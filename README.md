# ZeroLab — Virtual Science Lab

ZeroLab is a virtual science lab for school students (Class 9–12) covering
**Physics** and **Chemistry**. It bundles interactive, self-contained
simulations, dynamic theory / procedure / observation modules, and an
AI-assisted "Prompt Simulator" that turns plain-English prompts into runnable
HTML lab animations on demand.

## Features

- **Interactive Simulations** — 28+ pre-built, fully offline HTML5 simulations
  (Meter Bridge, Convex Lens, Potentiometer, Ohm's Law, Titrations, Flame Test,
  Paper Chromatography, and more) shipped under `public/simulations/`.
- **Dynamic Lab Pages** — every experiment renders Theory, Procedure,
  Simulator, and Observation tabs from a centralized data file
  (`src/data/experimentContent.js`), with auto-computed metrics, savable
  progress, and a printable report.
- **Prompt Simulator** — generates new HTML lab animations from a one-line
  prompt, with a live preview, downloadable HTML, and a saved-history panel
  (persisted to `localStorage`).
- **Standalone Interactive Site** — a static interactive simulations site is
  embedded under `/interactive-simulations/`.
- **Demo Login** — username `Demo`, password `Demo@123`.

## Tech Stack

- **Frontend:** React 17, Tailwind CSS 2, CRACO, Redux, React Router 6,
  Framer Motion
- **AI:** Google Generative Language API (configurable in
  `src/components/Dashboard/Simulator/PromptSimulator.js`)
- **Hosting:** Static build served by nginx on EC2 (Ubuntu 24.04). Any static
  host works — just serve the `build/` directory with SPA fallback to
  `index.html`.

## Quick Start (local dev)

```bash
npm install --legacy-peer-deps
NODE_OPTIONS=--openssl-legacy-provider npm start
```

The dev server runs at <http://localhost:3000>.

## Production Build

```bash
NODE_OPTIONS=--openssl-legacy-provider npm run build
```

Outputs to `build/`. Deploy that folder to any static host with SPA fallback.

## Project Layout

```
lab_simulation/
├── public/
│   ├── simulations/            # 28 self-contained HTML5 lab simulations
│   └── interactive-simulations/ # standalone simulations site
├── src/
│   ├── components/
│   │   ├── Authentication/     # Demo-credential login modal
│   │   ├── Dashboard/
│   │   │   ├── Simulation/     # DynamicTheory/Procedure/Observation
│   │   │   ├── Simulator/      # AI-powered Prompt Simulator
│   │   │   └── Welcome/        # Dashboard home with activity
│   │   └── HomePage/           # Landing page sections
│   ├── data/experimentContent.js  # Single source of truth for lab content
│   └── pages/                  # Route-level components
├── craco.config.js
└── tailwind.config.js
```

## License

Educational / hackathon use.
