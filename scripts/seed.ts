import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { config } from "dotenv";
import {
  closePool,
  createImpactLink,
  createMemory,
  ensureProject,
  listMemories,
} from "@devtrace/db";
import { embedText } from "@devtrace/agent";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
config({ path: path.join(root, ".env.local") });
config({ path: path.join(root, ".env") });

interface SeedMemory {
  title: string;
  body: string;
  memory_type: "adr" | "incident" | "onboarding" | "feature" | "refactor" | "note";
  source: string;
  module_path?: string;
  tags?: string[];
}

interface SeedImpact {
  code_path: string;
  feature_name: string;
  user_segment: string;
  apis: string[];
  downstream: string[];
  severity_if_changed: string;
  notes: string;
}

interface SeedFile {
  project: {
    slug: string;
    name: string;
    description: string;
  };
  memories: SeedMemory[];
  impact_links: SeedImpact[];
}

async function main() {
  const seedPath = path.join(root, "demo/shopflow/seed/memories.json");
  const raw = await readFile(seedPath, "utf8");
  const seed = JSON.parse(raw) as SeedFile;

  const project = await ensureProject(seed.project);
  console.log(`Project ready: ${project.name} (${project.id})`);

  const existing = await listMemories({ projectId: project.id, limit: 1 });
  if (existing.length > 0) {
    console.log(
      "Memories already exist — skipping re-seed. Truncate tables to re-seed."
    );
    await closePool();
    return;
  }

  for (const memory of seed.memories) {
    const text = `${memory.title}\n\n${memory.body}\n\ntype:${memory.memory_type}\nmodule:${memory.module_path ?? ""}`;
    process.stdout.write(`Embedding memory: ${memory.title}\n`);
    const embedding = await embedText(text);
    await createMemory({
      projectId: project.id,
      title: memory.title,
      body: memory.body,
      memoryType: memory.memory_type,
      source: memory.source,
      modulePath: memory.module_path ?? null,
      tags: memory.tags ?? [],
      embedding,
    });
  }

  for (const link of seed.impact_links) {
    await createImpactLink({
      projectId: project.id,
      codePath: link.code_path,
      featureName: link.feature_name,
      userSegment: link.user_segment,
      apis: link.apis,
      downstream: link.downstream,
      severityIfChanged: link.severity_if_changed,
      notes: link.notes,
    });
  }

  console.log(
    `Seeded ${seed.memories.length} memories and ${seed.impact_links.length} impact links.`
  );
  await closePool();
}

main().catch(async (err) => {
  console.error(err);
  await closePool().catch(() => undefined);
  process.exit(1);
});
