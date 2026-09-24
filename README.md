# Student 3 — AI Agent / Decision Engine

Deterministic decision engine + LLM reasoning layer for a collaborative
Customer Support AI project.

> **Scope:** this repository contains **only Student 3's module**. It does not
> include Student 1's backend or Student 2's complaint-intelligence module, and
> it contains no frontend code. Both are integrated through stable JSON contracts.

---

## 1. Project overview

Student 2 turns a raw complaint into structured intelligence. Student 3 takes
that intelligence, retrieves **verified** customer/order/policy data, applies
**deterministic business rules**, uses an LLM only for reasoning and wording,
validates everything through **guardrails**, and returns a clean structured
response that Student 1 (backend) and Student 4 (frontend) can consume.

### Core design principle

**Verified data + deterministic rules decide the action.
The LLM only explains and writes the customer message.**

The LLM can never change the recommended action, can never invent order,
payment, refund or customer facts, and can never claim something was completed
unless the backend confirms it.

---

## 2. Student 3 responsibility

| In scope | Out of scope |
|---|---|
| Understand the complaint | Building a frontend |
| Retrieve customer / order / policy data | Replacing Student 1's backend |
| Determine what happened | Re-implementing Student 2's NLP analysis |
| Identify missing information | |
| Apply deterministic business rules | |
| LLM reasoning + customer-facing response | |
| Guardrails + escalation to human review | |
| Structured JSON output + FastAPI | |

---

## 3. Architecture

```
Complaint Intelligence (Student 2)
        │
        ▼
Customer Lookup        ─┐
Order Lookup            ├─ VERIFIED DATA (never from the LLM)
Policy Lookup          ─┘
        │
        ▼
Deterministic Decision  ── authoritative: picks the action + escalation
        │
        ▼
LLM Reasoning / Response generation  ── wording only, JSON-constrained
        │
        ▼
Guardrail Validation   ── blocks hallucinations, unsafe actions, leaks
        │
        ▼
Final Structured Output (AgentResponse)
```

Pipeline entry point: `Agent.run()` in `agent.py`.

---

## 4. Folder structure

```
student3-agent/
├── prompts/
│   └── agent_prompt.txt
├── tools/
│   ├── __init__.py
│   ├── order_lookup.py
│   ├── customer_lookup.py
│   └── policy_lookup.py
├── data/
│   └── policy.json
├── contracts/
│   └── data_formats.json
├── tests/
│   ├── conftest.py
│   └── test_agent.py
├── agent.py
├── decision.py
├── guardrails.py
├── response.py
├── schemas.py
├── llm_provider.py
├── main.py
├── requirements.txt
├── .env.example
├── .gitignore
└── README.md
```

`schemas.py` and `llm_provider.py` are supporting modules: Pydantic contracts
and the swappable LLM layer (kept separate from `agent.py` so neither the API
layer nor the decision engine knows which vendor is in use).

---

## 5. Setup instructions

```bash
git clone <your-repo-url>
cd student3-agent
python3.11 -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate
pip install -r requirements.txt
```

The application runs immediately **without an API key** (deterministic mock
mode). No database is required.

---

## 6. Environment variables

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

| Variable | Default | Purpose |
|---|---|---|
| `LLM_API_KEY` | *(empty)* | OpenAI-compatible key. Empty ⇒ mock mode. |
| `OPENAI_API_KEY` | *(empty)* | Accepted alias for `LLM_API_KEY`. |
| `LLM_MODEL` | `gpt-4o-mini` | Model name. |
| `LLM_BASE_URL` | *(empty)* | Custom base URL (Groq, Together, vLLM, Ollama, Azure…). |
| `STUDENT3_FORCE_MOCK` | `1` | Force mock mode even when a key exists. |
| `LOG_LEVEL` | `INFO` | Logging level. |
| `PORT` | `8000` | Uvicorn port. |

**Provider selection logic** (`llm_provider.get_provider`):
mock mode is used when `STUDENT3_FORCE_MOCK` is truthy **or** no key is set;
otherwise the real OpenAI-compatible provider is constructed.

---

## 7. How to run

```bash
uvicorn main:app --reload
# or
python main.py
```

- Swagger UI: http://127.0.0.1:8000/docs
- Health: http://127.0.0.1:8000/health

