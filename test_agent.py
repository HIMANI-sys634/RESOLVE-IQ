"""Test suite for the Student 3 AI Agent / Decision Engine.

Covers the 12 required scenarios: normal damaged item, return window open and
closed, late delivery, refund request, missing order id, missing customer
information, high severity, conflicting backend data, invalid/unsafe LLM
output, refund hallucination and schema validation.

All tests run offline (mock mode) - no API key, no network.
"""

from __future__ import annotations

import json

import pytest
from fastapi.testclient import TestClient
from pydantic import ValidationError

from agent import Agent, run_agent
from decision import decide
from guardrails import apply_guardrails, parse_llm_output
from llm_provider import MockProvider, get_provider
from main import app
from schemas import AgentRequest, AgentResponse, CustomerRecord, LlmOutput, OrderRecord
from tools.customer_lookup import get_customer
from tools.order_lookup import get_order
from tools.policy_lookup import get_policy, load_policy

client = TestClient(app)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
def make_request(**overrides) -> AgentRequest:
    payload = {
        "complaint_id": "C001",
        "clean_text": "my headphones arrived damaged",
        "issue_type": "Damaged Product",
        "sentiment": "Negative",
        "severity": "Low",
        "cluster": "Damaged Products",
        "customer_id": "U101",
        "order_id": "O501",
    }
    payload.update(overrides)
    return AgentRequest.model_validate(payload)


# ===========================================================================
# 1. Normal damaged item (return window OPEN) -> Offer Return/Replacement
# ===========================================================================
def test_damaged_item_return_window_open(mock_agent: Agent) -> None:
    response = mock_agent.run(make_request())

    assert isinstance(response, AgentResponse)
    assert response.action == "Offer Return/Replacement"
    assert response.escalate is False
    assert response.missing_information == []
    assert "return or a replacement" in response.customer_message.lower()
    assert response.used_llm is False
    assert response.llm_provider == "mock"
    # LLM must not invent refund facts
    assert "refund" not in response.customer_message.lower()


# ===========================================================================
# 2. Return window CLOSED -> Human Review + escalate
# ===========================================================================
def test_damaged_item_return_window_closed_escalates(mock_agent: Agent) -> None:
    response = mock_agent.run(make_request(customer_id="U102", order_id="O502"))

    assert response.action == "Human Review"
    assert response.escalate is True
    assert response.escalate_reason is not None
    assert "specialist" in response.customer_message.lower()


# ===========================================================================
# 3. Late delivery -> Investigate Delivery
# ===========================================================================
def test_late_delivery_investigated(mock_agent: Agent) -> None:
    response = mock_agent.run(
        make_request(
            complaint_id="C003",
            clean_text="my keyboard is two weeks late",
            issue_type="Late Delivery",
            severity="Medium",
            customer_id="U103",
            order_id="O503",
        )
    )

    assert response.action == "Investigate Delivery"
    assert response.escalate is False
    assert "delay" in response.customer_message.lower() or "carrier" in response.customer_message.lower()


# ===========================================================================
# 4a. Refund request with NO backend confirmation -> Check Refund Eligibility
# ===========================================================================
def test_refund_request_not_confirmed_checks_eligibility(mock_agent: Agent) -> None:
    response = mock_agent.run(
        make_request(
            complaint_id="C004",
            clean_text="I want my money back for the earbuds",
            issue_type="Refund",
            severity="Medium",
            customer_id="U105",
            order_id="O505",
        )
    )

    assert response.action == "Check Refund Eligibility"
    assert response.escalate is False
    lowered = response.customer_message.lower()
    # Must never confirm an issued refund that the backend does not confirm
    assert "has been issued" not in lowered
    assert "already been issued" not in lowered


# ===========================================================================
# 4b. Refund request WITH backend confirmation -> Inform Refund Confirmed
# ===========================================================================
def test_refund_confirmed_in_backend_is_reported(mock_agent: Agent) -> None:
    response = mock_agent.run(
        make_request(
            complaint_id="C005",
            clean_text="where is my refund for the smart watch",
            issue_type="Refund",
            severity="Low",
            customer_id="U104",
            order_id="O504",
        )
    )

    assert response.action == "Inform Refund Confirmed"
    assert response.escalate is False
    assert "refund" in response.customer_message.lower()


# ===========================================================================
# 5. Missing order id -> Request Missing Information + escalate
# ===========================================================================
def test_missing_order_id_requests_information(mock_agent: Agent) -> None:
    response = mock_agent.run(make_request(order_id=None))

    assert response.action == "Request Missing Information"
    assert response.escalate is True
    assert "order_id" in response.missing_information


# ===========================================================================
# 6. Unknown / missing customer information -> escalate safely
# ===========================================================================
def test_missing_customer_information_escalates(mock_agent: Agent) -> None:
    response = mock_agent.run(make_request(customer_id=None))

    assert response.escalate is True
    assert "customer_id" in response.missing_information
    assert response.action == "Request Missing Information"


def test_unknown_customer_id_flagged(mock_agent: Agent) -> None:
    response = mock_agent.run(make_request(customer_id="U999"))

    assert "customer_id" in response.missing_information
    assert response.escalate is True


