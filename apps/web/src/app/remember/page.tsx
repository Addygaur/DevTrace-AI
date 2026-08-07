"use client";

import { FormEvent, useState } from "react";

export default function RememberPage() {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [memoryType, setMemoryType] = useState("note");
  const [modulePath, setModulePath] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setStatus(null);
    try {
      const res = await fetch("/api/remember", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          body,
          memoryType,
          modulePath: modulePath || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      setStatus(`Saved memory ${data.memory.id}`);
      setTitle("");
      setBody("");
      setModulePath("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="stack">
      <header className="page-header">
        <h1>Remember this</h1>
        <p>
          Capture a decision, incident note, or onboarding tip. DevTrace embeds
          it with Bedrock Titan and stores it in CockroachDB for future
          retrieval.
        </p>
      </header>

      <form className="panel form-grid" onSubmit={onSubmit}>
        <div className="form-field">
          <label htmlFor="title">Title</label>
          <input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            placeholder="e.g. Prefer webhook completion over client redirects"
          />
        </div>
        <div className="form-field">
          <label htmlFor="type">Memory type</label>
          <select
            id="type"
            value={memoryType}
            onChange={(e) => setMemoryType(e.target.value)}
          >
            <option value="note">note</option>
            <option value="adr">adr</option>
            <option value="incident">incident</option>
            <option value="onboarding">onboarding</option>
            <option value="feature">feature</option>
            <option value="refactor">refactor</option>
          </select>
        </div>
        <div className="form-field">
          <label htmlFor="module">Module path</label>
          <input
            id="module"
            value={modulePath}
            onChange={(e) => setModulePath(e.target.value)}
            placeholder="services/checkout"
          />
        </div>
        <div className="form-field">
          <label htmlFor="body">Knowledge</label>
          <textarea
            id="body"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            required
            rows={8}
            placeholder="Write the engineering context you want DevTrace to remember…"
          />
        </div>
        {error && <div className="error">{error}</div>}
        {status && <div className="success">{status}</div>}
        <button className="btn btn-primary" type="submit" disabled={loading}>
          {loading ? "Embedding & saving…" : "Save to memory"}
        </button>
      </form>
    </div>
  );
}
