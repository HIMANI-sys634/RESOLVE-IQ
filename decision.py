"""Deterministic decision engine.

This module owns every critical business action. It never calls an LLM.
Inputs are verified facts (customer, order) plus the configurable policy
document; the output is a fully reproducible ``DecisionResult``.

Rule evaluation order:
    1. Missing critical information        -> Request Missing Information
    2. Conflicting backend data            -> Human Review (fail safe)
    3. High-risk issue / customer          -> Human Review (fail safe)
    4. Policy rules (first match wins)     -> issue-specific action
    5. Policy default action               -> safe fallback
    6. Escalation overlays (severity etc.) -> escalate=True, action unchanged
"""

from __future__ import annotations

import logging
from typing import Any

from schemas import (
    AgentRequest,
    CustomerRecord,
    DecisionResult,
    OrderRecord,
)
from tools.policy_lookup import get_policy, load_policy

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
def _matches(condition: dict[str, Any], sources: list[dict[str, Any]]) -> bool:
    """Return True when every key/value in ``condition`` is present in a source."""
    if not condition:
        return False
    for source in sources:
        if not source:
            continue
        if all(str(source.get(key)).lower() == str(value).lower() for key, value in condition.items()):
            return True
    return False


def _resolve_missing_information(
    request: AgentRequest,
    customer: CustomerRecord | None,
    order: OrderRecord | None,
    policy: dict[str, Any],
) -> tuple[list[str], list[str]]:
    """Return (missing_information, risk_flags)."""
    missing: list[str] = []
    flags: list[str] = []

    if not request.customer_id:
        missing.append("customer_id")
    elif customer is None:
        missing.append("customer_id")
        flags.append("unknown_customer_id")

    if not request.order_id:
        missing.append("order_id")
    elif order is None:
        missing.append("order_id")
        flags.append("unknown_order_id")

    # Order/customer mismatch is a data-integrity problem, not a missing field.
    if order is not None and request.customer_id and order.customer_id and order.customer_id != request.customer_id:
        flags.append("customer_order_mismatch")

    return missing, flags


