import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new Database("skyintel.db");
db.pragma("foreign_keys = ON");

export function initDb() {
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

  console.log("Database initialized.");
}

export default db;
