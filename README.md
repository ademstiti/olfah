# Olfah — Motherhood Support Platform

## Setup

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Add your API key** — copy `.env.example` to `.env` and fill in your Anthropic API key:
   ```bash
   cp .env.example .env
   # then edit .env and paste your key
   ```

## Development

```bash
npm run dev
```
Opens at http://localhost:3000

## Production build & start

```bash
npm run build
npm start
```

## Deploy to Railway / Render / Fly.io

- Set environment variable: `ANTHROPIC_API_KEY=sk-ant-...`
- Build command: `npm run build`
- Start command: `npm start`
- The server serves the built frontend and proxies AI requests.