# ===========================================================================
# 7. High severity -> deterministic action preserved, escalation forced
# ===========================================================================
def test_high_severity_escalates_but_keeps_action(mock_agent: Agent) -> None:
    response = mock_agent.run(make_request(severity="High"))

    assert response.action == "Offer Return/Replacement"
    assert response.escalate is True
    assert response.escalate_reason is not None


def test_high_risk_customer_escalates(mock_agent: Agent) -> None:
    response = mock_agent.run(make_request(customer_id="U107", order_id="O507", severity="Low"))

    assert response.escalate is True
    # Order O507 is a normal delivered order, so the customer flag is what escalates it.
    assert response.action == "Offer Return/Replacement"


# ===========================================================================
# 8. Conflicting backend data -> Human Review (fail safe)
# ===========================================================================
def test_conflicting_backend_data_forces_human_review(mock_agent: Agent) -> None:
    response = mock_agent.run(
        make_request(
            complaint_id="C008",
            clean_text="my gaming mouse never arrived",
            issue_type="Late Delivery",
            severity="Low",
            customer_id="U106",
            order_id="O506",
        )
    )

    assert response.action == "Human Review"
    assert response.escalate is True
    assert "conflicting_backend_data" in response.guardrail_flags or (
        response.escalate_reason and "conflict" in response.escalate_reason.lower()
    )


# ===========================================================================
# 9. High-risk issue type -> always Human Review
# ===========================================================================
def test_high_risk_issue_type_forces_human_review(mock_agent: Agent) -> None:
    response = mock_agent.run(
        make_request(complaint_id="C009", clean_text="someone stole my card and used my account", issue_type="Fraud")
    )

    assert response.action == "Human Review"
    assert response.escalate is True


# ===========================================================================
# 10. Invalid / malformed LLM JSON -> deterministic fallback
# ===========================================================================
def test_malformed_llm_json_falls_back(fake_llm_factory) -> None:
    agent = fake_llm_factory("Sure! Here is my answer: {not valid json at all")
    response = agent.run(make_request())

    assert response.action == "Offer Return/Replacement"
    assert "invalid_llm_json" in response.guardrail_flags
    assert response.customer_message  # still a usable message
    assert "return or a replacement" in response.customer_message.lower()


def test_markdown_fenced_json_is_recovered(fake_llm_factory) -> None:
    agent = fake_llm_factory(
        "```json\n"
        + json.dumps(
            {
                "complaint_id": "C001",
                "summary": "Damaged headphones reported.",
                "action": "Offer Return/Replacement",
                "reason": "Return window is open.",
                "customer_message": "We can help with a return or replacement.",
                "escalate": False,
                "missing_information": [],
            }
        )
        + "\n```"
    )
    response = agent.run(make_request())

    assert response.action == "Offer Return/Replacement"
    assert "invalid_llm_json" not in response.guardrail_flags
    assert response.guardrail_flags == []


# ===========================================================================
# 11. Refund hallucination -> forced Human Review + escalation
# ===========================================================================
def test_refund_hallucination_is_blocked(fake_llm_factory) -> None:
    agent = fake_llm_factory(
        json.dumps(
            {
                "complaint_id": "C004",
                "summary": "Refund handled.",
                "action": "Check Refund Eligibility",
                "reason": "Refunded.",
                "customer_message": "Good news, your refund has been issued and is on the way!",
                "escalate": False,
                "missing_information": [],
            }
        )
    )
    response = agent.run(
        make_request(
            complaint_id="C004",
            clean_text="I want a refund for the earbuds",
            issue_type="Refund",
            customer_id="U105",
            order_id="O505",
        )
    )

    assert "fabricated_refund_claim" in response.guardrail_flags
    assert response.action == "Human Review"
    assert response.escalate is True
    assert "has been issued" not in response.customer_message.lower()


def test_unconfirmed_completion_claim_rewritten(fake_llm_factory) -> None:
    agent = fake_llm_factory(
        json.dumps(
            {
                "complaint_id": "C001",
                "summary": "Replacement handled.",
                "action": "Offer Return/Replacement",
                "reason": "Return window is open.",
                "customer_message": "Your replacement has been shipped already.",
                "escalate": False,
                "missing_information": [],
            }
        )
    )
    response = agent.run(make_request())

    assert "fabricated_completion_claim" in response.guardrail_flags
    assert "has been shipped" not in response.customer_message.lower()


# ===========================================================================
# 12. Unsupported action / escalation mismatch -> corrected by guardrails
# ===========================================================================
def test_unsupported_action_is_reverted(fake_llm_factory) -> None:
    agent = fake_llm_factory(
        json.dumps(
            {
                "complaint_id": "C001",
                "summary": "Deleted the account.",
                "action": "Delete Account",
                "reason": "Customer asked.",
                "customer_message": "We have deleted your account.",
                "escalate": False,
                "missing_information": [],
            }
        )
    )
    response = agent.run(make_request())

    assert "unsupported_action" in response.guardrail_flags
    assert response.action == "Offer Return/Replacement"


