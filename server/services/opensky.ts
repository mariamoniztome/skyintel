import axios from "axios";
import db from "../db.js";
import { calculateTurbulence } from "../utils/turbulence.js";

const OPENSKY_URL = "https://opensky-network.org/api/states/all";

export async function fetchOpenSkyData() {
  try {
    console.log("Fetching data from OpenSky...");
    // Limit to a bounding box for better performance/relevance (e.g., Europe)
    // lamin, lomin, lamax, lomax (Europe bounding box)
    const response = await axios.get(`${OPENSKY_URL}?lamin=35&lomin=-15&lamax=70&lomax=40`, {
      timeout: 30000
    });

    const states = response.data.states;
    if (!states || !Array.isArray(states)) {
      console.log("No states received from OpenSky.");
      return;
    }

    console.log(`Received ${states.length} states from OpenSky.`);

    // Process top 100 flights
    const topStates = states.slice(0, 100);

    for (const s of topStates) {
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
    
    console.log(`OpenSky sync complete. Processed ${topStates.length} flights.`);
  } catch (error) {
    console.error("Error fetching OpenSky data, using dynamic fallback:", error);
    generateMockFlights();
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

function generateMockFlights() {
  console.log("Generating 50 dynamic mock flights...");
  const prefixes = ["BAW", "AFR", "DLH", "UAL", "EMR", "QTR", "SIA", "KLM", "RYR", "EZY"];
  
  for (let i = 0; i < 50; i++) {
    const id = `MOCK${1000 + i}`;
    const callsign = `${prefixes[i % prefixes.length]}${100 + i}`;
    
    // Random position in Europe/North Atlantic
    const lat = 35 + (Math.random() * 35);
    const lon = -15 + (Math.random() * 55);
    const altitude = 25000 + (Math.random() * 15000);
    const speed = 400 + (Math.random() * 100);
    const heading = Math.random() * 360;

    processFlight(id, callsign, lat, lon, altitude, speed, heading);
  }
  
  // Cleanup old flights (not updated in last 5 minutes)
  db.prepare("DELETE FROM flights WHERE last_updated < datetime('now', '-5 minutes')").run();
  console.log("Dynamic mock flight generation complete.");
}
