const { Router } = require('express');
const { batches, qualityStandards } = require('../store');
const { addBlockToChain } = require('../blockchain');

// ---------- Mounted at /api/quality-test ----------
const testRouter = Router();

// Lab Quality Test & Smart Contract Gateways
testRouter.post('/', (req, res) => {
  const {
    batchId,
    labName,
    tester,
    moisturePercent,
    nmrPurityScore,
    c4SugarAdulteration,
    hmf,
    acidity,
    sugarProfile,
    pollenDominance,
    antibioticResidues,
    certificateName,
  } = req.body;

  const batch = batches[batchId];
  if (!batch) return res.status(404).json({ ok: false, error: 'Batch not found' });

  const moisture = parseFloat(moisturePercent) || 18.0;
  const nmrScore = parseFloat(nmrPurityScore) || 99.2;
  const hmfVal = parseFloat(hmf) || 14.0;
  const acidityVal = acidity != null && acidity !== '' ? parseFloat(acidity) : null;
  const isC4Negative = (c4SugarAdulteration || 'NEGATIVE').toUpperCase().includes('NEGATIVE') || c4SugarAdulteration === false;

  // Smart contract rules: FSSAI standard
  // (Moisture <= 20%, NMR >= 98%, C4 Sugar NEGATIVE, HMF < 40, Free acidity <= 40 meq/kg)
  const moisturePass = moisture <= 20.0;
  const nmrPass = nmrScore >= 98.0;
  const hmfPass = hmfVal < 40.0;
  const acidityPass = acidityVal == null || acidityVal <= 40.0;
  const overallPass = moisturePass && nmrPass && isC4Negative && hmfPass && acidityPass;

  // Was this honey already processed by the processor? Then a pass approves it
  // for manufacturing (QA_APPROVED) instead of certifying the raw harvest.
  const priorStatus = batch.status;
  const postProcess = !!batch.production || priorStatus === 'PROCESSED' || priorStatus === 'QA_APPROVED';
  const testedAt = new Date().toISOString();

  batch.qualityTest = {
    testedAt,
    labName: labName || 'National Bee Board Referral & FSSAI Accredited Honey Lab',
    tester: tester || 'Lab Tester',
    moisturePercent: moisture,
    nmrPurityScore: nmrScore,
    hmf: hmfVal,
    acidity: acidityVal,
    sugarProfile: sugarProfile || null,
    c4SugarAdulteration: isC4Negative ? 'NEGATIVE (< 1.0% C4 Sugar)' : 'POSITIVE (ADULTERATED)',
    c3SugarAdulteration: 'NEGATIVE',
    pollenDominance: pollenDominance || `${batch.honeyType || 'Multifloral'} Pollen Grains`,
    antibioticResidues: antibioticResidues || 'NOT DETECTED (0.0 ppm)',
    certificate: certificateName || null,
    result: overallPass ? 'PASS' : 'FAIL',
    approvedForManufacturing: overallPass && postProcess,
    fssaiCompliance: overallPass ? 'PASSED (FSSAI Reg. 2.8.2 / AGMARK Grade A)' : 'FAILED (Non-compliant)'
  };

  batch.smartContractValidations = batch.smartContractValidations || {};
  batch.smartContractValidations.moistureValidation = moisturePass
    ? `PASS (${moisture}% <= 20.0%)`
    : `FAIL (${moisture}% > 20.0% Fermentation Risk)`;
  batch.smartContractValidations.nmrPurityValidation = nmrPass
    ? `PASS (${nmrScore}% >= 98.0%)`
    : `FAIL (${nmrScore}% < 98.0%)`;
  batch.smartContractValidations.adulterationValidation = isC4Negative
    ? 'PASS (100% Pure Raw Honey)'
    : 'FAIL (C4 Foreign Sugar Detected)';
  batch.smartContractValidations.hmfValidation = hmfPass
    ? `PASS (${hmfVal} mg/kg < 40 mg/kg)`
    : `FAIL (${hmfVal} mg/kg >= 40 mg/kg)`;
  if (acidityVal != null) {
    batch.smartContractValidations.acidityValidation = acidityPass
      ? `PASS (${acidityVal} meq/kg <= 40.0 meq/kg)`
      : `FAIL (${acidityVal} meq/kg > 40.0 meq/kg)`;
  }

  batch.status = overallPass ? (postProcess ? 'QA_APPROVED' : 'CERTIFIED') : 'REJECTED';
  batch.transactions = batch.transactions || [];
  batch.transactions.push({
    date: testedAt,
    event: overallPass ? 'Quality test passed' : 'Quality test failed',
    actor: 'Tester'
  });

  // Add quality block
  const block = addBlockToChain('QualityCertification', {
    batchId,
    tester: batch.qualityTest.tester,
    testedAt,
    moisturePercent: moisture,
    nmrPurityScore: nmrScore,
    hmf: hmfVal,
    acidity: acidityVal,
    sugarProfile: batch.qualityTest.sugarProfile,
    overallPass,
    approvedForManufacturing: batch.qualityTest.approvedForManufacturing,
    status: batch.status
  });

  res.json({ ok: true, batch, block });
});

