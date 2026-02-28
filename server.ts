import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import apiRoutes from "./server/routes/index.js";

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

  // Health: Render usa esto
  app.get("/api/health", (req, res) => {
    res.json({
      status: "ok",
      message: "Farmasi SaaS API running",
      timestamp: new Date().toISOString()
    });
  });

  // API
  app.use("/api", apiRoutes);

  // ====================================
  // 🔥 SERVIR FRONTEND EN PRODUCCIÓN
  // ====================================
  if (process.env.NODE_ENV === "production") {
    const clientPath = path.join(__dirname, "client");

    console.log("Sirviendo frontend desde:", clientPath);

    app.use(express.static(clientPath));

    // Cualquier ruta no API → index.html
    app.get("*", (req, res) => {
      if (req.path.startsWith("/api")) {
        return res.status(404).json({ message: "Ruta no encontrada" });
      }
      res.sendFile(path.join(clientPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 Farmasi SaaS corriendo en http://localhost:${PORT}`);
    console.log(`📊 Entorno: ${process.env.NODE_ENV || "development"}`);
    console.log(
      `🗄️ BD: ${process.env.DATABASE_URL ? "Conectada" : "⚠️ Sin configurar"}`
    );
  });
}

startServer();