# ---------------------------------------------------------------------------
# Main entry point
# ---------------------------------------------------------------------------
def decide(
    request: AgentRequest,
    customer: CustomerRecord | None,
    order: OrderRecord | None,
    policy: dict[str, Any] | None = None,
) -> DecisionResult:
    """Apply deterministic policy rules and return the recommended decision."""
    policy = policy or load_policy()
    issue_policy = get_policy(request.issue_type, policy)
    canonical = issue_policy.get("canonical_issue_type", "Unknown")
    escalation_cfg = policy.get("escalation", {})
    missing_cfg = policy.get("missing_information", {})

    risk_flags: list[str] = []
    missing, lookup_flags = _resolve_missing_information(request, customer, order, policy)
    risk_flags.extend(lookup_flags)

    order_facts = order.model_dump() if order else {}
    customer_facts = customer.model_dump() if customer else {}
    sources = [order_facts, customer_facts]

    allowed_actions = list(issue_policy.get("allowed_actions", []))

    # --- 1. Missing critical information -----------------------------------
    critical = set(missing_cfg.get("escalate_if_any_of", ["customer_id", "order_id"]))
    if missing and (critical & set(missing)):
        logger.info("decision: missing critical information %s", missing)
        return DecisionResult(
            action=missing_cfg.get("action", "Request Missing Information"),
            reason=missing_cfg.get("escalate_reason", "Critical identifiers are missing."),
            escalate=True,
            escalate_reason=missing_cfg.get("escalate_reason"),
            missing_information=missing,
            allowed_actions=allowed_actions or ["Request Missing Information", "Human Review"],
            canonical_issue_type=canonical,
            policy_version=policy.get("version"),
            risk_flags=risk_flags or ["missing_information"],
            source="missing_info",
        )

    # --- 2. Conflicting backend data -> fail safe --------------------------
    if order is not None and order.data_conflict and escalation_cfg.get("escalate_on_data_conflict", True):
        logger.warning("decision: conflicting backend data for order %s", order.order_id)
        return DecisionResult(
            action="Human Review",
            reason="The backend records for this order conflict, so an automated decision is not safe.",
            escalate=True,
            escalate_reason="Conflicting backend data detected.",
            missing_information=missing,
            allowed_actions=["Human Review"],
            canonical_issue_type=canonical,
            policy_version=policy.get("version"),
            risk_flags=risk_flags + ["conflicting_backend_data"],
            source="guardrail",
        )

    # --- 3. High-risk issue type -------------------------------------------
    high_risk_issues = {str(x).lower() for x in escalation_cfg.get("high_risk_issue_types", [])}
    if request.issue_type and request.issue_type.strip().lower() in high_risk_issues:
        risk_flags.append("high_risk_issue_type")
        return DecisionResult(
            action="Human Review",
            reason=f"'{request.issue_type}' is a high-risk case category and always requires a human agent.",
            escalate=True,
            escalate_reason="High-risk issue type.",
            missing_information=missing,
            allowed_actions=["Human Review"],
            canonical_issue_type=canonical,
            policy_version=policy.get("version"),
            risk_flags=risk_flags,
            source="guardrail",
        )

    # --- 4. Policy rules: first match wins ---------------------------------
    action: str | None = None
    reason: str | None = None
    escalate: bool = False
    escalate_reason: str | None = None
    source = "policy_default"

    for rule in issue_policy.get("rules", []):
        if _matches(rule.get("when", {}), sources):
            action = rule.get("action")
            reason = rule.get("reason")
            escalate = bool(rule.get("escalate", False))
            if escalate:
                escalate_reason = rule.get("reason")
            source = "policy_rule"
            logger.info("decision: rule matched for %s -> %s", canonical, action)
            break

    # --- 5. Policy default -------------------------------------------------
    if action is None:
        action = issue_policy.get("default_action", "Human Review")
        reason = issue_policy.get("default_reason", "No automated policy matched this case.")
        escalate = action == "Human Review"
        if escalate:
            escalate_reason = reason
        source = "policy_default"
        logger.info("decision: default applied for %s -> %s", canonical, action)

    # --- 6. Escalation overlays (action is preserved) ----------------------
    severity = (request.severity or "").strip()
    high_levels = [str(x).lower() for x in escalation_cfg.get("high_severity_levels", ["high", "critical"])]
    if severity and severity.lower() in high_levels and escalation_cfg.get("escalate_on_high_severity", True):
        escalate = True
        risk_flags.append("high_severity")
        escalate_reason = escalate_reason or "High severity complaint - routed to a human agent."

    if customer is not None and customer.is_high_risk and escalation_cfg.get("escalate_on_high_risk_customer", True):
        escalate = True
        risk_flags.append("high_risk_customer")
        escalate_reason = escalate_reason or "Customer is flagged as high risk."

    if customer is not None and customer.membership_tier in ("Platinum", "VIP") and escalation_cfg.get(
        "vip_tiers_always_escalate", False
    ):
        escalate = True
        risk_flags.append("vip_customer")
        escalate_reason = escalate_reason or "VIP customer - routed to a dedicated agent."

    # --- Safety: never emit a forbidden action -----------------------------
    forbidden = {str(x).lower() for x in escalation_cfg.get("forbidden_actions", [])}
    if action and action.lower() in forbidden:
        logger.error("decision: forbidden action '%s' blocked", action)
        action = "Human Review"
        reason = "The requested action requires human authorisation and cannot be automated."
        escalate = True
        escalate_reason = "Blocked forbidden action."
        risk_flags.append("forbidden_action_blocked")
        source = "guardrail"

    # Guarantee the action is within the policy allow-list.
    if allowed_actions and action not in allowed_actions:
        logger.warning("decision: action '%s' not allow-listed -> Human Review", action)
        risk_flags.append("action_not_allow_listed")
        action = "Human Review"
        escalate = True
        escalate_reason = escalate_reason or "Action was not permitted by policy."
        source = "guardrail"

    # Post-condition safety net: escalate whenever the recommendation is a
    # human-review action, regardless of how it was reached.
    if action == "Human Review":
        escalate = True
        escalate_reason = escalate_reason or reason

    return DecisionResult(
        action=action,
        reason=reason or "Deterministic policy decision.",
        escalate=escalate,
        escalate_reason=escalate_reason,
        missing_information=missing,
        allowed_actions=allowed_actions,
        canonical_issue_type=canonical,
        policy_version=policy.get("version"),
        risk_flags=risk_flags,
        source=source,  # type: ignore[arg-type]
    )
