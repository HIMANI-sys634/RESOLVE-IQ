"""Policy lookup tool.

Loads the configurable rule set from ``data/policy.json`` and resolves an
issue type (including Student 2's free-text aliases) to a policy block.

Policy is DATA, not code: editing policy.json changes behaviour without
touching the decision engine.
"""

from __future__ import annotations

import json
import logging
from functools import lru_cache
from pathlib import Path
from typing import Any

logger = logging.getLogger(__name__)

_POLICY_PATH = Path(__file__).resolve().parent.parent / "data" / "policy.json"


@lru_cache(maxsize=1)
def load_policy(path: str | None = None) -> dict[str, Any]:
    """Load and cache the policy document.

    Raises ``FileNotFoundError`` / ``json.JSONDecodeError`` if the policy file
    is missing or malformed - fail loudly at startup, never silently.
    """
    policy_path = Path(path) if path else _POLICY_PATH
    with policy_path.open("r", encoding="utf-8") as handle:
        policy = json.load(handle)
    logger.info("policy_lookup: loaded policy v%s", policy.get("version", "?"))
    return policy


def normalize_issue_type(issue_type: str | None, policy: dict[str, Any] | None = None) -> str:
    """Map a raw issue type / alias to a canonical policy key."""
    policy = policy or load_policy()
    if not issue_type:
        return "Unknown"
    key = issue_type.strip().lower()
    aliases = policy.get("issue_aliases", {})
    if key in aliases:
        return aliases[key]
    # exact match against canonical keys (case-insensitive)
    for canonical in policy.get("issue_policies", {}):
        if canonical.lower() == key:
            return canonical
    return "Unknown"


def get_policy(issue_type: str | None, policy: dict[str, Any] | None = None) -> dict[str, Any]:
    """Return the policy block for ``issue_type`` (canonical or alias).

    Falls back to ``default_policy`` for unknown issue types so the decision
    engine always has a deterministic, safe rule set.
    """
    policy = policy or load_policy()
    canonical = normalize_issue_type(issue_type, policy)
    block = policy.get("issue_policies", {}).get(canonical)
    if block is None:
        logger.info("policy_lookup: no policy for '%s' -> default", issue_type)
        block = policy.get("default_policy", {})
        canonical = "Unknown"
    result = dict(block)
    result["canonical_issue_type"] = canonical
    result["version"] = policy.get("version")
    return result
