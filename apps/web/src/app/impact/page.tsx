"use client";

import { useEffect, useState } from "react";

type ImpactLink = {
  id: string;
  code_path: string;
  feature_name: string;
  user_segment: string | null;
  apis: string[];
  downstream: string[];
  severity_if_changed: string;
  notes: string | null;
};

const PATHS = [
  "",
  "services/payments/src/stripeAdapter.ts",
  "services/checkout/src/session.ts",
  "services/cart/src/cart.ts",
  "services/inventory/src/reserve.ts",
  "services/payments",
];

export default function ImpactPage() {
  const [path, setPath] = useState("");
  const [links, setLinks] = useState<ImpactLink[]>([]);
  const [summary, setSummary] = useState<string | null>(null);
  const [related, setRelated] = useState<
    Array<{ id: string; title: string; memory_type: string }>
  >([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      setSummary(null);
      try {
        const qs = path
          ? `?path=${encodeURIComponent(path)}&summarize=1`
          : "";
        const res = await fetch(`/api/impact${qs}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed");
        if (!cancelled) {
          setLinks(data.links ?? []);
          setSummary(data.summary ?? null);
          setRelated(
            (data.relatedMemories ?? []).map(
              (m: { id: string; title: string; memory_type: string }) => ({
                id: m.id,
                title: m.title,
                memory_type: m.memory_type,
              })
            )
          );
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [path]);

  return (
    <div className="stack">
      <header className="page-header">
        <h1>Production impact</h1>
        <p>
          Connect a file or module to the features, users, APIs, and downstream
          systems that depend on it.
        </p>
      </header>

      <div className="filters">
        <select value={path} onChange={(e) => setPath(e.target.value)}>
          <option value="">All impact links</option>
          {PATHS.filter(Boolean).map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
      </div>

      {loading && <p className="muted">Analyzing impact…</p>}
      {error && <p className="error">{error}</p>}

      {summary && (
        <article className="panel memory-item">
          <span className="badge">ai summary</span>
          <h3>Impact analysis</h3>
          <p>{summary}</p>
        </article>
      )}

      {related.length > 0 && (
        <div className="panel side-panel">
          <h2>Related memories</h2>
          {related.map((m) => (
            <div key={m.id} className="memory-chip">
              <span className="badge">{m.memory_type}</span>
              <strong>{m.title}</strong>
            </div>
          ))}
        </div>
      )}

      <div className="impact-grid">
        {links.map((l) => (
          <article key={l.id} className="panel impact-item">
            <span className={`badge ${l.severity_if_changed}`}>
              {l.severity_if_changed}
            </span>
            <h3>{l.feature_name}</h3>
            <div className="meta">{l.code_path}</div>
            <p className="muted">
              Users: {l.user_segment ?? "n/a"}
              <br />
              APIs: {(l.apis ?? []).join(", ") || "n/a"}
              <br />
              Downstream: {(l.downstream ?? []).join(", ") || "n/a"}
            </p>
            {l.notes && <p>{l.notes}</p>}
          </article>
        ))}
      </div>
    </div>
  );
}
