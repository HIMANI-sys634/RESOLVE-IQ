"""LLM provider layer (modular / replaceable).

The agent never talks to a vendor SDK directly. It calls an ``LLMProvider``.
Two implementations ship here:

  * ``OpenAICompatibleProvider`` - any OpenAI-compatible chat-completions
    endpoint (OpenAI, Azure OpenAI, Groq, Together, local vLLM, Ollama...).
  * ``MockProvider`` - deterministic, offline, no API key required.

``get_provider()`` picks the real provider automatically when
``LLM_API_KEY`` / ``OPENAI_API_KEY`` is present and mock mode is not forced,
otherwise it falls back to the mock so the whole system runs immediately.
"""

from __future__ import annotations

import abc
import json
import logging
import os
from pathlib import Path
from typing import Any

logger = logging.getLogger(__name__)

_PROMPT_PATH = Path(__file__).resolve().parent / "prompts" / "agent_prompt.txt"


class LLMProvider(abc.ABC):
    """Minimal interface every provider must implement."""

    name: str = "abstract"

    @abc.abstractmethod
    def complete(self, system_prompt: str, user_prompt: str) -> str:
        """Return the raw (ideally JSON) completion text."""
        raise NotImplementedError

    @property
    def is_mock(self) -> bool:
        return False


class MockProvider(LLMProvider):
    """Offline deterministic provider.

    It does NOT decide anything. It simply restates the deterministic decision
    supplied in the user prompt, producing well-formed JSON with slight natural
    language polish - which is exactly what the real model is asked to do.
    """

    name = "mock"

    @property
    def is_mock(self) -> bool:
        return True

    def complete(self, system_prompt: str, user_prompt: str) -> str:
        context = _extract_context(user_prompt)
        decision = context.get("deterministic_decision", {}) or {}
        request = context.get("request", {}) or {}

        action = decision.get("action", "Human Review")
        message = _MOCK_MESSAGES.get(action, _MOCK_MESSAGES["Human Review"])

        payload = {
            "complaint_id": request.get("complaint_id", ""),
            "summary": _mock_summary(context, action),
            "action": action,
            "reason": decision.get("reason", "Deterministic policy decision."),
            "customer_message": message,
            "escalate": bool(decision.get("escalate", False)),
            "missing_information": decision.get("missing_information", []),
        }
        return json.dumps(payload)


_MOCK_MESSAGES: dict[str, str] = {
    "Offer Return/Replacement": (
        "I'm sorry your item arrived in that condition. We can arrange a return or a replacement "
        "- just let us know which you'd prefer and we'll get it started."
    ),
    "Investigate Delivery": (
        "Sorry for the wait. Your parcel is showing a delay on our side, so we're checking with the "
        "carrier and will come back to you as soon as we have an update."
    ),
    "Check Refund Eligibility": (
        "Thanks for getting in touch. We're checking your refund eligibility against your order "
        "and will confirm the next step with you once that's verified."
    ),
    "Inform Refund Confirmed": (
        "Good news - our records confirm your refund has already been issued. Depending on your "
        "bank it may take a few business days to show up."
    ),
    "Request Missing Information": (
        "We'd like to help straight away, but we need a little more detail first. Could you share "
        "the information listed below so we can find your case?"
    ),
    "Human Review": (
        "Thanks for reaching out. Your case has been passed to a specialist who will review it and "
        "come back to you with the next steps."
    ),
}


def _mock_summary(context: dict[str, Any], action: str) -> str:
    request = context.get("request", {}) or {}
    order = context.get("order") or {}
    text = str(request.get("clean_text", "the customer's issue")).rstrip(".")
    product = order.get("product")
    if product:
        return f"Customer reports: {text}. Item: {product}. Recommended action: {action}."
    return f"Customer reports: {text}. Recommended action: {action}."


