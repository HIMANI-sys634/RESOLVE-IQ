from fastapi import FastAPI, HTTPException

from agent import agent, get_policy
from schemas import AgentRequest, AgentResponse


app = FastAPI(
    title="Customer Support AI — Decision Engine",
    description="AI Agent for complaint decisioning and customer-support response generation.",
    version="1.0.0",
)


@app.get("/")
def root():
    return {
        "message": "Customer Support AI — AI Agent",
        "status": "running",
        "version": "1.0.0",
        "documentation": "/docs",
        "endpoints": [
            "GET /health",
            "POST /agent/run",
            "GET /policy",
        ],
    }


@app.get("/health")
def health():
    return {
        "status": "healthy",
        "service": "ai_agent",
        "llm_provider": agent.provider.name,
        "mock_mode": agent.provider.is_mock,
    }


@app.get("/policy")
def policy():
    return get_policy()


@app.post("/agent/run", response_model=AgentResponse)
def run_agent(request: AgentRequest):
    try:
        return agent.run(request)
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"AI Agent processing failed: {exc}",
        ) from exc