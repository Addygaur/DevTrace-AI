import { NextResponse } from "next/server";
import { askDevTrace } from "@devtrace/agent";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const question = String(body.question ?? "").trim();
    if (!question) {
      return NextResponse.json({ error: "question is required" }, { status: 400 });
    }

    const result = await askDevTrace({
      question,
      conversationId: body.conversationId,
      projectSlug: body.projectSlug,
    });

    return NextResponse.json({
      answer: result.answer,
      conversationId: result.conversationId,
      memories: result.memories.map((m) => ({
        id: m.id,
        title: m.title,
        memory_type: m.memory_type,
        module_path: m.module_path,
        distance: m.distance,
        body: m.body.slice(0, 280),
      })),
      impact: result.impact,
      usedCodePaths: result.usedCodePaths,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Chat failed";
    console.error("[api/chat]", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
