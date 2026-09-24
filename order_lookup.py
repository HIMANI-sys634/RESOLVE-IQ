"""Order lookup tool.

Returns VERIFIED order data. In production this function is replaced by a
call to Student 1's backend; the signature and return shape must stay stable.
The LLM is never the source of truth for any field returned here.
"""

from __future__ import annotations

import logging
from typing import Any

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Mock order store. Swap this dict for an HTTP/SQL call to Student 1's API.
# ---------------------------------------------------------------------------
_MOCK_ORDERS: dict[str, dict[str, Any]] = {
    # Normal path: delivered, return window open -> Offer Return/Replacement
    "O501": {
        "order_id": "O501",
        "customer_id": "U101",
        "product": "Wireless Headphones",
        "status": "Delivered",
        "delivery_date": "2026-09-20",
        "expected_delivery": "2026-09-19",
        "return_window_open": True,
        "payment_status": "Paid",
        "amount_paid": 149.99,
        "refund_confirmed": False,
        "tracking_status": "Delivered",
        "carrier": "FastShip",
        "data_conflict": False,
    },
    # Return window CLOSED -> Human Review
    "O502": {
        "order_id": "O502",
        "customer_id": "U102",
        "product": "Bluetooth Speaker",
        "status": "Delivered",
        "delivery_date": "2026-03-01",
        "expected_delivery": "2026-02-27",
        "return_window_open": False,
        "payment_status": "Paid",
        "amount_paid": 89.50,
        "refund_confirmed": False,
        "tracking_status": "Delivered",
        "carrier": "FastShip",
        "data_conflict": False,
    },
    # Late delivery, still in transit -> Investigate Delivery
    "O503": {
        "order_id": "O503",
        "customer_id": "U103",
        "product": "Mechanical Keyboard",
        "status": "In Transit",
        "delivery_date": None,
        "expected_delivery": "2026-09-15",
        "return_window_open": False,
        "payment_status": "Paid",
        "amount_paid": 210.00,
        "refund_confirmed": False,
        "tracking_status": "Delayed at hub",
        "carrier": "GlobalPost",
        "data_conflict": False,
    },
    # Refund request, backend confirms the refund WAS issued
    "O504": {
        "order_id": "O504",
        "customer_id": "U104",
        "product": "Smart Watch",
        "status": "Returned",
        "delivery_date": "2026-08-30",
        "expected_delivery": "2026-08-28",
        "return_window_open": True,
        "payment_status": "Refunded",
        "amount_paid": 320.00,
        "refund_confirmed": True,
        "refund_amount": 320.00,
        "tracking_status": "Returned to sender",
        "carrier": "FastShip",
        "data_conflict": False,
    },
    # Refund request, NO refund confirmed -> Check Refund Eligibility
    "O505": {
        "order_id": "O505",
        "customer_id": "U105",
        "product": "Noise-Cancelling Earbuds",
        "status": "Delivered",
        "delivery_date": "2026-09-10",
        "expected_delivery": "2026-09-08",
        "return_window_open": True,
        "payment_status": "Paid",
        "amount_paid": 199.00,
        "refund_confirmed": False,
        "tracking_status": "Delivered",
        "carrier": "FastShip",
        "data_conflict": False,
    },
    # CONFLICTING BACKEND DATA: status says Delivered but tracking says In Transit
    "O506": {
        "order_id": "O506",
        "customer_id": "U106",
        "product": "Gaming Mouse",
        "status": "Delivered",
        "delivery_date": None,
        "expected_delivery": "2026-09-12",
        "return_window_open": True,
        "payment_status": "Paid",
        "amount_paid": 75.00,
        "refund_confirmed": False,
        "tracking_status": "In Transit - no delivery scan",
        "carrier": "GlobalPost",
        "data_conflict": True,
    },
    # High-risk customer, high severity damaged claim
    "O507": {
        "order_id": "O507",
        "customer_id": "U107",
        "product": "4K Monitor",
        "status": "Delivered",
        "delivery_date": "2026-09-18",
        "expected_delivery": "2026-09-17",
        "return_window_open": True,
        "payment_status": "Paid",
        "amount_paid": 640.00,
        "refund_confirmed": False,
        "tracking_status": "Delivered",
        "carrier": "FastShip",
        "data_conflict": False,
    },
}


def get_order(order_id: str | None) -> dict[str, Any] | None:
    """Return the verified order record for ``order_id``.

    Returns ``None`` when the order id is missing or unknown. Never raises for
    a missing id so the decision engine can handle it deterministically.
    """
    if not order_id:
        logger.info("order_lookup: no order_id supplied")
        return None
    record = _MOCK_ORDERS.get(order_id)
    if record is None:
        logger.info("order_lookup: order %s not found", order_id)
        return None
    logger.debug("order_lookup: resolved %s", order_id)
    return dict(record)


def list_orders() -> list[str]:
    """Return all known mock order ids (useful for demos and tests)."""
    return sorted(_MOCK_ORDERS.keys())
