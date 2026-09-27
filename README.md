# ZeroLab — Virtual Science Lab

ZeroLab is a virtual science lab for school students (Class 9–12) covering
**Physics** and **Chemistry**. It bundles interactive, self-contained
simulations, dynamic theory / procedure / observation modules, and an
AI-assisted "Prompt Simulator" that turns plain-English prompts into runnable
HTML lab animations on demand.

## Features

- **3D virtual labs for every experiment** — all 28 physics and chemistry
  experiments under `public/simulations/` are full 3D lab rooms (Three.js,
  vendored under `public/simulations/lib/three/` so everything stays offline).
  Each one offers three ways to work: watch a student perform the whole
  experiment automatically (drag to move the camera), be the student in
  first person with game-style hands (W A S D to walk), or turn the human off
  and use direct controls. The student must put on a lab coat, goggles,
  gloves and safety shoes at the PPE station first, then carries the
  apparatus from the trolley to the bench and performs every step; each step
  has a "Show me" demonstration. Readings go into an observation table and
  can be sent to the Observation tab or exported as CSV.
  - *Physics*: meter bridge, potentiometer and Ohm's law circuits are wired
    lead by lead and solved as real resistor networks (wrong connections
    behave physically); lens experiments throw a computed, defocus-blurred
    image on the screen; springs, trolleys, marbles and Melde's thread move
    with real dynamics; vernier calipers, screw gauges, spherometer and
    Searle's micrometer have legible scales.
  - *Chemistry*: glassware holds real volumes (levels follow the vessel's
    shape); titrations use a burette, pipette and indicator chemistry with
    transient and permanent end-point colours; test-tube reactions show
    precipitates, effervescence and fumes; flame tests, chromatography,
    sublimation and crystallisation are animated step by step.
  - Code: the shared engine is `public/simulations/lab-engine/` (engine,
    `chem.js` and `phys.js` apparatus); each experiment is a spec in
    `public/simulations/labs/<id>.js`, loaded by `<id>.html` (regenerate the
    pages with `python3 scripts/make-lab-pages.py <id> …`). The meter bridge
    lives in `public/simulations/meter-bridge/`, which also holds the room,
    the student avatar (a rigged Ready Player Me model, see
    `assets/STUDENT-LICENSE.md`) and the shared apparatus.
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
│   ├── simulations/            # 28 3D lab experiments (lab-engine/, labs/, meter-bridge/)
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
