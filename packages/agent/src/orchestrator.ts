import {
  createConversation,
  addMessage,
  createMemory,
  getProjectBySlug,
  listImpactLinks,
  searchMemoriesByEmbedding,
  type EngineeringMemory,
  type ImpactLink,
  type MemoryType,
} from "@devtrace/db";
import { chatCompletion, embedText } from "./bedrock";
import { findRelevantCodeSnippets } from "./codebase";

const SYSTEM_PROMPT = `You are DevTrace AI — an Engineering Memory Agent for software teams.

You are NOT a generic coding assistant. Your job is to preserve and use long-term engineering knowledge:
architecture decisions (ADRs), production incidents, onboarding lore, feature context, and production impact.

Answer style:
- Prefer engineering memory over guessing.
- Cite memories by title and type when you use them.
- Connect code paths to business/production impact when impact data is present.
- If memory is insufficient, say so clearly and use codebase context + general knowledge carefully.
- Be concise, concrete, and useful to developers and new hires.
`;

function formatMemories(memories: EngineeringMemory[]): string {
  if (!memories.length) return "No relevant engineering memories found.";
  return memories
    .map(
      (m, i) =>
        `[Memory ${i + 1}] id=${m.id}
type=${m.memory_type} | module=${m.module_path ?? "n/a"} | distance=${m.distance ?? "n/a"}
Title: ${m.title}
${m.body}`
    )
    .join("\n\n---\n\n");
}

function formatImpact(links: ImpactLink[]): string {
  if (!links.length) return "No impact links matched.";
  return links
    .map(
      (l) =>
        `- ${l.code_path} → feature "${l.feature_name}" | users: ${l.user_segment ?? "n/a"} | severity: ${l.severity_if_changed}
  APIs: ${(l.apis ?? []).join(", ") || "n/a"}
  Downstream: ${(l.downstream ?? []).join(", ") || "n/a"}
  Notes: ${l.notes ?? "n/a"}`
    )
    .join("\n");
}

export interface AskResult {
  answer: string;
  memories: EngineeringMemory[];
  impact: ImpactLink[];
  conversationId: string;
  usedCodePaths: string[];
}

export async function askDevTrace(opts: {
  question: string;
  projectSlug?: string;
  conversationId?: string;
}): Promise<AskResult> {
  const slug = opts.projectSlug ?? process.env.DEMO_PROJECT_SLUG ?? "shopflow";
  const project = await getProjectBySlug(slug);
  if (!project) {
    throw new Error(
      `Project "${slug}" not found. Run npm run db:seed after migrations.`
    );
  }

  const embedding = await embedText(opts.question);
  const memories = await searchMemoriesByEmbedding({
    projectId: project.id,
    embedding,
    limit: 6,
  });

  // Gather impact for modules mentioned in retrieved memories or question
  const allImpact = await listImpactLinks({ projectId: project.id });
  const q = opts.question.toLowerCase();
  const impact = allImpact
    .filter((link) => {
      const pathHit = q.includes(link.code_path.toLowerCase());
      const memHit = memories.some(
        (m) =>
          (m.module_path &&
            link.code_path.startsWith(m.module_path.replace(/\/$/, ""))) ||
          link.code_path
            .toLowerCase()
            .includes((m.module_path ?? "").toLowerCase().split("/").pop() ?? "___")
      );
      const featureHit = q.includes(link.feature_name.toLowerCase());
      return pathHit || memHit || featureHit;
    })
    .slice(0, 8);

  const codeSnippets = await findRelevantCodeSnippets(opts.question, 3);

  const userPrompt = `Project: ${project.name} (${project.slug})
${project.description ?? ""}

User question:
${opts.question}

=== Engineering memories (semantic search via CockroachDB VECTOR index) ===
${formatMemories(memories)}

=== Production impact links ===
${formatImpact(impact)}

=== Relevant codebase snippets (ShopFlow demo) ===
${
  codeSnippets.length
    ? codeSnippets
        .map((c) => `File: ${c.path}\n\`\`\`\n${c.snippet}\n\`\`\``)
        .join("\n\n")
    : "None matched by path heuristic."
}

Write a helpful answer. Explicitly mention which memories you used (by title). If no memories applied, say that you fell back to codebase/general knowledge.`;

  const answer = await chatCompletion({
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: userPrompt }],
  });

  let conversationId = opts.conversationId;
  if (!conversationId) {
    const conv = await createConversation(project.id, opts.question.slice(0, 80));
    conversationId = conv.id;
  }

  await addMessage({
    conversationId,
    role: "user",
    content: opts.question,
  });
  await addMessage({
    conversationId,
    role: "assistant",
    content: answer,
    memoryIds: memories.map((m) => m.id),
  });

  return {
    answer,
    memories,
    impact,
    conversationId,
    usedCodePaths: codeSnippets.map((c) => c.path),
  };
}

export async function rememberDecision(opts: {
  title: string;
  body: string;
  memoryType?: MemoryType;
  modulePath?: string;
  tags?: string[];
  projectSlug?: string;
}): Promise<EngineeringMemory> {
  const slug = opts.projectSlug ?? process.env.DEMO_PROJECT_SLUG ?? "shopflow";
  const project = await getProjectBySlug(slug);
  if (!project) {
    throw new Error(`Project "${slug}" not found. Run npm run db:seed.`);
  }

  const memoryType = opts.memoryType ?? "note";
  const textForEmbed = `${opts.title}\n\n${opts.body}\n\ntype:${memoryType}\nmodule:${opts.modulePath ?? ""}`;
  const embedding = await embedText(textForEmbed);

  return createMemory({
    projectId: project.id,
    title: opts.title,
    body: opts.body,
    memoryType,
    source: "manual",
    modulePath: opts.modulePath ?? null,
    tags: opts.tags ?? ["user-captured"],
    embedding,
  });
}

export async function analyzeImpact(opts: {
  codePath: string;
  projectSlug?: string;
}): Promise<{
  links: ImpactLink[];
  relatedMemories: EngineeringMemory[];
  summary: string;
}> {
  const slug = opts.projectSlug ?? process.env.DEMO_PROJECT_SLUG ?? "shopflow";
  const project = await getProjectBySlug(slug);
  if (!project) {
    throw new Error(`Project "${slug}" not found. Run npm run db:seed.`);
  }

  const links = await listImpactLinks({
    projectId: project.id,
    codePath: opts.codePath,
  });

  const embedding = await embedText(
    `production impact of ${opts.codePath} ${links.map((l) => l.feature_name).join(" ")}`
  );
  const relatedMemories = await searchMemoriesByEmbedding({
    projectId: project.id,
    embedding,
    limit: 5,
  });

  const summary = await chatCompletion({
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: `Summarize the production impact of changing \`${opts.codePath}\` for the ShopFlow project.

Impact links:
${formatImpact(links)}

Related memories:
${formatMemories(relatedMemories)}

Give: who is affected, which features/APIs break, severity, and any historical lessons from memory.`,
      },
    ],
    maxTokens: 1200,
  });

  return { links, relatedMemories, summary };
}