class OpenAICompatibleProvider(LLMProvider):
    """OpenAI-compatible chat-completions provider.

    The ``openai`` package is imported lazily inside ``__init__`` so the app
    (and the test suite) runs without the dependency installed.
    """

    name = "openai-compatible"

    def __init__(
        self,
        api_key: str,
        model: str = "gpt-4o-mini",
        base_url: str | None = None,
        temperature: float = 0.2,
        timeout: float = 30.0,
        max_tokens: int = 700,
    ) -> None:
        try:
            from openai import OpenAI  # type: ignore import-not-found
        except ImportError as exc:  # pragma: no cover - depends on environment
            raise RuntimeError(
                "The 'openai' package is required for the real LLM provider. "
                "Run: pip install openai"
            ) from exc

        kwargs: dict[str, Any] = {"api_key": api_key, "timeout": timeout}
        if base_url:
            kwargs["base_url"] = base_url
        self._client = OpenAI(**kwargs)
        self._model = model
        self._temperature = temperature
        self._max_tokens = max_tokens
        self.name = f"openai-compatible:{model}"

    def complete(self, system_prompt: str, user_prompt: str) -> str:
        response = self._client.chat.completions.create(
            model=self._model,
            temperature=self._temperature,
            max_tokens=self._max_tokens,
            response_format={"type": "json_object"},
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
        )
        content = response.choices[0].message.content or ""
        logger.debug("llm: received %d chars", len(content))
        return content


def _extract_context(user_prompt: str) -> dict[str, Any]:
    """Recover the CONTEXT JSON block embedded in the user prompt."""
    marker_start = user_prompt.find("{")
    marker_end = user_prompt.rfind("}")
    if marker_start == -1 or marker_end <= marker_start:
        return {}
    try:
        return json.loads(user_prompt[marker_start : marker_end + 1])
    except json.JSONDecodeError:
        # The prompt wraps the JSON in markers - fall back to a bounded search.
        try:
            start = user_prompt.index("CONTEXT_JSON>>>") + len("CONTEXT_JSON>>>")
            end = user_prompt.index("<<<END_CONTEXT_JSON")
            return json.loads(user_prompt[start:end].strip())
        except (ValueError, json.JSONDecodeError):
            logger.warning("llm: could not recover context JSON from prompt")
            return {}


def load_system_prompt(context_json: str | None = None) -> str:
    """Load the agent system prompt from prompts/agent_prompt.txt.

    ``{{CONTEXT_JSON}}`` / ``<<<CONTEXT_JSON>>>`` placeholders are replaced when
    a context is supplied; otherwise the markers are left intact.
    """
    try:
        template = _PROMPT_PATH.read_text(encoding="utf-8")
    except OSError:
        logger.warning("llm: agent_prompt.txt missing, using inline fallback")
        template = (
            "You are the reasoning layer of a support agent. Use ONLY the supplied "
            "context. Never invent order, payment or refund facts. Return JSON only."
        )
    if context_json is not None:
        template = template.replace("<<<CONTEXT_JSON>>>", "").replace("<<<END_CONTEXT_JSON>>>", "")
        template = template.replace("{{CONTEXT_JSON}}", context_json)
    return template


def get_provider(force_mock: bool | None = None) -> LLMProvider:
    """Return the active provider, preferring the real LLM when configured.

    Mock mode is used when:
      * ``force_mock`` is True, or
      * ``STUDENT3_FORCE_MOCK`` is truthy, or
      * no API key is configured.
    """
    if force_mock is None:
        force_mock = os.getenv("STUDENT3_FORCE_MOCK", "").strip().lower() in {"1", "true", "yes"}

    api_key = os.getenv("LLM_API_KEY") or os.getenv("OPENAI_API_KEY")
    if force_mock or not api_key:
        logger.info("llm: using MockProvider (offline deterministic mode)")
        return MockProvider()

    model = os.getenv("LLM_MODEL", "gpt-4o-mini")
    base_url = os.getenv("LLM_BASE_URL") or None
    try:
        provider = OpenAICompatibleProvider(api_key=api_key, model=model, base_url=base_url)
        logger.info("llm: using %s", provider.name)
        return provider
    except RuntimeError as exc:
        logger.warning("llm: real provider unavailable (%s) -> falling back to mock", exc)
        return MockProvider()
