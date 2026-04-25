import axios from "axios";
import db from "../db.js";
import { calculateTurbulence } from "../utils/turbulence.js";

const OPENSKY_URL = "https://opensky-network.org/api/states/all";

type RegionBox = {
  name: string;
  lamin: number;
  lomin: number;
  lamax: number;
  lomax: number;
};

const TARGET_REGIONS: RegionBox[] = [
  // Mainland Portugal + western Spain buffer.
  { name: "iberia-west", lamin: 35.0, lomin: -10.5, lamax: 44.5, lomax: -1.5 },
  { name: "madeira", lamin: 32.0, lomin: -18.8, lamax: 34.0, lomax: -15.0 },
  { name: "azores", lamin: 36.0, lomin: -31.8, lamax: 40.8, lomax: -24.0 },
];

function isInTargetRegions(lat: number, lon: number): boolean {
  return TARGET_REGIONS.some(region =>
    lat >= region.lamin &&
    lat <= region.lamax &&
    lon >= region.lomin &&
    lon <= region.lomax,
  );
}

export async function fetchOpenSkyData() {
  try {
    console.log("Fetching data from OpenSky (Portugal, Madeira, Azores + nearby Spain)...");
    // Coarse envelope, then strict filtering against target region boxes.
    const response = await axios.get(`${OPENSKY_URL}?lamin=30&lomin=-32&lamax=45&lomax=-1`, {
      timeout: 30000
    });

    const states = response.data.states;
    if (!states || !Array.isArray(states)) {
      console.log("No flights received from OpenSky for Portugal/Madeira/Azores region.");
      return;
    }

    const filteredStates = states.filter((s: any[]) => {
      const lon = s[5];
      const lat = s[6];
      if (lat === null || lon === null) return false;
      return isInTargetRegions(lat, lon);
    });

    console.log(`Received ${states.length} flights from OpenSky. Keeping ${filteredStates.length} in target regions.`);

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
  // Check if flight is new to seed history
  const existing = db.prepare("SELECT id FROM flights WHERE id = ?").get(id);
  
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

  // If new, seed some history points behind it to show a path immediately
  if (!existing) {
    for (let i = 1; i <= 5; i++) {
      const offset = i * 0.05;
      const hLat = lat - (Math.cos(heading * Math.PI / 180) * offset);
      const hLon = lon - (Math.sin(heading * Math.PI / 180) * offset);
      db.prepare(`
        INSERT INTO turbulence_history (flight_id, score, risk_level, altitude, lat, lon, timestamp)
        VALUES (?, ?, ?, ?, ?, ?, datetime('now', ?))
      `).run(id, Math.random() * 50, "low", altitude, hLat, hLon, `-${i * 5} minutes`);
    }
  }

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
  const score = calculateTurbulence(weather, altitude);
  const riskLevel = score <= 30 ? "low" : score <= 60 ? "medium" : "high";

  // Insert Turbulence History
  db.prepare(`
    INSERT INTO turbulence_history (flight_id, score, risk_level, altitude, lat, lon)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(id, score, riskLevel, altitude, lat, lon);

  // Generate Alert if high risk
  if (score >= 70) {
    db.prepare(`
      INSERT INTO alerts (flight_id, message, score)
      VALUES (?, ?, ?)
    `).run(id, `Flight ${callsign} entering high turbulence risk zone`, score);
  }
}


