import fs from "fs";
import path from "path";
import db from "./index.js";

const migrationsDir = path.resolve(path.join(__dirname, "../../src/db/migrations"));

const applied = (db
  .prepare("SELECT id FROM migrations")
  .all() as { id: string }[])
  .map((r) => r.id);

const files = fs
  .readdirSync(migrationsDir)
  .filter((f) => f.endsWith(".sql"))
  .sort();

db.transaction(() => {
  for (const file of files) {
    if (applied.includes(file)) continue;

    const sql = fs.readFileSync(path.join(migrationsDir, file), "utf8");

    console.log("Applying migration:", file);
    db.exec(sql);

    db.prepare("INSERT INTO migrations (id, applied_at) VALUES (?, ?)").run(
      file,
      Date.now()
    );
  }
})();
