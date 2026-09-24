"""Shared pytest fixtures.

Guarantees:
  * the project root is importable (imports match the folder structure)
  * tests NEVER make a network call - mock mode is forced and any API key in
    the environment is removed
  * a ``FakeLLM`` provider lets us inject hostile / malformed model output
"""

from __future__ import annotations

import os
import sys
from pathlib import Path

import pytest

ROOT = Path(__file__).resolve().parent.parent
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))


@pytest.fixture(autouse=True, scope="session")
def _offline_environment() -> None:
    """Force deterministic offline mode for the entire test session."""
    os.environ["STUDENT3_FORCE_MOCK"] = "1"
    os.environ.pop("OPENAI_API_KEY", None)
    os.environ.pop("LLM_API_KEY", None)
    yield
    os.environ.pop("STUDENT3_FORCE_MOCK", None)


from llm_provider import LLMProvider  # noqa: E402
from agent import Agent  # noqa: E402


class FakeLLM(LLMProvider):
    """Test double that returns a canned raw string instead of calling a model."""

    name = "fake-llm"

    def __init__(self, raw: str) -> None:
        self._raw = raw
        self.calls: int = 0

    @property
    def is_mock(self) -> bool:
        # Report False so the agent treats this as a live provider and actually
        # routes the raw output through the guardrails.
        return False

    def complete(self, system_prompt: str, user_prompt: str) -> str:
        self.calls += 1
        return self._raw


class ExplodingLLM(LLMProvider):
    """Provider that always raises - verifies safe degradation."""

    name = "exploding-llm"

    @property
    def is_mock(self) -> bool:
        return False

    def complete(self, system_prompt: str, user_prompt: str) -> str:
        raise RuntimeError("simulated provider outage")


@pytest.fixture()
def mock_agent() -> Agent:
    """Agent running with the deterministic mock provider (no API key needed)."""
    from llm_provider import MockProvider

    return Agent(llm_provider=MockProvider())


@pytest.fixture()
def fake_llm_factory():
    """Return a factory that builds an Agent with an injected raw LLM response."""
    from agent import Agent as AgentClass

    def _make(raw: str) -> AgentClass:
        return AgentClass(llm_provider=FakeLLM(raw))

    return _make
