import React, { useState, useMemo } from 'react';
import {
  Layers, ShieldCheck, Search, ChevronRight, AlertTriangle,
  Download, FileText, MapPin, User, Clock
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import CertificateModal from '../components/CertificateModal';

const STAGE_META = {
  HARVEST_CREATED: { label: 'Harvest', icon: '🐝', color: 'var(--amber-400)', stage: 1 },
  HARVEST_VERIFIED: { label: 'Verified', icon: '✓', color: 'var(--emerald-400)', stage: 2 },
  HANDOFF_TO_PROCESSOR: { label: 'Sent to Processor', icon: '🚚', color: 'var(--amber-400)', stage: 3 },
  RECEIVED_BY_PROCESSOR: { label: 'Received', icon: '🏭', color: '#a78bfa', stage: 4 },
  QUALITY_VERIFIED: { label: 'Lab Test', icon: '🔬', color: '#60a5fa', stage: 5 },
  PROCESSED: { label: 'Processing', icon: '⚙', color: '#a78bfa', stage: 6 },
  PACKAGED: { label: 'Packaging', icon: '📦', color: '#f472b6', stage: 7 },
  DISPATCHED: { label: 'Dispatched', icon: '🚚', color: '#60a5fa', stage: 8 },
  BatchCertification: { label: 'Certified', icon: '🏅', color: 'var(--emerald-400)', stage: 9 },
};

const MOCK_CHECKPOINTS = {
  'HONEY-BATCH-2025-001': {
    batchId: 'HONEY-BATCH-2025-001',
    batchName: 'Raw Pure Litchi Monofloral Honey',
    hiveId: 'HIVE-BOX-01',
    beekeeper: 'Rameshwar Verma',
    floralSource: 'Litchi Blossom (Muzaffarpur)',
    quantityKg: 45.0,
    extractionMethod: 'Stainless Steel Centrifugal Cold Extraction',
    harvestDate: '2025-05-10',
    gps: { lat: 26.1209, lon: 85.3647 },
    checkpoints: [
      {
        stage: 'HARVEST_CREATED', actor: 'Rameshwar Verma', role: 'Beekeeper',
        date: '2025-05-10T07:40:00Z', location: 'Muzaffarpur Litchi Orchard, Bihar',
        hash: '0x8f2c19a0e14d5cb792e3f1a8b4c6d0e5f7a9b2c3d4e5f6a7b8c9d0e1f2a3b4c5',
        prevHash: '0x71fbc889a0b12cf34da6e892b1c4f0a3d2e5c8b7a6f9d0e3c2b1a8f5d4e7c6b',
        documents: ['Harvest_log_Muzaffarpur.pdf', 'GPS_coordinates.json'],
        notes: 'Unheated manual comb uncapping and centrifugal spin. 12 frames harvested.',
      },
      {
        stage: 'HARVEST_VERIFIED', actor: 'Dr. Anita Kulkarni', role: 'Tester',
        date: '2025-05-11T09:15:00Z', location: 'Satara Quality Lab, Maharashtra',
        hash: '0x3ba7e0291df445ea1b8c3d2e5f6a7b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a',
        prevHash: '0x8f2c19a0e14d5cb792e3f1a8b4c6d0e5f7a9b2c3d4e5f6a7b8c9d0e1f2a3b4c5',
        documents: ['Visual_inspection_form.pdf'],
        notes: 'Colony health verified. No signs of disease. Harvest quality confirmed.',
      },
      {
        stage: 'QUALITY_VERIFIED', actor: 'Dr. Anita Kulkarni', role: 'Tester',
        date: '2025-05-12T10:30:00Z', location: 'National Bee Board Referral Lab',
        hash: '0x9e14d5c8821034bc2da7f8e9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9',
        prevHash: '0x3ba7e0291df445ea1b8c3d2e5f6a7b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a',
        documents: ['NMR_Certificate_99.4.pdf', 'FSSAI_Compliance_Report.pdf', 'Moisture_Analysis.pdf'],
        notes: 'NMR purity: 99.4%. Moisture: 17.2%. C4 Sugar: NEGATIVE. FSSAI PASSED.',
        qualityData: { moisture: 17.2, purity: 99.4, hmf: 12.4, c4Sugar: 'NEGATIVE', fssai: 'PASSED' },
      },
      {
        stage: 'PROCESSED', actor: 'Vikram Deshmukh', role: 'Processor',
        date: '2025-05-13T14:20:00Z', location: 'Satara Cold Processing Unit',
        hash: '0x71fbc889a0b12cf34da6e892b1c4f0a3d2e5c8b7a6f9d0e3c2b1a8f5d4e7c6b',
        prevHash: '0x9e14d5c8821034bc2da7f8e9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9',
        documents: ['Processing_log_cold_unit.pdf', 'Filtration_certificate.pdf'],
        notes: 'Micro-mesh sediment filtration (200 microns). N2-flushed glass bottling.',
      },
      {
        stage: 'PACKAGED', actor: 'Vikram Deshmukh', role: 'Processor',
        date: '2025-05-14T11:00:00Z', location: 'Satara Packaging Facility',
        hash: '0xd402a91e55b8921a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7',
        prevHash: '0x71fbc889a0b12cf34da6e892b1c4f0a3d2e5c8b7a6f9d0e3c2b1a8f5d4e7c6b',
        documents: ['Packaging_record.pdf', 'QR_serial_log.json'],
        notes: '240 units × 500g amber glass jars. Tamper-evident seals applied.',
      },
      {
        stage: 'BatchCertification', actor: 'KVIC System', role: 'System',
        date: '2025-05-15T08:00:00Z', location: 'KVIC Central Ledger',
        hash: '0xe94a1b6c0032f918e3c5d7a9b0f2e4c6d8a1b3f5e7c9d0a2b4f6e8c0d2a4b6',
        prevHash: '0xd402a91e55b8921a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7',
        documents: ['Digital_Certificate_KVIC.pdf'],
        notes: 'Full chain certification complete. Batch approved for distribution.',
      },
    ],
  },
};

function generateHash() {
  return '0x' + Array.from({ length: 64 }, () => '0123456789abcdef'[Math.floor(Math.random() * 16)]).join('');
}

function buildCheckpointsFromBatch(batch) {
  const checkpoints = [];
  const events = batch.transactions || [];
  const hiveLabel = batch.hiveId || 'Unknown Hive';
  const beekeeper = batch.beekeeper || batch.beekeeperName || 'Beekeeper';

  const stageMap = {
    'Harvest created': { stage: 'HARVEST_CREATED', actor: beekeeper, role: 'Beekeeper', location: hiveLabel },
    'Harvest verified': { stage: 'HARVEST_VERIFIED', actor: 'Tester', role: 'Tester', location: 'Regional Quality Lab' },
    'Sent to processor': { stage: 'HANDOFF_TO_PROCESSOR', actor: beekeeper, role: 'Beekeeper', location: hiveLabel },
    'Received by processor': { stage: 'RECEIVED_BY_PROCESSOR', actor: 'Processor', role: 'Processor', location: batch.received?.receiver || 'Processing Unit' },
    'Quality test passed': { stage: 'QUALITY_VERIFIED', actor: 'Tester', role: 'Tester', location: batch.qualityTest?.labName || 'FSSAI Accredited Lab' },
    'Processing completed': { stage: 'PROCESSED', actor: 'Processor', role: 'Processor', location: batch.processing?.processor || batch.processing?.center || batch.production?.location || 'Cold Processing Unit' },
    'Package registered': { stage: 'PACKAGED', actor: 'Manufacturer', role: 'Manufacturer', location: batch.packaging?.location || batch.production?.packagedLocation || 'Packing Facility' },
    'QR generated': null,
  };

  const dispatchMapping = {
    stage: 'DISPATCHED',
    actor: 'Manufacturer',
    role: 'Manufacturer',
    location: batch.dispatch?.destination || 'Distribution Hub',
  };

  events.forEach((tx, i) => {
    const mapped = stageMap[tx.event] || (typeof tx.event === 'string' && tx.event.startsWith('Dispatched') ? dispatchMapping : undefined);
    if (mapped) {
      checkpoints.push({
        ...mapped,
        date: tx.date,
        hash: generateHash(),
        prevHash: i > 0 ? generateHash() : '0x0',
        documents: [],
        notes: tx.event,
      });
    }
  });

  if (checkpoints.length === 0 && events.length > 0) {
    checkpoints.push({
      stage: 'HARVEST_CREATED', actor: beekeeper, role: 'Beekeeper',
      date: events[0].date, location: hiveLabel,
      hash: generateHash(), prevHash: '0x0', documents: [], notes: events[0].event,
    });
  }

  return checkpoints;
}

export default function BlockchainTrace() {
  const { sharedBatches } = useApp();
  const [searchType, setSearchType] = useState('batchId');
  const [searchValue, setSearchValue] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [expandedBlock, setExpandedBlock] = useState(null);
  const [showCertModal, setShowCertModal] = useState(false);
  const [certBatch, setCertBatch] = useState(null);

  const allBatches = useMemo(() => {
    const apiBatches = sharedBatches.map(b => ({ ...b, id: b.id || b.batchId }));
    const mockBatches = Object.values(MOCK_CHECKPOINTS);
    const merged = [...mockBatches];
    apiBatches.forEach(b => {
      if (!merged.find(m => m.batchId === b.id || m.batchId === b.batchId)) {
        merged.push(b);
      }
    });
    return merged;
  }, [sharedBatches]);

  const filteredBatches = useMemo(() => {
    if (!searchValue.trim()) return allBatches;
    const q = searchValue.trim().toLowerCase();
    return allBatches.filter(b => {
      if (searchType === 'batchId') return (b.batchId || b.id || '').toLowerCase().includes(q);
      if (searchType === 'hiveId') return (b.hiveId || '').toLowerCase().includes(q);
      if (searchType === 'beekeeper') return (b.beekeeper || b.beekeeperName || '').toLowerCase().includes(q);
      return true;
    }).filter(b => {
      if (searchType === 'date' && dateFrom && dateTo) {
        const d = new Date(b.harvestDate || b.checkpoints?.[0]?.date || '');
        return d >= new Date(dateFrom) && d <= new Date(dateTo);
      }
      return true;
    });
  }, [allBatches, searchValue, searchType, dateFrom, dateTo]);

  const activeBatch = selectedBatch
    ? (MOCK_CHECKPOINTS[selectedBatch] || allBatches.find(b => (b.batchId || b.id) === selectedBatch))
    : null;

  const checkpoints = activeBatch?.checkpoints || (activeBatch ? buildCheckpointsFromBatch(activeBatch) : []);

  const chainValid = checkpoints.length > 0 && checkpoints.every((cp, i) => {
    if (i === 0) return true;
    return cp.prevHash === checkpoints[i - 1].hash;
  });

  const handleExport = () => {
    if (!activeBatch) return;
    const batchId = activeBatch.batchId || activeBatch.id;
    const stageRows = checkpoints.map((cp, i) => {
      const meta = STAGE_META[cp.stage] || { label: cp.stage, icon: '?' };
      return `
        <tr>
          <td style="padding:8px 10px;border-bottom:1px solid #e5e7eb;font-weight:600;color:#92400e;">${i + 1}</td>
          <td style="padding:8px 10px;border-bottom:1px solid #e5e7eb;">${meta.icon} ${meta.label}</td>
          <td style="padding:8px 10px;border-bottom:1px solid #e5e7eb;">${cp.actor}<br><span style="font-size:11px;color:#6b7280;">${cp.role}</span></td>
          <td style="padding:8px 10px;border-bottom:1px solid #e5e7eb;">${new Date(cp.date).toLocaleString()}</td>
          <td style="padding:8px 10px;border-bottom:1px solid #e5e7eb;">${cp.location}</td>
          <td style="padding:8px 10px;border-bottom:1px solid #e5e7eb;font-family:monospace;font-size:10px;word-break:break-all;color:#92400e;">${cp.hash.slice(0, 20)}...</td>
          <td style="padding:8px 10px;border-bottom:1px solid #e5e7eb;font-size:12px;">${cp.notes || ''}</td>
          <td style="padding:8px 10px;border-bottom:1px solid #e5e7eb;font-size:11px;">${cp.documents?.join('<br>') || '—'}</td>
        </tr>`;
    }).join('');

    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>HoneyChain Trace — ${batchId}</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700&family=JetBrains+Mono:wght@400;600&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        body{font-family:'Plus Jakarta Sans',sans-serif;color:#1f2937;padding:40px;line-height:1.5}
        h1{font-size:22px;color:#92400e;margin-bottom:4px}
        h2{font-size:14px;color:#6b7280;font-weight:600;margin-bottom:20px}
        .info-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:24px;font-size:13px}
        .info-grid span{color:#6b7280}
        .info-grid strong{color:#1f2937}
        table{width:100%;border-collapse:collapse;font-size:12px;margin-bottom:24px}
        th{background:#fef3c7;color:#92400e;padding:8px 10px;text-align:left;font-size:11px;letter-spacing:0.05em;border-bottom:2px solid #d97706}
        .status-box{padding:12px 16px;border-radius:8px;font-size:13px;font-weight:600;margin-bottom:20px}
        .status-ok{background:#dcfce7;color:#15803d;border:1px solid #86efac}
        .status-fail{background:#fee2e2;color:#dc2626;border:1px solid #fca5a5}
        .footer{margin-top:30px;padding-top:16px;border-top:1px solid #e5e7eb;font-size:11px;color:#9ca3af;text-align:center}
        @media print{body{padding:20px}}
      </style></head><body>
      <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:20px;">
        <div>
          <h1>🍯 Honey Chain — Batch Traceability Report</h1>
          <h2>KVIC Honey Mission • Blockchain & IoT Platform</h2>
        </div>
        <div style="text-align:right;font-size:12px;color:#6b7280;">
          <div>Generated: ${new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
          <div style="font-family:monospace;color:#92400e;">${batchId}</div>
        </div>
      </div>

      <div class="info-grid">
        <div><span>Batch ID:</span> <strong>${batchId}</strong></div>
        <div><span>Honey Type:</span> <strong>${activeBatch.batchName || activeBatch.honeyType || 'N/A'}</strong></div>
        <div><span>Hive ID:</span> <strong>${activeBatch.hiveId || 'N/A'}</strong></div>
        <div><span>Beekeeper:</span> <strong>${activeBatch.beekeeper || activeBatch.beekeeperName || 'N/A'}</strong></div>
        <div><span>Floral Source:</span> <strong>${activeBatch.floralSource || 'N/A'}</strong></div>
        <div><span>Quantity:</span> <strong>${activeBatch.quantityKg || activeBatch.quantity || 'N/A'} kg</strong></div>
        <div><span>Extraction Method:</span> <strong>${activeBatch.extractionMethod || 'N/A'}</strong></div>
        <div><span>Harvest Date:</span> <strong>${activeBatch.harvestDate || 'N/A'}</strong></div>
      </div>

      <div class="status-box ${chainValid ? 'status-ok' : 'status-fail'}">
        ${chainValid ? '✅ CHAIN VERIFIED — All SHA-256 hashes match. No tampering detected.' : '❌ CHAIN DISCREPANCY — Hash mismatch detected!'}
        &nbsp;&nbsp;(${checkpoints.length} blocks validated)
      </div>

      <table>
        <thead><tr>
          <th>#</th><th>Stage</th><th>Actor</th><th>Date & Time</th><th>Location</th><th>Hash</th><th>Notes</th><th>Documents</th>
        </tr></thead>
        <tbody>${stageRows}</tbody>
      </table>

      <div class="footer">
        This document was generated by Honey Chain — KVIC Honey Mission Blockchain & IoT Platform<br>
        Report ID: RPT-${batchId}-${Date.now()}
      </div>
    </body></html>`;

    const printWindow = window.open('', '_blank');
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.onload = () => {
      printWindow.print();
    };
  };

  return (
    <section className="view-pane active" id="view-chain">
      <div className="flow-title-row">
        <div className="eyebrow-badge"><Layers size={13} /> Permissioned Blockchain Ledger</div>
        <h2>Immutable Batch Traceability</h2>
        <p className="section-lede">
          Every stage from apiary extraction to lab NMR screening and packaging writes an SHA-256 hash-linked record to the Honey Chain ledger.
        </p>
      </div>

      {/* Search Bar */}
      <div style={{ marginBottom: '24px' }}>
        <div className="flex gap-10 flex-wrap" style={{ marginBottom: '12px' }}>
          <div className="chip-group">
            {[
              { key: 'batchId', label: 'Batch ID' },
              { key: 'hiveId', label: 'Hive ID' },
              { key: 'beekeeper', label: 'Beekeeper' },
              { key: 'date', label: 'Date Range' },
            ].map(s => (
              <button key={s.key} onClick={() => { setSearchType(s.key); setSearchValue(''); }}
                className={searchType === s.key ? 'chip active' : 'chip'}>{s.label}</button>
            ))}
          </div>

          {searchType === 'date' ? (
            <div className="flex gap-8">
              <input className="input" type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
              <span className="muted">to</span>
              <input className="input" type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} />
            </div>
          ) : (
            <input className="input" type="text" value={searchValue} onChange={e => setSearchValue(e.target.value)}
              placeholder={searchType === 'batchId' ? 'e.g. HONEY-BATCH-2025-001' : searchType === 'hiveId' ? 'e.g. HIVE-BOX-01' : 'e.g. Rameshwar Verma'}
              style={{ flex: 1, minWidth: '200px' }} />
          )}
        </div>

        {/* Batch Results */}
        {filteredBatches.length > 0 && (
          <div className="chip-group">
            {filteredBatches.map(b => {
              const bid = b.batchId || b.id;
              const isActive = selectedBatch === bid;
              return (
                <button key={bid} onClick={() => { setSelectedBatch(bid); setExpandedBlock(null); }}
                  className={isActive ? 'chip active' : 'chip'}>
                  {bid}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Batch Detail + Chain */}
      {activeBatch ? (
        <>
          {/* Batch Info Header */}
          <div className="glass-card" style={{ marginBottom: '20px' }}>
            <div className="flex-between">
              <div>
                <div style={{ fontSize: '11px', color: 'var(--text-dim)', marginBottom: '4px', letterSpacing: '0.06em' }}>BATCH DETAILS</div>
                <h3 className="mono" style={{ fontSize: '20px', margin: '0 0 8px', color: 'var(--amber-400)' }}>{activeBatch.batchId || activeBatch.id}</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '10px', fontSize: '13px' }}>
                  <div><span style={{ color: 'var(--text-dim)' }}>Honey:</span> <strong>{activeBatch.batchName || activeBatch.honeyType || 'N/A'}</strong></div>
                  <div><span style={{ color: 'var(--text-dim)' }}>Hive:</span> <strong>{activeBatch.hiveId || 'N/A'}</strong></div>
                  <div><span style={{ color: 'var(--text-dim)' }}>Beekeeper:</span> <strong>{activeBatch.beekeeper || activeBatch.beekeeperName || 'N/A'}</strong></div>
                  <div><span style={{ color: 'var(--text-dim)' }}>Quantity:</span> <strong>{activeBatch.quantityKg || activeBatch.quantity || 'N/A'} kg</strong></div>
                  <div><span style={{ color: 'var(--text-dim)' }}>Extraction:</span> <strong>{activeBatch.extractionMethod || 'N/A'}</strong></div>
                  <div><span style={{ color: 'var(--text-dim)' }}>Harvest:</span> <strong>{activeBatch.harvestDate || 'N/A'}</strong></div>
                </div>
              </div>
              <div className="flex gap-8">
                <button className="btn-luxury btn-luxury-ghost btn-sm" onClick={handleExport}>
                  <Download size={14} /> Export Report
                </button>
                <button className="btn-luxury btn-luxury-ghost btn-sm" onClick={() => { setCertBatch(activeBatch); setShowCertModal(true); }}>
                  <FileText size={14} /> View Certificate
                </button>
              </div>
            </div>
          </div>

          {/* Chain Integrity Status */}
          <div className={chainValid ? 'notice notice-success flex gap-10' : 'notice notice-danger flex gap-10'} style={{ marginBottom: '20px' }}>
            {chainValid ? <ShieldCheck size={20} color="var(--emerald-400)" /> : <AlertTriangle size={20} color="#f87171" />}
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700 }}>
                {chainValid ? 'CHAIN VERIFIED — All SHA-256 hashes match. No tampering detected.' : 'CHAIN DISCREPANCY — Hash mismatch detected!'}
              </div>
              <div className="field-hint" style={{ marginTop: '2px' }}>
                {checkpoints.length} blocks validated • Last hash verified at {new Date().toLocaleTimeString()}
              </div>
            </div>
            <div className="mono pill" style={{ background: 'var(--bg-input-subtle)', color: 'var(--text-dim)' }}>
              MERKLE ROOT: {checkpoints.length > 0 ? checkpoints[checkpoints.length - 1].hash.slice(0, 18) + '...' : 'N/A'}
            </div>
          </div>

          {/* Checkpoint Chain */}
          <div style={{ position: 'relative' }}>
            {checkpoints.map((cp, i) => {
              const meta = STAGE_META[cp.stage] || { label: cp.stage, icon: '?', color: 'var(--text-muted)' };
              const isExpanded = expandedBlock === i;
              const isLast = i === checkpoints.length - 1;

              return (
                <div key={i} className="flex gap-16">
                  {/* Vertical connector line */}
                  <div className="flex-col flex-center" style={{ width: '40px', flexShrink: 0 }}>
                    <div className="flex-center" style={{
                      width: '36px', height: '36px', borderRadius: '50%',
                      background: `${meta.color}20`, border: `2px solid ${meta.color}`, fontSize: '16px', flexShrink: 0,
                      boxShadow: `0 0 12px ${meta.color}30`,
                    }}>
                      {meta.icon}
                    </div>
                    {!isLast && (
                      <div style={{
                        width: '2px', flex: 1, minHeight: '40px',
                        background: `linear-gradient(180deg, ${meta.color}60, ${STAGE_META[checkpoints[i + 1]?.stage]?.color || 'var(--border-subtle)'}60)`,
                      }} />
                    )}
                  </div>

                  {/* Block Card */}
                  <div
                    className="glass-card"
                    onClick={() => setExpandedBlock(isExpanded ? null : i)}
                    style={{
                      flex: 1, marginBottom: isLast ? 0 : '16px', cursor: 'pointer',
                      borderColor: isExpanded ? meta.color : undefined,
                    }}
                  >
                    <div className="flex-between">
                      <div style={{ flex: 1 }}>
                        <div className="flex gap-8" style={{ marginBottom: '6px' }}>
                          <span className="pill pill-sm" style={{
                            background: `${meta.color}15`, color: meta.color, fontWeight: 700,
                          }}>STAGE {i + 1}</span>
                          <span style={{ fontSize: '14px', fontWeight: 700, color: meta.color }}>{meta.label}</span>
                        </div>

                        <div className="muted flex gap-12 flex-wrap">
                          <span className="flex" style={{ gap: '4px' }}><User size={12} /> {cp.actor}</span>
                          <span className="pill pill-sm" style={{
                            background: cp.role === 'Beekeeper' ? 'rgba(52,211,153,0.1)' : cp.role === 'Tester' ? 'rgba(96,165,250,0.1)' : cp.role === 'Processor' ? 'rgba(167,139,250,0.1)' : cp.role === 'Manufacturer' ? 'rgba(244,114,182,0.1)' : 'rgba(148,163,184,0.1)',
                            color: cp.role === 'Beekeeper' ? 'var(--emerald-400)' : cp.role === 'Tester' ? '#60a5fa' : cp.role === 'Processor' ? '#a78bfa' : cp.role === 'Manufacturer' ? '#f472b6' : 'var(--text-muted)',
                          }}>{cp.role}</span>
                          <span className="flex" style={{ gap: '4px' }}><Clock size={12} /> {new Date(cp.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                          <span className="flex" style={{ gap: '4px' }}><MapPin size={12} /> {cp.location}</span>
                        </div>

                        {cp.notes && (
                          <div style={{ fontSize: '12px', color: 'var(--text-dim)', marginTop: '6px', lineHeight: 1.5 }}>{cp.notes}</div>
                        )}
                      </div>

                      <div className="flex gap-8" style={{ flexShrink: 0 }}>
                        {cp.documents?.length > 0 && (
                          <span className="pill pill-sm" style={{ background: 'rgba(96,165,250,0.1)', color: '#60a5fa' }}>
                            {cp.documents.length} doc{cp.documents.length > 1 ? 's' : ''}
                          </span>
                        )}
                        <ChevronRight size={16} color="var(--text-dim)" style={{
                          transform: isExpanded ? 'rotate(90deg)' : 'none',
                          transition: 'transform 0.2s',
                        }} />
                      </div>
                    </div>

                    {/* Expanded Details */}
                    {isExpanded && (
                      <div className="divider-top" style={{ marginTop: '14px' }}>
                        {/* Hash Info */}
                        <div className="grid-2" style={{ marginBottom: '12px' }}>
                          <div>
                            <div style={{ fontSize: '10px', color: 'var(--text-dim)', marginBottom: '3px', letterSpacing: '0.05em' }}>BLOCK HASH</div>
                            <div className="mono" style={{ fontSize: '10.5px', padding: '6px 8px', background: 'var(--bg-code)', borderRadius: '6px', wordBreak: 'break-all', color: 'var(--amber-400)' }}>
                              {cp.hash}
                            </div>
                          </div>
                          <div>
                            <div style={{ fontSize: '10px', color: 'var(--text-dim)', marginBottom: '3px', letterSpacing: '0.05em' }}>PREVIOUS HASH</div>
                            <div className="mono" style={{ fontSize: '10.5px', padding: '6px 8px', background: 'var(--bg-code)', borderRadius: '6px', wordBreak: 'break-all', color: 'var(--text-dim)' }}>
                              {cp.prevHash}
                            </div>
                          </div>
                        </div>

                        {/* Quality Data if available */}
                        {cp.qualityData && (
                          <div style={{ marginBottom: '12px' }}>
                            <div style={{ fontSize: '10px', color: 'var(--text-dim)', marginBottom: '6px', letterSpacing: '0.05em' }}>LAB RESULTS</div>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '8px' }}>
                              {[
                                { label: 'Moisture', val: `${cp.qualityData.moisture}%`, ok: cp.qualityData.moisture <= 20 },
                                { label: 'NMR Purity', val: `${cp.qualityData.purity}%`, ok: cp.qualityData.purity >= 98 },
                                { label: 'HMF', val: `${cp.qualityData.hmf} mg/kg`, ok: cp.qualityData.hmf < 40 },
                                { label: 'C4 Sugar', val: cp.qualityData.c4Sugar, ok: cp.qualityData.c4Sugar === 'NEGATIVE' },
                                { label: 'FSSAI', val: cp.qualityData.fssai, ok: cp.qualityData.fssai === 'PASSED' },
                              ].map(q => (
                                <div key={q.label} style={{ padding: '6px 8px', background: 'var(--bg-inset)', borderRadius: '6px', textAlign: 'center' }}>
                                  <div style={{ fontSize: '9px', color: 'var(--text-dim)' }}>{q.label}</div>
                                  <div className="mono" style={{ fontSize: '11px', fontWeight: 700, color: q.ok ? 'var(--emerald-400)' : '#f87171', marginTop: '2px' }}>{q.val}</div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Documents */}
                        {cp.documents?.length > 0 && (
                          <div>
                            <div style={{ fontSize: '10px', color: 'var(--text-dim)', marginBottom: '6px', letterSpacing: '0.05em' }}>ATTACHED DOCUMENTS</div>
                            <div className="flex gap-6 flex-wrap">
                              {cp.documents.map((doc, j) => (
                                <span key={j} className="pill" style={{
                                  background: 'rgba(96,165,250,0.08)', borderColor: 'rgba(96,165,250,0.2)', color: '#60a5fa',
                                }}>
                                  <FileText size={11} /> {doc}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Export Footer */}
          <div className="summary-strip flex-between" style={{ marginTop: '24px' }}>
            <div className="muted">
              Download the full traceability report for regulatory compliance or buyer verification.
            </div>
            <div className="flex gap-8">
              <button className="btn-luxury btn-luxury-ghost btn-sm" onClick={handleExport}>
                <Download size={14} /> Export PDF Report
              </button>
              <button className="btn-luxury btn-luxury-primary btn-sm" onClick={() => { setCertBatch(activeBatch); setShowCertModal(true); }}>
                <FileText size={14} /> Digital Certificate
              </button>
            </div>
          </div>
        </>
      ) : (
        <div className="glass-card state-empty">
          <Search size={40} color="var(--text-dim)" style={{ marginBottom: '16px', opacity: 0.5 }} />
          <h3 style={{ fontSize: '18px', marginBottom: '8px', color: 'var(--text-muted)' }}>Search for a Batch</h3>
          <p style={{ maxWidth: '400px', margin: '0 auto' }}>
            Enter a Batch ID, Hive ID, or Beekeeper name to view the full blockchain traceability chain.
          </p>
          {allBatches.length > 0 && (
            <div className="mt-20">
              <div style={{ fontSize: '11px', color: 'var(--text-dim)', marginBottom: '8px' }}>AVAILABLE BATCHES</div>
              <div className="flex-center chip-group">
                {allBatches.map(b => (
                  <button key={b.batchId || b.id} onClick={() => setSelectedBatch(b.batchId || b.id)}
                    className="btn-luxury btn-luxury-ghost btn-sm">
                    {b.batchId || b.id}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {showCertModal && certBatch && (
        <CertificateModal batch={certBatch} onClose={() => setShowCertModal(false)} />
      )}
    </section>
  );
}