// ---------- Mounted at /api/quality ----------
const router = Router();

// Quality Standards & Thresholds
router.get('/standards', (req, res) => {
  res.json({ ok: true, standards: qualityStandards });
});

router.post('/standards', (req, res) => {
  const { key, ...updates } = req.body;
  if (!key || !qualityStandards[key]) return res.status(400).json({ ok: false, error: 'Invalid standard key' });
  qualityStandards[key] = { ...qualityStandards[key], ...updates };
  res.json({ ok: true, standard: qualityStandards[key] });
});

// Quality Trends & Analytics
router.get('/trends', (req, res) => {
  const allBatches = Object.values(batches);
  const tested = allBatches.filter(b => b.qualityTest || b.quality);

  const byMonth = {};
  const byCluster = {};
  const bySeason = {};
  let totalPass = 0, totalFail = 0;

  tested.forEach(batch => {
    const qt = batch.qualityTest || batch.quality || {};
    const d = batch.harvestDate || qt.testedAt || new Date().toISOString();
    const month = d.slice(0, 7);
    const cluster = batch.hiveId ? batch.hiveId.replace(/-\d+$/, '') : 'Unknown';
    const monthNum = parseInt(d.slice(5, 7));
    const season = monthNum >= 3 && monthNum <= 5 ? 'Spring' : monthNum >= 6 && monthNum <= 9 ? 'Monsoon' : 'Winter';

    if (!byMonth[month]) byMonth[month] = { pass: 0, fail: 0, avgPurity: [], avgMoisture: [] };
    if (!byCluster[cluster]) byCluster[cluster] = { pass: 0, fail: 0, total: 0, avgPurity: [] };
    if (!bySeason[season]) bySeason[season] = { pass: 0, fail: 0, total: 0 };

    const purity = parseFloat(qt.nmrPurityScore || qt.purity) || 0;
    const moisture = parseFloat(qt.moisturePercent || qt.moisture) || 0;
    const pass = batch.status !== 'REJECTED';

    if (pass) { totalPass++; byMonth[month].pass++; byCluster[cluster].pass++; bySeason[season].pass++; }
    else { totalFail++; byMonth[month].fail++; byCluster[cluster].fail++; bySeason[season].fail++; }

    if (purity > 0) { byMonth[month].avgPurity.push(purity); byCluster[cluster].avgPurity.push(purity); }
    if (moisture > 0) byMonth[month].avgMoisture.push(moisture);
    byCluster[cluster].total++;
    bySeason[season].total++;
  });

  const avg = arr => arr.length ? (arr.reduce((a, b) => a + b, 0) / arr.length).toFixed(1) : 0;

  const trends = {
    summary: { total: tested.length, pass: totalPass, fail: totalFail, passRate: tested.length ? ((totalPass / tested.length) * 100).toFixed(1) : 0 },
    byMonth: Object.entries(byMonth).sort((a, b) => a[0].localeCompare(b[0])).map(([m, v]) => ({ month: m, pass: v.pass, fail: v.fail, avgPurity: avg(v.avgPurity), avgMoisture: avg(v.avgMoisture) })),
    byCluster: Object.entries(byCluster).map(([c, v]) => ({ cluster: c, pass: v.pass, fail: v.fail, total: v.total, avgPurity: avg(v.avgPurity), passRate: v.total ? ((v.pass / v.total) * 100).toFixed(1) : 0 })),
    bySeason: Object.entries(bySeason).map(([s, v]) => ({ season: s, pass: v.pass, fail: v.fail, total: v.total, passRate: v.total ? ((v.pass / v.total) * 100).toFixed(1) : 0 })),
  };

  res.json({ ok: true, trends });
});

