const { Router } = require('express');
const { batches, hives, beekeepers, processingFacility } = require('../store');
const { blockchain } = require('../blockchain');
const router = Router();

// 1. Health
router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    system: 'Honey Chain - KVIC Honey Mission Blockchain & IoT Platform',
    blocksCount: blockchain.length,
    activeHives: Object.keys(hives).length,
    batchesCount: Object.keys(batches).length,
    timestamp: new Date().toISOString()
  });
});

// 11. Blockchain Ledger Explorer
router.get('/ledger', (req, res) => {
  res.json({
    ok: true,
    chainLength: blockchain.length,
    blockchain
  });
});

// 12. KVIC Cluster Aggregated Analytics
router.get('/kvic/dashboard', (req, res) => {
  const allBatches = Object.values(batches);
  const totalHarvestKg = allBatches.reduce((sum, b) => sum + (b.quantityKg || 0), 0);
  const certifiedCount = allBatches.filter(b => b.status === 'CERTIFIED' || b.status === 'QA_APPROVED' || b.status === 'PACKAGED').length;

  res.json({
    ok: true,
    stats: {
      totalBeekeepers: Object.keys(beekeepers).length,
      totalBoxesDistributed: Object.values(beekeepers).reduce((sum, bk) => sum + (bk.boxesAllocated || 0), 0),
      activeSmartHives: Object.keys(hives).length,
      totalHoneyHarvestedKg: totalHarvestKg,
      certifiedPurityBatches: certifiedCount,
      adulterationFailures: allBatches.filter(b => b.status === 'REJECTED').length,
      avgNMRPurityScore: '99.3%',
      avgMoistureContent: '17.4%',
      ruralRevenueGeneratedInr: Math.round(totalHarvestKg * 450)
    }
  });
});

// Inventory
router.get('/inventory', (req, res) => {
  const inventory = Object.values(batches)
    .filter(b => ['PACKAGED', 'DISPATCHED'].includes(b.status))
    .map(b => ({
      id: b.id,
      hiveId: b.hiveId,
      honeyType: b.honeyType,
      quantity: b.quantity,
      status: b.status,
      processing: b.processing || null,
      production: b.production || null,
      productionBatchId: b.productionBatchId || null,
      packaging: b.packaging || null,
      dispatch: b.dispatch || null,
      beekeeper: b.beekeeper || 'Unknown',
      createdAt: b.transactions?.[0]?.date || null,
    }))
    .sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
  res.json({ ok: true, inventory });
});

// Facility
router.get('/facility', (req, res) => {
  processingFacility.blockchainNode.lastSync = new Date().toISOString();
  processingFacility.blockchainNode.blocksAnchored = blockchain.length;
  res.json({ ok: true, facility: processingFacility });
});

module.exports = router;