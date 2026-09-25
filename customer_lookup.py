"""Customer lookup tool.

Returns VERIFIED customer data. Replace the mock store with Student 1's real
customer endpoint without changing the signature or return shape.
"""

from __future__ import annotations

import logging
from typing import Any

logger = logging.getLogger(__name__)

# Masked contact details only - the agent must never leak full contact data.
_MOCK_CUSTOMERS: dict[str, dict[str, Any]] = {
    "U101": {
        "customer_id": "U101",
        "name": "Alex Morgan",
        "email": "a***@example.com",
        "phone": "+1-***-***-4821",
        "membership_tier": "Standard",
        "is_high_risk": False,
        "previous_complaints": 1,
    },
    "U102": {
        "customer_id": "U102",
        "name": "Priya Nair",
        "email": "p***@example.com",
        "phone": "+44-***-***-7710",
        "membership_tier": "Gold",
        "is_high_risk": False,
        "previous_complaints": 0,
    },
    "U103": {
        "customer_id": "U103",
        "name": "Daniel Okafor",
        "email": "d***@example.com",
        "phone": "+1-***-***-3390",
        "membership_tier": "Standard",
        "is_high_risk": False,
        "previous_complaints": 2,
    },
    "U104": {
        "customer_id": "U104",
        "name": "Mei Lin",
        "email": "m***@example.com",
        "phone": "+86-***-***-5566",
        "membership_tier": "Platinum",
        "is_high_risk": False,
        "previous_complaints": 1,
    },
    "U105": {
        "customer_id": "U105",
        "name": "Tom Becker",
        "email": "t***@example.com",
        "phone": "+49-***-***-2214",
        "membership_tier": "Standard",
        "is_high_risk": False,
        "previous_complaints": 3,
    },
    "U106": {
        "customer_id": "U106",
        "name": "Sara Haddad",
        "email": "s***@example.com",
        "phone": "+971-***-***-8890",
        "membership_tier": "Gold",
        "is_high_risk": False,
        "previous_complaints": 0,
    },
    "U107": {
        "customer_id": "U107",
        "name": "Victor Reyes",
        "email": "v***@example.com",
        "phone": "+1-***-***-1140",
        "membership_tier": "Standard",
        "is_high_risk": True,
        "previous_complaints": 7,
    },
}


def get_customer(customer_id: str | None) -> dict[str, Any] | None:
    """Return the verified customer record for ``customer_id``.

    Returns ``None`` when the id is missing or unknown.
    """
    if not customer_id:
        logger.info("customer_lookup: no customer_id supplied")
        return None
    record = _MOCK_CUSTOMERS.get(customer_id)
    if record is None:
        logger.info("customer_lookup: customer %s not found", customer_id)
        return None
    logger.debug("customer_lookup: resolved %s", customer_id)
    return dict(record)


def list_customers() -> list[str]:
    """Return all known mock customer ids (useful for demos and tests)."""
    return sorted(_MOCK_CUSTOMERS.keys())
