# CockroachDB Managed MCP Server setup

DevTrace stores engineering memory in CockroachDB Cloud. The **Managed MCP Server** lets AI tools (Cursor, Claude Code, etc.) talk to that same cluster — list tables, describe schema, run `SELECT`, and insert rows.

## 1. Get your Cluster ID

In CockroachDB Cloud → cluster Overview. The URL looks like:

`https://cockroachlabs.cloud/cluster/{CLUSTER_ID}/overview`

Put `{CLUSTER_ID}` in `.env.local` as `COCKROACH_CLUSTER_ID`.

## 2. Cursor configuration

Create or edit `.cursor/mcp.json` in this repo (or your global Cursor MCP config):

### OAuth (recommended)

```json
{
  "mcpServers": {
    "cockroachdb-cloud": {
      "url": "https://cockroachlabs.cloud/mcp",
      "headers": {
        "mcp-cluster-id": "YOUR_CLUSTER_ID"
      }
    }
  }
}
```

Then authenticate in Cursor’s MCP UI (read + write consent for inserting memories).

### API key (agents / CI)

```json
{
  "mcpServers": {
    "cockroachdb-cloud": {
      "url": "https://cockroachlabs.cloud/mcp",
      "headers": {
        "mcp-cluster-id": "YOUR_CLUSTER_ID",
        "Authorization": "Bearer YOUR_SERVICE_ACCOUNT_API_KEY"
      }
    }
  }
}
```

## 3. Demo prompts for judges

After MCP is connected:

```text
List tables in the database and describe engineering_memories.
```

```text
Select the 5 most recent engineering_memories titles and memory_type for ShopFlow.
```

```text
Show me the vector index definitions related to embeddings.
```

## 4. ccloud CLI (companion tool)

```bash
# Install: https://www.cockroachlabs.com/docs/cockroachcloud/ccloud-get-started
ccloud auth login
ccloud sql --url "$DATABASE_URL" -f packages/db/migrations/001_init.sql
```

Or use the npm helpers:

```bash
npm run db:migrate
npm run db:seed
```

These apply the same SQL the MCP server can inspect afterward.
