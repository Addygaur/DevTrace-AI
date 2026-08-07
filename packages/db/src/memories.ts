import { query } from "./client";
import type {
  CreateMemoryInput,
  EngineeringMemory,
  ImpactLink,
  MemoryType,
  Project,
} from "./types";

function vectorLiteral(embedding: number[]): string {
  return `[${embedding.join(",")}]`;
}

export async function getProjectBySlug(slug: string): Promise<Project | null> {
  const result = await query<Project>(
    `SELECT id, slug, name, description, created_at
     FROM projects WHERE slug = $1`,
    [slug]
  );
  return result.rows[0] ?? null;
}

export async function ensureProject(input: {
  slug: string;
  name: string;
  description: string;
}): Promise<Project> {
  const existing = await getProjectBySlug(input.slug);
  if (existing) return existing;

  const result = await query<Project>(
    `INSERT INTO projects (slug, name, description)
     VALUES ($1, $2, $3)
     RETURNING id, slug, name, description, created_at`,
    [input.slug, input.name, input.description]
  );
  return result.rows[0];
}

export async function listMemories(opts: {
  projectId: string;
  memoryType?: MemoryType;
  limit?: number;
}): Promise<EngineeringMemory[]> {
  const limit = opts.limit ?? 100;
  if (opts.memoryType) {
    const result = await query<EngineeringMemory>(
      `SELECT id, project_id, title, body, memory_type, source, module_path,
              tags, created_at, updated_at
       FROM engineering_memories
       WHERE project_id = $1 AND memory_type = $2
       ORDER BY created_at DESC
       LIMIT $3`,
      [opts.projectId, opts.memoryType, limit]
    );
    return result.rows;
  }

  const result = await query<EngineeringMemory>(
    `SELECT id, project_id, title, body, memory_type, source, module_path,
            tags, created_at, updated_at
     FROM engineering_memories
     WHERE project_id = $1
     ORDER BY created_at DESC
     LIMIT $2`,
    [opts.projectId, limit]
  );
  return result.rows;
}

export async function searchMemoriesByEmbedding(opts: {
  projectId: string;
  embedding: number[];
  limit?: number;
  memoryType?: MemoryType;
}): Promise<EngineeringMemory[]> {
  const limit = opts.limit ?? 6;
  const vec = vectorLiteral(opts.embedding);

  if (opts.memoryType) {
    const result = await query<EngineeringMemory & { distance: number }>(
      `SELECT id, project_id, title, body, memory_type, source, module_path,
              tags, created_at, updated_at,
              (embedding <=> $1::vector) AS distance
       FROM engineering_memories
       WHERE project_id = $2
         AND memory_type = $3
         AND embedding IS NOT NULL
       ORDER BY embedding <=> $1::vector
       LIMIT $4`,
      [vec, opts.projectId, opts.memoryType, limit]
    );
    return result.rows;
  }

  const result = await query<EngineeringMemory & { distance: number }>(
    `SELECT id, project_id, title, body, memory_type, source, module_path,
            tags, created_at, updated_at,
            (embedding <=> $1::vector) AS distance
     FROM engineering_memories
     WHERE project_id = $2
       AND embedding IS NOT NULL
     ORDER BY embedding <=> $1::vector
     LIMIT $3`,
    [vec, opts.projectId, limit]
  );
  return result.rows;
}

export async function createMemory(
  input: CreateMemoryInput
): Promise<EngineeringMemory> {
  const vec = vectorLiteral(input.embedding);
  const result = await query<EngineeringMemory>(
    `INSERT INTO engineering_memories
      (project_id, title, body, memory_type, source, module_path, tags, embedding)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8::vector)
     RETURNING id, project_id, title, body, memory_type, source, module_path,
               tags, created_at, updated_at`,
    [
      input.projectId,
      input.title,
      input.body,
      input.memoryType,
      input.source ?? "manual",
      input.modulePath ?? null,
      input.tags ?? [],
      vec,
    ]
  );
  return result.rows[0];
}

export async function listImpactLinks(opts: {
  projectId: string;
  codePath?: string;
}): Promise<ImpactLink[]> {
  if (opts.codePath) {
    const result = await query<ImpactLink>(
      `SELECT id, project_id, code_path, feature_name, user_segment, apis,
              downstream, severity_if_changed, notes, created_at
       FROM impact_links
       WHERE project_id = $1
         AND (code_path = $2 OR code_path LIKE $3)
       ORDER BY
         CASE severity_if_changed
           WHEN 'critical' THEN 1
           WHEN 'high' THEN 2
           WHEN 'medium' THEN 3
           ELSE 4
         END,
         code_path`,
      [opts.projectId, opts.codePath, `${opts.codePath}%`]
    );
    return result.rows;
  }

  const result = await query<ImpactLink>(
    `SELECT id, project_id, code_path, feature_name, user_segment, apis,
            downstream, severity_if_changed, notes, created_at
     FROM impact_links
     WHERE project_id = $1
     ORDER BY code_path`,
    [opts.projectId]
  );
  return result.rows;
}

export async function createImpactLink(input: {
  projectId: string;
  codePath: string;
  featureName: string;
  userSegment?: string;
  apis?: string[];
  downstream?: string[];
  severityIfChanged?: string;
  notes?: string;
}): Promise<ImpactLink> {
  const result = await query<ImpactLink>(
    `INSERT INTO impact_links
      (project_id, code_path, feature_name, user_segment, apis, downstream,
       severity_if_changed, notes)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING id, project_id, code_path, feature_name, user_segment, apis,
               downstream, severity_if_changed, notes, created_at`,
    [
      input.projectId,
      input.codePath,
      input.featureName,
      input.userSegment ?? null,
      input.apis ?? [],
      input.downstream ?? [],
      input.severityIfChanged ?? "medium",
      input.notes ?? null,
    ]
  );
  return result.rows[0];
}

export async function createConversation(projectId: string, title?: string) {
  const result = await query<{ id: string }>(
    `INSERT INTO conversations (project_id, title)
     VALUES ($1, $2)
     RETURNING id`,
    [projectId, title ?? null]
  );
  return result.rows[0];
}

export async function addMessage(input: {
  conversationId: string;
  role: "user" | "assistant" | "system";
  content: string;
  memoryIds?: string[];
}) {
  const result = await query(
    `INSERT INTO messages (conversation_id, role, content, memory_ids)
     VALUES ($1, $2, $3, $4)
     RETURNING id`,
    [
      input.conversationId,
      input.role,
      input.content,
      input.memoryIds ?? [],
    ]
  );
  return result.rows[0];
}
