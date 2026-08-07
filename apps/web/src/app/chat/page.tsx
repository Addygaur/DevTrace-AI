"use client";

import { FormEvent, useState } from "react";

type MemoryHit = {
  id: string;
  title: string;
  memory_type: string;
  module_path: string | null;
  distance?: number;
  body: string;
};

type Message = {
  role: "user" | "assistant";
  content: string;
};

const SUGGESTIONS = [
  "Why does ShopFlow exist?",
  "Why do we use Stripe instead of PayPal as primary?",
  "What would break if I change stripeAdapter.ts?",
  "What did we learn from the payment timeout incident?",
];

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [memories, setMemories] = useState<MemoryHit[]>([]);
  const [codePaths, setCodePaths] = useState<string[]>([]);
  const [conversationId, setConversationId] = useState<string | undefined>();
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function send(text: string) {
    const q = text.trim();
    if (!q || loading) return;

    setError(null);
    setLoading(true);
    setMessages((prev) => [...prev, { role: "user", content: q }]);
    setQuestion("");

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: q, conversationId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Request failed");

      setConversationId(data.conversationId);
      setMemories(data.memories ?? []);
      setCodePaths(data.usedCodePaths ?? []);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.answer },
      ]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Chat failed");
    } finally {
      setLoading(false);
    }
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    void send(question);
  }

  return (
    <div className="stack">
      <header className="page-header">
        <h1>Memory chat</h1>
        <p>
          Questions search CockroachDB vector memory first, then combine with
          ShopFlow code context via Amazon Bedrock Claude.
        </p>
      </header>

      <div className="chat-layout">
        <div className="panel">
          <div className="chat-log">
            {messages.length === 0 && (
              <div className="muted">
                Try a suggestion, or ask about architecture, incidents, or
                production impact.
              </div>
            )}
            {messages.map((m, i) => (
              <div key={i} className={`bubble ${m.role}`}>
                {m.content}
              </div>
            ))}
            {loading && <div className="meta">Retrieving memories…</div>}
          </div>

          <form className="composer" onSubmit={onSubmit}>
            <div className="filters">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => void send(s)}
                  disabled={loading}
                >
                  {s}
                </button>
              ))}
            </div>
            <textarea
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Ask DevTrace about ShopFlow engineering knowledge…"
              disabled={loading}
            />
            {error && <div className="error">{error}</div>}
            <button className="btn btn-primary" type="submit" disabled={loading}>
              {loading ? "Thinking…" : "Ask"}
            </button>
          </form>
        </div>

        <aside className="panel side-panel">
          <h2>Memories used</h2>
          {memories.length === 0 ? (
            <p className="muted">Citations appear after you ask a question.</p>
          ) : (
            memories.map((m) => (
              <div key={m.id} className="memory-chip">
                <span className="badge">{m.memory_type}</span>
                <strong>{m.title}</strong>
                <span className="meta">
                  {m.module_path ?? "n/a"}
                  {typeof m.distance === "number"
                    ? ` · distance ${Number(m.distance).toFixed(3)}`
                    : ""}
                </span>
              </div>
            ))
          )}

          <h2 style={{ marginTop: "1.25rem" }}>Code context</h2>
          {codePaths.length === 0 ? (
            <p className="muted">No file snippets attached yet.</p>
          ) : (
            codePaths.map((p) => (
              <div key={p} className="meta" style={{ marginBottom: "0.4rem" }}>
                {p}
              </div>
            ))
          )}
        </aside>
      </div>
    </div>
  );
}
