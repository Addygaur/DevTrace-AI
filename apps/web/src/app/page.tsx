import Link from "next/link";

export default function HomePage() {
  return (
    <>
      <section className="hero">
        <h1>DevTrace</h1>
        <p>
          The memory layer for software engineering. It doesn&apos;t just know
          what the code does — it remembers why it exists.
        </p>
        <div className="cta-row">
          <Link className="btn btn-primary" href="/chat">
            Ask the memory
          </Link>
          <Link className="btn btn-secondary" href="/memories">
            Explore memories
          </Link>
        </div>
      </section>

      <div className="panel stack-callout">
        <strong>Hackathon stack:</strong> CockroachDB Distributed Vector
        Indexing · Managed MCP Server · ccloud CLI · Amazon Bedrock (Titan
        Embeddings + Claude)
      </div>

      <div className="feature-strip">
        <article className="panel">
          <h3>Persistent memory</h3>
          <p>
            ADRs, incidents, onboarding lore, and design decisions live in
            CockroachDB — not in a chat that forgets.
          </p>
        </article>
        <article className="panel">
          <h3>Memory-first answers</h3>
          <p>
            Every question searches engineering memory with vector similarity,
            then combines it with code context.
          </p>
        </article>
        <article className="panel">
          <h3>Production impact</h3>
          <p>
            Trace a module to the features, users, and APIs that break if it
            changes.
          </p>
        </article>
      </div>
    </>
  );
}
