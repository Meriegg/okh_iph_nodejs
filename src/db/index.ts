import Database from "better-sqlite3";
import fs from "fs";
import path from "path";

const dbPath = path.resolve(path.join(__dirname, "../../app.db"));
const initSchemaPath = path.resolve(path.join(__dirname, "../../src/db/init_schema.sql"));

const db = new Database(dbPath);
db.pragma("journal_mode = WAL");

const schema = fs.readFileSync(initSchemaPath, "utf8");
db.exec(schema);

export default db;
