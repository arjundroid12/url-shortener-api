# URL Shortener API

> REST API for shortening URLs with click analytics, custom aliases, and optional expiry. Node.js + Express + LowDB (JSON file storage).

![CI](https://github.com/arjundroid12/url-shortener-api/actions/workflows/ci.yml/badge.svg)
![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)
![Node](https://img.shields.io/badge/node-%3E%3D18-green)

## ✨ Features

- **Shorten any URL** — POST `/shorten` with `{ url }`, get back a short alias
- **Custom aliases** — pass `alias: "my-link"` to choose your own
- **Click analytics** — every redirect increments a counter; view via `/stats`
- **Expiry support** — pass `expiresInSeconds: 3600` for time-limited links
- **CORS enabled** — call from any frontend
- **JSON file persistence** — LowDB stores everything in `data/db.json`
- **Health endpoint** — `/health` for monitoring

## 📡 API Reference

### `POST /shorten`

```bash
curl -X POST http://localhost:3000/shorten \
  -H "Content-Type: application/json" \
  -d '{"url":"https://github.com/arjundroid12","alias":"my-gh","expiresInSeconds":86400}'
```

Response:
```json
{
  "alias": "my-gh",
  "shortUrl": "http://localhost:3000/my-gh",
  "url": "https://github.com/arjundroid12"
}
```

### `GET /:alias` — Redirect

Visiting `http://localhost:3000/my-gh` redirects to the long URL (302).

### `GET /:alias/stats` — Click Analytics

```json
{
  "alias": "my-gh",
  "url": "https://github.com/arjundroid12",
  "clicks": 5,
  "createdAt": "2026-06-30T10:00:00.000Z",
  "expiresAt": "2026-07-01T10:00:00.000Z",
  "expired": false
}
```

### `GET /health`

```json
{
  "status": "ok",
  "uptime": 120,
  "totalLinks": 15,
  "totalClicks": 42
}
```

## 🚀 Live Demo

This app requires a Node.js backend, so it can't run on GitHub Pages or Surge.sh (which are static-only).

### ⚡ One-Click Deploy to Render (free)

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/arjundroid12/url-shortener-api)

**Steps (~2 minutes):**
1. Click the button above
2. Sign in to Render with your GitHub account (no credit card needed)
3. Click "Create Web Service" (defaults are pre-filled from `render.yaml`)
4. Wait ~90 seconds for build & deploy
5. Your API will be at `https://url-shortener-api-xxxx.onrender.com`

## 📦 Run Locally

```bash
git clone https://github.com/arjundroid12/url-shortener-api.git
cd url-shortener-api
npm install
npm start
# Visit http://localhost:3000
```

## 🚢 Deploy

**Render:** Push to GitHub → New Web Service → Build: `npm install`, Start: `npm start`

## 📁 Project Structure

```
url-shortener-api/
├── .github/workflows/ci.yml
├── src/
│   └── server.js        # Express app + LowDB + routes
├── data/
│   └── db.json          # Auto-created JSON storage (gitignored)
├── package.json
├── render.yaml          # One-click Render deploy
└── README.md
```

## 📄 License

MIT © Arjun Vashishtha