def test_internal_data_leak_is_scrubbed(fake_llm_factory) -> None:
    agent = fake_llm_factory(
        json.dumps(
            {
                "complaint_id": "C001",
                "summary": "ok",
                "action": "Offer Return/Replacement",
                "reason": "policy",
                "customer_message": "Note severity: High and guardrail flags were triggered internally.",
                "escalate": False,
                "missing_information": [],
            }
        )
    )
    response = agent.run(make_request())

    assert "internal_data_leak" in response.guardrail_flags
    assert "severity:" not in response.customer_message.lower()


def test_provider_outage_degrades_safely(monkeypatch) -> None:
    from tests.conftest import ExplodingLLM

    agent = Agent(llm_provider=ExplodingLLM())
    response = agent.run(make_request())

    assert response.action == "Offer Return/Replacement"
    assert "invalid_llm_json" in response.guardrail_flags


# ===========================================================================
# 13. Schema validation
# ===========================================================================
def test_request_schema_rejects_blank_complaint_id() -> None:
    with pytest.raises(ValidationError):
        AgentRequest.model_validate(
            {"complaint_id": "  ", "clean_text": "x", "issue_type": "Refund"}
        )


def test_llm_output_schema_rejects_bad_types() -> None:
    with pytest.raises(ValidationError):
        LlmOutput.model_validate(
            {
                "complaint_id": "C1",
                "summary": "s",
                "action": "a",
                "reason": "r",
                "customer_message": "m",
                "escalate": "not-a-bool-at-all",
            }
        )


def test_response_contains_all_contract_fields(mock_agent: Agent) -> None:
    response = mock_agent.run(make_request())
    dumped = response.model_dump()

    for field in AgentResponse.model_fields:
        assert field in dumped


# ===========================================================================
# 14. Policy engine + tools
# ===========================================================================
def test_policy_aliases_resolve() -> None:
    assert get_policy("damaged item")["canonical_issue_type"] == "Damaged Product"
    assert get_policy("Refund Request")["canonical_issue_type"] == "Refund"
    assert get_policy("delayed delivery")["canonical_issue_type"] == "Late Delivery"


def test_unknown_issue_falls_back_to_default_policy() -> None:
    policy = get_policy("Something Weird")
    assert policy["canonical_issue_type"] == "Unknown"
    assert policy["default_action"] == "Human Review"


def test_lookup_tools_return_verified_data() -> None:
    order = get_order("O501")
    customer = get_customer("U101")

    assert order is not None and order["return_window_open"] is True
    assert customer is not None and customer["customer_id"] == "U101"
    assert get_order("NOPE") is None
    assert get_customer(None) is None


def test_decision_is_deterministic() -> None:
    request = make_request()
    customer = CustomerRecord.model_validate(get_customer("U101"))
    order = OrderRecord.model_validate(get_order("O501"))
    policy = load_policy()

    first = decide(request, customer, order, policy)
    second = decide(request, customer, order, policy)

    assert first.model_dump() == second.model_dump()


def test_mock_provider_selected_without_api_key(monkeypatch) -> None:
    monkeypatch.delenv("OPENAI_API_KEY", raising=False)
    monkeypatch.delenv("LLM_API_KEY", raising=False)
    monkeypatch.setenv("STUDENT3_FORCE_MOCK", "1")

    provider = get_provider()
    assert isinstance(provider, MockProvider)
    assert provider.is_mock is True


# ===========================================================================
# 15. API layer
# ===========================================================================
def test_health_endpoint() -> None:
    resp = client.get("/health")
    assert resp.status_code == 200
    body = resp.json()
    assert body["status"] == "ok"
    assert body["llm_mode"] == "mock"


def test_agent_run_endpoint_damaged_product() -> None:
    resp = client.post(
        "/agent/run",
        json={
            "complaint_id": "C001",
            "clean_text": "my headphones arrived damaged",
            "issue_type": "Damaged Product",
            "sentiment": "Negative",
            "severity": "High",
            "cluster": "Damaged Products",
            "customer_id": "U101",
            "order_id": "O501",
        },
    )
    assert resp.status_code == 200
    body = resp.json()
    assert body["action"] == "Offer Return/Replacement"
    assert body["escalate"] is True  # High severity overlay


def test_agent_run_endpoint_validation_error() -> None:
    resp = client.post("/agent/run", json={"complaint_id": "C001"})
    assert resp.status_code == 422


def test_policy_endpoint() -> None:
    resp = client.get("/policy")
    assert resp.status_code == 200
    assert "Damaged Product" in resp.json()["issue_types"]


def test_debug_endpoint_separates_internal_and_customer() -> None:
    resp = client.post(
        "/agent/run/debug",
        json={
            "complaint_id": "C002",
            "clean_text": "headphones broken",
            "issue_type": "Damaged Product",
            "customer_id": "U102",
            "order_id": "O502",
        },
    )
    assert resp.status_code == 200
    body = resp.json()
    assert "internal" in body and "customer_facing" in body
    assert "guardrail" not in body["customer_facing"]["message"].lower()
