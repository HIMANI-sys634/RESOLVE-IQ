"""Verified-data tools for the Student 3 decision engine.

Every module in this package is an isolation seam: Student 1's real backend
can replace the mock implementation without touching the decision engine,
the guardrails or the API layer.
"""

from tools.customer_lookup import get_customer, list_customers
from tools.order_lookup import get_order, list_orders
from tools.policy_lookup import get_policy, load_policy

__all__ = [
    "get_customer",
    "list_customers",
    "get_order",
    "list_orders",
    "get_policy",
    "load_policy",
]
