import "dotenv/config";
import express from "express";
import cors from "cors";
import { initFirebase } from "./firebase.js";
import authRoutes from "./routes/auth.js";

const app = express();
const PORT = Number(process.env.PORT || 4000);
const FRONTEND_URL = (process.env.FRONTEND_URL || "http://localhost:5173").split(",").map((s) => s.trim()).filter(Boolean);

app.use(cors({ origin: FRONTEND_URL.length ? FRONTEND_URL : true, credentials: false }));
app.use(express.json({ limit: "64kb" }));

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, service: "yuvora-backend", time: new Date().toISOString() });
});

app.use("/api/auth", authRoutes);

app.use((req, res) => {
  res.status(404).json({ ok: false, error: `No route: ${req.method} ${req.path}` });
});

const fb = initFirebase();
if (!fb.ready) {
  console.warn(`[backend] Firebase NOT configured — missing: ${fb.missing.join(", ")}.`);
  console.warn("[backend] Copy Backend/.env.example to Backend/.env and fill it. /api/health works; /api/auth/register returns 503 until then.");
} else {
  console.log("[backend] Firebase Admin ready.");
}

app.listen(PORT, () => {
  console.log(`[backend] listening on http://localhost:${PORT}`);
  console.log(`[backend] health: http://localhost:${PORT}/api/health`);
  console.log(`[backend] register: POST http://localhost:${PORT}/api/auth/register`);
});
