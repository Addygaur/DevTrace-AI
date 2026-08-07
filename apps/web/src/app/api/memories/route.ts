import { NextResponse } from "next/server";
import { getProjectBySlug, listMemories, type MemoryType } from "@devtrace/db";

export const runtime = "nodejs";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const slug = searchParams.get("project") ?? process.env.DEMO_PROJECT_SLUG ?? "shopflow";
    const memoryType = searchParams.get("type") as MemoryType | null;

    const project = await getProjectBySlug(slug);
    if (!project) {
      return NextResponse.json(
        { error: `Project "${slug}" not found. Run npm run db:seed.` },
        { status: 404 }
      );
    }

    const memories = await listMemories({
      projectId: project.id,
      memoryType: memoryType || undefined,
      limit: 100,
    });

    return NextResponse.json({ project, memories });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to list memories";
    console.error("[api/memories]", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
