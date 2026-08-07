export default function StackPage() {
  return (
    <div className="stack">
      <header className="page-header">
        <h1>Stack & tools</h1>
        <p>
          Explicit callouts for the CockroachDB × AWS AI Memory Hackathon
          requirements.
        </p>
      </header>

      <article className="panel memory-item">
        <h3>CockroachDB tools</h3>
        <p>
          <strong>Distributed Vector Indexing</strong> —{" "}
          <code>engineering_memories.embedding VECTOR(1024)</code> with{" "}
          <code>VECTOR INDEX ... vector_cosine_ops</code> (C-SPANN) powers
          semantic memory retrieval.
        </p>
        <p>
          <strong>Managed MCP Server</strong> — connect Cursor/agents to the
          same cluster via <code>https://cockroachlabs.cloud/mcp</code> to
          inspect schema, run selects, and insert memories. See{" "}
          <code>docs/mcp-setup.md</code>.
        </p>
        <p>
          <strong>ccloud CLI</strong> — used for cluster SQL access and running
          migrations/seeds (<code>npm run db:migrate</code>,{" "}
          <code>npm run db:seed</code>).
        </p>
      </article>

      <article className="panel memory-item">
        <h3>AWS services</h3>
        <p>
          <strong>Amazon Bedrock</strong> — Titan Embed Text v2 creates memory
          embeddings; Claude generates memory-aware answers and impact
          summaries.
        </p>
      </article>

      <article className="panel memory-item">
        <h3>Memory-first workflow</h3>
        <p>
          1. Embed the question → 2. Cosine search memories in CockroachDB → 3.
          Join impact links → 4. Optionally read ShopFlow files → 5. Claude
          answers with citations → 6. Optional “Remember this” writes a new
          memory.
        </p>
      </article>
    </div>
  );
}
