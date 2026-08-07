"use client";

import { useEffect, useState } from "react";

type Memory = {
  id: string;
  title: string;
  body: string;
  memory_type: string;
  source: string;
  module_path: string | null;
  tags: string[];
  created_at: string;
};

const TYPES = [
  "all",
  "adr",
  "incident",
  "onboarding",
  "feature",
  "refactor",
  "note",
];

export default function MemoriesPage() {
  const [type, setType] = useState("all");
  const [memories, setMemories] = useState<Memory[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const qs = type === "all" ? "" : `?type=${type}`;
        const res = await fetch(`/api/memories${qs}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to load");
        if (!cancelled) setMemories(data.memories ?? []);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [type]);

  return (
    <div className="stack">
      <header className="page-header">
        <h1>Engineering memory</h1>
        <p>
          Structured long-term knowledge stored in CockroachDB — searchable by
          type and by vector similarity at query time.
        </p>
      </header>

      <div className="filters">
        <select value={type} onChange={(e) => setType(e.target.value)}>
          {TYPES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </div>

      {loading && <p className="muted">Loading memories…</p>}
      {error && <p className="error">{error}</p>}

      <div className="memory-list">
        {memories.map((m) => (
          <article key={m.id} className="panel memory-item">
            <span className="badge">{m.memory_type}</span>
            <h3>{m.title}</h3>
            <div className="meta">
              {m.module_path ?? "n/a"} · {m.source} ·{" "}
              {(m.tags ?? []).join(", ")}
            </div>
            <p>{m.body}</p>
          </article>
        ))}
      </div>
    </div>
  );
}
