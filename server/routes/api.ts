import { Router } from "express";
import db from "../db.js";
import { calculateTurbulence } from "../utils/turbulence.js";

const router = Router();

// GET /api/flights
router.get("/flights", (req, res) => {
  const flights = db.prepare(`
    SELECT f.*, w.wind_speed, w.gust, w.temperature, w.pressure, w.humidity, w.clouds, w.precipitation, w.condition, t.score as turbulenceScore, t.risk_level as riskLevel
    FROM flights f
    LEFT JOIN weather_snapshots w
      ON f.id = w.flight_id
      AND w.id = (
        SELECT MAX(id)
        FROM weather_snapshots
        WHERE flight_id = f.id
      )
    LEFT JOIN turbulence_history t
      ON f.id = t.flight_id
      AND t.id = (
        SELECT MAX(id)
        FROM turbulence_history
        WHERE flight_id = f.id
      )
    WHERE f.last_updated >= datetime('now', '-10 minutes')
  `).all();
  res.json(flights);
});

// GET /api/flights/:id
router.get("/flights/:id", (req, res) => {
  const flight = db.prepare("SELECT * FROM flights WHERE id = ?").get(req.params.id) as any;
  if (!flight) return res.status(404).json({ error: "Flight not found" });

  const history = db.prepare(`
    SELECT score, altitude, lat, lon, timestamp 
    FROM turbulence_history 
    WHERE flight_id = ?
      AND timestamp >= datetime('now', '-3 hours')
      AND lat IS NOT NULL
      AND lon IS NOT NULL
    ORDER BY id DESC 
    LIMIT 50
  `).all(req.params.id);

  res.json({ ...(flight as object), history });
});

// GET /api/health
router.get("/health", (req, res) => {
  try {
    db.prepare("SELECT 1").get();
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  } catch (err) {
    res.status(503).json({ status: "error", message: (err as Error).message });
  }
});

// GET /api/alerts
router.get("/alerts", (req, res) => {
  const alerts = db.prepare(`
    SELECT *
    FROM alerts
    ORDER BY timestamp DESC
    LIMIT 50
  `).all();

  res.json(alerts);
});

// POST /api/alerts (Node-RED severe weather alerts)
router.post("/alerts", (req, res) => {
  const { flightId, callsign, message, score } = req.body;

  if (!flightId || !message) {
    return res.status(400).json({ error: "Missing flightId or message" });
  }

  // Ensure the flight row exists so the FK constraint is satisfied
  db.prepare(`
    INSERT OR IGNORE INTO flights (id, callsign, lat, lon, altitude, speed, heading, last_updated)
    VALUES (?, ?, 0, 0, 0, 0, 0, CURRENT_TIMESTAMP)
  `).run(flightId, callsign || flightId);

  db.prepare(`
    INSERT INTO alerts (flight_id, message, score)
    VALUES (?, ?, ?)
  `).run(flightId, message, score ?? 0);

  res.json({ status: "ok" });
});

// POST /api/ingest/flights (Node-RED Integration)
router.post("/ingest/flights", (req, res) => {
  const { id, callsign, lat, lon, altitude, speed, heading, weather } = req.body;

  if (!id) return res.status(400).json({ error: "Missing flight ID" });

  // Update or Insert Flight
  db.prepare(`
    INSERT INTO flights (id, callsign, lat, lon, altitude, speed, heading, last_updated)
    VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    ON CONFLICT(id) DO UPDATE SET
      lat=excluded.lat,
      lon=excluded.lon,
      altitude=excluded.altitude,
      speed=excluded.speed,
      heading=excluded.heading,
      last_updated=CURRENT_TIMESTAMP
  `).run(id, callsign, lat, lon, altitude, speed, heading);

  // Insert Weather Snapshot
  if (weather) {
    db.prepare(`
      INSERT INTO weather_snapshots (flight_id, wind_speed, gust, temperature, pressure, humidity, clouds, precipitation, condition)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, weather.windSpeed, weather.gust, weather.temperature, weather.pressure, weather.humidity, weather.clouds, weather.precipitation, weather.condition);

    console.log(
      callsign,
      weather.windSpeed,
      weather.gust,
      weather.clouds,
      altitude,
      speed
    );
    // Calculate Turbulence
    const score = calculateTurbulence(weather, altitude, speed);
    const riskLevel = score <= 30 ? "low" : score <= 60 ? "medium" : "high";

    // Insert Turbulence History
    db.prepare(`
      INSERT INTO turbulence_history (flight_id, score, risk_level, altitude, lat, lon)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(id, score, riskLevel, altitude, lat, lon);

    // Generate Alert if high risk
    if (score >= 61) {
      db.prepare(`
        INSERT INTO alerts (flight_id, message, score)
        VALUES (?, ?, ?)
      `).run(id, `Flight ${callsign || id} entering high turbulence risk zone`, score);
    }
  }

  res.json({ status: "success" });
});

// DELETE /api/flights/stale (Node-RED hourly cleanup)
router.delete("/flights/stale", (req, res) => {
  const result = db.prepare(`
    DELETE FROM flights WHERE last_updated < datetime('now', '-30 minutes')
  `).run();
  res.json({ status: "ok", deleted: result.changes });
});

export default router;
