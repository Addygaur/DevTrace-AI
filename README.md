# DevTrace AI

**Engineering memory agent** for software teams — powered by **CockroachDB** and **Amazon Bedrock**.

DevTrace is not another coding assistant. It is the **persistent memory layer for software engineering**: it stores ADRs, incidents, onboarding lore, and production impact, then retrieves that knowledge when developers ask questions.

> It doesn’t just know what the code does — it remembers why it exists.

## Hackathon stack

### CockroachDB tools (3)

| Tool | How DevTrace uses it |
|------|----------------------|
| **Distributed Vector Indexing** | `VECTOR(1024)` + `VECTOR INDEX ... vector_cosine_ops` (C-SPANN) for semantic memory search |
| **Managed MCP Server** | AI ↔ CockroachDB: schema inspect, `SELECT`, insert memories (see [docs/mcp-setup.md](docs/mcp-setup.md)) |
| **`ccloud` CLI** | Cluster SQL, migrations, and seeding |

### AWS

| Service | How DevTrace uses it |
|---------|----------------------|
| **Amazon Bedrock** | Titan Embed Text v2 → embeddings; Claude → memory-aware answers & impact summaries |

## Demo project: ShopFlow

A fictional checkout platform under [`demo/shopflow`](demo/shopflow) with seeded engineering memories (ADRs, INC-2141 payment timeouts, onboarding, impact links).

## Quick start

### 1. Prerequisites

1. **CockroachDB Cloud** cluster (free tier is fine) — [cloud.cockroachlabs.com](https://cockroachlabs.cloud)
2. Install **`ccloud`**: https://www.cockroachlabs.com/docs/cockroachcloud/ccloud-get-started
3. **AWS** account with Bedrock model access enabled for:
   - `amazon.titan-embed-text-v2:0`
   - Amazon Nova Pro (default) or Claude Sonnet 4.6 after submitting the Anthropic use-case form in Bedrock
4. Node.js 20+

### 2. Configure

```bash
cp .env.example .env.local
# Edit DATABASE_URL, AWS credentials, COCKROACH_CLUSTER_ID
```

Export the same vars for CLI scripts, or symlink:

```bash
cp .env.local .env
```

### 3. Install & migrate

```bash
npm install
# Optional: ccloud sql --url "$DATABASE_URL" < packages/db/migrations/001_init.sql
npm run db:migrate
npm run db:seed
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### 4. Health check

```bash
curl http://localhost:3000/api/health
```

## App surfaces

| Route | Purpose |
|-------|---------|
| `/` | Brand + product pitch |
| `/chat` | Memory-first Q&A with citations |
| `/memories` | Browse engineering memory |
| `/remember` | Capture a new memory |
| `/impact` | Production impact analysis |
| `/stack` | Judge-facing tool callouts |

## Architecture

See [docs/architecture.md](docs/architecture.md). Demo video script: [docs/demo-script.md](docs/demo-script.md).

## Monorepo layout

```
apps/web          Next.js UI + API routes
packages/agent    Memory-first orchestrator + Bedrock clients
packages/db       CockroachDB client, migrations, repositories
demo/shopflow     Seeded demo codebase + memory JSON
scripts           migrate + seed (ccloud-compatible SQL)
docs              Architecture, MCP setup, demo script
```

## License

MIT
