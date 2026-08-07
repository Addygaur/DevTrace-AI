import { readFile, readdir, stat } from "node:fs/promises";
import path from "node:path";

const DEMO_ROOT = path.resolve(
  process.cwd(),
  process.env.SHOPFLOW_ROOT ?? "demo/shopflow"
);

const TEXT_EXTS = new Set([
  ".ts",
  ".tsx",
  ".js",
  ".jsx",
  ".md",
  ".json",
  ".yml",
  ".yaml",
  ".sql",
  ".txt",
]);

async function walk(dir: string, files: string[] = []): Promise<string[]> {
  let entries: string[];
  try {
    entries = await readdir(dir);
  } catch {
    return files;
  }

  for (const entry of entries) {
    if (entry === "node_modules" || entry === ".git") continue;
    const full = path.join(dir, entry);
    const info = await stat(full);
    if (info.isDirectory()) {
      await walk(full, files);
    } else if (TEXT_EXTS.has(path.extname(entry))) {
      files.push(full);
    }
  }
  return files;
}

function scorePath(rel: string, query: string): number {
  const q = query.toLowerCase();
  const p = rel.toLowerCase();
  let score = 0;
  for (const token of q.split(/[^a-z0-9_/.-]+/).filter(Boolean)) {
    if (token.length < 3) continue;
    if (p.includes(token)) score += token.length;
  }
  return score;
}

export async function findRelevantCodeSnippets(
  question: string,
  limit = 3
): Promise<Array<{ path: string; snippet: string }>> {
  const all = await walk(DEMO_ROOT);
  const ranked = all
    .map((full) => {
      const rel = path.relative(DEMO_ROOT, full);
      return { full, rel, score: scorePath(rel, question) };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  const snippets: Array<{ path: string; snippet: string }> = [];
  for (const item of ranked) {
    try {
      const content = await readFile(item.full, "utf8");
      snippets.push({
        path: `demo/shopflow/${item.rel}`,
        snippet: content.slice(0, 1800),
      });
    } catch {
      // skip unreadable
    }
  }
  return snippets;
}

export async function readShopflowFile(
  relativePath: string
): Promise<string | null> {
  const cleaned = relativePath
    .replace(/^demo\/shopflow\//, "")
    .replace(/^\.\//, "");
  const full = path.join(DEMO_ROOT, cleaned);
  if (!full.startsWith(DEMO_ROOT)) return null;
  try {
    return await readFile(full, "utf8");
  } catch {
    return null;
  }
}
