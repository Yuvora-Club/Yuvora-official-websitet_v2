import "dotenv/config";
import express from "express";
import cors from "cors";
import { initFirebase } from "./firebase.js";
import authRoutes from "./routes/auth.js";

const app = express();
const PORT = Number(process.env.PORT || 4000);

// Production origins that must always be allowed, even if FRONTEND_URL
// on Render is stale/missing. Merge with the env var (comma-separated).
const DEFAULT_ORIGINS = [
  "https://yuvora.org",
  "https://www.yuvora.org",
  "http://localhost:5173",
  "http://localhost:3000",
  "http://localhost:4000",
];
const ENV_ORIGINS = String(process.env.FRONTEND_URL || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);
const ALLOWED_ORIGINS = [...new Set([...DEFAULT_ORIGINS, ...ENV_ORIGINS])];

const corsOptions = {
  origin(origin, callback) {
    // No Origin header (curl, Render health checks, same-origin) -> allow.
    if (!origin) return callback(null, true);
    if (ALLOWED_ORIGINS.includes(origin)) return callback(null, true);
    console.warn(`[backend] CORS blocked origin: ${origin}`);
    return callback(null, false);
  },
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "Accept"],
  credentials: false,
  optionsSuccessStatus: 204,
};

app.use(cors(corsOptions));
// Explicit preflight handler so OPTIONS /api/* never falls through to the 404 handler.
app.options("*", cors(corsOptions));
app.use(express.json({ limit: "64kb" }));

app.get("/", (_req, res) => {
  res.json({ ok: true, service: "yuvora-backend", use: "/api/health" });
});

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
  console.log(`[backend] CORS allowed origins: ${ALLOWED_ORIGINS.join(", ")}`);
  console.log(`[backend] health: http://localhost:${PORT}/api/health`);
  console.log(`[backend] register: POST http://localhost:${PORT}/api/auth/register`);
});
