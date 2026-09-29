const { Router } = require('express');
const { hives } = require('../store');
const { addBlockToChain } = require('../blockchain');
const { evaluateAlerts, simulateTelemetry } = require('../telemetry');
const router = Router();

// Hive registrations are NOT live until a signed-in user reviews them.
function isApproved(hive) {
  return !hive.approvalStatus || hive.approvalStatus === 'APPROVED';
}

const KNOWN_ROLES = ['BEEKEEPER', 'PROCESSOR', 'TESTER', 'MANUFACTURER'];

function reviewerOnly(req, res, next) {
  const role = req.get('x-user-role') || (req.body && req.body.role);
  if (!KNOWN_ROLES.includes(role)) {
    return res.status(403).json({ ok: false, error: 'Sign in to review hive registrations' });
  }
  next();
}

function nextHiveId() {
  let n = Object.keys(hives).length + 1;
  while (hives[`HIVE-BOX-${String(n).padStart(2, '0')}`]) n += 1;
  return { hiveId: `HIVE-BOX-${String(n).padStart(2, '0')}`, n };
}

router.get('/', (req, res) => {
  res.json({ ok: true, hives: Object.values(hives) });
});

router.get('/pending', (req, res) => {
  const pending = Object.values(hives).filter(h => h.approvalStatus === 'PENDING');
  res.json({ ok: true, hives: pending });
});

router.get('/:hiveId', (req, res) => {
  const hive = hives[req.params.hiveId];
  if (!hive) return res.status(404).json({ ok: false, error: 'Hive not found' });
  res.json({ ok: true, hive });
});

// 1. Beekeeper registers a smart hive -> waits for review
router.post('/', (req, res) => {
  const { location, beekeeperName, floralSource, cluster, coordinates } = req.body;
  const { hiveId, n: hiveCount } = nextHiveId();
  const requestedAt = new Date().toISOString();

  const newHive = {
    hiveId,
    boxNumber: `KVIC-BOX-${8800 + hiveCount}`,
    beekeeperId: null,
    beekeeperName: beekeeperName || 'Unassigned',
    location: location || 'Location TBD',
    coordinates: coordinates || null,
    floralSource: floralSource || 'Mixed Flora',
    installationDate: requestedAt.split('T')[0],
    queenStatus: 'Awaiting first inspection',
    colonyHealth: 'PENDING',
    weather: 'Awaiting review',
    powerSource: 'Solar-assisted',
    firmwareVersion: 'v2.3.1',
    calibrationDue: 'Not scheduled',
    healthScore: 0,
    swarmRisk: 'Low',
    diseaseRisk: { varroa: 0, foulbrood: 0, nosema: 0 },
    yieldForecastKg: 0,
    alertSeverity: 'none',
    cluster: cluster || (location ? location.split(',').pop().trim() : 'New Cluster'),
    gps: coordinates || null,
    beekeeper: beekeeperName || 'Unassigned',
    approvalStatus: 'PENDING',
    approval: { requestedAt, reviewedAt: null, reviewedBy: null, note: null },
    telemetry: null,
    alerts: []
  };

  hives[hiveId] = newHive;
  addBlockToChain('HiveRegistrationRequested', {
    hiveId,
    location: newHive.location,
    beekeeper: newHive.beekeeperName,
    requestedAt
  });
  res.json({ ok: true, hive: newHive });
});

