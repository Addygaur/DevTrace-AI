import { NextResponse } from "next/server";
import { analyzeImpact } from "@devtrace/agent";
import { getProjectBySlug, listImpactLinks } from "@devtrace/db";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const slug =
      searchParams.get("project") ?? process.env.DEMO_PROJECT_SLUG ?? "shopflow";
    const codePath = searchParams.get("path") ?? undefined;
    const summarize = searchParams.get("summarize") === "1";

    const project = await getProjectBySlug(slug);
    if (!project) {
      return NextResponse.json(
        { error: `Project "${slug}" not found. Run npm run db:seed.` },
        { status: 404 }
      );
    }

    if (summarize && codePath) {
      const result = await analyzeImpact({
        codePath,
        projectSlug: slug,
      });
      return NextResponse.json({ project, ...result });
    }

    const links = await listImpactLinks({
      projectId: project.id,
      codePath,
    });

    return NextResponse.json({ project, links });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Impact lookup failed";
    console.error("[api/impact]", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
