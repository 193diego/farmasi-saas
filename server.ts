import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import apiRoutes from "./server/routes/index.js"; // IMPORTANTE: ".js" después de compilar

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json({ limit: "10mb" }));
  app.use(express.urlencoded({ extended: true }));

  // CORS solo en desarrollo
  if (process.env.NODE_ENV !== "production") {
    app.use((req, res, next) => {
      res.header("Access-Control-Allow-Origin", "*");
      res.header(
        "Access-Control-Allow-Headers",
        "Origin, X-Requested-With, Content-Type, Accept, Authorization"
      );
      res.header(
        "Access-Control-Allow-Methods",
        "GET, POST, PUT, PATCH, DELETE, OPTIONS"
      );
      if (req.method === "OPTIONS") return res.sendStatus(200);
      next();
    });
  }

  // Health check
  app.get("/api/health", (req, res) => {
    res.json({
      status: "ok",
      message: "Farmasi SaaS API running",
      timestamp: new Date().toISOString(),
    });
  });

  // API rutas
  app.use("/api", apiRoutes);

  // === SERVIR FRONTEND SOLO EN PRODUCCIÓN ===
  if (process.env.NODE_ENV === "production") {
    const clientDist = path.join(__dirname, "client");

    app.use(express.static(clientDist));

    app.get("*", (req, res) => {
      if (req.path.startsWith("/api"))
        return res.status(404).json({ message: "Ruta no encontrada" });

      res.sendFile(path.join(clientDist, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 Farmasi SaaS corriendo en http://localhost:${PORT}`);
    console.log(`📊 Entorno: ${process.env.NODE_ENV || "development"}`);
    console.log(`🗄️ BD: ${process.env.DATABASE_URL ? "Conectada" : "⚠️ Sin configurar"}`);
  });
}

startServer();