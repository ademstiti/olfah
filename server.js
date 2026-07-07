// Local dev + production server. In dev it proxies /api/chat to the same
// serverless handler Vercel runs in prod, and serves the built SPA in prod.
import express from "express";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import chatHandler from "./api/chat.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
app.use(express.json({ limit: "1mb" }));

// Adapt the Vercel-style (req,res) handler to Express.
app.post("/api/chat", (req, res) => chatHandler(req, res));

if (process.env.NODE_ENV === "production") {
  const dist = join(__dirname, "dist");
  app.use(express.static(dist));
  app.get("*", (_req, res) => res.sendFile(join(dist, "index.html")));
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`olfah server on :${PORT}`));
