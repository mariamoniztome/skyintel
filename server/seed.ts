import db from "./db.js";
import { calculateTurbulence } from "./utils/turbulence.js";

const mockFlights = [
  { id: "FL101", callsign: "BAW123", lat: 51.5074, lon: -0.1278, altitude: 35000, speed: 450, heading: 270 },
  { id: "FL102", callsign: "AFR456", lat: 48.8566, lon: 2.3522, altitude: 32000, speed: 430, heading: 90 },
  { id: "FL103", callsign: "DLH789", lat: 52.5200, lon: 13.4050, altitude: 28000, speed: 410, heading: 180 },
  { id: "FL104", callsign: "UAL012", lat: 40.7128, lon: -74.0060, altitude: 38000, speed: 480, heading: 315 },
  { id: "FL105", callsign: "EMR345", lat: 25.2048, lon: 55.2708, altitude: 34000, speed: 460, heading: 45 },
];

const mockWeather = [
  { windSpeed: 15, gust: 25, temperature: -45, pressure: 1010, humidity: 20, clouds: 40, precipitation: 0, condition: "Cloudy" },
  { windSpeed: 45, gust: 65, temperature: -50, pressure: 995, humidity: 80, clouds: 90, precipitation: 5, condition: "Stormy" },
  { windSpeed: 5, gust: 10, temperature: -40, pressure: 1015, humidity: 10, clouds: 10, precipitation: 0, condition: "Clear" },
  { windSpeed: 25, gust: 40, temperature: -48, pressure: 1005, humidity: 50, clouds: 60, precipitation: 1, condition: "Rainy" },
  { windSpeed: 10, gust: 15, temperature: -42, pressure: 1012, humidity: 15, clouds: 20, precipitation: 0, condition: "Partly Cloudy" },
];

export function seed() {
  console.log("Seeding database...");

  mockFlights.forEach((f, i) => {
    const weather = mockWeather[i % mockWeather.length];
    
    // Insert Flight
    db.prepare(`
      INSERT OR REPLACE INTO flights (id, callsign, lat, lon, altitude, speed, heading)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(f.id, f.callsign, f.lat, f.lon, f.altitude, f.speed, f.heading);

    // Insert Weather
    db.prepare(`
      INSERT INTO weather_snapshots (flight_id, wind_speed, gust, temperature, pressure, humidity, clouds, precipitation, condition)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(f.id, weather.windSpeed, weather.gust, weather.temperature, weather.pressure, weather.humidity, weather.clouds, weather.precipitation, weather.condition);

    // Calculate and Insert Turbulence
    const score = calculateTurbulence(weather, f.altitude);
    const riskLevel = score <= 30 ? "low" : score <= 60 ? "medium" : "high";

    db.prepare(`
      INSERT INTO turbulence_history (flight_id, score, risk_level, altitude, lat, lon)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(f.id, score, riskLevel, f.altitude, f.lat, f.lon);

    // Add some history
    for (let j = 1; j <= 10; j++) {
      const histScore = Math.max(0, Math.min(100, score + (Math.random() * 20 - 10)));
      const histRisk = histScore <= 30 ? "low" : histScore <= 60 ? "medium" : "high";
      const histAlt = f.altitude + (Math.random() * 1000 - 500);
      const histLat = f.lat - (j * 0.5 * Math.cos(f.heading * Math.PI / 180));
      const histLon = f.lon - (j * 0.5 * Math.sin(f.heading * Math.PI / 180));
      
      db.prepare(`
        INSERT INTO turbulence_history (flight_id, score, risk_level, altitude, lat, lon, timestamp)
        VALUES (?, ?, ?, ?, ?, ?, datetime('now', '-${j * 10} minutes'))
      `).run(f.id, histScore, histRisk, histAlt, histLat, histLon);
    }

    // Add alert if high risk
    if (score >= 70) {
      db.prepare(`
        INSERT INTO alerts (flight_id, message, score)
        VALUES (?, ?, ?)
      `).run(f.id, `Flight ${f.callsign} entering high turbulence risk zone`, score);
    }
  });

  console.log("Seeding complete.");
}

// If run directly
if (process.argv[1].endsWith("seed.ts")) {
  seed();
}
