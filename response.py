"""Response layer.

Keeps the internal view of a case strictly separate from the customer-facing
text. Student 4 receives the customer message only; Student 1 receives the
full record.
"""

from __future__ import annotations

import logging
from typing import Any

from schemas import (
    AgentRequest,
    AgentResponse,
    CustomerRecord,
    DecisionResult,
    LlmOutput,
    OrderRecord,
)

logger = logging.getLogger(__name__)


def build_internal_summary(
    request: AgentRequest,
    customer: CustomerRecord | None,
    order: OrderRecord | None,
    decision: DecisionResult,
) -> str:
    """Human-readable internal summary built ONLY from verified facts."""
    parts: list[str] = [f"Customer reports: {request.clean_text.rstrip('.')}."]
    if order is not None:
        parts.append(
            f"Order {order.order_id} ({order.product or 'item'}) is {order.status or 'of unknown status'}"
            + (f", delivered {order.delivery_date}" if order.delivery_date else "")
            + f"; payment {order.payment_status or 'unknown'}"
            + f"; return window {'open' if order.return_window_open else 'closed'}."
        )
    if customer is not None:
        parts.append(
            f"Customer {customer.customer_id}"
            + (f" ({customer.membership_tier} tier)" if customer.membership_tier else "")
            + f", {customer.previous_complaints} previous complaint(s)."
        )
    parts.append(f"Recommended action: {decision.action}.")
    return " ".join(parts)


def deterministic_output(
    request: AgentRequest,
    customer: CustomerRecord | None,
    order: OrderRecord | None,
    decision: DecisionResult,
) -> LlmOutput:
    """Build a fully deterministic (no-LLM) response payload.

    Used by the mock provider, as the LLM fallback, and in unit tests - so the
    pipeline always produces a valid answer even without a model.
    """
    summary = build_internal_summary(request, customer, order, decision)

    reason = decision.reason
    if decision.action == "Offer Return/Replacement" and order is not None:
        reason = "The order is delivered and the return window is open."
    elif decision.action == "Inform Refund Confirmed" and order is not None:
        reason = "The backend confirms the refund was already issued."
    elif decision.action == "Check Refund Eligibility":
        reason = "No refund is confirmed in the backend, so eligibility must be verified."
    elif decision.action == "Investigate Delivery":
        reason = "The delivery timeline shows a delay and must be investigated with the carrier."
    elif decision.action == "Request Missing Information":
        reason = "Required information is missing from the complaint."

    message = _message_for(decision.action, decision.missing_information)

    return LlmOutput(
        complaint_id=request.complaint_id,
        summary=summary,
        action=decision.action,
        reason=reason,
        customer_message=message,
        escalate=decision.escalate,
        missing_information=list(decision.missing_information),
    )


def _message_for(action: str, missing: list[str]) -> str:
    """Deterministic customer-facing message for an action."""
    templates = {
        "Offer Return/Replacement": (
            "Thanks for letting us know, and sorry about the trouble with your order. "
            "We can help with a return or a replacement - please confirm which option you prefer "
            "and we will take it from there."
        ),
        "Investigate Delivery": (
            "Thanks for flagging this. Your order is showing a delay, so we are checking the "
            "delivery record with the carrier and will update you as soon as we know more."
        ),
        "Check Refund Eligibility": (
            "Thanks for your message. We are verifying your refund eligibility against the order "
            "record and will confirm the next step with you once that check is complete."
        ),
        "Inform Refund Confirmed": (
            "Good news - our records confirm your refund has already been issued. Depending on "
            "your bank, it may take a few business days to appear on your statement."
        ),
        "Request Missing Information": (
            "We would like to help but need a little more detail first. Please share the "
            "information listed below so we can locate your case and assist you."
        ),
        "Human Review": (
            "Thanks for reaching out. We have passed your case to a specialist for review and "
            "will get back to you with the next steps shortly."
        ),
    }
    message = templates.get(action, templates["Human Review"])
    if missing:
        message += " " + " ".join(f"[{field}]" for field in missing)
    return message


def build_response(
    request: AgentRequest,
    decision: DecisionResult,
    llm_output: LlmOutput,
    guardrail_flags: list[str],
    used_llm: bool,
    llm_provider: str | None,
) -> AgentResponse:
    """Assemble the final validated API response."""
    return AgentResponse(
        complaint_id=request.complaint_id,
        summary=llm_output.summary,
        action=decision.action,
        reason=llm_output.reason or decision.reason,
        customer_message=llm_output.customer_message,
        escalate=decision.escalate,
        missing_information=sorted(set(decision.missing_information) | set(llm_output.missing_information)),
        escalate_reason=decision.escalate_reason,
        guardrail_flags=guardrail_flags,
        severity=request.severity,
        issue_type=request.issue_type,
        used_llm=used_llm,
        llm_provider=llm_provider,
        policy_version=decision.policy_version,
    )


def debug_view(response: AgentResponse) -> dict[str, Any]:
    """Internal-only view for logs / Student 1. Never send to a customer."""
    return {
        "internal": {
            "complaint_id": response.complaint_id,
            "summary": response.summary,
            "action": response.action,
            "reason": response.reason,
            "escalate": response.escalate,
            "escalate_reason": response.escalate_reason,
            "risk_and_guardrail_flags": response.guardrail_flags,
            "policy_version": response.policy_version,
        },
        "customer_facing": {"message": response.customer_message},
    }
