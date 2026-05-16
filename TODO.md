# Trader Dashboard — TODO

## 🔒 Security
- [ ] **Restructure API key management** — Current `VITE_*` env vars leak into the frontend bundle. Implement a lightweight backend proxy (e.g. serverless function, Express, or Vite API proxy) to keep API keys server-side.

## 📊 Data
- [ ] Connect real API keys via backend proxy (Twelve Data / Finnhub)
- [ ] Add WebSocket support for real-time price updates
- [ ] Implement data caching with stale-while-revalidate

## 🎨 UI/UX
- [ ] Add dark/light mode toggle
- [ ] Mobile responsiveness polish
- [ ] Add loading skeletons instead of spinner

## 🏗️ Architecture
- [ ] Add state management (Zustand / Jotai)
- [ ] Add unit tests for data service providers
- [ ] Code-split large JS bundle (610KB)
