import Database from "better-sqlite3";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_PATH = path.resolve(process.cwd(), "skyintel.db");

let db = createConnection();

function createConnection() {
  const connection = new Database(DB_PATH);
  connection.pragma("foreign_keys = ON");
  return connection;
}

function isCorruptionError(error: unknown) {
  if (!(error instanceof Error)) return false;
  const sqliteCode = (error as { code?: string }).code;
  return sqliteCode === "SQLITE_CORRUPT" || error.message.toLowerCase().includes("database disk image is malformed");
}

function backupCorruptDatabase() {
  if (!fs.existsSync(DB_PATH)) return;

  const backupPath = path.resolve(process.cwd(), `skyintel.corrupt.${Date.now()}.db`);
  fs.renameSync(DB_PATH, backupPath);
  console.warn(`Detected corrupted SQLite database. Backed it up to: ${backupPath}`);
}

function ensureHealthyConnection() {
  try {
    const result = db.pragma("quick_check", { simple: true });
    if (result !== "ok") {
      throw new Error(`quick_check failed: ${String(result)}`);
    }
  } catch (error) {
    if (!isCorruptionError(error)) {
      throw error;
    }

    db.close();
    backupCorruptDatabase();
    db = createConnection();
  }
}

function createSchema() {
  // Flights table
  db.exec(`
    CREATE TABLE IF NOT EXISTS flights (
      id TEXT PRIMARY KEY,
      callsign TEXT,
      lat REAL,
      lon REAL,
      altitude REAL,
      speed REAL,
      heading REAL,
      last_updated DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Weather snapshots
  db.exec(`
    CREATE TABLE IF NOT EXISTS weather_snapshots (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      flight_id TEXT,
      wind_speed REAL,
      gust REAL,
      temperature REAL,
      pressure REAL,
      humidity REAL,
      clouds REAL,
      precipitation REAL,
      condition TEXT,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(flight_id) REFERENCES flights(id) ON DELETE CASCADE
    )
  `);

  // Turbulence scores and history
  db.exec(`
    CREATE TABLE IF NOT EXISTS turbulence_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      flight_id TEXT,
      score REAL,
      risk_level TEXT,
      altitude REAL,
      lat REAL,
      lon REAL,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(flight_id) REFERENCES flights(id) ON DELETE CASCADE
    )
  `);

  // Alerts
  db.exec(`
    CREATE TABLE IF NOT EXISTS alerts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      flight_id TEXT,
      message TEXT,
      score REAL,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(flight_id) REFERENCES flights(id) ON DELETE CASCADE
    )
  `);
}

export function initDb() {
  ensureHealthyConnection();

  try {
    createSchema();
  } catch (error) {
    if (!isCorruptionError(error)) {
      throw error;
    }

    db.close();
    backupCorruptDatabase();
    db = createConnection();
    createSchema();
  }

  console.log("Database initialized.");
}

export { db as default };
