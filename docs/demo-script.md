# DevTrace AI — Demo video script (< 3 minutes)

**Target length:** 2:00–2:45  
**Message:** DevTrace is the memory layer for software engineering.

---

## 0:00–0:20 — Hook

> “AI coding tools forget everything after each chat. DevTrace remembers why your system exists.”

Show homepage: brand **DevTrace**, one line pitch, stack callout (CockroachDB + Bedrock).

---

## 0:20–0:45 — Problem

> “Architecture decisions, production incidents, and onboarding knowledge are scattered across PRs, Slack, and senior engineers’ heads.”

Cut to ShopFlow repo tree briefly (`demo/shopflow`).

---

## 0:45–1:20 — Store + retrieve

1. Open **Memories** — show ADR-0007 (Stripe), INC-2141 (timeouts).
2. Say: “These live in CockroachDB with vector embeddings.”
3. Open **Chat** — ask: *“Why do we use Stripe as primary?”*
4. Show **Memories used** citations panel (ADR-0007).

**Mention tools:** “Semantic search uses CockroachDB distributed vector indexing. Answers from Amazon Bedrock Claude.”

---

## 1:20–1:55 — Act on memory (impact)

1. Open **Impact** → select `services/payments/src/stripeAdapter.ts`.
2. Show severity **critical**, users, APIs, downstream.
3. Show AI summary referencing INC-2141.

> “DevTrace doesn’t just explain code — it tells you what breaks in production.”

---

## 1:55–2:25 — Grow memory

1. Open **Remember this**.
2. Paste a short note: “Never mark checkout paid from the browser redirect alone.”
3. Save — show success.
4. Ask chat the same idea — cite the new memory.

---

## 2:25–2:45 — Close + stack

Open **Stack** page:

- CockroachDB: Vector Indexing · Managed MCP · ccloud  
- AWS: Bedrock  

> “DevTrace AI — the persistent engineering memory for your team.”

End on GitHub repo URL.

---

## B-roll / optional

- `ccloud sql` running migration  
- Cursor MCP listing `engineering_memories`  
- `/api/health` JSON  
