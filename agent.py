"""Student 3 - AI Agent / Decision Engine.

Pipeline:
    Complaint Intelligence
        -> Customer Lookup        (verified)
        -> Order Lookup           (verified)
        -> Policy Lookup          (configurable rules)
        -> Deterministic Decision (authoritative)
        -> LLM Reasoning / Response generation
        -> Guardrail validation
        -> Final structured output

The LLM can NEVER change the recommended action; it only explains and phrases.
Set ``llm_provider`` to inject a provider (used by tests). When no API key is
configured the agent automatically uses the deterministic MockProvider.
"""

from __future__ import annotations

import json
import logging
from typing import Any

from decision import decide
from guardrails import apply_guardrails, parse_llm_output
from llm_provider import LLMProvider, MockProvider, get_provider, load_system_prompt
from response import build_response, deterministic_output
from schemas import (
    AgentRequest,
    AgentResponse,
    CustomerRecord,
    OrderRecord,
)
from tools.customer_lookup import get_customer
from tools.order_lookup import get_order
from tools.policy_lookup import get_policy, load_policy

logger = logging.getLogger(__name__)


class Agent:
    """Orchestrates the full decision pipeline for one complaint."""

    def __init__(self, llm_provider: LLMProvider | None = None) -> None:
        self.policy = load_policy()
        self.llm_provider = llm_provider or get_provider()

    # -- public API ---------------------------------------------------------
    def run(self, request: AgentRequest) -> AgentResponse:
        """Run the full pipeline and return a validated response."""
        logger.info("agent: processing complaint %s", request.complaint_id)

        customer, order = self._retrieve(request)
        issue_policy = get_policy(request.issue_type, self.policy)
        decision = decide(request, customer, order, self.policy)
        logger.info(
            "agent: deterministic decision for %s -> %s (escalate=%s)",
            request.complaint_id,
            decision.action,
            decision.escalate,
        )

        order_facts = order.model_dump() if order else {}

        llm_output = self._call_llm(request, customer, order, issue_policy, decision)
        safe_output, flags, effective_decision = apply_guardrails(
            llm_output, decision, order_facts, self.policy
        )

        if flags:
            logger.warning("agent: guardrail flags for %s: %s", request.complaint_id, flags)

        response = build_response(
            request=request,
            decision=effective_decision,
            llm_output=safe_output,
            guardrail_flags=flags,
            used_llm=not self.llm_provider.is_mock,
            llm_provider=self.llm_provider.name,
        )
        return response

    # -- pipeline steps -----------------------------------------------------
    def _retrieve(
        self, request: AgentRequest
    ) -> tuple[CustomerRecord | None, OrderRecord | None]:
        """Fetch verified customer and order records (never from the LLM)."""
        raw_customer = get_customer(request.customer_id)
        raw_order = get_order(request.order_id)
        customer = CustomerRecord.model_validate(raw_customer) if raw_customer else None
        order = OrderRecord.model_validate(raw_order) if raw_order else None
        return customer, order

    def _build_context(
        self,
        request: AgentRequest,
        customer: CustomerRecord | None,
        order: OrderRecord | None,
        issue_policy: dict[str, Any],
        decision: Any,
    ) -> dict[str, Any]:
        """Build the verified context handed to the LLM as the only truth."""
        return {
            "request": {
                "complaint_id": request.complaint_id,
                "clean_text": request.clean_text,
                "issue_type": request.issue_type,
                "sentiment": request.sentiment,
                "severity": request.severity,
                "cluster": request.cluster,
            },
            "customer": customer.model_dump() if customer else None,
            "order": order.model_dump() if order else None,
            "policy": {
                "canonical_issue_type": issue_policy.get("canonical_issue_type"),
                "allowed_actions": issue_policy.get("allowed_actions", []),
                "version": issue_policy.get("version"),
            },
            "deterministic_decision": decision.model_dump(),
        }

    def _call_llm(
        self,
        request: AgentRequest,
        customer: CustomerRecord | None,
        order: OrderRecord | None,
        issue_policy: dict[str, Any],
        decision: Any,
    ):
        """Call the provider and parse its output.

        Any provider/serialisation error degrades safely to the deterministic
        output - the pipeline never crashes because of the LLM.
        """
        context = self._build_context(request, customer, order, issue_policy, decision)
        context_json = json.dumps(context, indent=2, default=str)

        if isinstance(self.llm_provider, MockProvider):
            # Deterministic path: skip the prompt round-trip entirely.
            return deterministic_output(request, customer, order, decision)

        system_prompt = load_system_prompt(context_json)
        user_prompt = (
            "Decide the customer-facing wording for the case described in the CONTEXT JSON "
            "above. Restate the deterministic decision; do not change the action.\n\n"
            f"CONTEXT_JSON: {context_json}"
        )

        try:
            raw = self.llm_provider.complete(system_prompt, user_prompt)
        except Exception as exc:  # noqa: BLE001 - provider failures must be safe
            logger.error("agent: LLM call failed (%s) -> deterministic fallback", exc)
            return None

        return parse_llm_output(raw)


# Module-level default agent for the FastAPI layer (lazy, so tests can patch).
_default_agent: Agent | None = None


def get_agent() -> Agent:
    """Return the process-wide default agent (created on first use)."""
    global _default_agent
    if _default_agent is None:
        _default_agent = Agent()
    return _default_agent


def run_agent(request: AgentRequest, agent: Agent | None = None) -> AgentResponse:
    """Convenience wrapper: run one complaint through the pipeline."""
    return (agent or get_agent()).run(request)
