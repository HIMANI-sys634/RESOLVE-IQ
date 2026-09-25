from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .database import Base, engine
from . import models  # noqa: F401  (ensures models are registered before create_all)
from .routes import complaints, orders, customers, auth, intelligence
# Creates tables on startup if they don't exist yet.
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Customer Support AI — Backend",
    description="Stores complaints/orders/customers and exposes APIs for the rest of the team.",
    version="1.0.0",
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(customers.router)
app.include_router(orders.router)
app.include_router(complaints.router)
app.include_router(auth.router)
app.include_router(intelligence.router)


@app.get("/")
def root():
    return {
        "message": "Customer Support AI API",
        "status": "running",
        "version": "1.0.0",
        "documentation": "/docs",
        "openapi": "/openapi.json",
        "services": [
            "customers",
            "orders",
            "complaints"
        ]
    }