// 2. Reviewer approves -> hive goes live with a realistic telemetry baseline
router.post('/:hiveId/approve', reviewerOnly, (req, res) => {
  const hive = hives[req.params.hiveId];
  if (!hive) return res.status(404).json({ ok: false, error: 'Hive not found' });
  if (isApproved(hive)) return res.status(400).json({ ok: false, error: 'Hive is already approved' });

  const now = new Date().toISOString();
  const baseline = {
    internalTemp: Math.round((34 + Math.random() * 1.4) * 10) / 10,
    humidity: Math.round((52 + Math.random() * 14) * 10) / 10,
    weightKg: Math.round((18 + Math.random() * 16) * 10) / 10,
    weightDelta24h: `+${Math.round(Math.random() * 20) / 10} kg`,
    acousticFreqHz: 205 + Math.round(Math.random() * 75),
    co2Ppm: 430 + Math.round(Math.random() * 420),
    batteryLevel: 84 + Math.round(Math.random() * 15),
    ambientTemp: Math.round((24 + Math.random() * 9) * 10) / 10,
    lastUpdated: now
  };

  hive.telemetry = baseline;
  hive.approvalStatus = 'APPROVED';
  hive.approval = {
    ...(hive.approval || {}),
    requestedAt: (hive.approval && hive.approval.requestedAt) || now,
    reviewedAt: now,
    reviewedBy: (req.body && req.body.reviewer) || 'Reviewer',
    note: (req.body && req.body.note) || 'Approved'
  };
  hive.colonyHealth = 'EXCELLENT';
  hive.queenStatus = 'Active (Mated)';
  hive.weather = 'Live telemetry stream connected';
  hive.healthScore = 78 + Math.round(Math.random() * 17);
  hive.yieldForecastKg = Math.round((22 + Math.random() * 18) * 10) / 10;
  hive.swarmRisk = 'Low';
  hive.diseaseRisk = { varroa: 3 + Math.round(Math.random() * 9), foulbrood: 1 + Math.round(Math.random() * 5), nosema: 1 + Math.round(Math.random() * 6) };
  hive.alertSeverity = 'none';

  simulateTelemetry(hive);
  addBlockToChain('HiveApproved', {
    hiveId: hive.hiveId,
    location: hive.location,
    reviewedBy: hive.approval.reviewedBy,
    reviewedAt: now
  });

  res.json({ ok: true, hive });
});

// 3. Reviewer rejects -> hive stays out of the monitoring network
router.post('/:hiveId/reject', reviewerOnly, (req, res) => {
  const hive = hives[req.params.hiveId];
  if (!hive) return res.status(404).json({ ok: false, error: 'Hive not found' });
  if (hive.approvalStatus === 'REJECTED') return res.status(400).json({ ok: false, error: 'Hive is already rejected' });

  const now = new Date().toISOString();
  hive.approvalStatus = 'REJECTED';
  hive.approval = {
    ...(hive.approval || {}),
    requestedAt: (hive.approval && hive.approval.requestedAt) || now,
    reviewedAt: now,
    reviewedBy: (req.body && req.body.reviewer) || 'Reviewer',
    note: (req.body && req.body.note) || 'Rejected by reviewer'
  };
  hive.colonyHealth = 'REJECTED';
  hive.telemetry = null;

  addBlockToChain('HiveRegistrationRejected', {
    hiveId: hive.hiveId,
    reviewedBy: hive.approval.reviewedBy,
    reviewedAt: now
  });

  res.json({ ok: true, hive });
});

router.post('/:hiveId/telemetry', (req, res) => {
  const hive = hives[req.params.hiveId];
  if (!hive) return res.status(404).json({ ok: false, error: 'Hive not found' });
  if (!hive.telemetry) hive.telemetry = {};
  if (!isApproved(hive)) return res.status(403).json({ ok: false, error: 'Hive is awaiting review' });

  const { internalTemp, humidity, weightKg, acousticFreqHz, co2Ppm } = req.body;

  if (internalTemp !== undefined) hive.telemetry.internalTemp = parseFloat(internalTemp);
  if (humidity !== undefined) hive.telemetry.humidity = parseFloat(humidity);
  if (weightKg !== undefined) hive.telemetry.weightKg = parseFloat(weightKg);
  if (acousticFreqHz !== undefined) hive.telemetry.acousticFreqHz = parseFloat(acousticFreqHz);
  if (co2Ppm !== undefined) hive.telemetry.co2Ppm = parseFloat(co2Ppm);
  hive.telemetry.lastUpdated = new Date().toISOString();

  // Evaluate dynamic smart alerts
  const alerts = evaluateAlerts(hive);
  hive.alerts = alerts;

  res.json({ ok: true, hive });
});

module.exports = router;
