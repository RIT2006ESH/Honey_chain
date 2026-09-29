const { Router } = require('express');
const { batches } = require('../store');
const { addBlockToChain } = require('../blockchain');
const router = Router();

// Create Batch (Beekeeper)
router.post('/', (req, res) => {
  const { hiveId, honeyType, extractionMethod, quantity, harvestDate, moisture, floralSource, notes, beekeeper } = req.body;
  const batchId = `HC-MH-2026-00${Math.floor(100 + Math.random() * 900)}`;

  batches[batchId] = {
    id: batchId,
    hiveId,
    beekeeper: beekeeper || 'KVIC-BK-101',
    honeyType,
    extractionMethod: extractionMethod || 'Centrifugal Cold Extraction',
    quantity,
    moisture: moisture || null,
    floralSource: floralSource || '',
    notes: notes || '',
    harvestDate: harvestDate || new Date().toISOString(),
    status: 'HARVEST_CREATED',
    transactions: [
      { date: new Date().toISOString(), event: 'Harvest created', actor: beekeeper || 'Beekeeper' }
    ]
  };

  addBlockToChain('HARVEST_CREATED', batches[batchId]);
  res.json({ ok: true, batch: batches[batchId] });
});

// Get all batches
router.get('/', (req, res) => {
  res.json({ ok: true, batches: Object.values(batches) });
});

// Batch statuses that are still with the beekeeper (not yet processed)
const PRE_PROCESSING_STATUSES = ['HARVEST_CREATED', 'HARVEST_VERIFIED', 'QUALITY_VERIFIED', 'CERTIFIED'];

// Send harvested honey to the processor (Beekeeper)
router.post('/:id/handoff', (req, res) => {
  const batch = batches[req.params.id];
  if (!batch) return res.status(404).json({ ok: false, error: 'Batch not found' });
  if (batch.handoff) return res.status(400).json({ ok: false, error: 'Batch has already been sent to the processor' });
  if (!PRE_PROCESSING_STATUSES.includes(batch.status)) {
    return res.status(400).json({ ok: false, error: 'Batch is already with the processor' });
  }

  const sentAt = new Date().toISOString();
  const sender = (req.body && req.body.sender) || batch.beekeeper || 'Beekeeper';
  const receiver = (req.body && req.body.receiver) || 'Satara Processing Unit';
  const note = (req.body && req.body.note) || `Raw honey consignment from ${batch.hiveId || 'hive'} (${batch.quantity || 0} kg)`;

  batch.handoff = { sentAt, sender, receiver, status: 'IN_TRANSIT', note };
  batch.transactions.push({ date: sentAt, event: 'Sent to processor', actor: 'Beekeeper' });
  addBlockToChain('HANDOFF_TO_PROCESSOR', {
    batchId: batch.id,
    hiveId: batch.hiveId,
    sender,
    receiver,
    quantity: batch.quantity,
    sentAt
  });

  res.json({ ok: true, batch });
});

// Processor accepts the consignment sent by a beekeeper
router.post('/:id/receive', (req, res) => {
  const batch = batches[req.params.id];
  if (!batch) return res.status(404).json({ ok: false, error: 'Batch not found' });
  if (!batch.handoff) return res.status(400).json({ ok: false, error: 'No consignment from a beekeeper is recorded for this batch' });
  if (batch.received) return res.status(400).json({ ok: false, error: 'Batch has already been received' });

  const receivedAt = new Date().toISOString();
  const receiver = (req.body && req.body.receiver) || 'Satara Processing Unit';
  const acceptedQuantity = (req.body && req.body.acceptedQuantity != null)
    ? parseFloat(req.body.acceptedQuantity)
    : batch.quantity;
  const note = (req.body && req.body.note) || 'Consignment accepted at the processing facility';

  batch.received = { receivedAt, receiver, acceptedQuantity, note };
  batch.transactions.push({ date: receivedAt, event: 'Received by processor', actor: 'Processor' });
  addBlockToChain('RECEIVED_BY_PROCESSOR', {
    batchId: batch.id,
    receiver,
    acceptedQuantity,
    receivedAt
  });

  res.json({ ok: true, batch });
});

// Verify Harvest (Tester)
router.post('/:id/verify', (req, res) => {
  const batch = batches[req.params.id];
  if (!batch) return res.status(404).json({ ok: false });

  batch.status = 'HARVEST_VERIFIED';
  batch.transactions.push({ date: new Date().toISOString(), event: 'Harvest verified', actor: 'Tester' });
  addBlockToChain('HARVEST_VERIFIED', batch);

  res.json({ ok: true, batch });
});

// Submit Quality (Tester)
router.post('/:id/quality', (req, res) => {
  const batch = batches[req.params.id];
  if (!batch) return res.status(404).json({ ok: false });

  batch.status = 'QUALITY_VERIFIED';
  batch.quality = req.body;
  batch.transactions.push({ date: new Date().toISOString(), event: 'Quality test passed', actor: 'Tester' });
  addBlockToChain('QUALITY_VERIFIED', batch);

  res.json({ ok: true, batch });
});

