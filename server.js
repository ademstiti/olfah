import express from "express";
import { createServer as createViteServer } from "vite";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const isProd = process.env.NODE_ENV === "production";
const PORT = process.env.PORT || 3000;

const app = express();
app.use(express.json());

// ─── AI PROXY ───
app.post("/api/chat", async (req, res) => {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return res.status(500).json({ error: "ANTHROPIC_API_KEY not set" });

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify(req.body),
    });
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (err) {
    res.status(500).json({ error: "Failed to reach Anthropic API" });
  }
});

if (isProd) {
  // Serve built frontend
  app.use(express.static(join(__dirname, "dist")));
  app.get("*", (_req, res) => res.sendFile(join(__dirname, "dist", "index.html")));
  app.listen(PORT, () => console.log(`Olfah running on http://localhost:${PORT}`));
} else {
  // Dev: use Vite middleware
  const vite = await createViteServer({ server: { middlewareMode: true }, appType: "spa" });
  app.use(vite.middlewares);
  app.listen(PORT, () => console.log(`Olfah dev server on http://localhost:${PORT}`));
}