---

## 8. How to run tests

```bash
pytest -q
```

Tests force offline mode (`STUDENT3_FORCE_MOCK=1`, API keys removed) and never
make a network call. Harmful LLM output is injected through a `FakeLLM`
provider fixture.

---

## 9. API example

### POST /agent/run

```bash
curl -X POST http://127.0.0.1:8000/agent/run \
  -H "Content-Type: application/json" \
  -d '{
    "complaint_id": "C001",
    "clean_text": "my headphones arrived damaged",
    "issue_type": "Damaged Product",
    "sentiment": "Negative",
    "severity": "High",
    "cluster": "Damaged Products",
    "customer_id": "U101",
    "order_id": "O501"
  }'
```

Response:

```json
{
  "complaint_id": "C001",
  "summary": "Customer reports: my headphones arrived damaged. Order O501 (Wireless Headphones) is Delivered, delivered 2026-09-20; payment Paid; return window open. Recommended action: Offer Return/Replacement.",
  "action": "Offer Return/Replacement",
  "reason": "The order is delivered and the return window is open.",
  "customer_message": "Thanks for letting us know, and sorry about the trouble with your order. We can help with a return or a replacement - please confirm which option you prefer and we will take it from there.",
  "escalate": true,
  "missing_information": [],
  "escalate_reason": "High severity complaint - routed to a human agent.",
  "guardrail_flags": [],
  "severity": "High",
  "issue_type": "Damaged Product",
  "used_llm": false,
  "llm_provider": "mock",
  "policy_version": "1.0.0"
}
```

### Other endpoints

| Method | Path | Purpose |
|---|---|---|
| GET | `/health` | Liveness + active LLM mode + policy version |
| POST | `/agent/run` | Full pipeline, validated `AgentResponse` |
| POST | `/agent/run/debug` | Internal vs customer-facing split (not for the UI) |
| GET | `/policy` | Inspect the loaded policy document |

---

## 10. Example input / output

**Input** (from Student 2, identifiers added by Student 1):

```json
{
  "complaint_id": "C004",
  "clean_text": "I want my money back for the earbuds",
  "issue_type": "Refund",
  "sentiment": "Negative",
  "severity": "Medium",
  "cluster": "Refund Requests",
  "customer_id": "U105",
  "order_id": "O505"
}
```

**Output:**

```json
{
  "complaint_id": "C004",
  "summary": "Customer reports: I want my money back for the earbuds. Order O505 (Noise-Cancelling Earbuds) is Delivered, delivered 2026-09-10; payment Paid; return window open. Recommended action: Check Refund Eligibility.",
  "action": "Check Refund Eligibility",
  "reason": "No refund is confirmed in the backend, so eligibility must be verified.",
  "customer_message": "Thanks for your message. We are verifying your refund eligibility against the order record and will confirm the next step with you once that check is complete.",
  "escalate": false,
  "missing_information": [],
  "escalate_reason": null,
  "guardrail_flags": [],
  "severity": "Medium",
  "issue_type": "Refund",
  "used_llm": false,
  "llm_provider": "mock",
  "policy_version": "1.0.0"
}
```

### Mock data included

| Order | Scenario |
|---|---|
| `O501` / `U101` | Damaged product, return window open ⇒ Offer Return/Replacement |
| `O502` / `U102` | Damaged product, return window closed ⇒ Human Review |
| `O503` / `U103` | Late delivery, in transit ⇒ Investigate Delivery |
| `O504` / `U104` | Refund confirmed in backend ⇒ Inform Refund Confirmed |
| `O505` / `U105` | Refund not confirmed ⇒ Check Refund Eligibility |
| `O506` / `U106` | **Conflicting backend data** ⇒ Human Review |
| `O507` / `U107` | **High-risk customer** ⇒ escalate |

Any request without `customer_id` / `order_id`, or with an unknown id,
⇒ `Request Missing Information` + escalation.

---

## 11. Policy engine

`data/policy.json` holds all rules as **data**, so behaviour changes without
touching `decision.py`:

