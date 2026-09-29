const { Router } = require('express');
const { batches } = require('../store');
const { addBlockToChain } = require('../blockchain');
const router = Router();

// Processing & Packaging Step
router.post('/', (req, res) => {
  const { batchId, step, notes } = req.body;
  const batch = batches[batchId];
  if (!batch) return res.status(404).json({ ok: false, error: 'Batch not found' });

  const newStep = {
    step: step || 'Processing / Filtration',
    date: new Date().toISOString().split('T')[0],
    notes: notes || 'Raw unheated processing compliant with KVIC purity norms'
  };
  batch.processingSteps = batch.processingSteps || [];
  batch.processingSteps.push(newStep);

  if (step?.toLowerCase().includes('packag') || step?.toLowerCase().includes('bottl')) {
    if (batch.status === 'CERTIFIED') batch.status = 'PACKAGED';
  }

  const block = addBlockToChain('ProcessingStep', { batchId, step: newStep.step });
  res.json({ ok: true, batch, block });
});

module.exports = router;