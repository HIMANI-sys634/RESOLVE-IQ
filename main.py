"""FastAPI entrypoint for the Student 3 AI Agent / Decision Engine.

Endpoints
    GET  /health      - liveness + active LLM mode
    POST /agent/run   - run the pipeline on one complaint
    GET  /policy      - inspect the loaded policy (debugging / integration)
"""

from __future__ import annotations

import logging
import os

from dotenv import load_dotenv
from fastapi import Depends, FastAPI, HTTPException, status
from fastapi.responses import JSONResponse

from agent import Agent, get_agent
from response import debug_view
from schemas import AgentRequest, AgentResponse
from tools.policy_lookup import load_policy

load_dotenv()

logging.basicConfig(
    level=os.getenv("LOG_LEVEL", "INFO").upper(),
    format="%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
)
logger = logging.getLogger("student3.main")

app = FastAPI(
    title="Student 3 - AI Agent / Decision Engine",
    version="1.0.0",
    description=(
        "Deterministic decision engine + LLM reasoning layer for customer support. "
        "Verified data + policy rules decide the action; the LLM only explains and phrases."
    ),
)


def get_agent_dependency() -> Agent:
    """Dependency-injection seam so tests can override the agent."""
    return get_agent()


@app.get("/health", tags=["system"])
def health() -> dict[str, object]:
    """Liveness probe. Reports whether the LLM or the mock provider is active."""
    try:
        agent = get_agent()
        return {
            "status": "ok",
            "service": "student3-agent",
            "version": app.version,
            "llm_provider": agent.llm_provider.name,
            "llm_mode": "mock" if agent.llm_provider.is_mock else "live",
            "policy_version": agent.policy.get("version"),
        }
    except Exception as exc:  # noqa: BLE001 - health must never crash
        logger.exception("health check failed")
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(exc)) from exc


@app.post("/agent/run", response_model=AgentResponse, tags=["agent"])
def agent_run(
    request: AgentRequest,
    agent: Agent = Depends(get_agent_dependency),
) -> AgentResponse:
    """Run complaint intelligence through the full decision pipeline."""
    logger.info("POST /agent/run complaint_id=%s issue_type=%s", request.complaint_id, request.issue_type)
    try:
        response = agent.run(request)
    except Exception as exc:  # noqa: BLE001 - never leak a stack trace to the client
        logger.exception("agent run failed for %s", request.complaint_id)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Agent failed to process complaint {request.complaint_id}: {exc}",
        ) from exc
    return response


@app.post("/agent/run/debug", tags=["agent"])
def agent_run_debug(
    request: AgentRequest,
    agent: Agent = Depends(get_agent_dependency),
) -> JSONResponse:
    """Internal/debug view: separates internal reasoning from customer text.

    NOT for the customer UI. Useful for Student 1 auditing and Student 4 QA.
    """
    response = agent.run(request)
    return JSONResponse(content=debug_view(response))


@app.get("/policy", tags=["system"])
def policy_view() -> dict[str, object]:
    """Return the loaded policy document (configurable rules)."""
    policy = load_policy()
    return {
        "version": policy.get("version"),
        "issue_types": sorted(policy.get("issue_policies", {}).keys()),
        "escalation": policy.get("escalation", {}),
    }


if __name__ == "__main__":  # pragma: no cover
    import uvicorn

    uvicorn.run("main:app", host="0.0.0.0", port=int(os.getenv("PORT", "8000")), reload=True)
