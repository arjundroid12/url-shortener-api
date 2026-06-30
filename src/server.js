/**
 * URL Shortener API
 * Tech: Node.js + Express + LowDB (JSON file storage)
 *
 * Endpoints:
 *   POST   /shorten           { url, alias?, expiresInSeconds? } → { shortUrl, alias }
 *   GET    /:alias            → 302 redirect to long URL (records click)
 *   GET    /:alias/stats      → { alias, url, clicks, createdAt, expiresAt }
 *   GET    /health            → health check
 *   GET    /                  → API info + recent links
 */

import express from "express";
import cors from "cors";
import { JSONFilePreset } from "lowdb/node";
import { nanoid } from "nanoid";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 3000;
const DB_FILE = path.join(__dirname, "..", "data", "db.json");

// ---------- DB schema ----------
const defaultData = { links: {} };
const db = await JSONFilePreset(DB_FILE, defaultData);

// ---------- App ----------
const app = express();
app.use(cors());
app.use(express.json());

// ---------- Helpers ----------
const isValidUrl = (str) => {
  try {
    const u = new URL(str);
    return ["http:", "https:"].includes(u.protocol);
  } catch { return false; }
};

const isValidAlias = (s) => /^[a-zA-Z0-9_-]{3,30}$/.test(s);

const generateAlias = () => nanoid(7);

const BASE_URL = process.env.BASE_URL || `http://localhost:${PORT}`;

// ---------- Routes ----------

// API info
app.get("/", (req, res) => {
  const links = db.data.links;
  const recent = Object.entries(links)
    .sort((a, b) => b[1].createdAt - a[1].createdAt)
    .slice(0, 10)
    .map(([alias, link]) => ({ alias, ...link, shortUrl: `${BASE_URL}/${alias}` }));
  res.json({
    name: "URL Shortener API",
    endpoints: {
      shorten: "POST /shorten  { url, alias?, expiresInSeconds? }",
      redirect: "GET /:alias",
      stats: "GET /:alias/stats",
      health: "GET /health",
    },
    totalLinks: Object.keys(links).length,
    recentLinks: recent,
  });
});

// Health
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    uptime: process.uptime(),
    totalLinks: Object.keys(db.data.links).length,
    totalClicks: Object.values(db.data.links).reduce((s, l) => s + l.clicks, 0),
  });
});

// Shorten
app.post("/shorten", async (req, res) => {
  const { url, alias, expiresInSeconds } = req.body;
  if (!url || !isValidUrl(url)) {
    return res.status(400).json({ error: "Valid url required (http/https)" });
  }
  let finalAlias = alias || generateAlias();
  if (alias && !isValidAlias(alias)) {
    return res.status(400).json({ error: "Alias must be 3-30 chars: alphanumeric, _, -" });
  }
  if (db.data.links[finalAlias]) {
    return res.status(409).json({ error: `Alias "${finalAlias}" already taken` });
  }
  const link = {
    url,
    alias: finalAlias,
    clicks: 0,
    createdAt: Date.now(),
    expiresAt: expiresInSeconds ? Date.now() + expiresInSeconds * 1000 : null,
  };
  db.data.links[finalAlias] = link;
  await db.write();
  res.status(201).json({ alias: finalAlias, shortUrl: `${BASE_URL}/${finalAlias}`, url });
});

// Stats
app.get("/:alias/stats", (req, res) => {
  const link = db.data.links[req.params.alias];
  if (!link) return res.status(404).json({ error: "Alias not found" });
  res.json({
    alias: link.alias,
    url: link.url,
    clicks: link.clicks,
    createdAt: new Date(link.createdAt).toISOString(),
    expiresAt: link.expiresAt ? new Date(link.expiresAt).toISOString() : null,
    expired: link.expiresAt && Date.now() > link.expiresAt,
  });
});

// Redirect (must be after /:alias/stats to avoid conflict)
app.get("/:alias", async (req, res) => {
  const alias = req.params.alias;
  const link = db.data.links[alias];
  if (!link) return res.status(404).send("Not found");
  if (link.expiresAt && Date.now() > link.expiresAt) {
    return res.status(410).send("This link has expired");
  }
  // Record click
  link.clicks++;
  link.lastAccessedAt = Date.now();
  await db.write();
  res.redirect(302, link.url);
});

// ---------- 404 fallback ----------
app.use((req, res) => res.status(404).json({ error: "Not found" }));

// ---------- Start ----------
if (import.meta.url === `file://${process.argv[1]}`) {
  app.listen(PORT, () => {
    console.log(`🚀 URL Shortener running at ${BASE_URL}`);
    console.log(`📊 Health: ${BASE_URL}/health`);
  });
}

export { app, db };
