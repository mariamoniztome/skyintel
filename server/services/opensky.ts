import axios from "axios";
import db from "../db.js";
import { calculateTurbulence } from "../utils/turbulence.js";

const OPENSKY_URL = "https://opensky-network.org/api/states/all";

// Matches the map's EXPLORE_BOUNDS: lon -37→6, lat 27→47
const MAP_BOUNDS = { lamin: 27, lomin: -37, lamax: 47, lomax: 6 };

export async function fetchOpenSkyData() {
  try {
    const { lamin, lomin, lamax, lomax } = MAP_BOUNDS;
    console.log("Fetching data from OpenSky (full map area)...");
    const response = await axios.get(
      `${OPENSKY_URL}?lamin=${lamin}&lomin=${lomin}&lamax=${lamax}&lomax=${lomax}`,
      { timeout: 30000 }
    );
    console.log("OpenSky response received");
    const states = response.data.states;
    if (!states || !Array.isArray(states)) {
      console.log("No flights received from OpenSky.");
      return;
    }

    const filteredStates = (states as any[][]).filter(s => s[5] !== null && s[6] !== null);

    db.prepare("DELETE FROM alerts").run();

    const count = db.prepare(
      "SELECT COUNT(*) as total FROM alerts"
    ).get();

    console.log("Alerts after clear:", count);

    for (const s of filteredStates) {
      const id = s[0]; // icao24
      const callsign = s[1]?.trim() || id;
      const lon = s[5];
      const lat = s[6];
      const altitude = s[7] ? s[7] * 3.28084 : 0; // meters to feet
      const speed = s[9] ? s[9] * 1.94384 : 0; // m/s to knots
      const heading = s[10] || 0;

      if (lat === null || lon === null) continue;

      processFlight(id, callsign, lat, lon, altitude, speed, heading);
    }

    // Cleanup old flights (not updated in last 5 minutes)
    db.prepare("DELETE FROM flights WHERE last_updated < datetime('now', '-5 minutes')").run();
    
    console.log(`OpenSky sync complete. Processed ${filteredStates.length} flights.`);
  } catch (error) {
    console.error("Error fetching OpenSky data:", error instanceof Error ? error.message : String(error));
  }
}

function processFlight(id: string, callsign: string, lat: number, lon: number, altitude: number, speed: number, heading: number) {
  // Update or Insert Flight
  console.log("PROCESS FLIGHT RUNNING");
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

  // Generate mock weather for the flight
  const weather = {
    windSpeed: Math.random() * 50,
    gust: Math.random() * 70,
    temperature: -50 + (Math.random() * 20),
    pressure: 980 + (Math.random() * 40),
    humidity: Math.random() * 100,
    clouds: Math.random() * 100,
    precipitation: Math.random() * 10,
    condition: "Dynamic"
  };

  db.prepare(`
    INSERT INTO weather_snapshots (flight_id, wind_speed, gust, temperature, pressure, humidity, clouds, precipitation, condition)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, weather.windSpeed, weather.gust, weather.temperature, weather.pressure, weather.humidity, weather.clouds, weather.precipitation, weather.condition);

  // Calculate Turbulence
  const score = calculateTurbulence(weather, altitude, speed);
  const riskLevel = score <= 30 ? "low" : score <= 60 ? "medium" : "high";

  // Insert Turbulence History
  db.prepare(`
    INSERT INTO turbulence_history (flight_id, score, risk_level, altitude, lat, lon)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(id, score, riskLevel, altitude, lat, lon);

  console.log("Alert score:", score, callsign);
  // Generate Alert if high risk
  if (score >= 61) {
    console.log("INSERTING ALERT", score, callsign);
    db.prepare(`
      INSERT INTO alerts (flight_id, message, score)
      VALUES (?, ?, ?)
    `).run(id, `Flight ${callsign} entering high turbulence risk zone`, score);
  }
}


