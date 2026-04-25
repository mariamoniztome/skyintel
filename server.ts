import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import apiRouter from "./server/routes/api.js";
import { initDb } from "./server/db.js";
import db from "./server/db.js";
import { fetchOpenSkyData } from "./server/services/opensky.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Initialize Database
  initDb();

  // Start OpenSky Real-Time Data Sync (fetches live flight data from OpenSky Network)
  console.log("Initializing OpenSky real-time data sync...");
  fetchOpenSkyData();
  setInterval(fetchOpenSkyData, 60000); // Sync every 60s to respect rate limits

  // Middleware
  app.use(helmet({
    contentSecurityPolicy: false, // Disable for development/Mapbox
  }));
  app.use(cors());
  app.use(morgan("dev"));
  app.use(express.json());

  // API Routes
  app.use("/api", apiRouter);

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`SkyIntel Server running on http://localhost:${PORT}`);
  });
}

startServer();
