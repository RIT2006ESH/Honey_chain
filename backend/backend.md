# Honey Chain — Backend

> Node.js + Express REST API backing the Honey Chain blockchain honey traceability platform,
> built for **KVIC's Honey Mission** and rural beekeepers.
>
> Deployed on **Render** (see `render.yaml` at the repo root). Consumed by the Vercel-hosted
> React frontend.

---

## Table of Contents

1. [Quick Start](#1-quick-start)
2. [Tech Stack](#2-tech-stack)
3. [Project Structure](#3-project-structure)
4. [File Inventory](#4-file-inventory)
5. [Architecture](#5-architecture)
6. [API Reference](#6-api-reference)
7. [Blockchain Engine](#7-blockchain-engine)
8. [Data Store & Domain Model](#8-data-store--domain-model)
9. [Business Rules](#9-business-rules)
10. [The Six-Checkpoint Supply Chain](#10-the-six-checkpoint-supply-chain)
11. [Auth & Roles](#11-auth--roles)
12. [Deployment](#12-deployment)
13. [Known Issues & Roadmap](#13-known-issues--roadmap)

---

## 1. Quick Start

```bash
cd backend
npm install
npm start     # node server.js  →  http://localhost:4000
```

| Script | Command | Purpose |
|---|---|---|
| `start` | `node server.js` | Production start. Port from `PORT`, default **4000**. |
| `dev` | `nodemon server.js` | Auto-restart on file change |
| `test` | `jest` | Jest + supertest (no test files exist yet) |

Smoke test:

```bash
curl http://localhost:4000/api/health
```

```json
{
  "status": "ok",
  "system": "Honey Chain - KVIC Honey Mission Blockchain & IoT Platform",
  "blocksCount": 7,
  "activeHives": 3,
  "batchesCount": 6,
  "timestamp": "2026-09-27T..."
}
```

**Requirements:** Node.js ≥ 18 (`engines` field). CORS is wide open (`app.use(cors())`) so
the Vercel frontend can call the Render API from any origin.

---

## 2. Tech Stack

| Concern | Choice | Notes |
|---|---|---|
| Runtime | **Node.js ≥ 18** | CommonJS modules throughout |
| Framework | **Express 4.18.2** | Mounts one router under `/api` |
| CORS | **cors 2.8.5** | Unrestricted, no config |
| Body parsing | **body-parser** (transitive via Express) | `express.json()` equivalent, 100 kb default |
| QR generation | **qrcode 1.5.3** | `toDataURL` for the consumer label |
| UUIDs | **uuid 9.0.1** | `v4` for block txIds and batch ids |
| Crypto | **node:crypto** (built-in) | SHA-256 block hashing, merkle-style root |
| Dev | **nodemon 3.0.1** | |
| Test | **jest 29.6.4** + **supertest 6.3.3** | Configured, zero specs written |

### Declared but unused dependencies

| Package | Status | What it was clearly intended for |
|---|---|---|
| `mongoose` 7.5 | never required | MongoDB persistence — the store is in-memory |
| `joi` 17.9 | never required | Request validation — handlers trust `req.body` |
| `jsonwebtoken` 9.0 | never required | Real JWT auth — login is a hardcoded email lookup |
| `bcryptjs` 2.4 | never required | Password hashing — no password is ever read |
| `multer` 1.4 | never required | File uploads (certificates, hive photos) |
| `moment` 2.29 | never required | Date formatting — native `Date` is used |
| `axios` 1.5 | never required | Outbound HTTP (e.g. anchoring to Polygon RPC) |
| `dotenv` 16.3 | never required | `.env` loading — `server.js` never calls `dotenv.config()` |

Also note `body-parser` is `require`d in `src/app.js:3` but is **not** a direct dependency —
it only resolves because Express 4 depends on it. Add it explicitly or switch to
`express.json()`.

---

## 3. Project Structure

```
backend/
├── package.json
├── package-lock.json
├── server.js                      # Entry point: requires app, listens on PORT
│
└── src/
    ├── app.js                     # ★ Express app factory (21 lines)
    ├── routes/
    │   ├── index.js               # ★ Router registry — mounts all 14 sub-routers
    │   ├── auth.js                # Mock role login
    │   ├── users.js               # User CRUD
    │   ├── beekeepers.js          # Beekeeper enrolment + geo-zones
    │   ├── hives.js               # IoT hive registry + telemetry ingest + smart alerts
    │   ├── ai.js                  # Disease diagnosis + yield forecast (rule-based)
    │   ├── harvest.js             # Harvest event → batch creation
    │   ├── quality.js             # ★ Quality gate (testRouter) + analytics (router)
    │   ├── processing.js          # Processing/packaging step append
    │   ├── batches.js             # ★ Batch lifecycle state machine
    │   ├── reports.js             # Consumer counterfeit reports
    │   ├── qr.js                  # QR data-URL + verification URL
    │   ├── provenance.js          # FHIR-style traceability bundle
    │   └── system.js              # Health, ledger, KVIC analytics, inventory, facility
    │
    ├── blockchain.js              # ★ In-memory SHA-256 proof-of-work chain (48 lines)
    ├── store.js                   # ★ In-memory entity stores + seed hydration (39 lines)
    │
    └── data/
        └── seedData.js            # ★ All seed data (277 lines)
```

**Scale:** 17 source files, 1,263 lines total. Hand-rolled, zero framework abstraction.

---

## 4. File Inventory

| File | Lines | Responsibility |
|---|---:|---|
| `server.js` | 12 | Requires `./src/app`, listens on `process.env.PORT \|\| 4000`, logs a 🍯 banner, exports the server (so supertest can use it). |
| `src/app.js` | 21 | `express()` + `cors()` + `bodyParser.json()`, mounts `./routes` at `/api`, then a catch-all `404 { ok:false, error:'Route not found' }` for everything else. |
| `src/routes/index.js` | 33 | The router registry — see the mount table below. |
| `src/routes/auth.js` | 18 | `POST /login`. Hardcoded email → role map. |
| `src/routes/users.js` | 26 | `GET/POST /`, `DELETE /:id`. |
| `src/routes/beekeepers.js` | 32 | `GET/POST /`. Generates `KVIC-BK-1xx` ids, stamps `verified: true`, writes a `BeekeeperEnrolled` block. |
| `src/routes/hives.js` | 94 | `GET /`, `GET /:hiveId`, `POST /` (register), `POST /:hiveId/telemetry` (ingest + alert engine). |
| `src/routes/ai.js` | 84 | `POST /diagnose`, `POST /predict-yield`. Keyword/symptom matching and a per-floral-source yield table. |
| `src/routes/harvest.js` | 67 | `POST /`. Creates a `HONEY-BATCH-YYYY-XXXXXX` with GPS, extraction method, and a first `processingSteps` entry. |
| `src/routes/quality.js` | 189 | **Two routers.** `testRouter` (mounted at `/api/quality-test`) is the FSSAI smart-contract gate. `router` (mounted at `/api/quality`) serves standards CRUD, trends, rejections, history. |
| `src/routes/processing.js` | 26 | `POST /`. Appends a step to `batch.processingSteps`; promotes `CERTIFIED → PACKAGED` when the step mentions packaging/bottling. |
| `src/routes/batches.js` | 127 | The lifecycle state machine: create, list, verify, quality, process, package, packaging, dispatch. |
| `src/routes/reports.js` | 27 | `POST /` (counterfeit report → `COUNTERFEIT_REPORT` block), `GET /`. |
| `src/routes/qr.js` | 28 | `GET /:batchId`. Returns a 320 px amber-on-white PNG data URL + the ngrok verification URL. |
| `src/routes/provenance.js` | 50 | `GET /:batchId`. Assembles the `HoneyTraceabilityBundle` with origin, certificates, smart-contract verdicts, timeline, and blockchain proof. |
| `src/routes/system.js` | 75 | `/health`, `/ledger`, `/kvic/dashboard`, `/inventory`, `/facility`. |
| `src/blockchain.js` | 48 | `calculateHash`, `initBlockchain`, `addBlockToChain`, exported `blockchain` array. |
| `src/store.js` | 39 | Declares `batches`, `hives`, `beekeepers`, `users`, `reports`, re-exports `qualityStandards` + `processingFacility`. Runs `initStore()` on import. |
| `src/data/seedData.js` | 277 | `seedUsers` (6), `sampleBeekeepers` (3), `sampleHives` (3), `initialBatch` (1 certified), `seedBatches` (5), `qualityStandards` (5 regimes), `processingFacility` (1). |

### Router mount table (`src/routes/index.js`)

| Mount path | Router | Serves |
|---|---|---|
| `/api/auth` | `auth` | Login |
| `/api/users` | `users` | User management |
| `/api/beekeepers` | `beekeepers` | Beekeeper registry |
| `/api/iot/hives` | `hives` | Hive IoT |
| `/api/ai` | `ai` | AI engine |
| `/api/harvest-event` | `harvest` | Harvest events |
| `/api/quality-test` | `quality.testRouter` | The FSSAI quality gate |
| `/api/quality` | `quality.router` | Quality analytics |
| `/api/processing-step` | `processing` | Processing steps |
| `/api/batches` | `batches` | Batch lifecycle |
| `/api/reports` | `reports` | Counterfeit reports |
| `/api/qr` | `qr` | QR generation |
| `/api/provenance` | `provenance` | Consumer traceability bundle |
| `/api` | `system` | Health, ledger, dashboard, inventory, facility |

---

## 5. Architecture

Four layers, wired by plain `require`. No DI container, no async middleware, no service layer.

```
  HTTP request
      │
      ▼
  server.js ──▶ src/app.js            ← CORS, JSON body parsing, /api mount, 404 catch-all
      │
      ▼
  src/routes/index.js                 ← path → router registry
      │
      ├──────────────┬────────────────┬──────────────┬─────────────┐
      ▼              ▼                ▼              ▼             ▼
  routes/*.js    routes/*.js      routes/*.js    routes/*.js   routes/*.js
  (13 routers, all read/write the same in-memory stores)
      │              │                │              │             │
      └──────────────┴────────────────┴──────┬───────┴─────────────┘
                                             ▼
                          ┌──────────────────────────────┐
                          │  src/store.js                │
                          │  batches / hives /           │
                          │  beekeepers / users /        │
                          │  reports  (plain objects)    │
                          └───────────┬──────────────────┘
                                      │  addBlockToChain(...)
                                      ▼
                          ┌─────────────────────────────┐
                          │  src/blockchain.js          │
                          │  blockchain[] — SHA-256     │
                          │  linked list of blocks      │
                          └─────────────────────────────┘
```

### Design characteristics

- **Synchronous, in-memory, zero-persistence.** State lives in module-scope plain objects.
  A restart wipes every batch, hive, and block. This is a deliberate prototype choice —
  `mongoose` is installed but never connected.
- **`initStore()` runs at import time.** Requiring `store.js` seeds users, beekeepers, hives,
  the certified flagship batch, and 5 more batches — and writes 7 blocks to the chain as a
  side effect. Tests must account for this.
- **No middleware beyond CORS/JSON.** No auth guard, no rate limit, no logging, no error
  handler. A thrown error inside a handler falls through to Express's default HTML 500 page,
  which breaks the `{ ok: ... }` JSON contract.
- **No input validation.** Every handler destructures `req.body` and applies `|| default`
  fallbacks. A missing or malformed field silently becomes a default rather than a 400.
- **Idempotency is not considered.** `POST /api/batches` appends a block on every call.

---

## 6. API Reference

**34 endpoints across 14 routers.** Unless noted, all responses are JSON and all success
shapes include `ok: true`.

### Conventions

- **Content type:** `application/json` in and out.
- **Auth:** none. No `Authorization` header is read anywhere.
- **Errors:** `{ "ok": false, "error": "..." }` with a 4xx status. Two exceptions return a
  bare `{ ok: false }` with no `error` key — see [§13](#13-known-issues--roadmap).
- **Timestamps:** ISO-8601 UTC via `new Date().toISOString()`. Human dates via
  `toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'numeric' })`.

### 6.1 System

#### `GET /api/health`
Liveness + entity counts. Not wrapped in `ok`.

```json
{
  "status": "ok",
  "system": "Honey Chain - KVIC Honey Mission Blockchain & IoT Platform",
  "blocksCount": 7,
  "activeHives": 3,
  "batchesCount": 6,
  "timestamp": "2026-09-27T04:10:00.000Z"
}
```

#### `GET /api/ledger`
Full blockchain explorer payload.

```json
{
  "ok": true,
  "chainLength": 13,
  "blockchain": [
    { "index": 0, "timestamp": "2025-01-01T00:00:00.000Z",
      "data": { "message": "Honey Chain Genesis Block - KVIC Honey Mission" },
      "previousHash": "0", "hash": "<sha256 hex>" }
  ]
}
```

#### `GET /api/kvic/dashboard`
Cluster-wide aggregated statistics.

| Field | Source |
|---|---|
| `totalBeekeepers` | `Object.keys(beekeepers).length` |
| `totalBoxesDistributed` | Σ `beekeeper.boxesAllocated` |
| `activeSmartHives` | `Object.keys(hives).length` |
| `totalHoneyHarvestedKg` | Σ `batch.quantityKg` |
| `certifiedPurityBatches` | count of `CERTIFIED` or `PACKAGED` |
| `adulterationFailures` | count of `REJECTED` |
| `avgNMRPurityScore` | hardcoded `"99.3%"` |
| `avgMoistureContent` | hardcoded `"17.4%"` |
| `ruralRevenueGeneratedInr` | `totalHoneyHarvestedKg × 450` |

> ⚠️ The two averages are hardcoded, and the revenue rate of ₹450/kg is a hardcoded constant
> (it also appears independently in `routes/ai.js`). The `quantityKg` sum only counts
> harvest-created batches — `routes/batches.js` writes `quantity` instead, so those batches
> contribute **0**.

#### `GET /api/inventory`
Batches in `PACKAGED` or `DISPATCHED`, sorted newest-first by first transaction date.

```json
{ "ok": true, "inventory": [ { "id", "hiveId", "honeyType", "quantity", "status",
                              "processing", "production", "productionBatchId",
                              "packaging", "dispatch",
                              "beekeeper", "createdAt" } ] }
```

#### `GET /api/facility`
The processing unit profile, with two fields refreshed on every call:
`blockchainNode.lastSync` (now) and `blockchainNode.blocksAnchored` (live `blockchain.length`).
Includes certifications, 6 equipment rows with service dates, 3 operators, and a
Polygon-mainnet node descriptor (`contractAddress: "0x7a3B...4f2E"`).

### 6.2 Auth

#### `POST /api/auth/login`
Body: `{ email }` — **no password field is read.**

| Email | Role | Name |
|---|---|---|
| `beekeeper@honeychain.demo` | `BEEKEEPER` | Rameshwar Verma |
| `processor@honeychain.demo` | `PROCESSOR` | Satara Processing Unit |
| `tester@honeychain.demo` | `TESTER` | Dr. Sharma |
| `manufacturer@honeychain.demo` | `MANUFACTURER` | Nashik Packing Works |

```json
{ "ok": true, "user": { "email": "...", "role": "BEEKEEPER", "name": "Rameshwar Verma" } }
```

Anything else → `401 { "ok": false, "error": "Invalid mock credentials" }`.

### 6.3 Users

#### `GET /api/users` → `{ ok, users: [...] }`

#### `POST /api/users`
Body: `{ name, email, role, cluster? }` — all of `name`/`email`/`role` required
(`400 { error: 'Name, email and role required' }`).

Creates `{ id: "U00N", name, email, role, cluster, status: "Invited", joined: "DD Mon YYYY" }`.

#### `DELETE /api/users/:id`
`404 { error: 'User not found' }` if absent, otherwise `{ ok: true }`.

### 6.4 Beekeepers

#### `GET /api/beekeepers` → `{ ok, beekeepers: [...] }`

Each seeded beekeeper carries a `geoZone` bounding box
(`{ latMin, latMax, lonMin, lonMax }`) — intended for geo-fence validation at harvest, though
`routes/harvest.js` never checks it.

#### `POST /api/beekeepers`
Every field is optional and defaulted: `name`, `aadhaar` (`XXXX-XXXX-0000`), `krishiId`,
`cluster`, `state`, `village`, `boxesAllocated` (5), `species` (`Apis mellifera`), `phone`.

Id is generated as `KVIC-BK-${100 + count + 1}`. New records get `verified: true` with no
verification step. **Writes a `BeekeeperEnrolled` block** and returns it in the body.

### 6.5 IoT Hives

#### `GET /api/iot/hives` → `{ ok, hives: [...] }`

#### `GET /api/iot/hives/:hiveId` → `{ ok, hive }` · `404 { error: 'Hive not found' }`

#### `POST /api/iot/hives`
Body: `{ location, beekeeperName, floralSource, cluster, coordinates }`.

Generates `hiveId = HIVE-BOX-NN` and `boxNumber = KVIC-BOX-${8800 + N}`. New hives boot with
safe defaults: `internalTemp 34.5`, `humidity 58.0`, `weightKg 25.0`, `acousticFreqHz 240`,
`co2Ppm 500`, `batteryLevel 100`, `healthScore 50`, `swarmRisk 'Low'`, `alertSeverity 'none'`,
`firmwareVersion 'v2.3.1'`, `powerSource 'Solar-assisted'`. **Writes a `HiveRegistered` block.**

#### `POST /api/iot/hives/:hiveId/telemetry`
The sensor ingest endpoint — this is what real hardware would POST to.

Body (all optional): `internalTemp`, `humidity`, `weightKg`, `acousticFreqHz`, `co2Ppm`.
Each present field is `parseFloat`-ed and overwritten; `lastUpdated` is always stamped.
**The alert engine then runs** — see [§9.3](#93-smart-alert-rules). No block is written.

### 6.6 AI Engine

#### `POST /api/ai/diagnose`
Body: `{ symptomTags[], acousticFreq, visualObservations, broodPattern }`.

Keyword matching over `visualObservations + symptomTags` (lowercased), evaluated **in order** —
first match wins, so a report mentioning both "mite" and "foul" returns Varroa.

| Match contains | Diagnosis | Risk | Confidence |
|---|---|---|---:|
| `mite`, `spot`, `deformed wing` | Varroa Mite Infestation (Varroosis) | HIGH | 94.8 |
| `foul`, `sunken`, `slimy`, `sulfur` | American / European Foulbrood (AFB/EFB) | CRITICAL | 91.2 |
| `chalk`, `mummy`, `white hard` | Chalkbrood (*Ascosphaera apis*) | MEDIUM | 89.0 |
| `acousticFreq > 420` (and no textual match) | Swarming Frenzy (Pre-Swarm Queen Piping) | HIGH | 95.3 |
| *none* | Healthy Colony | LOW | 96.5 |

Returns `{ diagnosis: { disease, riskLevel, confidence, treatment, detectedBiomarkers[], diagnosedAt } }`.
Each branch ships a specific treatment protocol and its own biomarker list.

#### `POST /api/ai/predict-yield`
Body: `{ floralSource, hiveCount = 10, season, colonyStrength = 8.5 }`.

Per-hive base yield by floral source:

| Floral source | kg / hive |
|---|---:|
| `mangrove` / `sundarbans` | 22.0 |
| `mustard` | 18.0 |
| `litchi` | 15.5 |
| `sidr` | 16.5 |
| `acacia` | 14.0 |
| *default* (forest multifloral) | 12.0 |

```
predictedTotalKg = round(hiveCount × baseYieldPerHive × (colonyStrength / 10), 1)
estimatedRevenueInr = round(predictedTotalKg × 450)
```

Returns `{ forecast: { floralSource, hiveCount, predictedTotalKg, yieldPerHiveKg,
estimatedRevenueInr, optimalHarvestWindow, foragingFlightEfficiency } }`. `season` is
accepted but never used in the calculation.

### 6.7 Harvest

#### `POST /api/harvest-event`
Body: `{ hiveId, beekeeperId, floralSource, quantityKg, latitude, longitude, extractionMethod, batchName }`.

Creates `batchId = HONEY-BATCH-${year}-${uuid.slice(0,6).toUpperCase()}` and a batch with:

- `status: 'HARVESTED'`
- `gpsLocation` from lat/long, falling back to the hive's `coordinates`
- `extractionMethod` defaulting to `Cold Centrifugal Extraction (Raw & Unheated)`
- `qualityTest: null`
- one `processingSteps` entry: *Harvest & Extraction*
- `smartContractValidations.geoFenceValidation` optimistically set to `PASS` — **never
  actually checked against the beekeeper's `geoZone`**
- moisture/NMR validations set to `PENDING LAB TEST`

Falls back to the first beekeeper and first hive if the ids don't resolve.
**Writes a `HarvestEvent` block** and returns `{ ok, batch, block }`.

> This endpoint and `POST /api/batches` create **structurally different** batches — different
> id format, different field names, different statuses. See [§10](#10-the-six-checkpoint-supply-chain).

### 6.8 Quality

#### `POST /api/quality-test` — the smart-contract gate

Body: `{ batchId, labName, tester, moisturePercent, nmrPurityScore, c4SugarAdulteration, hmf, acidity, sugarProfile, pollenDominance, antibioticResidues, certificateName }`.

Defaults when a field is absent: moisture `18.0`, NMR `99.2`, HMF `14.0`, C4 `NEGATIVE`.
A batch that doesn't exist → `404 { error: 'Batch not found' }`.

**FSSAI rule set:**

| Rule | Threshold | Verdict expression |
|---|---|---|
| Moisture | ≤ 20.0 % | `PASS (${m}% <= 20.0%)` / `FAIL (… > 20.0% Fermentation Risk)` |
| NMR purity | ≥ 98.0 % | `PASS (${n}% >= 98.0%)` / `FAIL (… < 98.0%)` |
| C4 sugar | NEGATIVE | `PASS (100% Pure Raw Honey)` / `FAIL (C4 Foreign Sugar Detected)` |
| HMF | < 40.0 mg/kg | `PASS (… < 40 mg/kg)` / `FAIL (… >= 40 mg/kg)` |
| Free acidity | ≤ 40.0 meq/kg (only when `acidity` supplied) | `PASS (… <= 40.0 meq/kg)` / `FAIL (… > 40.0 meq/kg)` |

`overallPass = moisturePass && nmrPass && isC4Negative && hmfPass && acidityPass`.

**Status outcome depends on whether the batch was already processed:**

- **Processed honey** (`batch.production` exists, or status `PROCESSED` / `QA_APPROVED`) —
  the tester is approving it for manufacturing: pass → `QA_APPROVED`,
  fail → `REJECTED`. Sets `qualityTest.approvedForManufacturing = true` on a pass.
- **Raw honey** (legacy pre-processing path) — pass → `CERTIFIED`, fail → `REJECTED`.

On success it writes `batch.qualityTest` (incl. `tester`, `testedAt`, `acidity`,
`sugarProfile`, `certificate`, `result: PASS|FAIL`, `approvedForManufacturing`,
`fssaiCompliance`), overwrites all five `smartContractValidations`, appends a
`Quality test passed` / `Quality test failed` transaction (actor `Tester`), and
**writes a `QualityCertification` block** carrying `tester`, `testedAt`, `acidity`,
`sugarProfile` and `approvedForManufacturing`. Returns `{ ok, batch, block }`.

> ⚠️ This reads `qualityStandards` from the store but never consults it — the thresholds are
> hardcoded FSSAI values. Editing `/api/quality/standards` has **no effect** on the gate.

#### `GET /api/quality/standards` → `{ ok, standards }`
Five regimes: `fssai` (2.8.2), `agmark` (Grade A, 2024), `nices` (Organic, 2023),
`eu` (Codex Alimentarius), `internal` (HC-2026, stricter than FSSAI).
Each: `{ label, version, moistureMax, nmrPurityMin, c4SugarMax, hmfMax, antibioticMax, description }`.

#### `POST /api/quality/standards`
Body: `{ key, ...updates }`. Merges into the existing standard.
`400 { error: 'Invalid standard key' }` if `key` is missing or unknown. No auth.

#### `GET /api/quality/trends`
Aggregates every tested batch into:

```
summary:  { total, pass, fail, passRate }
byMonth:  [ { month: "YYYY-MM", pass, fail, avgPurity, avgMoisture } ]   // sorted
byCluster:[ { cluster, pass, fail, total, avgPurity, passRate } ]
bySeason: [ { season, pass, fail, total, passRate } ]
```

Cluster key = `hiveId` with the trailing `-NN` stripped. Season from the month number:
Mar–May `Spring`, Jun–Sep `Monsoon`, else `Winter`. A batch counts as pass when
`status !== 'REJECTED'`. Reads both `qualityTest` (harvest path) and `quality` (batches path).

#### `GET /api/quality/rejected`
All `REJECTED` batches, each with a computed `rejectionReasons[]`:

| Condition | Label | Threshold | Severity |
|---|---|---|---|
| moisture > 20 | `Moisture` | `<= 20.0%` | critical |
| purity 0 < x < 98 | `NMR Purity` | `>= 98.0%` | critical |
| C4 positive/adulterated | `C4 Sugar` | `NEGATIVE (< 7.0%)` | critical |
| HMF > 40 | `HMF Level` | `< 40 mg/kg` | warning |
| *none matched* | `General` | `All criteria must pass` | critical |

#### `GET /api/quality/history`
Every tested batch, newest first, normalised to a flat row:
`{ batchId, hiveId, beekeeper, honeyType, moisture, purity, hmf, c4Sugar, result, testedBy, date, status }`
where `result` is `FAIL` when `status === 'REJECTED'`, else `PASS`.

### 6.9 Batches — the lifecycle state machine

#### `GET /api/batches` → `{ ok, batches }`
Polls every 10 s from the frontend. Returns all batches raw, in insertion order.

#### `POST /api/batches` — create
Body: `{ hiveId, honeyType, extractionMethod, quantity, harvestDate, moisture, floralSource, notes, beekeeper }`.

Generates `id = HC-MH-2026-00${random 100–999}` and creates:

```json
{
  "id": "HC-MH-2026-00412",
  "hiveId": "HIVE-BOX-01",
  "beekeeper": "KVIC-BK-101",
  "honeyType": "...",
  "extractionMethod": "Centrifugal Cold Extraction",
  "quantity": 45,
  "moisture": null,
  "floralSource": "",
  "notes": "",
  "harvestDate": "2026-09-01",
  "status": "HARVEST_CREATED",
  "transactions": [ { "date": "...", "event": "Harvest created", "actor": "KVIC-BK-101" } ]
}
```

**Writes a `HARVEST_CREATED` block** carrying the whole batch object.

#### `POST /api/batches/:id/handoff` — beekeeper sends the honey to the processor
Body: `{ sender?, receiver?, note? }` (all optional).

Only allowed while the batch is still pre-processing
(`HARVEST_CREATED` / `HARVEST_VERIFIED` / `QUALITY_VERIFIED` / `CERTIFIED`) and has not been
handed over before:

- `404 { error: 'Batch not found' }` if absent ·
  `400 { error: 'Batch has already been sent to the processor' }` on a repeat ·
  `400 { error: 'Batch is already with the processor' }` once processing has started.

On success sets `batch.handoff = { sentAt, sender, receiver, status: 'IN_TRANSIT', note }`,
appends a `Sent to processor` transaction (actor `Beekeeper`), and
**writes a `HANDOFF_TO_PROCESSOR` block** `{ batchId, hiveId, sender, receiver, quantity, sentAt }`.
The batch `status` is unchanged — the tester pipeline still gates it before the processor's
"Ready for Processing" list picks it up.

#### `POST /api/batches/:id/receive` — processor accepts the consignment
Body: `{ receiver?, acceptedQuantity?, note? }` (all optional).

- `404 { error: 'Batch not found' }` if absent ·
  `400 { error: 'No consignment from a beekeeper is recorded for this batch' }` if the batch
  was never handed over ·
  `400 { error: 'Batch has already been received' }` on a repeat.

On success sets `batch.received = { receivedAt, receiver, acceptedQuantity, note }`
(default `acceptedQuantity` = `batch.quantity`), appends a `Received by processor`
transaction (actor `Processor`), and **writes a `RECEIVED_BY_PROCESSOR` block**
`{ batchId, receiver, acceptedQuantity, receivedAt }`. `status` is unchanged.

A batch that has a `handoff` but no `received` record is **blocked from processing** —
`POST /:id/process` returns `400 { error: 'Receive the beekeeper consignment before processing' }`.

#### `POST /api/batches/:id/verify` — tester
→ `status = 'HARVEST_VERIFIED'`, appends a transaction, writes `HARVEST_VERIFIED`.

#### `POST /api/batches/:id/quality` — **legacy, superseded**
Body stored verbatim on `batch.quality`; `status = 'QUALITY_VERIFIED'`; writes
`QUALITY_VERIFIED`. Does **not** evaluate any threshold — see
`POST /api/quality-test` for the real gate. No frontend caller reaches this.

#### `POST /api/batches/:id/process` — processor
Body is **merged** into `batch.processing = { ...existing, ...body }`, so a partial payload
(e.g. `{ startedAt }` from IncomingBatches or `{ center, qtyProcessed }` from the overview
form) never wipes extraction/filtration details recorded by `ProcessingLog.jsx`.

Every call also creates-or-updates the **production batch record**:

```json
"productionBatchId": "PB-<batch id>",
"production": { "productionBatchId": "PB-…", "createdAt": "…", "updatedAt": "…",
                "location": "<processor|center>", "processedAt": "…",
                "inputQuantity": 12.5, "outputQuantity": 11.8,
                "filtration": { "method": "…", "settlingHours": 24 } }
```

`inputQuantity` falls back to `qtyProcessed`, then `batch.quantity`; `location` prefers
`processor`, then `center`; `filtration` persists once set. Packaging later syncs
`production = { …, packagedBatchId, jarCount, finalQuantityKg, packagedAt, packagedLocation }`.

`status = 'PROCESSED'`; appends a `Processing completed` transaction (actor `Processor`);
writes `PROCESSED`. Packaging and dispatch transactions use actor `Manufacturer`.

#### `POST /api/batches/:id/package`
`400 { error: 'Batch must be QA-approved by the tester before packaging' }` unless
`status === 'QA_APPROVED'`. Otherwise `status = 'PACKAGED'`; builds the packaging record
via the shared `applyPackaging()` helper (see `/packaging` below), appends **two**
transactions (*Package registered*, *QR generated*); writes `PACKAGED`.
The QR image is **not** generated here — see `GET /api/qr/:batchId`.

#### `POST /api/batches/:id/packaging` — the richer variant
Body: `{ packagedBatchId, jarCount, jarWeight, sealDate, bestBefore, packagingType, location, notes }`.

```json
"packaging": { "packagedBatchId": "PKG-…", "jarCount": 18, "jarWeight": "500g",
               "finalQuantityKg": 9, "sealDate": "2026-09-30",
               "packagedAt": "<now ISO>", "location": "Nashik Packing Works",
               "bestBefore": "+365 days", "packagingType": "Glass Jar with Tamper-Evident Seal" }
```

`packagedBatchId` defaults to `PKG-<productionBatchId>` (falling back to `PKG-<batch id>`);
`finalQuantityKg` is computed from `jarCount × jarWeight` (parses `500g` / `1kg`);
`location` defaults to `Nashik Packing Works`; `packagedAt` is stamped on first packaging
and kept on re-packaging. Fields merge with any previously stored packaging record.
Both packaging routes refuse
non-`QA_APPROVED` batches with `400 { error: 'Batch must be QA-approved by the tester before packaging' }`
and sync `batch.production = { …, packagedBatchId, jarCount, updatedAt }`.

`status = 'PACKAGED'`; writes `PACKAGED` with `{ batchId, jarCount, sealDate }`.
> ⚠️ Despite the similar names, `/package` and `/packaging` are **independent routes that
> both set the same status**. The frontend calls each from a different page.

#### `POST /api/batches/:id/dispatch`
Body: `{ logisticsPartner, destination, dispatchDate, jarCount, trackingId }`.

```json
"dispatch": { "logisticsPartner": "BlueDart Cold Chain", "destination": "Mumbai Retail Hub",
              "dispatchDate": "…", "jarCount": 90, "trackingId": "TRK-<epoch ms>" }
```

`status = 'DISPATCHED'`; writes `DISPATCHED`.

> **Every handler in this file returns `404 { ok: false }` with no `error` key** on a missing
> batch — except `dispatch` and `packaging`, which do include one.

### 6.10 Processing Steps

#### `POST /api/processing-step`
Body: `{ batchId, step, notes }`. Appends `{ step, date, notes }` to `batch.processingSteps`.

If the step name contains `packag` or `bottl` **and** `status === 'CERTIFIED'`, it promotes
the batch to `PACKAGED`. Writes a `ProcessingStep` block. Returns `{ ok, batch, block }`.

### 6.11 QR

#### `GET /api/qr/:batchId`
`404 { error: 'Batch not found' }` if absent.

```json
{
  "ok": true,
  "batchId": "KVIC-HC-2026-0417",
  "dataUrl": "data:image/png;base64,iVBORw0KGgo…",
  "verificationUrl": "https://certified-overfaintly-vivian.ngrok-free.dev/#verify/KVIC-HC-2026-0417"
}
```

QR specs: 320 px, margin 2, dark `#B45309` (amber-700) on white. The encoded URL uses the
`#verify/<batchId>` hash form, which the frontend's hash listener in `App.jsx:106-115` picks
up to route to the consumer scan screen.

> ⚠️ The ngrok hostname is a **developer's personal tunnel hardcoded in source**. It will
> expire and should be an env var.

### 6.12 Provenance

#### `GET /api/provenance/:batchId`
The richest endpoint — a consumer-facing traceability bundle. `404` if the batch is absent.

```json
{
  "ok": true,
  "provenance": {
    "resourceType": "HoneyTraceabilityBundle",
    "id": "<batchId>",
    "batchName": "Raw Pure Litchi Monofloral Honey",
    "floralSource": "Litchi Blossom (Muzaffarpur)",
    "harvestDate": "2025-05-10",
    "status": "CERTIFIED",

    "origin": { "beekeeperName", "aadhaarMasked", "krishiId", "cluster",
                "state", "village", "hiveBoxNumber", "gpsLocation": { lat, lon } },

    "qualityCertificates":        { ...9-field lab report },
    "smartContractValidations":   { moisture, geoFence, nmr, adulteration, hmf },
    "journeyTimeline":            [ { step, date, notes } ],

    "blockchainProof": { "blocksCount", "latestHash", "merkleRoot": "0x<sha256>" }
  }
}
```

`blocksCount`/`latestHash` come from scanning the chain for blocks whose
`payload.batchId === batchId` **or** `payload.beekeeperId === batch.beekeeperId` — so a
batch with no direct events still inherits the beekeeper's enrolment block.
`merkleRoot` is `sha256(batchId + JSON.stringify(qualityTest))`, i.e. a single-leaf digest
labelled as a Merkle root.

Every field has a literal fallback string, so a sparse batch still returns a complete-looking
bundle.

### 6.13 Reports

#### `POST /api/reports`
Body: `{ batchId, reason, description, reporterName, reporterContact }`.

Creates `RPT-<epoch ms>` with `status: 'PENDING'` and defaults
(`reason: 'Suspected counterfeit'`, `reporterName: 'Anonymous'`).
**Writes a `COUNTERFEIT_REPORT` block.** Returns `{ ok, report }`.

#### `GET /api/reports` → `{ ok, reports }`

---

## 7. Blockchain Engine

`src/blockchain.js` — 48 lines, a real (if minimal) SHA-256 hash chain in memory.

```js
hash = sha256(index + previousHash + timestamp + JSON.stringify(data))
```

### Genesis

Block 0 is created on module import with a fixed timestamp
(`2025-01-01T00:00:00.000Z`) so the chain is deterministic across restarts:

```js
{ index: 0, timestamp: '2025-01-01T00:00:00.000Z',
  data: { message: 'Honey Chain Genesis Block - KVIC Honey Mission' },
  previousHash: '0', hash: '<sha256>' }
```

### Appending

`addBlockToChain(type, payload)` builds
`data = { type, payload, txId: uuidv4() }`, hashes it against the previous block, pushes, and
returns the new block. There is **no proof-of-work, no signature, no validation, and no
persistence** — it is an append-only audit log with tamper-evidence, not a distributed ledger.

### Block types emitted

| `type` | Emitted by |
|---|---|
| `BatchCertification` | `store.js` init (flagship certified batch) |
| `BatchCreated` | `store.js` init (each seeded batch) |
| `BeekeeperEnrolled` | `POST /api/beekeepers` |
| `HiveRegistered` | `POST /api/iot/hives` |
| `HarvestEvent` | `POST /api/harvest-event` |
| `QualityCertification` | `POST /api/quality-test` |
| `ProcessingStep` | `POST /api/processing-step` |
| `COUNTERFEIT_REPORT` | `POST /api/reports` |
| `HARVEST_CREATED` | `POST /api/batches` |
| `HARVEST_VERIFIED` | `POST /api/batches/:id/verify` |
| `HANDOFF_TO_PROCESSOR` | `POST /api/batches/:id/handoff` |
| `RECEIVED_BY_PROCESSOR` | `POST /api/batches/:id/receive` |
| `QUALITY_VERIFIED` | `POST /api/batches/:id/quality` |
| `PROCESSED` | `POST /api/batches/:id/process` |
| `PACKAGED` | `POST /api/batches/:id/package` and `/:id/packaging` |
| `DISPATCHED` | `POST /api/batches/:id/dispatch` |

Naming is inconsistent — `quality-test` and `processing-step` use PascalCase
(`QualityCertification`, `ProcessingStep`) while `batches.js` and `reports.js` use
SCREAMING_SNAKE (`HARVEST_CREATED`, `COUNTERFEIT_REPORT`). Normalise to one convention.

### Production intent

`processingFacility.blockchainNode` describes the target architecture — Polygon Mainnet,
`https://polygon-rpc.com`, `contractAddress: "0x7a3B...4f2E"`, with a `blocksAnchored` counter
that `GET /api/facility` refreshes to the live chain length. There is **no anchoring code**;
`axios` is installed but never used. The in-memory chain is the placeholder for that.

---

## 8. Data Store & Domain Model

`src/store.js` holds five plain objects plus two re-exported config objects.

```js
batches      // batchId -> batch
hives        // hiveId   -> hive + live telemetry
beekeepers   // id      -> beekeeper + geoZone
users        // id      -> user
reports      // array
qualityStandards     // re-exported from seedData (mutable at runtime)
processingFacility   // re-exported from seedData (mutated per request)
```

`initStore()` runs on import: seeds 6 users, 3 beekeepers, 3 hives, and 6 batches
(`initialBatch` + 5 `seedBatches`), writing **7 blocks** as it goes.

### 8.1 Two incompatible batch shapes

This is the most important thing to know about the codebase — the two creation paths produce
different documents, and the two id formats even differ in shape.

| | `POST /api/harvest-event` | `POST /api/batches` |
|---|---|---|
| Id | `HONEY-BATCH-2026-A1B2C3` (uuid) | `HC-MH-2026-00123` (random) |
| `id` key | ✅ plus `batchId` | `id` only |
| Beekeeper | `beekeeperId` + `beekeeperName` | `beekeeper` (string) |
| Quantity | `quantityKg` | `quantity` |
| GPS | `gpsLocation { lat, lon }` | ✗ |
| Status | `HARVESTED` | `HARVEST_CREATED` |
| Timeline | `processingSteps[]` | `transactions[]` |
| Lab report | `qualityTest` | `quality` |
| Contract verdicts | `smartContractValidations` | ✗ |
| Idempotency | n/a | **random id per call** |

Every read path in the codebase defensively handles both
(`batch.qualityTest || batch.quality`, `batch.id || batch.batchId`, `quantityKg || 0`).
The `HONEY-BATCH-2025-001` seed record is the only one carrying **both** shapes, which is
why it works with every screen.

### 8.2 Status vocabulary

Two overlapping sets, with no single enum enforcing them:

| Set | Values | Source |
|---|---|---|
| `harvest-event` / `quality-test` (raw) | `HARVESTED` → `CERTIFIED` / `REJECTED` → `PACKAGED` | `harvest.js`, `quality.js` |
| `batches.js` (live 4-role pipeline) | `HARVEST_CREATED` → `HARVEST_VERIFIED` → `PROCESSED` → `QA_APPROVED` → `PACKAGED` → `DISPATCHED` | `batches.js`, `quality.js` |

`QA_APPROVED` is set by `POST /api/quality-test` when a **processed** batch passes — it is
the tester's approval for manufacturing, and both packaging routes refuse any other status.
`REJECTED` can return to the flow only by re-testing (`/api/quality-test`).
`QUALITY_VERIFIED` / `CERTIFIED` are legacy pre-processing values kept for seed data and
the raw-honey test path.

### 8.3 Telemetry model

```json
"telemetry": {
  "internalTemp": 34.8,     // °C — optimal 34–36
  "humidity": 56.2,         // %  — optimal 50–65
  "weightKg": 28.4,
  "weightDelta24h": "+1.2 kg",
  "acousticFreqHz": 235,    // normal 200–280; swarm risk > 400–450
  "co2Ppm": 820,
  "batteryLevel": 94,
  "ambientTemp": 28.0,
  "lastUpdated": "2026-..."
}
```

The three seeded hives deliberately span the health spectrum: `HIVE-BOX-01` **EXCELLENT**
(Litchi, Muzaffarpur), `HIVE-BOX-02` **GOOD** (Sundarbans mangrove), `HIVE-BOX-03` **WARNING**
(mustard, Hoshiarpur — 37.8 °C and 420 Hz, carrying a pre-swarm alert). The seed data's inline
comments document the acceptable ranges.

### 8.4 Seed inventory

| Collection | Count | Notes |
|---|---|---|
| `seedUsers` | 6 | 3 beekeepers (1 `Invited`), 1 tester, 1 processor, 1 manufacturer |
| `sampleBeekeepers` | 3 | Bihar, West Bengal, Punjab — each with a `geoZone` bounding box |
| `sampleHives` | 3 | Tied to the 3 beekeepers; one in each health state |
| `initialBatch` | 1 | `HONEY-BATCH-2025-001`, `CERTIFIED`, 45 kg, 99.4 % NMR, 90 jars, full `processingSteps` + 5 transactions |
| `seedBatches` | 5 | One per status: `PACKAGED`, `CERTIFIED`, `PROCESSED`, `HARVEST_CREATED`, `HARVEST_VERIFIED` |
| `qualityStandards` | 5 | fssai · agmark · nices · eu · internal |
| `processingFacility` | 1 | 4 certifications, 6 equipment rows, 3 operators, Polygon node descriptor |

> `seedData.js:259` contains a Chinese character in an equipment name:
> `'自动 Filling & Capping Machine'`. The intended text is almost certainly
> `'Automatic Filling & Capping Machine'`.

---

## 9. Business Rules

### 9.1 The FSSAI quality gate

Fully specified in [§6.8](#68-quality). All four conditions must pass; any single failure sets
`status = 'REJECTED'` and blocks the batch permanently. This is the platform's core
integrity control and the only place where domain logic gates a state transition.

### 9.2 Yield model

Fully specified in [§6.6](#66-ai-engine). Per-hive base by floral source, scaled by
`colonyStrength / 10`, monetised at a flat ₹450/kg.

### 9.3 Smart alert rules

`POST /api/iot/hives/:hiveId/telemetry` — evaluated **in order**, so only one alert fires:

| Condition | Alert | Health |
|---|---|---|
| `acousticFreqHz > 400` | High Acoustic Activity: Queen Piping / Swarm Departure Imminent | `WARNING` |
| else `internalTemp > 37.5` | Brood Heat Stress: Hive ventilation required | `WARNING` |
| else `internalTemp < 32.0` | Brood Chilling Alert: Low temperature risk | `WARNING` |
| else | *(no alert)* | `EXCELLENT` |

`alerts` is **overwritten** each call, so a resolved condition clears the list.
Note the acoustic threshold here (400) differs from `routes/ai.js` (420) and from the seed
data's comment (450) — pick one.

### 9.4 Guards

| Rule | Where |
|---|---|
| Hive review requires a signed-in role header (`x-user-role` ∈ the four roles) | `hives.js` |
| `key` must exist before a standard can be patched | `quality.js` |
| Packaging step only promotes `CERTIFIED → PACKAGED` (not from `REJECTED`) | `processing.js` |
| C4-sugar check accepts `false`, `"NEGATIVE"`, or any string containing it | `quality.js` |
| Batch must exist before verify/quality/process/package/dispatch | `batches.js` |
| Hive must exist before telemetry ingest | `hives.js` |

### 9.5 Guards that are missing

- **No geo-fence enforcement.** `harvest.js` sets `geoFenceValidation: 'PASS (Verified within
  registered KVIC Apiary radius)'` unconditionally, even though every seeded beekeeper has a
  `geoZone` bounding box sitting unused. This is the single most valuable unimplemented rule
  — it is what makes the "verified at the source" claim real.
- **No status-transition validation.** Any batch can be processed, packaged, or dispatched
  regardless of its current status — including a `REJECTED` one.
- **No auth anywhere.** Every mutation endpoint is world-writable.
- **No input validation.** `joi` is installed but unused.

---

## 10. The Six-Checkpoint Supply Chain

The platform's stated model is 6 immutable checkpoints. Here is how they map onto actual
endpoints — and where the map is incomplete.

| # | Checkpoint | Endpoint | Block type | Status written |
|---|---|---|---|---|
| 1 | **Harvest** | `POST /api/harvest-event` **or** `POST /api/batches` | `HarvestEvent` / `HARVEST_CREATED` | `HARVESTED` / `HARVEST_CREATED` |
| 2 | **Processing** | `POST /api/batches/:id/process` **or** `POST /api/processing-step` | `PROCESSED` / `ProcessingStep` | `PROCESSED` / — |
| 3 | **Lab Test** | `POST /api/quality-test` | `QualityCertification` | `QA_APPROVED` / `REJECTED` (raw path: `CERTIFIED`) |
| 4 | **Packaging** | `POST /api/batches/:id/packaging` **or** `/:id/package` | `PACKAGED` | `PACKAGED` (refuses non-`QA_APPROVED`) |
| 5 | **Distribution** | `POST /api/batches/:id/dispatch` | `DISPATCHED` | `DISPATCHED` |
| 6 | **Retail** | — | — | ✗ **not implemented** |

Steps 1, 3, and 4 each have **two competing endpoints** with different payload shapes.
Step 6 does not exist. The frontend compensates by maintaining its own parallel status
strings in `AppContext` and by treating batches as loosely-typed.

Two internal transfer checkpoints sit outside the six: `POST /:id/handoff`
(`HANDOFF_TO_PROCESSOR`) and `POST /:id/receive` (`RECEIVED_BY_PROCESSOR`). Neither changes
`status`, but `/process` refuses a handed-over batch until it has been received.

**Consumer-facing view:** `GET /api/provenance/:batchId` reassembles all of the above into a
single `HoneyTraceabilityBundle`, and `GET /api/qr/:batchId` renders it as a scannable label.

---

## 11. Auth & Roles

### Four roles

Supply-chain order: **beekeeper → processor → tester → manufacturer.**

| Role | Seed user | Scope |
|---|---|---|
| `BEEKEEPER` | U002 Ganesh Pawar | Own batches, harvest submission, alerts, earnings |
| `PROCESSOR` | U006 Vikram Deshmukh | Incoming, processing |
| `TESTER` | U005 Dr. Anita Kulkarni | Verification, lab tests, standards, trends, rejections |
| `MANUFACTURER` | U007 Nashik Packing Works | Packaging, inventory, dispatch, blockchain, consumer scan |

Plus **CONSUMER**, which has **no account and no role** — the public verification path
(`/api/provenance`, `/api/qr`, `POST /api/reports`) is deliberately unauthenticated.

### How auth works today

`POST /api/auth/login` compares the submitted email against a **hardcoded four-entry map** in
`auth.js` and returns `{ email, role, name }`. There is no password check, no token, no
session, and no cookie. The frontend stores `currentUser` in React state for the life of the
tab and sends no credentials on any subsequent request.

**Consequence: authentication and authorization are both entirely client-side theatre.**
Knowing an email is sufficient to become any role, and — because no endpoint checks anything —
sufficient to call every route in this document with `curl`.

### Dependencies already installed for the fix

`jsonwebtoken` + `bcryptjs` are declared and unused. The intended upgrade is straightforward:

1. Add a password field to `seedUsers` and a `passwordHash`.
2. `bcrypt.compare` in `POST /api/auth/login`; return a signed JWT.
3. An `authenticate` middleware reading `Authorization: Bearer <token>`.
4. An `authorize(...roles)` middleware on every mutating route.
5. Persist users to MongoDB via the already-installed `mongoose`.
6. `joi` schemas for `POST` bodies.

---

## 12. Deployment

### Render — `render.yaml` (repo root)

```yaml
services:
  - type: web
    name: honey-chain-api
    runtime: node
    rootDir: backend
    buildCommand: npm install
    startCommand: npm start
    envVars:
      - key: NODE_VERSION
        value: 18
```

- Single Node web service, `rootDir: backend`.
- **Free tier ⇒ cold starts and full state loss on every redeploy.** The in-memory store makes
  every restart a full reset to seed data. A MongoDB Atlas instance (via the installed
  `mongoose`) is the prerequisite for anything beyond a demo.
- `PORT` is injected by Render and read in `server.js`.
- `dotenv` is installed but `server.js` never calls `dotenv.config()`, so a local `.env` is
  **not** loaded. Add it, or set env vars through the shell.

### CORS

`app.use(cors())` with no origin allowlist — required today because the frontend is on Vercel
and the API on Render (different origins). Tighten to a fixed allowlist before production.

### Frontend pairing

`REACT_APP_API_URL=https://<service>.onrender.com` in the Vercel project.
CRA inlines this at build time, so an API URL change requires a frontend rebuild.

### Health check

`GET /api/health` returns entity counts and `status: "ok"`, suitable for a Render health
check path — but note it is **not** wrapped in `ok: true` and returns HTTP 200 even if the
process is degraded.

---

## 13. Known Issues & Roadmap

### Security

1. **No authentication.** `POST /api/auth/login` is a hardcoded email lookup with no password
   check. Four known emails grant four roles.
2. **No authorization.** Every endpoint is world-writable. A `curl` can create users, enrol
   beekeepers, register hives, submit lab tests, certify batches, and dispatch shipments.
3. **Unrestricted CORS.** Any origin may call the API.
4. **No input validation.** `joi` is installed and unused; handlers `parseFloat` whatever
   arrives and fall back to defaults.
5. **Personal ngrok URL in source** (`routes/qr.js:16`) — an expired external tunnel
   committed to the repo. Move to an env var.
6. **Aadhaar numbers are stored and returned unmasked-by-default.** Seeds use
   `XXXX-XXXX-NNNN` placeholders and `provenance.js` returns `aadhaarMasked`, but
   `GET /api/beekeepers` returns the raw `aadhaar` field with no masking.

### Correctness

7. **No persistence.** Every restart wipes all state. `mongoose` is installed and unused.
8. **Two incompatible batch shapes** ([§8.1](#81-two-incompatible-batch-shapes)) force every
   reader to write `batch.qualityTest || batch.quality` defensively. Normalise to one schema.
9. **Two competing endpoints** at steps 1, 3, and 4 of the supply chain
   ([§10](#10-the-six-checkpoint-supply-chain)). Pick one per checkpoint.
10. **`POST /api/batches` generates a random id on every call** — retrying a failed request
    silently creates a duplicate batch and a duplicate block. No idempotency key.
11. **Status vocabulary is split** across two sets with no enum, and no transition validation
    — a `REJECTED` batch can still be processed and dispatched.
12. **`/api/quality-test` ignores `qualityStandards`.** Thresholds are hardcoded even though
    `POST /api/quality/standards` lets you edit them, so standards editing has **no effect on
    the gate** that matters. Wire the standard into the rule evaluation.
13. **`quality.js` reads `qualityTest` *or* `quality`, then writes only `qualityTest`** — so a
    batch that came through the legacy `/batches/:id/quality` path leaves a stale duplicate.
14. **`/api/kvic/dashboard` hardcodes `avgNMRPurityScore: '99.3%'` and
    `avgMoistureContent: '17.4%'`** rather than computing from `qualityTest`, and its
    `totalHoneyHarvestedKg` sums `quantityKg` — which `batches.js` never writes, so those
    batches count as 0 kg. `ruralRevenueGeneratedInr` inherits the error and can report ₹0.
15. **₹450/kg is hardcoded in two places** (`system.js`, `ai.js`) with no shared constant.
16. **Alert threshold inconsistency:** acoustic swarm risk is `> 400` in `hives.js`,
    `> 420` in `ai.js`, documented as `450` in `seedData.js` comments.
17. **`merkleRoot` is a single-leaf SHA-256 digest**, not a Merkle root. Either implement a
    real Merkle tree or rename the field to `contentHash` — labelling it `merkleRoot` invites
    false assurance.
18. **Inconsistent block `type` casing** — PascalCase vs SCREAMING_SNAKE
    ([§7](#7-blockchain-engine)).
19. **`POST /api/harvest-event` claims geo-fence PASS unconditionally** while every beekeeper's
    `geoZone` sits unused. This is the platform's core integrity claim, currently asserted
    rather than verified.
20. **`seedData.js:259` contains a Chinese character**: `'自动 Filling & Capping Machine'`
    should be `'Automatic …'`.
21. **No error handler.** A throw inside a handler returns Express's default HTML 500 page,
    breaking the `{ ok: false }` contract that every frontend `catch` and `.then` assumes.

### Dead code

22. **`POST /api/batches/:id/quality`** — no frontend caller, no threshold evaluation. Delete
    once the frontend's dead `handleQualitySubmit` is removed.
23. **Seven installed-unused packages:** `mongoose`, `joi`, `jsonwebtoken`, `bcryptjs`,
    `multer`, `moment`, `axios`, `dotenv`.
24. **`body-parser` is required but not a declared dependency** — add it directly or use
    `express.json()`.
25. **The `/health` endpoint's `ok` key** is missing, inconsistent with all 33 other responses.
26. **Two missing `error` keys** — `batches.js` verify/quality/process/package return bare
    `{ ok: false }` where every other route includes a message.
27. **`multer` is installed but there is no upload route** — the app has no way to attach a
    lab certificate, hive photo, or QR label image to a record.

### Testing

28. **Zero tests.** `package.json` wires `jest` + `supertest` and `server.js` exports the
    server instance specifically so supertest can drive it — the harness is fully prepared
    and simply unused. Highest-value first tests:
    - The FSSAI gate: each of the 4 rules in isolation, plus the all-pass and all-fail cases.
    - Batch lifecycle: each transition writes the expected status and the expected block.
    - Chain integrity: `block[i].previousHash === block[i-1].hash` after a mutation sequence.
    - `provenance/:batchId` fallback behaviour on a sparse batch.
    - `POST /api/auth/login` for all 4 email cases including the rejection path.
    Remember `store.js` seeds on import, so every suite starts from the seeded state — reset
    the module registry between tests.

### Suggested order of work

1. Add real auth (JWT + bcrypt) and role guards — items 1–4, 6.
2. Wire `mongoose` to a real database — item 7. Nothing else survives a restart until this is done.
3. Normalise the batch schema and collapse the duplicate endpoints — items 8–11, 13.
4. Implement geo-fence validation at harvest — item 19. Highest integrity value per line.
5. Make `/api/quality-test` read `qualityStandards` instead of hardcoded thresholds — item 12.
6. Add the missing Express error handler and normalize error shapes — items 21, 26.
7. Write the test suite — item 28.
8. Cleanup: dead routes, unused deps, CJK artifact, ngrok env var — items 22–24, 20, 5.

---

## See also

- [`../frontend/frontend.md`](../frontend/frontend.md) — full frontend architecture
- [`../README.md`](../README.md) — project overview and quick start
