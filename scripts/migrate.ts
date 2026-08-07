import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { config } from "dotenv";
import { closePool, query } from "@devtrace/db";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
config({ path: path.join(root, ".env.local") });
config({ path: path.join(root, ".env") });

async function main() {
  const sqlPath = path.join(
    root,
    "packages/db/migrations/001_init.sql"
  );
  const sql = await readFile(sqlPath, "utf8");

  // Strip full-line SQL comments, then split on statement boundaries
  const withoutLineComments = sql
    .split("\n")
    .filter((line) => !line.trim().startsWith("--"))
    .join("\n");

  const statements = withoutLineComments
    .split(";")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  console.log(`Running ${statements.length} statements against CockroachDB...`);

  for (const statement of statements) {
    const preview = statement.replace(/\s+/g, " ").slice(0, 80);
    process.stdout.write(`  → ${preview}...\n`);
    await query(statement);
  }

  console.log("Migration complete.");
  await closePool();
}

main().catch(async (err) => {
  console.error(err);
  await closePool().catch(() => undefined);
  process.exit(1);
});
