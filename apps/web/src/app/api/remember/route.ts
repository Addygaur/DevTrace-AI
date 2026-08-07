import { NextResponse } from "next/server";
import { rememberDecision } from "@devtrace/agent";
import type { MemoryType } from "@devtrace/db";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const title = String(body.title ?? "").trim();
    const content = String(body.body ?? "").trim();
    if (!title || !content) {
      return NextResponse.json(
        { error: "title and body are required" },
        { status: 400 }
      );
    }

    const memory = await rememberDecision({
      title,
      body: content,
      memoryType: (body.memoryType as MemoryType) || "note",
      modulePath: body.modulePath || undefined,
      tags: Array.isArray(body.tags) ? body.tags : undefined,
      projectSlug: body.projectSlug,
    });

    return NextResponse.json({ memory });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to remember";
    console.error("[api/remember]", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
