# IRM Sentinel – Integrated Risk Management Platform

Enterprise AI-powered GRC console prototype for G-SIB banks. 100% browser-only with deterministic AI narratives calibrated to OCC/FDIC/Basel III supervisory tone.

## Quick Start

```bash
cd irm-command
npm install
npm run dev
```

Open http://localhost:5173 in your browser.

## Build & Deploy

```bash
npm run build        # Production build → dist/
npm run preview      # Preview production build
npx vercel           # Deploy to Vercel
```

## Modules

| Module | Route | Description |
|--------|-------|-------------|
| Dashboard | `/dashboard` | Executive Command Center with KRIs, heat map, AI digest |
| TPRM | `/tprm` | Full vendor lifecycle, AI narratives, questionnaire generator |
| Compliance | `/compliance` | Multi-framework controls, gaps, regulatory intelligence |
| AI Workbench | `/workbench` | Risk scoring studio with XAI explainability |
| IRM Copilot | `/copilot` | Persistent AI agent with quick actions and FAQ |

## Architecture

See [docs/architecture.md](docs/architecture.md) for full technical documentation.
See [docs/demo-script.md](docs/demo-script.md) for guided demo walkthrough.

## Tech Stack

React 18 · TypeScript · Vite · Tailwind CSS · Zustand · React Router v6 · Lucide Icons