// Process Batch (Processor)
router.post('/:id/process', (req, res) => {
  const batch = batches[req.params.id];
  if (!batch) return res.status(404).json({ ok: false });
  if (batch.handoff && !batch.received) {
    return res.status(400).json({ ok: false, error: 'Receive the beekeeper consignment before processing' });
  }

  // Merge so partial payloads (e.g. { startedAt }) never wipe extraction details
  const now = new Date().toISOString();
  batch.processing = { ...(batch.processing || {}), ...(req.body || {}) };
  const p = batch.processing;

  // Production batch record — created on first process, updated afterwards
  batch.productionBatchId = batch.productionBatchId || `PB-${batch.id}`;
  batch.production = {
    ...(batch.production || {}),
    productionBatchId: batch.productionBatchId,
    createdAt: (batch.production && batch.production.createdAt) || now,
    updatedAt: now,
    location: p.processor || p.center || (batch.production && batch.production.location) || null,
    processedAt: p.processedAt || now,
    inputQuantity: p.inputQuantity != null
      ? p.inputQuantity
      : (p.qtyProcessed != null ? parseFloat(p.qtyProcessed) : batch.quantity),
    outputQuantity: p.outputQuantity != null ? p.outputQuantity : (batch.production && batch.production.outputQuantity) || null,
    filtration: p.filtrationMethod
      ? { method: p.filtrationMethod, settlingHours: p.settlingHours != null ? p.settlingHours : null }
      : (batch.production && batch.production.filtration) || null,
  };

  batch.status = 'PROCESSED';
  batch.transactions.push({ date: now, event: 'Processing completed', actor: 'Processor' });
  addBlockToChain('PROCESSED', batch);

  res.json({ ok: true, batch });
});

// '500g' | '1kg' -> kilograms (null when unparseable)
function weightToKg(w) {
  if (w == null || w === '') return null;
  const s = String(w).toLowerCase().trim();
  const n = parseFloat(s);
  if (Number.isNaN(n)) return null;
  return s.includes('kg') ? n : n / 1000;
}

// Build/refresh the packaging record and keep the production batch in sync
function applyPackaging(batch, body = {}) {
  const { packagedBatchId, jarCount, jarWeight, sealDate, bestBefore, packagingType, location } = body;
  const now = new Date().toISOString();
  const prev = batch.packaging || {};
  const count = jarCount || prev.jarCount || 0;
  const weight = jarWeight || prev.jarWeight || '500g';
  const weightKg = weightToKg(weight);
  const finalQuantityKg = count && weightKg ? Math.round(count * weightKg * 100) / 100 : prev.finalQuantityKg || null;

  batch.packaging = {
    ...prev,
    packagedBatchId: packagedBatchId || prev.packagedBatchId
      || (batch.productionBatchId ? `PKG-${batch.productionBatchId}` : 'PKG-' + batch.id),
    jarCount: count,
    jarWeight: weight,
    finalQuantityKg,
    sealDate: sealDate || prev.sealDate || now,
    packagedAt: prev.packagedAt || now,
    location: location || prev.location || 'Nashik Packing Works',
    bestBefore: bestBefore || prev.bestBefore || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
    packagingType: packagingType || prev.packagingType || 'Glass Jar with Tamper-Evident Seal',
  };
  if (batch.production) {
    batch.production = {
      ...batch.production,
      updatedAt: now,
      packagedBatchId: batch.packaging.packagedBatchId,
      jarCount: batch.packaging.jarCount,
      finalQuantityKg: batch.packaging.finalQuantityKg,
      packagedAt: batch.packaging.packagedAt,
      packagedLocation: batch.packaging.location,
    };
  }
  return now;
}

// Package Batch & Generate QR (Processor)
router.post('/:id/package', async (req, res) => {
  const batch = batches[req.params.id];
  if (!batch) return res.status(404).json({ ok: false });
  if (batch.status !== 'QA_APPROVED') {
    return res.status(400).json({ ok: false, error: 'Batch must be QA-approved by the tester before packaging' });
  }

  batch.status = 'PACKAGED';
  applyPackaging(batch, req.body || {});
  batch.transactions.push({ date: new Date().toISOString(), event: 'Package registered', actor: 'Manufacturer' });
  batch.transactions.push({ date: new Date().toISOString(), event: 'QR generated', actor: 'System' });

  addBlockToChain('PACKAGED', batch);

  res.json({ ok: true, batch });
});

// Dispatch Batch (Processor)
router.post('/:id/dispatch', (req, res) => {
  const batch = batches[req.params.id];
  if (!batch) return res.status(404).json({ ok: false, error: 'Batch not found' });

  const { logisticsPartner, destination, dispatchDate, jarCount, trackingId } = req.body;
  batch.status = 'DISPATCHED';
  batch.dispatch = {
    logisticsPartner: logisticsPartner || 'BlueDart Cold Chain',
    destination: destination || 'Mumbai Retail Hub',
    dispatchDate: dispatchDate || new Date().toISOString(),
    jarCount: jarCount || 0,
    trackingId: trackingId || 'TRK-' + Date.now(),
  };
  batch.transactions.push({ date: new Date().toISOString(), event: 'Dispatched to ' + (logisticsPartner || 'logistics'), actor: 'Manufacturer' });
  addBlockToChain('DISPATCHED', { batchId: batch.id, logisticsPartner, destination, trackingId: batch.dispatch.trackingId });
  res.json({ ok: true, batch });
});

// Packaging endpoint
router.post('/:id/packaging', (req, res) => {
  const batch = batches[req.params.id];
  if (!batch) return res.status(404).json({ ok: false, error: 'Batch not found' });
  if (batch.status !== 'QA_APPROVED') {
    return res.status(400).json({ ok: false, error: 'Batch must be QA-approved by the tester before packaging' });
  }

  batch.status = 'PACKAGED';
  const now = applyPackaging(batch, req.body || {});
  batch.transactions.push({ date: now, event: 'Packaged (' + (batch.packaging.jarCount || 0) + ' jars)', actor: 'Manufacturer' });
  addBlockToChain('PACKAGED', { batchId: batch.id, jarCount: batch.packaging.jarCount, sealDate: batch.packaging.sealDate });
  res.json({ ok: true, batch });
});

module.exports = router;