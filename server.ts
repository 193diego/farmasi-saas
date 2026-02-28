import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import apiRoutes from "./server/routes/index.ts";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json({ limit: "10mb" }));
  app.use(express.urlencoded({ extended: true }));

  // CORS para desarrollo
  if (process.env.NODE_ENV !== "production") {
    app.use((req, res, next) => {
      res.header("Access-Control-Allow-Origin", "*");
      res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
      res.header("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS");
      if (req.method === "OPTIONS") return res.sendStatus(200);
      next();
    });
  }

  // Health check para Render
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", message: "Farmasi SaaS API running", timestamp: new Date().toISOString() });
  });

  // API Routes
  app.use("/api", apiRoutes);

  if (process.env.NODE_ENV !== "production") {
    // Vite dev server
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Producción: sirve el build de Vite
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      if (req.path.startsWith("/api")) return res.status(404).json({ message: "Ruta no encontrada" });
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`\n🚀 Farmasi SaaS corriendo en http://localhost:${PORT}`);
    console.log(`📊 Entorno: ${process.env.NODE_ENV || "development"}`);
    console.log(`🗄️  BD: ${process.env.DATABASE_URL ? "Conectada" : "⚠️ Sin configurar"}\n`);
  });
}

startServer();