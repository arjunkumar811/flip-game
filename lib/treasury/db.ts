import Database from "better-sqlite3";
import fs from "fs";
import path from "path";

export interface HouseRow {
  id: number;
  bankrollCents: number;
  createdAt: string;
  updatedAt: string;
}

// Ensure data directory exists
const dataDir = path.join(process.cwd(), "data");
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, "treasury.db");

// Singleton SQLite Database Connection
export const db = new Database(dbPath);

// Enable WAL mode for high concurrency & performance
db.pragma("journal_mode = WAL");

// Initialize House table
db.exec(`
  CREATE TABLE IF NOT EXISTS House (
    id INTEGER PRIMARY KEY,
    bankrollCents INTEGER NOT NULL,
    createdAt TEXT NOT NULL,
    updatedAt TEXT NOT NULL
  );
`);

// Seed initial House record if not present (Initial Treasury = 500 USDT -> 50000 cents)
const seedStmt = db.prepare(`
  INSERT OR IGNORE INTO House (id, bankrollCents, createdAt, updatedAt)
  VALUES (1, 50000, datetime('now'), datetime('now'))
`);
seedStmt.run();

export function getHouseRecord(): HouseRow {
  const row = db.prepare<[], HouseRow>("SELECT * FROM House WHERE id = 1").get();
  if (!row) {
    db.prepare(`
      INSERT INTO House (id, bankrollCents, createdAt, updatedAt)
      VALUES (1, 50000, datetime('now'), datetime('now'))
    `).run();
    return db.prepare<[], HouseRow>("SELECT * FROM House WHERE id = 1").get()!;
  }
  return row;
}