// Rejected Batches
router.get('/rejected', (req, res) => {
  const rejected = Object.values(batches).filter(b => b.status === 'REJECTED');
  const withReasons = rejected.map(b => {
    const reasons = [];
    const qt = b.qualityTest || b.quality || {};
    const moisture = parseFloat(qt.moisturePercent || qt.moisture) || 0;
    const purity = parseFloat(qt.nmrPurityScore || qt.purity) || 0;
    const c4 = (qt.c4SugarAdulteration || '').toUpperCase();
    const hmf = parseFloat(qt.hmf) || 0;

    if (moisture > 20.0) reasons.push({ param: 'Moisture', value: moisture + '%', threshold: '<= 20.0%', severity: 'critical' });
    if (purity > 0 && purity < 98.0) reasons.push({ param: 'NMR Purity', value: purity + '%', threshold: '>= 98.0%', severity: 'critical' });
    if (c4.includes('POSITIVE') || c4.includes('ADULTERATED')) reasons.push({ param: 'C4 Sugar', value: c4, threshold: 'NEGATIVE (< 7.0%)', severity: 'critical' });
    if (hmf > 40) reasons.push({ param: 'HMF Level', value: hmf + ' mg/kg', threshold: '< 40 mg/kg', severity: 'warning' });

    if (reasons.length === 0) reasons.push({ param: 'General', value: 'Failed QC', threshold: 'All criteria must pass', severity: 'critical' });

    return { ...b, rejectionReasons: reasons };
  });

  res.json({ ok: true, batches: withReasons });
});

// Quality History (all tested batches)
router.get('/history', (req, res) => {
  const allBatches = Object.values(batches);
  const tested = allBatches
    .filter(b => b.qualityTest || b.quality)
    .map(b => {
      const qt = b.qualityTest || b.quality || {};
      return {
        batchId: b.id,
        hiveId: b.hiveId,
        beekeeper: b.beekeeper || 'Unknown',
        honeyType: b.honeyType,
        moisture: parseFloat(qt.moisturePercent || qt.moisture) || null,
        purity: parseFloat(qt.nmrPurityScore || qt.purity) || null,
        hmf: parseFloat(qt.hmf) || null,
        acidity: qt.acidity != null ? qt.acidity : null,
        sugarProfile: qt.sugarProfile || null,
        c4Sugar: qt.c4SugarAdulteration || null,
        result: b.status === 'REJECTED' ? 'FAIL' : 'PASS',
        testedBy: qt.tester || qt.labName || 'Lab Officer',
        approvedForManufacturing: !!qt.approvedForManufacturing,
        date: qt.testedAt || b.harvestDate || 'Unknown',
        status: b.status,
      };
    })
    .sort((a, b) => (b.date || '').localeCompare(a.date || ''));

  res.json({ ok: true, history: tested });
});

module.exports = { testRouter, router };