- `issue_aliases` — maps Student 2's free-text issue types to canonical keys
- `issue_policies.<type>.rules` — ordered `when → action` rules (first match wins)
- `issue_policies.<type>.allowed_actions` — allow-list; anything else ⇒ Human Review
- `issue_policies.<type>.default_action` — safe fallback
- `escalation` — severity levels, high-risk issue types, forbidden actions,
  VIP behaviour, data-conflict handling
- `missing_information` — which fields are critical, and the ask-messages
- `guardrails` — forbidden refund/completion phrases, internal markers, length cap

---

## 12. Guardrails

`guardrails.py` corrects or rejects any LLM output that breaks the rules:

| Check | Result |
|---|---|
| Invalid / malformed JSON | Fall back to the deterministic output (`invalid_llm_json`) |
| Schema violation | Fall back to the deterministic output |
| Fabricated refund claim (`refund_confirmed=false`) | `action = Human Review`, `escalate = true`, message rewritten |
| Unconfirmed completion claim ("has been shipped") | Message rewritten |
| Unsupported / forbidden action | Reverted to the deterministic action |
| Escalation-flag mismatch | Forced to the deterministic value |
| Missing-information mismatch | Merged with the deterministic list |
| Internal-data or PII leak | Message rewritten |
| Over-long message | Truncated safely |

The system fails safe: a guardrail violation can only make the outcome **more**
conservative, never less.

---

## 13. Integration notes for Student 1 (backend)

1. Call `POST /agent/run` with Student 2's intelligence payload plus
   `customer_id` / `order_id`.
2. The response is validated by the `AgentResponse` Pydantic model — see
   `contracts/data_formats.json`.
3. **Never** let upstream code write the `customer_message`; it is already
   guardrail-checked and safe to send.
4. Internal fields (`escalate_reason`, `guardrail_flags`, `policy_version`)
   are for your audit log, not for customers.
5. Persist the full record; `escalate == true` should create a human-review task.
6. To replace mock data with real APIs, implement the three callables:
   `get_order(order_id)`, `get_customer(customer_id)`, `get_policy(issue_type)`.
   Keep the same signatures and return shapes — nothing else changes.

```python
# tools/order_lookup.py  (production version sketch)
def get_order(order_id: str | None) -> dict | None:
    if not order_id:
        return None
    resp = httpx.get(f"{BACKEND_URL}/orders/{order_id}", timeout=5)
    if resp.status_code == 404:
        return None
    resp.raise_for_status()
    return resp.json()
```

---

## 14. Integration notes for Student 4 (frontend)

- Use `POST /agent/run`; render only these fields to the customer:
  `customer_message`, `action` (as a friendly status chip), `escalate`,
  `missing_information`.
- If `escalate` is `true`, show a neutral "a specialist will follow up" state —
  the `customer_message` already says so.
- If `missing_information` is not empty, render an input form for those fields
  and resubmit with them filled in.
- Do **not** render `reason`, `escalate_reason`, `guardrail_flags` or
  `policy_version` in the customer UI. Use `POST /agent/run/debug` for QA only.
- Field names are frozen in `contracts/data_formats.json`.

---

## 15. Security notes

- Secrets live only in `.env`, which is git-ignored. `.env.example` contains no
  real keys. Never commit a key.
- The LLM never receives raw database access; it only sees the verified context
  actually needed for the case.
- Guardrails strip internal markers, PII and email addresses from customer text.
- Error responses never expose stack traces; details are logged server-side.
- Mock customer records already store masked email/phone values.
- Input is validated by Pydantic; malformed payloads return HTTP 422.

---

## 16. Future replacement of mock tools with real backend APIs

| Mock module | Replace with |
|---|---|
| `tools/order_lookup.py` | `GET {BACKEND}/orders/{order_id}` |
| `tools/customer_lookup.py` | `GET {BACKEND}/customers/{customer_id}` |
| `tools/policy_lookup.py` | Keep `data/policy.json`, or fetch it from a policy service |
| `llm_provider.MockProvider` | `OpenAICompatibleProvider` (automatic once a key is set) |

Because the decision engine only depends on the returned dictionaries and the
Pydantic models, swapping a source requires no change to `decision.py`,
`guardrails.py`, `response.py` or `main.py`. Add the real client behind the same
function name and the rest of the pipeline keeps working unchanged.

---

## 17. Quick start commands

```bash
pip install -r requirements.txt
pytest -q
uvicorn main:app --reload
```
