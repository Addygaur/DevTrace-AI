import { NextResponse } from "next/server";
import { query } from "@devtrace/db";

export const runtime = "nodejs";

export async function GET() {
  const checks: Record<string, string> = {
    app: "ok",
    database: "unknown",
    bedrock: process.env.AWS_REGION ? "configured" : "missing_region",
  };

  try {
    if (!process.env.DATABASE_URL) {
      checks.database = "missing_DATABASE_URL";
    } else {
      await query("SELECT 1 AS ok");
      checks.database = "ok";
    }
  } catch (err) {
    checks.database =
      err instanceof Error ? `error: ${err.message}` : "error";
  }

  const ok = checks.database === "ok";
  return NextResponse.json(
    {
      status: ok ? "healthy" : "degraded",
      checks,
      stack: {
        cockroachdb: [
          "Distributed Vector Indexing (VECTOR + C-SPANN)",
          "Managed MCP Server",
          "ccloud CLI",
        ],
        aws: ["Amazon Bedrock (Titan Embeddings + Claude)"],
      },
    },
    { status: ok ? 200 : 503 }
  );
}
