# Honey Chain — Frontend

> Customer-facing React dashboard for the Honey Chain blockchain honey traceability platform,
> built for **KVIC's Honey Mission** and rural beekeepers.
>
> Deployed on **Vercel**. Consumes the Node/Express API on **Render**.

---

## Table of Contents

1. [Quick Start](#1-quick-start)
2. [Tech Stack](#2-tech-stack)
3. [Project Structure](#3-project-structure)
4. [File Inventory](#4-file-inventory)
5. [Routing Map](#5-routing-map)
6. [State Management — AppContext](#6-state-management--appcontext)
7. [API Integration](#7-api-integration)
8. [Feature Breakdown by Role](#8-feature-breakdown-by-role)
9. [Styling System](#9-styling-system)
10. [Assets & Fonts](#10-assets--fonts)
11. [Testing](#11-testing)
12. [Build, Env & Deployment](#12-build-env--deployment)
13. [Known Issues & Improvement Backlog](#13-known-issues--improvement-backlog)

---

## 1. Quick Start

```bash
cd frontend
npm install
npm start          # http://localhost:3000
```

| Script | Command | Purpose |
|---|---|---|
| `start` | `react-scripts start` | Dev server w/ HMR on port 3000 |
| `build` | `react-scripts build` | Production bundle → `build/` |
| `test` | `react-scripts test` | Jest + React Testing Library |
| `eject` | `react-scripts eject` | Irreversible CRA eject |

**Backend must also be running** for live data:

```bash
cd ../backend && npm install && npm start   # http://localhost:4000
```

The app is **resilient by design** — every fetch is wrapped in a silent `catch`, so if the
API is down the UI falls back to `src/data/mockData.js` and still renders fully. This is what
makes the Vercel static demo work with no backend at all.

### Demo accounts

Password is not actually checked (see [Known Issues](#13-known-issues--improvement-backlog)).

| Email | Role | Name |
|---|---|---|
| `beekeeper@honeychain.demo` | `BEEKEEPER` | Rameshwar Verma |
| `processor@honeychain.demo` | `PROCESSOR` | Satara Processing Unit |
| `tester@honeychain.demo` | `TESTER` | Dr. Sharma |
| `manufacturer@honeychain.demo` | `MANUFACTURER` | Nashik Packing Works |

Any other email → `401 Invalid mock credentials`.

---

## 2. Tech Stack

| Concern | Choice | Notes |
|---|---|---|
| Framework | **React 19.1.1** | Function components + hooks only, no class components |
| Build tool | **Create React App (react-scripts 5.0.1)** | Webpack 5, Babel, ESLint built in. *Not* Vite. |
| Router | **react-router-dom 7.9.1** | `BrowserRouter` + declarative `<Routes>` |
| Icons | **lucide-react 0.544.0** | Tree-shakeable SVG icons |
| QR rendering | **qrcode.react 4.2.0** | Used on `ConsumerScan` |
| HTTP | **fetch (native)** + **axios 1.12.1** *(declared, unused)* | All real calls use bare `fetch` |
| Styling | **Plain CSS + CSS custom properties** | No Tailwind, no CSS-in-JS, no CSS modules |
| Charts | **Hand-rolled SVG** in `src/utils/charts.jsx` | No Chart.js / Recharts / D3 |
| Illustrations | **Inline SVG React components** | 24 components in `Illustrations.jsx` |
| Tests | **Jest + React Testing Library** | Via CRA's built-in runner |
| Language | JavaScript (JSX) | No TypeScript anywhere |

**No state library.** All global state lives in one hand-rolled React Context
(`src/context/AppContext.jsx`). There is no Redux, Zustand, or Jotai.

---

## 3. Project Structure

```
frontend/
├── .env                          # REACT_APP_API_URL (local, gitignored)
├── .env.example                  # Template
├── package.json
├── package-lock.json
├── vercel.json                   # SPA catch-all rewrite → /index.html
│
├── public/
│   ├── index.html                # CRA shell, <title>, font preconnect, PWA links
│   └── manifest.json             # PWA manifest
│
├── build/                        # Stale production artifact (gitignored, safe to delete)
│
└── src/
    ├── index.js                  # Entry point: createRoot + StrictMode
    ├── App.jsx                   # Root: BrowserRouter → AppProvider → AppShell
    ├── index.css                 # ★ DESIGN TOKEN SOURCE OF TRUTH (157 lines)
    ├── routeConfig.js            # ★ Single source of truth for view key ↔ URL path
    ├── setupTests.js             # jest-dom matcher registration
    │
    ├── context/
    │   └── AppContext.jsx        # ★ All global state + all shared API handlers
    │
    ├── components/               # 10 files — shared UI
    │   ├── Header.jsx            # Nav bar, role-filtered tabs, theme toggle, mobile drawer
    │   ├── LoginPage.jsx         # Split-screen login + demo account cards
    │   ├── CertificateModal.jsx  # Global lab certificate modal
    │   ├── landing/
    │   │   ├── Landing.jsx       # Public marketing page
    │   │   └── Illustrations.jsx # 24 inline-SVG illustration components
    │   └── hive-monitor/
    │       ├── FleetGrid.jsx         # Hive fleet overview
    │       ├── TrendsPanel.jsx       # Temp/weight SVG line charts
    │       ├── AlertsPanel.jsx       # Active alert feed
    │       ├── AIHealthSnapshot.jsx  # AI colony health card
    │       └── DeviceMetaPanel.jsx   # Device/firmware metadata card
    │
    ├── pages/                    # 30 files — one per routed screen
    │   ├── Overview.jsx          # KPI dashboard / landing redirect hub
    │   ├── HiveMonitor.jsx       # Live hive telemetry monitor
    │   ├── AIInsights.jsx        # AI health, disease & yield
    │   ├── BlockchainTrace.jsx   # Ledger explorer for a batch
    │   ├── ConsumerScan.jsx      # Consumer QR verification passport
    │   ├── ScaleUp.jsx           # Phased rollout plan
    │   │
    │   ├── quality/              # 7 — TESTER workspace
    │   │   ├── PendingVerification.jsx
    │   │   ├── QualityTestForm.jsx
    │   │   ├── QualityHistory.jsx
    │   │   ├── RejectedBatches.jsx
    │   │   ├── QualityStandards.jsx
    │   │   ├── QualityReports.jsx
    │   │   └── HivesView.jsx
    │   │
    │   ├── processor/            # 8 — PROCESSOR workspace
    │   │   ├── Processing.jsx
    │   │   ├── IncomingBatches.jsx
    │   │   ├── ProcessingLog.jsx
    │   │   ├── Packaging.jsx
    │   │   ├── Inventory.jsx
    │   │   ├── DistributionHandoff.jsx
    │   │   ├── FacilityInfo.jsx
    │   │   └── ProcessorBatches.jsx
    │   │
    │   ├── beekeeper/            # 5 — BEEKEEPER workspace
    │   │   ├── MyBatches.jsx
    │   │   ├── HarvestSubmission.jsx
    │   │   ├── BeekeeperAlerts.jsx
    │   │   ├── BeekeeperEarnings.jsx
    │   │   └── BeekeeperProfile.jsx
    │
    ├── data/
    │   └── mockData.js           # Offline fallback datasets
    │
    ├── images/                   # 7 PNGs (~11.6 MB, all currently unused)
    │
    ├── utils/
    │   └── charts.jsx            # renderAxisChart / renderSparkline / YieldForecastPaths
    │
    ├── styles/                   # 17 CSS files, imported in this exact order
    │   ├── index.css             # ★ @import manifest
    │   ├── base.css              #   App shell + honeycomb overlay
    │   ├── header.css            #   Nav, tabs, mobile drawer
    │   ├── views.css             #   View pane + glass card
    │   ├── landing.css           #   Marketing page (largest, 1900 lines)
    │   ├── overview.css          #   Dashboard hero + telemetry
    │   ├── monitor.css           #   Hive monitor
    │   ├── ai.css                #   AI insights
    │   ├── blockchain.css        #   Ledger explorer
    │   ├── consumer.css          #   QR passport + certificate modal
    │   ├── scaleup.css           #   Rollout plan
    │   ├── footer.css            #   Site footer (always dark)
    │   ├── dashboard.css         #   KPI popovers + status strip
    │   ├── roles.css             #   Login card + monitor dashboard
    │   ├── login.css             #   Login page (dark)
    │   ├── login-light.css       #   Login page (light override)
    │   ├── design-system.css     #   ★ Shared primitives (.btn/.panel/.kpi/.table)
    │   └── responsive.css        #   Breakpoints + attribute-selector hacks
    │
    └── __tests__/
        └── routing.test.jsx      # Route + role-gating tests
```

**Scale:** 43 JS/JSX source files, 17 CSS files, 15,549 lines total in `src/`.

---

## 4. File Inventory

### 4.1 Entry & Core

| File | Lines | Responsibility |
|---|---:|---|
| `index.js` | 12 | Mounts `<App />` into `#root` inside `React.StrictMode`. |
| `App.jsx` | 216 | `BrowserRouter` → `AppProvider` → `AppShell`. Holds the `VIEWS` map (view key → component), scroll-to-top effect, `#verify/BATCH_ID` hash handler, `NotificationBanner`, and `AppFooter`. |
| `routeConfig.js` | 37 | `VIEW_PATHS` (31 view key → path entries) and `viewForPath(pathname)`. Imported by both `App.jsx` and `AppContext.jsx` — this is why route logic is not duplicated. |
| `context/AppContext.jsx` | 332 | The whole app's brain. See [§6](#6-state-management--appcontext). |
| `data/mockData.js` | 219 | 17 exports: `initialHives`, `clusters`, `shopProducts`, `shopCategories`, `stats`, `iotFeatures`, `qrVerify`, `testimonials`, `mockActivityLog`, plus 7 unused legacy exports. |
| `utils/charts.jsx` | 137 | `renderAxisChart(data, stroke, fill, unit, minLabel, maxLabel)` — axis line chart; `renderSparkline(...)` — mini chart; `YieldForecastPaths()` — 3 overlaid forecast curves. |
| `__tests__/routing.test.jsx` | 94 | See [§11](#11-testing). |
| `setupTests.js` | — | Imports `@testing-library/jest-dom`. |

### 4.2 Components

| File | Lines | Responsibility |
|---|---:|---|
| `Header.jsx` | 306 | Sticky nav. Owns `NAV_ITEMS` (per-role tab list) and `VIEW_ICONS`. Theme toggle, LIVE pill, scan button, login/profile button, hamburger → mobile drawer (closes on Escape / outside click). **The only place role gating exists.** |
| `LoginPage.jsx` | 194 | Two-pane login: left branding + feature list + stats, right form. 4 clickable demo-account cards, "Continue as Consumer" escape hatch, show/hide password toggle. Password is collected but never sent. |
| `CertificateModal.jsx` | 144 | Global lab-certificate overlay: moisture, NMR purity, HMF, C4/C3 sugar, pollen, antibiotics, FSSAI verdict, beekeeper origin. Opened via `showFullCertModal`. |
| `landing/Landing.jsx` | 475 | Public marketing page: hero + count-up stats, product carousel, 5-step "how it works", IoT/AI feature cards, QR-verify demo, testimonials, CTA. Calls only `switchView`. |
| `landing/Illustrations.jsx` | 983 | 24 pure-SVG components (`BeeMark`, `HeroJar`, `HeroScene`, `ProductJar`, `Banner*`, `CommitArt`, `SeedSprig`, `HoneycombPattern`, `IoTArt`, `QrTile`, `SceneBee`, `GoldSwoosh`, `HexBackdrop`, `HeroLeaf*`, …). No logic, no network. 9 exports unused. |
| `hive-monitor/FleetGrid.jsx` | 133 | Grid of hive cards grouped by `clusters`. |
| `hive-monitor/TrendsPanel.jsx` | 147 | Temp & weight `renderAxisChart` panels + seasonal comparison bars. |
| `hive-monitor/AlertsPanel.jsx` | 69 | Active alert feed with severity styling. |
| `hive-monitor/AIHealthSnapshot.jsx` | 79 | Health score, disease risk, yield forecast summary card. |
| `hive-monitor/DeviceMetaPanel.jsx` | 48 | Firmware version, battery, calibration-due, power source. |

### 4.3 Pages — Public

| File | Lines | Screen | API calls |
|---|---:|---|---|
| `Overview.jsx` | 212 | KPI dashboard: stat strip, recent alerts, latest batch card, production chart with range toggle (7/30/90 d). | `GET /api/batches`, `GET /api/iot/hives` (result discarded — see issues) |
| `HiveMonitor.jsx` | 313 | Left sidebar hive selector + add-hive modal; right pane with 4 core sensor gauges, AI health, trends, alerts. Beekeeper-only harvest form. | via context: `POST /api/iot/hives`, `POST /api/batches` |
| `AIInsights.jsx` | 502 | Colony health score, queen/swarm status, 3-way disease risk (Varroa/Foulbrood/Nosema) with progress bars, yield forecast, anomaly detection, recommended actions, model confidence. | none (mock) |
| `BlockchainTrace.jsx` | 545 | Batch search, "Chain Integrity Status", expandable per-block checkpoint chain showing hash / quality / documents. Checkpoints map `Sent to processor`/`Received by processor` events to stages and show the batch's real processing location. | none (batch `transactions`) |
| `ConsumerScan.jsx` | 417 | Consumer QR passport: QR render, batch lookup, 7 result sections (authenticity badge, source story, plain-language lab results, origin map, timeline, ledger reference, report-counterfeit form). | `POST /api/reports` |
| `ScaleUp.jsx` | 446 | Static deployment roadmap: summary metrics, 3-phase rollout, cluster network map, tech stack, cost & partner model, KVIC integration flow. | none |

### 4.4 Pages — Tester

| File | Lines | Screen | API calls |
|---|---:|---|---|
| `quality/PendingVerification.jsx` | ~145 | Queue: harvest approvals (HARVEST_CREATED), batches awaiting beekeeper handoff (HARVEST_VERIFIED), and processed batches received from the processor with a "Run Lab Test" action. | `POST /api/batches/:id/verify` |
| `quality/QualityTestForm.jsx` | ~250 | Lab test on **processed** honey: moisture, NMR purity, HMF, free acidity, sugar profile, C4 adulteration, certificate upload; records tester + date, shows Passed/Failed and "Approved for Manufacturing". | `POST /api/quality-test` |
| `quality/QualityHistory.jsx` | 129 | Table of all past lab results, filterable, with row detail. | `GET /api/quality/history` |
| `quality/RejectedBatches.jsx` | 108 | Rejected batches with computed rejection reasons and severity. | `GET /api/quality/rejected` |
| `quality/QualityStandards.jsx` | 99 | Editable threshold table (FSSAI / AGMARK / NICES / EU / Internal). | `GET /api/quality/standards`, `POST /api/quality/standards` |
| `quality/QualityReports.jsx` | 146 | Trend analytics: pass rate, by-month purity/moisture, by-cluster, by-season. | `GET /api/quality/trends` |
| `quality/HivesView.jsx` | 44 | Read-only hive table for lab staff. | none (context) |

### 4.5 Pages — Processor

| File | Lines | Screen | API calls |
|---|---:|---|---|
| `processor/Processing.jsx` | 58 | Processor landing: per-batch process form + Package action. | via context: `POST /api/batches/:id/process`, `POST /api/batches/:id/package` |
| `processor/IncomingBatches.jsx` | ~185 | Incoming queue: in-transit handoff cards with **Receive** action, received consignments ready for processing (Start Processing auto-receives), plus batches handed to the tester. | `POST /api/batches/:id/receive`, `POST /api/batches/:id/process` |
| `processor/ProcessingLog.jsx` | ~255 | Extraction + filtration/settling form; success screen and "Processing Records" table show production batch id, processed-at date and location. | `POST /api/batches/:id/process`, `POST /api/processing-step` |
| `processor/Packaging.jsx` | ~205 | Packaging form for **QA-approved batches**: packaging type, final product batch id, jar count + package size (live final-qty hint), packaging/seal date, best-before, manufacturing location; success card shows product batch, final quantity, date and location. | `POST /api/batches/:id/packaging` |
| `processor/Inventory.jsx` | ~198 | Finished-goods table with package size/final qty, packaging date + location, production batch id; per-row QR modal (image + verification URL + download). | `GET /api/inventory`, `GET /api/qr/:batchId` |
| `processor/DistributionHandoff.jsx` | 167 | Dispatch form: logistics partner, destination, date, jar count, tracking id. | `POST /api/batches/:id/dispatch` |
| `processor/FacilityInfo.jsx` | 140 | Facility profile: certifications, equipment table with service dates, blockchain node sync status, operators. | `GET /api/facility` |
| `processor/ProcessorBatches.jsx` | 50 | All-batches table. | none (context) — **no nav entry** |

### 4.6 Pages — Beekeeper

| File | Lines | Screen | API calls |
|---|---:|---|---|
| `beekeeper/MyBatches.jsx` | ~110 | Personal batch list with pipeline stages, **Send to Processor** handoff button + "sent" badge, trace shortcut. | via context: `POST /api/batches/:id/handoff` |
| `beekeeper/HarvestSubmission.jsx` | 191 | Harvest form: honey type, extraction method, quantity, harvest date. | `POST /api/batches` |
| `beekeeper/BeekeeperAlerts.jsx` | 112 | Alerts derived from hive + batch state. | none (context) |
| `beekeeper/BeekeeperEarnings.jsx` | 114 | Earnings summary cards. | none (context) |
| `beekeeper/BeekeeperProfile.jsx` | 115 | Profile card + participation stats. | none (context) |

---

## 5. Routing Map

`BrowserRouter` with declarative `<Routes>`. Paths come from `src/routeConfig.js`;
components come from the `VIEWS` map in `App.jsx:48-79`. A `path="*"` catch-all renders
`Overview`, so unknown URLs never 404.

| View key | URL path | Component | Intended role |
|---|---|---|---|
| `overview` | `/` | `Overview` | public |
| `monitor` | `/monitor` | `HiveMonitor` | public |
| `ai` | `/ai` | `AIInsights` | public |
| `chain` | `/chain` | `BlockchainTrace` | public |
| `qr` | `/scan` | `ConsumerScan` | public |
| `scale` | `/scale-up` | `ScaleUp` | public |
| `login` | `/login` | `LoginPage` | public |
| `quality` | `/quality` | `PendingVerification` | TESTER |
| `quality-test` | `/quality/test` | `QualityTestForm` | TESTER |
| `quality-history` | `/quality/history` | `QualityHistory` | TESTER |
| `quality-rejected` | `/quality/rejected` | `RejectedBatches` | TESTER |
| `quality-standards` | `/quality/standards` | `QualityStandards` | TESTER |
| `quality-reports` | `/quality/reports` | `QualityReports` | TESTER |
| `hives` | `/hives` | `HivesView` | TESTER |
| `processing` | `/processing` | `Processing` | PROCESSOR — **no nav entry** |
| `proc-incoming` | `/processing/incoming` | `IncomingBatches` | PROCESSOR |
| `processing-log` | `/processing/log` | `ProcessingLog` | PROCESSOR |
| `packaging` | `/processing/packaging` | `Packaging` | MANUFACTURER |
| `inventory` | `/processing/inventory` | `Inventory` | MANUFACTURER |
| `dispatch` | `/processing/dispatch` | `DistributionHandoff` | MANUFACTURER |
| `facility` | `/processing/facility` | `FacilityInfo` | PROCESSOR — **no nav entry** |
| `proc-batches` | `/processing/batches` | `ProcessorBatches` | PROCESSOR — **no nav entry** |
| `my-batches` | `/beekeeper/batches` | `MyBatches` | BEEKEEPER |
| `harvest` | `/beekeeper/harvest` | `HarvestSubmission` | BEEKEEPER |
| `bk-alerts` | `/beekeeper/alerts` | `BeekeeperAlerts` | BEEKEEPER |
| `earnings` | `/beekeeper/earnings` | `BeekeeperEarnings` | BEEKEEPER |
| `bk-profile` | `/beekeeper/profile` | `BeekeeperProfile` | BEEKEEPER |

### Special routing behaviours

**Deep link from a QR scan.** `AppShell` has a hash listener (`App.jsx:106-115`). A URL of
`…/#verify/KVIC-HC-2026-0417` is parsed, written into `batchIdInput`, and the app navigates
to `/scan`. This is how the physical QR label on a jar hands off to the verification screen —
and why `backend/src/routes/qr.js` encodes the URL as `#verify/<batchId>`.

**Login short-circuit.** `AppShell` returns `<LoginPage />` instead of the shell whenever
`activeView === 'login'`, so no header/footer render on the login screen.

**Scroll reset.** Every `location.pathname` change triggers `window.scrollTo({ top: 0, behavior: 'smooth' })`.

**No route guards.** `Header.jsx` hides nav items by role, but `AppShell` maps every path
to a component with zero auth checks. Any user can deep-link to `/quality` or
`/processing/inventory`. See [Known Issues](#13-known-issues--improvement-backlog).

---

## 6. State Management — AppContext

`src/context/AppContext.jsx` is the single global store. API base:

```js
const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:4000';
```

### 6.1 State

| Group | State | Initial value |
|---|---|---|
| Theme | `theme`, `setTheme` | `'light'` |
| Routing | `activeView` *(derived from URL)*, `setActiveView`, `switchView` | from `viewForPath()` |
| Hives | `hives` *(object keyed by hiveId)*, `setHives`, `activeHive`, `setActiveHive`, `curHive` | `initialHives`, `'H001'` |
| Telemetry series | `tempSeriesData`, `weightSeriesData` | 24 synthetic points each |
| Batch / scan | `batchIdInput`, `setBatchIdInput`, `isScanned`, `setIsScanned` | `'KVIC-HC-2026-0417'` |
| Auth | `currentUser`, `setCurrentUser`, `loginEmail`, `setLoginEmail`, `loginError`, `setLoginError`, `showPassword`, `setShowPassword` | `null` / `''` |
| Server data | `sharedBatches`, `fetchBatches`, `dashboardStats`, `ledger` | `[]` / `null` / `null` |
| UI | `notification`, `showNotification`, `showFullCertModal`, `setShowFullCertModal`, `activePopover`, `productionRange`, `setProductionRange` | — |

### 6.2 Actions

| Action | Endpoint | Notes |
|---|---|---|
| `fetchBatches()` | `GET /api/batches` | Polls every **10 s** via `setInterval` |
| `handleLogin(e)` | `POST /api/auth/login` | Sends **only `{ email }`** |
| `handleRegisterHarvest(e)` | `POST /api/batches` | Reads `honeyType`, `extractionMethod`, `harvestQty`, `harvestDate` off the form |
| `handleVerifyBatch(id)` | `POST /api/batches/:id/verify` | **Dead** — no caller |
| `handleQualitySubmit(e, id)` | `POST /api/batches/:id/quality` | **Dead** — no caller |
| `handleProcessSubmit(e, id)` | `POST /api/batches/:id/process` | Reads `center`, `qtyProcessed` |
| `handlePackageSubmit(id)` | `POST /api/batches/:id/package` | Fire-and-forget |
| `handleAddHive(data)` | `POST /api/iot/hives` | Maps the API hive → the UI's flat `hives` shape, then re-keys state |
| `sendToProcessor(id)` | `POST /api/batches/:id/handoff` | Beekeeper handoff; sends `{ sender: currentUser.name }`, notifies + refetches on success |

### 6.3 Effects

1. **Batch polling** — `fetchBatches()` on mount, then every 10 s, cleaned up on unmount.
2. **Hydration** (mount only) — three parallel GETs:
   - `GET /api/iot/hives` → replaces `hives` if non-empty; re-points `activeHive` if the current one vanished. **Silently keeps mocks on failure.**
   - `GET /api/kvic/dashboard` → `dashboardStats`
   - `GET /api/ledger` → `ledger`
3. **Theme sync** — writes `data-theme="light|dark"` onto `<html>`.
4. **Live telemetry jitter** — every 3 s perturbs the active hive's temp ±0.075 °C,
   humidity ±0.25 %, weight +0…0.02 kg. This is what makes the monitor feel "live"
   without a websocket.

### 6.4 Hive shape mapping

`hives` is stored in a **flat, UI-shaped** form, not the API's nested form. Both the
hydration effect and `handleAddHive` run the same mapping:

| UI field | Source |
|---|---|
| `loc`, `cluster` | `location` (cluster = prefix before comma, if `cluster` absent) |
| `temp`, `hum`, `wt` | `telemetry.internalTemp` / `.humidity` / `.weightKg` |
| `wtDelta` | `telemetry.weightDelta24h` |
| `act` | `telemetry.acousticFreqHz > 400 ? 'Elevated (…Hz)' : 'Normal (…Hz)'` |
| `health`, `healthScore`, `swarmRisk`, `diseaseRisk`, `yieldForecastKg` | direct |
| `state` | derived: `EXCELLENT → 'ok'`, `WARNING → 'warn'`, else `'low'` |

---

## 7. API Integration

**34 total calls**: 11 from context, 23 direct from pages. Every one is bare `fetch`
(no axios in practice) and every one swallows its error, so a dead API degrades to mock data
rather than a blank screen.

> ⚠️ `API_BASE` is re-declared in **17 files** (16 pages + the context) as
> `process.env.REACT_APP_API_URL || 'http://localhost:4000'`. This is the single biggest
> refactor candidate — see the backlog.

### 7.1 Full call map

| Endpoint | Method | Called from |
|---|---|---|
| `/api/auth/login` | POST | `AppContext.handleLogin` |
| `/api/batches` | GET | `AppContext.fetchBatches` (10 s poll), `Overview.jsx:19` |
| `/api/batches` | POST | `AppContext.handleRegisterHarvest`, `beekeeper/HarvestSubmission.jsx:51` |
| `/api/batches/:id/handoff` | POST | `AppContext.sendToProcessor` ← `beekeeper/MyBatches.jsx` |
| `/api/batches/:id/receive` | POST | `processor/IncomingBatches.jsx` (Receive button, and auto-receive inside Start Processing) |
| `/api/batches/:id/verify` | POST | `quality/PendingVerification.jsx:27` · context `handleVerifyBatch` *(dead)* |
| `/api/batches/:id/quality` | POST | context `handleQualitySubmit` *(dead — no caller)* |
| `/api/batches/:id/process` | POST | `AppContext.handleProcessSubmit`, `processor/IncomingBatches.jsx`, `processor/ProcessingLog.jsx` |
| `/api/processing-step` | POST | `processor/ProcessingLog.jsx` (records the Filtration & Settling step) |
| `/api/batches/:id/package` | POST | `AppContext.handlePackageSubmit` |
| `/api/batches/:id/packaging` | POST | `processor/Packaging.jsx:43` |
| `/api/batches/:id/dispatch` | POST | `processor/DistributionHandoff.jsx:54` |
| `/api/iot/hives` | GET | `AppContext` mount effect, `Overview.jsx:24` |
| `/api/iot/hives` | POST | `AppContext.handleAddHive` |
| `/api/kvic/dashboard` | GET | `AppContext` mount effect |
| `/api/ledger` | GET | `AppContext` mount effect |
| `/api/quality-test` | POST | `quality/QualityTestForm.jsx:35` |
| `/api/quality/standards` | GET | `quality/QualityStandards.jsx:13` |
| `/api/quality/standards` | POST | `quality/QualityStandards.jsx:22` |
| `/api/quality/trends` | GET | `quality/QualityReports.jsx:12` |
| `/api/quality/history` | GET | `quality/QualityHistory.jsx:14` |
| `/api/quality/rejected` | GET | `quality/RejectedBatches.jsx:19` |
| `/api/inventory` | GET | `processor/Inventory.jsx:23` |
| `/api/qr/:batchId` | GET | `processor/Inventory.jsx:46` |
| `/api/facility` | GET | `processor/FacilityInfo.jsx:12` |
| `/api/reports` | POST | `ConsumerScan.jsx:113` |

### 7.2 Two parallel quality paths

There are **two ways** to record a lab result, and they hit different endpoints:

- `POST /api/quality-test` — the full smart-contract gate (moisture / NMR / HMF / C4-sugar /
  free acidity, computes FSSAI pass-fail). For a **processed** batch it sets `QA_APPROVED`
  (tester's approval for manufacturing) or `REJECTED`; for raw honey it sets `CERTIFIED` /
  `REJECTED`. Used by `QualityTestForm`.
- `POST /api/batches/:id/quality` — a thin legacy shim that just stores the body and sets
  `QUALITY_VERIFIED`. Handler exists in context but is never called.

`QualityTestForm` (the live one) is the one that actually gates certification — and both
packaging routes refuse batches that are not `QA_APPROVED`.

### 7.3 Unused backend endpoints

Present on the API, never called by the frontend:
`GET /api/health` · `GET /api/beekeepers` · `POST /api/beekeepers` · `POST /api/harvest-event` ·
`POST /api/ai/diagnose` · `POST /api/ai/predict-yield` · `GET /api/provenance/:batchId` ·
`GET /api/reports`.

`GET /api/provenance/:batchId` is the most notable gap — the backend already assembles a
complete FHIR-style `HoneyTraceabilityBundle` (merkle root, masked Aadhaar, KRISHI id,
blockchain proof), and `ConsumerScan` rebuilds an equivalent view by hand from `sharedBatches`.

---

## 8. Feature Breakdown by Role

The `Header` swaps its `NAV_ITEMS` list by `currentUser.role`. With no user it shows the
public set.

### Public / anonymous
`/` · `/monitor` · `/ai` · `/chain` · `/scan` · `/scale-up`

Landing page, live hive telemetry, AI health & yield, blockchain explorer, consumer QR
passport, and the KVIC scale-up roadmap. All work with the backend offline.

### BEEKEEPER
`/beekeeper/batches` · `/beekeeper/harvest` · `/beekeeper/alerts` · `/beekeeper/earnings` · `/beekeeper/profile`

Submit a harvest (becomes a blockchain `HARVEST_CREATED` event), **send the harvested honey on
to the processor** (`POST /api/batches/:id/handoff` → `HANDOFF_TO_PROCESSOR` block, shown to the
processor as "In Transit"), track batch status through the chain, see alerts for own hives,
review earnings, view profile. `HiveMonitor` also reveals a beekeeper-only "Register Harvest"
panel.

### PROCESSOR
`/processing/incoming` · `/processing/log`
(plus `/processing`, `/processing/packaging`, `/processing/inventory`, `/processing/dispatch`,
`/processing/facility` and `/processing/batches` by URL only)

Accept incoming batches and log processing steps. Packaging, inventory, dispatch and facility
screens are no longer part of this role's navigation.

### TESTER
`/quality` · `/quality/test` · `/quality/history` · `/quality/rejected` · `/quality/standards` · `/quality/reports` · `/hives`

Verify incoming harvests, submit lab tests that gate certification, browse full history and
rejections with computed reasons, edit the threshold table, view trend analytics, inspect hives.

### MANUFACTURER
`/processing/packaging` · `/processing/inventory` · `/processing/dispatch` · `/chain` · `/scan`

Packaging, inventory and dispatch views shared with the processor, plus the blockchain
explorer and consumer scan screen.

---

## 9. Styling System

Plain CSS, two tiers, no preprocessor.

### Tier 1 — tokens (`src/index.css`, 157 lines)

All design tokens are CSS custom properties in two blocks:

- `:root` — **"Walnut Dark Theme"** values
- `[data-theme='light']` — **"Warm cream artisan"** overrides (~30 vars)

`AppContext` sets `data-theme` on `<html>`. Because `useState('light')` is the default, the
app **boots light** even though `:root` holds the dark palette.

| Group | Examples |
|---|---|
| Backgrounds | `--bg-dark #1E1A0F`, `--bg-card rgba(38,33,20,.92)`, `--bg-panel`, `--bg-input`, `--bg-inset` |
| Text | `--text-main #F7F1E1`, `--text-muted #B5A886`, `--text-dim #857A5F` |
| Amber / gold | `--amber-400 #F0B434` (light `#C8860A`), `--amber-500 #F5B800`, `--gold-glow`, `--gold-gradient` |
| Brand | `--cream #FBF3DE`, `--walnut #1E1A0F`, `--highlight-orange #E67E22` |
| Semantic | `--emerald-400/-500/-bg/-border`, `--rose-400/-bg/-border`, `--border-subtle`, `--border-highlight` |
| Type | `--font-display` (Playfair), `--font-sans`/`--font-heading` (Inter), `--font-mono` (JetBrains) |
| Elevation | `--shadow-glow`, `--shadow-card`, `--shadow-soft`, `--shadow-pop` |
| Radius | `--radius-sm 8` → `--modal-radius 20`, `--card-radius 16`, `--btn-radius 10` |
| Motion | `--focus-ring`, `--transition-fast 0.18s`, `--transition 0.25s` |

`index.css` also holds the reset (`*` box-sizing, `html` smooth scroll, `body` 15.5px/1.7),
`.display` + `h1–h4` → display font at `-0.02em`, `.mono`, and `.wrap`
(`padding: 0 clamp(16px, 3.5vw, 56px)` — the app's universal content gutter).

### Tier 2 — per-area stylesheets

Imported in this exact order from `src/styles/index.css` (imported once, `App.jsx:4`):

```css
@import './base.css';
@import './header.css';
@import './views.css';
@import './landing.css';
@import './overview.css';
@import './monitor.css';
@import './ai.css';
@import './blockchain.css';
@import './consumer.css';
@import './scaleup.css';
@import './footer.css';
@import './dashboard.css';
@import './roles.css';
@import './login.css';
@import './login-light.css';
@import './design-system.css';
@import './responsive.css';
```

**Cascade order matters.** `design-system.css` and `responsive.css` load last, so their
`.btn`, `.input`, `.panel` win over any page-level rule. `roles.css` needs
`overview.css` for `@keyframes beaconPulse`; `consumer.css` reuses `fadeIn` from `views.css`.

| File | Lines | Scope |
|---|---:|---|
| `base.css` | 32 | `.app-container` shell, `.comb-overlay` honeycomb dot pattern |
| `header.css` | 517 | Nav, brand, gold-underline tabs, LIVE pill, mobile drawer. Only file using **container queries** (`container-type: inline-size` on `.headbar`, breakpoints 700/520/460px) plus media queries at 1024/460px. |
| `views.css` | 76 | `main.wrap`, `.view-pane` + `@keyframes fadeIn`, `.glass-card` (blur 16px, gold top gradient) |
| `landing.css` | 1,900 | Entire marketing page, all `.lp-*`. **Zero `var()` usage** — fully hardcoded hexes. Animations: `float`, `floatJar`, `pulse-glow`, `cardFloat`, `beeHover`; `.reveal` scroll-reveal; `prefers-reduced-motion` honoured. |
| `overview.css` | 430 | Hero grid, `.btn-luxury`, LIVE badge, `.status-beacon` pulse, telemetry vitals, supply-chain flow conduit, stat KPI cards |
| `monitor.css` | 175 | Monitor layout (280px + 1fr), hive selector, 4-col gauge grid, dual chart panels, health banner |
| `ai.css` | 70 | Dual column, big score numeral, risk progress bars, recommendation box |
| `blockchain.css` | 84 | Trace search bar (mono input), horizontally scrolling merkle chain, block node cards, hash pills |
| `consumer.css` | 176 | QR scanner grid, QR display frame, "passport" result card, blurred modal window, certificate rows |
| `scaleup.css` | 41 | 3-col phase roadmap, hex cluster network |
| `footer.css` | 214 | Site footer — **intentionally hardcoded dark in both themes**, honeycomb watermark, 4-col grid |
| `dashboard.css` | 202 | `.clickable`, metric popovers, system status strip, panel headers, alert list, production chart, batch cards |
| `roles.css` | 566 | Login card + status badges, then the full **Hive Monitor Dashboard** (`.mm-*`): sidebar, header card, status strip, chart row, 3-col sensor grid, table, timeline |
| `login.css` | 789 | Full dark login: glow orbs (blur 100px), split pane (480px form), `.lcd-*` form, role badge colours (`.badge-bk` green, `.badge-proc` orange, `.badge-test` blue, `.badge-mfr` purple) |
| `login-light.css` | 118 | Pure `[data-theme='light']` override layer, using its own palette (`#f7f2e8`, `#2f261f`, `#b87319`) |
| `design-system.css` | 684 | **The primitive library**: `.btn` (+gold/outline/soft/danger/sm/lg/block), `.field`, `.input`/`.select`/`.textarea` (inline-SVG select arrow), `.panel`, `.kpi-grid`/`.kpi-card`, `.chip`, `.pill`, `.table-scroll`/`.hc-table`, `.state-empty`/`.state-loading`, `.result-hero`, `.notice`, `.summary-strip`, `.modal-window`, `.app-notice` (fixed top pill), staggered `slideUp` page entrance. Only file gating animations behind `prefers-reduced-motion: no-preference`. |
| `responsive.css` | 388 | Breakpoints at 1180/861/860/768/600/520/400 + `max-height` variants; `@media (pointer: coarse)` for 40–48px tap targets; `@supports` safe-area insets. Contains inline-style attribute hacks: `[style*="repeat(4"]`, `[style*="auto-fill"]`, `[style*="1fr 1fr"]`, … to collapse React `gridTemplateColumns` to one column. |

---

## 10. Assets & Fonts

### Images — `src/images/` (7 PNGs, ~11.6 MB)

| File | Dimensions | Size | Referenced? |
|---|---:|---:|---|
| `honey.png` | 1478×706 | 1.48 MB | No |
| `honey1.png` | 960×568 | 826 KB | No |
| `honeybee.png` | 1633×963 | 1.98 MB | Imported by `Landing.jsx:15` but the `<img>` is **commented out** (line 429) — so webpack still bundles it |
| `honeybee1.png` | 1672×941 | 1.84 MB | No |
| `honeybee2.png` | 1632×964 | 1.83 MB | No |
| `honeybee22.png` | 1632×964 | 1.77 MB | No |
| `honeybeees.png` | 1983×793 | 1.62 MB | No |

All actual artwork is **inline SVG** from `Illustrations.jsx`. The `.lp-hero-scene` container
therefore reserves `min-height: 560px` and floats three chips over an empty box.

### Fonts — ⚠️ double load

| Source | Families |
|---|---|
| `public/index.html` | Fraunces (300–700), IBM Plex Sans (400–700), IBM Plex Mono (400–700) |
| `src/index.css:1` | Playfair Display (500–900 + italic), Inter (400–700), JetBrains Mono (400–700) |

Every `--font-*` token resolves to the **second** set, so the HTML `<link>` is a redundant
render-blocking request for fonts that are never used.

### `public/`

- **`index.html`** — 23-line CRA shell, `<title>Honey Chain — Traceable Honey, Verified at the Source</title>`,
  `theme-color #FBF3DE`, `preconnect` to Google Fonts. References `favicon.ico`,
  `logo192.png`, and `manifest.json` — **none of which exist** in `public/`, so all three 404.
  No `og:`/`twitter:` tags; `viewport` lacks `viewport-fit=cover`, which defeats the
  `env(safe-area-inset-*)` rules already present in two stylesheets.
- **`manifest.json`** — `short_name: "Honey Chain"`, `display: standalone`,
  `theme_color`/`background_color` `#FBF3DE`, a single `.ico` icon entry. Not installable as-is
  (a valid PWA manifest needs 192/512 PNGs).

---

## 11. Testing

Single suite: `src/__tests__/routing.test.jsx` (94 lines). CRA's Jest + React Testing Library.

| Case | What it asserts |
|---|---|
| Public nav | Each public URL renders its screen |
| Back / forward | Browser history navigation updates the view |
| Login | Submitting redirects to `/login` |
| Role nav (×4) | BEEKEEPER / PROCESSOR / TESTER / MANUFACTURER each get their own tab set |

`fetch` is mocked so that `POST /api/auth/login` returns `{ user: { role } }`, letting the
per-role assertions run without a backend.

`package.json` also pins three `moduleNameMapper` entries for `react-router-dom`,
`react-router`, and `react-router/dom` to explicit `dist/*.js` paths — a v7 CJS/ESM interop
workaround for Jest.

```bash
npm test            # watch mode
CI=true npm test    # single run
```

**No coverage config, no lint script, no typecheck script.** `eslintConfig` extends
`react-app` + `react-app/jest`, enforced only at `react-scripts start`/`build`.

---

## 12. Build, Env & Deployment

### Environment

| Variable | Required | Default | Purpose |
|---|---|---|---|
| `REACT_APP_API_URL` | yes in prod | `http://localhost:4000` | Backend base URL |

CRA **inlines `REACT_APP_*` at build time**, so changing the API URL requires a rebuild —
it is not a runtime variable.

```bash
# .env
REACT_APP_API_URL=https://your-render-service.onrender.com
```

### Vercel

`vercel.json` is a single SPA catch-all, required because `react-router-dom` uses real paths:

```json
{ "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }] }
```

Set `REACT_APP_API_URL` in Vercel → Settings → Environment Variables, then deploy.
The backend is a separate Render service (see `render.yaml` at the repo root).

### `browserslist`

```json
"production":  [">0.2%", "not dead", "not op_mini all"],
"development": ["last 1 chrome version", "last 1 firefox version", "last 1 safari version"]
```

### `build/`

A stale production artifact is checked into the working tree (gitignored, but present).
Safe to delete.

---

## 13. Known Issues & Improvement Backlog

### Critical

1. **Login is email-only.** `AppContext.jsx:74` posts `{ email: loginEmail }` with no password,
   even though `LoginPage` renders a `required` password field and the demo cards pre-fill
   `demo123`. Anyone who knows an email can authenticate as that role. The routing test
   doesn't catch it because `fireEvent.click` bypasses HTML5 `required` validation.

2. **No route-level authorization.** `Header.jsx` hides tabs by role, but `AppShell` renders
   every path unconditionally. Any visitor can deep-link to `/quality`,
   `/processing/inventory`, etc. Fix: wrap `AppRoute` in a guard that reads `currentUser.role`
   and redirects to `/login` or a 403 view.

### Bugs

3. **`BeekeeperProfile.jsx:9` — `(hives || []).length`.** `hives` is an **object keyed by
   hiveId**, not an array, so `.length` is `undefined` and `totalHives` renders wrong.
   `HiveMonitor.jsx` gets it right with `Object.keys(hives).length`.

4. **`Overview.jsx:15` — discarded fetch.** `const [, setHiveList] = useState([])` throws away
   the result of `GET /api/iot/hives`; the setter exists only to force a re-render. Either
   wire it into context or drop the call.

5. **`CertificateModal.jsx:107` — `quality.h遊FurfuralHMF`.** A stray CJK character in an
   identifier; always `undefined`, so the fallback never works. The real `quality.hmf` is
   read correctly on line 58.

6. **Two more CJK artifacts** in `AIInsights.jsx`: `加热` (line 58) and `湿度` (line 306),
   both unintended characters inside display strings.

### Refactors

7. **Centralize `API_BASE`.** 17 duplicate declarations of
   `process.env.REACT_APP_API_URL || 'http://localhost:4000'`. Extract to
   `src/config/api.js` and import it.

8. **Consolidate packaging endpoints.** `handlePackageSubmit` → `/package`,
   `Packaging.jsx` → `/packaging`. The backend supports both, which makes the split a trap.

9. **Delete dead code:**
   - Context: `handleVerifyBatch`, `handleQualitySubmit`, `setHives`, `dashboardStats`,
     `ledger`, `activePopover`/`setActivePopover`, `tempSeriesData`, `weightSeriesData`
     — all exposed, all unconsumed. (`ConsumerScan` shadows `isScanned` with local state.)
   - `mockData.js`: `flowSteps`, `chainStages`, `hexPath`, `mockUsers`, `processPerks`,
     `mockQualityHistory`, `recentAlerts`, `latestBatch` (all shadowed by locals in `Overview`).
   - `Illustrations.jsx`: 9 unused exports (`HeroJar`, `HeroScene`, `FloatBee`, `FloatDrip`,
     `FloatLeaf`, `FloatPollen`, `ProcessScene`, `BrushSwipe`, `StillLifeScene`).
   - `charts.jsx`: `renderSparkline`.
   - `package.json`: `axios`, `web-vitals` are declared but never imported.

10. **Unify the duplicate quality path** and delete the legacy
    `POST /api/batches/:id/quality` shim.

11. **Wire up the unused backend.** `GET /api/provenance/:batchId` already returns a complete
    `HoneyTraceabilityBundle` (merkle root, masked Aadhaar, KRISHI id, blockchain proof);
    `ConsumerScan` should consume it instead of rebuilding the view from `sharedBatches`.
    `POST /api/ai/diagnose` and `POST /api/ai/predict-yield` should back `AIInsights`, which is
    currently 100% hardcoded.

### CSS & assets

12. **Three undefined custom properties**, which silently drop their declarations:
    `var(--bg-surface)` (`dashboard.css:22,98`), `var(--shadow-sm)` (`blockchain.css:47`),
    `var(--amber-gold-gradient-soft, …)` (`login.css:785` — has a fallback, degrades gracefully).

13. **`responsive.css:1-234` is dead** — a "LOGIN RESPONSIVE" block targeting `.login-page-wrapper`,
    `.login-hero-pane`, `.lh-stats-grid`, `.lc-brand`, `.lc-form`, … **none of which exist in
    any JSX**. Roughly half the file.

14. **~62 unreferenced CSS classes** across the v1 view stylesheets (`.monitor-layout`,
    `.hive-select-card`, `.flow-stage-card`, `.blockchain-node-card`, `.phases-3col-grid`,
    `.metric-popover`, `.stat-kpi-card`, `.health-banner`, `.dual-charts-grid`, …) — superseded
    by the landing page + `roles.css` dashboard + `design-system.css` primitives.

15. **Theme model is half-migrated.** `:root` defines dark but the runtime default is `'light'`;
    `footer.css` is hardcoded dark in both themes; `landing.css` uses zero tokens;
    `overview.css`/`monitor.css`/`dashboard.css` use light-theme-unaware
    `rgba(10,15,26,…)` and `rgba(255,255,255,.02)`. Consolidate onto tokens.

16. **~11.6 MB of unused PNGs.** Delete all except what is actually rendered; the one
    "used" file is bundled solely because its `import` is live while its JSX is commented out.

17. **Missing PWA assets.** `favicon.ico` and `logo192.png` are referenced from
    `index.html`/`manifest.json` but absent. Add real 192/512 PNG icons and
    `viewport-fit=cover`.

18. **Duplicate font load.** Drop the Fraunces/IBM Plex `<link>` from `public/index.html` and
    keep only the `index.css` import (or vice versa — but not both).

### Functional

19. **`ConsumerScan.jsx:45` hardcodes a personal ngrok URL** as `PUBLIC_BASE` for localhost.
    Move it to an env var.

20. **Three orphaned pages** have no nav entry in any role and are reachable only by URL:
    `Processing` (`/processing`), `ProcessorBatches` (`/processing/batches`) and
    `FacilityInfo` (`/processing/facility`). Either add nav items or remove the routes.

21. **`YieldForecastPaths` ignores the selected hive** — the forecast curves are static.
    Drive them from `curHive` / the `/api/ai/predict-yield` endpoint.

22. **Backend dependency hygiene** (see `backend.md` §12): the API currently ships with
    unused `mongoose`, `joi`, `jsonwebtoken`, `bcryptjs`, `multer`, `moment`, `axios`, and
    `dotenv` — dependencies whose intended purpose (real DB, real auth, validation, uploads)
    is exactly what items 1 and 2 above need.

---

## See also

- [`../backend/backend.md`](../backend/backend.md) — full API reference
- [`../README.md`](../README.md) — project overview and quick start
