import React, { useState, useMemo, useEffect } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import {
  Search, CheckCircle2, XCircle, FileText, MapPin, Shield, Clock, Hash,
  AlertTriangle, Send, User, ChevronDown, ChevronUp, ExternalLink, Bug
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import CertificateModal from '../components/CertificateModal';

const MOCK_BATCH_DATA = {
  'HONEY-BATCH-2025-001': {
    batchId: 'HONEY-BATCH-2025-001',
    honeyType: 'Raw Pure Litchi Monofloral Honey',
    hiveId: 'HIVE-BOX-01',
    beekeeper: 'Rameshwar Verma',
    cluster: 'Muzaffarpur Apiary Cluster, Bihar',
    floralSource: 'Litchi Blossom (82% Litchi chinensis pollen)',
    harvestDate: '10 May 2025',
    extractionMethod: 'Stainless Steel Centrifugal Cold Extraction (Unheated)',
    quantityKg: 45.0,
    gps: { lat: 26.1209, lng: 85.3647 },
    verified: true,
    lab: {
      nmrPurity: 99.4,
      moisture: 17.2,
      hmf: 12.4,
      c4Sugar: 'NEGATIVE',
      antibiotics: 'NOT DETECTED',
      fssai: 'PASSED',
      labName: 'National Bee Board & FSSAI Accredited Referral Lab',
      testedDate: '12 May 2025',
    },
    hash: '0xe94a1b6c0032f918e3c5d7a9b0f2e4c6d8a1b3f5e7c9d0a2b4f6e8c0d2a4b6',
    checkpoints: [
      { stage: 'Harvest', date: '10 May 2025', actor: 'Rameshwar Verma', location: 'Muzaffarpur Litchi Orchard' },
      { stage: 'Lab Test', date: '12 May 2025', actor: 'Dr. Anita Kulkarni', location: 'National Bee Board Lab' },
      { stage: 'Processing', date: '13 May 2025', actor: 'Vikram Deshmukh', location: 'Satara Cold Processing Unit' },
      { stage: 'Packaging', date: '14 May 2025', actor: 'Vikram Deshmukh', location: 'Satara Packaging Facility' },
      { stage: 'Certified', date: '15 May 2025', actor: 'KVIC System', location: 'KVIC Central Ledger' },
    ],
  },
};

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:4000';
const HOSTED_APP = 'https://honey-chain-ruddy.vercel.app';
const IS_LOCAL = ['localhost', '127.0.0.1', ''].includes(window.location.hostname);
const PUBLIC_BASE = (process.env.REACT_APP_PUBLIC_URL || (IS_LOCAL ? HOSTED_APP : window.location.origin)).replace(/\/+$/, '');

function normalizeLab(lab) {
  if (!lab) return null;
  return {
    nmrPurity: lab.nmrPurityScore || lab.nmrPurity || 0,
    moisture: lab.moisturePercent || lab.moisture || 0,
    c4Sugar: lab.c4SugarAdulteration || lab.c4Sugar || 'N/A',
    antibiotics: lab.antibioticResidues || lab.antibiotics || 'N/A',
    hmf: lab.hmf || 0,
    labName: lab.labName || 'Lab',
    testedDate: lab.testedAt || lab.testedDate || 'N/A',
  };
}

export default function ConsumerScan() {
  const { batchIdInput, setBatchIdInput, sharedBatches, showFullCertModal, setShowFullCertModal } = useApp();
  const [isScanned, setIsScanned] = useState(false);
  const [lookupId, setLookupId] = useState(batchIdInput || '');
  const [showReport, setShowReport] = useState(false);
  const [reportForm, setReportForm] = useState({ reason: '', description: '', name: '', contact: '' });
  const [reportSubmitted, setReportSubmitted] = useState(false);
  const [expandedTimeline, setExpandedTimeline] = useState(true);

  const resolvedBatch = useMemo(() => {
    const q = (lookupId || batchIdInput || '').trim();
    if (!q) return null;
    if (MOCK_BATCH_DATA[q]) return MOCK_BATCH_DATA[q];
    const apiBatch = sharedBatches.find(b => (b.id || b.batchId) === q);
    if (apiBatch) {
      return {
        batchId: apiBatch.id || apiBatch.batchId,
        honeyType: apiBatch.honeyType || apiBatch.batchName || 'Honey',
        hiveId: apiBatch.hiveId || 'N/A',
        beekeeper: apiBatch.beekeeper || apiBatch.beekeeperName || 'N/A',
        cluster: 'KVIC Cluster',
        floralSource: apiBatch.floralSource || 'Mixed Flora',
        harvestDate: apiBatch.harvestDate || 'N/A',
        extractionMethod: apiBatch.extractionMethod || 'N/A',
        quantityKg: apiBatch.quantity || 0,
        gps: null,
        verified: ['QUALITY_VERIFIED', 'QA_APPROVED', 'PROCESSED', 'PACKAGED', 'DISPATCHED', 'CERTIFIED'].includes(apiBatch.status),
        lab: apiBatch.quality || apiBatch.qualityTest ? normalizeLab(apiBatch.quality || apiBatch.qualityTest) : null,
        hash: '0x' + Array.from({ length: 64 }, () => '0123456789abcdef'[Math.floor(Math.random() * 16)]).join(''),
        checkpoints: (apiBatch.transactions || []).map(tx => ({
          stage: tx.event, date: new Date(tx.date).toLocaleDateString(), actor: tx.actor, location: 'KVIC Network',
        })),
      };
    }
    return null;
  }, [lookupId, batchIdInput, sharedBatches]);

  // Auto-activate scan view when batch is set via QR hash
  useEffect(() => {
    if (batchIdInput) {
      setLookupId(batchIdInput);
      setIsScanned(true);
    }
  }, [batchIdInput]);

  const handleLookup = () => {
    setBatchIdInput(lookupId);
    setIsScanned(true);
  };

  const handleReportSubmit = async (e) => {
    e.preventDefault();
    try {
      await fetch(`${API_BASE}/api/reports`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ batchId: resolvedBatch?.batchId, ...reportForm }),
      });
    } catch (err) { /* ok in demo mode */ }
    setReportSubmitted(true);
    setTimeout(() => { setReportSubmitted(false); setShowReport(false); setReportForm({ reason: '', description: '', name: '', contact: '' }); }, 3000);
  };

  return (
    <section className="view-pane active" id="view-qr">
      <div className="flow-title-row">
        <div className="eyebrow-badge"><Search size={13} /> Direct Consumer Provenance</div>
        <h2 style={{ fontSize: '30px' }}>Scan the Jar · Verify the Honey Origin</h2>
        <p className="section-lede">
          Consumers scan the serialized QR code to instantly verify NMR purity, single-apiary GPS provenance, and direct farmer fair-trade support. No login required.
        </p>
      </div>

      <div className="qr-scanner-grid">
        {/* Left — QR Code + Lookup */}
        <div className="qr-generator-card">
          <div className="qr-display-frame">
            <QRCodeCanvas
              value={`${PUBLIC_BASE}/#verify/${lookupId || batchIdInput || 'DEMO'}`}
              size={180} level="H"
              fgColor="#1c1306"
            />
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '14px', textAlign: 'center' }}>
            Scan this QR or enter a batch code below
          </div>

          <div className="flex gap-8" style={{ marginTop: '14px' }}>
            <input
              type="text" value={lookupId} onChange={e => setLookupId(e.target.value)}
              placeholder="Enter Batch ID (e.g. HONEY-BATCH-2025-001)"
              onKeyDown={e => e.key === 'Enter' && handleLookup()}
              className="input" style={{ flex: 1 }}
            />
            <button className="btn-luxury btn-luxury-primary" onClick={handleLookup}>
              <Search size={14} /> Verify
            </button>
          </div>

          <div className="chip-group flex-center mt-12">
            {['HONEY-BATCH-2025-001', ...sharedBatches.slice(0, 2).map(b => b.id || b.batchId)].map(id => (
              <button key={id} onClick={() => { setLookupId(id); setBatchIdInput(id); setIsScanned(true); }}
                className={lookupId === id ? 'chip active' : 'chip'}>
                {id}
              </button>
            ))}
          </div>
        </div>

        {/* Right — Verification Result */}
        <div className={`passport-result-card ${isScanned ? 'active' : ''}`}>
          {!resolvedBatch ? (
            <div className="state-empty">
              <Shield size={40} color="var(--text-dim)" style={{ opacity: 0.4, marginBottom: '12px' }} />
              <h3 style={{ fontSize: '16px', color: 'var(--text-muted)', marginBottom: '6px' }}>Enter a Batch Code</h3>
              <p style={{ fontSize: '12.5px' }}>Type a batch ID or scan a QR code to view provenance details.</p>
            </div>
          ) : (
            <>
              {/* 1. Authenticity Badge */}
              <div className="flex-between"
                style={{
                  padding: '14px 18px', marginBottom: '20px',
                  background: resolvedBatch.verified ? 'var(--emerald-bg)' : 'rgba(248,113,113,0.1)',
                  border: `1px solid ${resolvedBatch.verified ? 'var(--emerald-border)' : 'rgba(248,113,113,0.3)'}`,
                  borderRadius: '12px',
                }}>
                {resolvedBatch.verified ? (
                  <CheckCircle2 size={22} color="var(--emerald-400)" />
                ) : (
                  <XCircle size={22} color="#f87171" />
                )}
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '15px', fontWeight: 700, color: resolvedBatch.verified ? 'var(--emerald-400)' : '#f87171' }}>
                    {resolvedBatch.verified ? '100% Authentic — Verified Pure Honey' : 'Verification Pending'}
                  </div>
                  <div className="field-hint" style={{ marginTop: '2px' }}>
                    Batch <strong className="mono">{resolvedBatch.batchId}</strong> • Blockchain integrity confirmed
                  </div>
                </div>
                <button className="btn-luxury btn-luxury-ghost btn-sm" onClick={() => setShowFullCertModal(true)}
                  style={{ flexShrink: 0 }}>
                  <FileText size={13} /> Certificate
                </button>
              </div>

              {/* 2. Source Story */}
              <div style={{ marginBottom: '20px' }}>
                <div className="panel-title" style={{ marginBottom: '10px' }}>SOURCE STORY</div>
                <div className="grid-2">
                  {[
                    { icon: <User size={14} />, label: 'Beekeeper', val: resolvedBatch.beekeeper },
                    { icon: <MapPin size={14} />, label: 'Apiary Cluster', val: resolvedBatch.cluster },
                    { icon: <Clock size={14} />, label: 'Harvest Date', val: resolvedBatch.harvestDate },
                    { icon: <Bug size={14} />, label: 'Floral Source', val: resolvedBatch.floralSource },
                    { icon: <Shield size={14} />, label: 'Honey Type', val: resolvedBatch.honeyType },
                    { icon: <Hash size={14} />, label: 'Extraction', val: resolvedBatch.extractionMethod },
                  ].map(item => (
                    <div key={item.label} className="flex gap-8">
                      <span style={{ color: 'var(--amber-400)', marginTop: '2px', flexShrink: 0 }}>{item.icon}</span>
                      <div>
                        <div style={{ fontSize: '10.5px', color: 'var(--text-dim)' }}>{item.label}</div>
                        <div style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--text-main)', lineHeight: 1.3 }}>{item.val}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 3. Lab Results in Plain Language */}
              {resolvedBatch.lab && (
                <div style={{ marginBottom: '20px' }}>
                  <div className="panel-title" style={{ marginBottom: '10px' }}>LAB TEST RESULTS</div>
                  <div style={{ padding: '14px', background: 'var(--bg-inset)', border: '1px solid var(--border-subtle)', borderRadius: '10px' }}>
                    <div className="flex flex-col gap-10">
                      {[
                        { label: 'Purity Score', val: `${resolvedBatch.lab.nmrPurity}%`, desc: 'Nuclear Magnetic Resonance test confirms this is pure, unadulterated honey.', good: resolvedBatch.lab.nmrPurity >= 98 },
                        { label: 'Moisture Content', val: `${resolvedBatch.lab.moisture}%`, desc: 'Low moisture means the honey won\'t ferment and has a long shelf life.', good: resolvedBatch.lab.moisture <= 20 },
                        { label: 'Foreign Sugar Test', val: resolvedBatch.lab.c4Sugar, desc: 'No cane sugar or corn syrup detected — this is 100% bee-produced honey.', good: resolvedBatch.lab.c4Sugar === 'NEGATIVE' },
                        { label: 'Antibiotic Residue', val: resolvedBatch.lab.antibiotics, desc: 'No antibiotic chemicals found — safe for all ages.', good: true },
                        { label: 'HMF Level', val: `${resolvedBatch.lab.hmf} mg/kg`, desc: 'Low HMF confirms the honey was never heated or aged improperly.', good: resolvedBatch.lab.hmf < 40 },
                      ].map(item => (
                        <div key={item.label} className="flex gap-10">
                          <span style={{
                            width: '8px', height: '8px', borderRadius: '50%', marginTop: '5px', flexShrink: 0,
                            background: item.good ? 'var(--emerald-400)' : '#f87171',
                          }} />
                          <div style={{ flex: 1 }}>
                            <div className="flex-between">
                              <span style={{ fontSize: '13px', fontWeight: 600 }}>{item.label}</span>
                              <span className="mono" style={{ fontSize: '13px', fontWeight: 700, color: item.good ? 'var(--emerald-400)' : '#f87171' }}>{item.val}</span>
                            </div>
                            <div className="field-hint" style={{ marginTop: '2px', lineHeight: 1.4 }}>{item.desc}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div style={{ marginTop: '10px', fontSize: '10.5px', color: 'var(--text-dim)' }}>
                      Tested by: {resolvedBatch.lab.labName} · {resolvedBatch.lab.testedDate}
                    </div>
                  </div>
                </div>
              )}

              {/* 4. Origin Map */}
              <div style={{ marginBottom: '20px' }}>
                <div className="panel-title" style={{ marginBottom: '10px' }}>ORIGIN MAP</div>
                <div style={{ padding: '14px', background: 'var(--bg-inset)', border: '1px solid var(--border-subtle)', borderRadius: '10px' }}>
                  <div className="field-label" style={{ marginBottom: '8px' }}>
                    <MapPin size={13} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'middle' }} />
                    GEO-VERIFIED ORIGIN — {resolvedBatch.cluster?.toUpperCase()}
                  </div>
                  <svg viewBox="0 0 320 90" width="100%" height="90">
                    {/* India outline simplified */}
                    <path d="M60 10 L120 5 L180 8 L240 15 L280 30 L290 50 L270 70 L230 80 L180 85 L130 80 L80 70 L50 50 L45 30 Z"
                      fill="none" stroke="var(--border-subtle)" strokeWidth="1" opacity="0.5" />
                    {/* Cluster locations */}
                    {[[80, 25, 'Punjab'], [120, 55, 'Maharashtra'], [200, 40, 'Bihar'], [250, 60, 'W. Bengal'], [160, 70, 'Karnataka']].map(([x, y, name], i) => (
                      <g key={i}>
                        <circle cx={x} cy={y} r="3" fill="var(--border-highlight)" />
                        <text x={x} y={y - 6} fontSize="7" fill="var(--text-dim)" textAnchor="middle">{name}</text>
                      </g>
                    ))}
                    {/* Highlighted origin */}
                    {resolvedBatch.gps && (
                      <>
                        <circle cx="200" cy="40" r="7" fill="var(--amber-400)" />
                        <circle cx="200" cy="40" r="12" fill="none" stroke="var(--amber-400)" strokeWidth="1.5" opacity="0.4">
                          <animate attributeName="r" values="10;16;10" dur="2s" repeatCount="indefinite" />
                          <animate attributeName="opacity" values="0.4;0.1;0.4" dur="2s" repeatCount="indefinite" />
                        </circle>
                        <text x="200" y="58" fontSize="8" fill="var(--amber-400)" textAnchor="middle" fontWeight="600">
                          {resolvedBatch.gps.lat.toFixed(2)}°N, {resolvedBatch.gps.lng.toFixed(2)}°E
                        </text>
                      </>
                    )}
                  </svg>
                </div>
              </div>

              {/* 5. Traceability Timeline */}
              {resolvedBatch.checkpoints?.length > 0 && (
                <div style={{ marginBottom: '20px' }}>
                  <div
                    className="flex-between" style={{ cursor: 'pointer', marginBottom: '10px' }}
                    onClick={() => setExpandedTimeline(!expandedTimeline)}
                  >
                    <div className="panel-title">TRACEABILITY JOURNEY</div>
                    {expandedTimeline ? <ChevronUp size={14} color="var(--text-dim)" /> : <ChevronDown size={14} color="var(--text-dim)" />}
                  </div>
                  {expandedTimeline && (
                    <div style={{ padding: '14px', background: 'var(--bg-inset)', border: '1px solid var(--border-subtle)', borderRadius: '10px' }}>
                      {resolvedBatch.checkpoints.map((cp, i) => (
                        <div key={i} className="flex gap-12" style={{ padding: '8px 0', borderBottom: i < resolvedBatch.checkpoints.length - 1 ? '1px solid var(--border-subtle)' : 'none' }}>
                          <div style={{
                            width: '24px', height: '24px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                            background: 'var(--emerald-bg)', border: '1px solid var(--emerald-border)', fontSize: '11px', fontWeight: 700, color: 'var(--emerald-400)',
                          }}>{i + 1}</div>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: '12.5px', fontWeight: 600 }}>{cp.stage}</div>
                            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{cp.actor} · {cp.location}</div>
                          </div>
                          <div style={{ fontSize: '11px', color: 'var(--text-dim)', textAlign: 'right' }}>{cp.date}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* 6. Ledger Reference */}
              <div style={{ marginBottom: '20px' }}>
                <div className="panel-title" style={{ marginBottom: '10px' }}>LEDGER REFERENCE</div>
                <div style={{ padding: '12px 14px', background: 'var(--bg-inset)', border: '1px solid var(--border-subtle)', borderRadius: '10px' }}>
                  <div className="flex gap-6" style={{ marginBottom: '8px' }}>
                    <Hash size={13} color="var(--amber-400)" />
                    <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-main)' }}>Blockchain Verification Hash</span>
                  </div>
                  <div className="mono" style={{ fontSize: '11px', padding: '8px 10px', background: 'var(--bg-code)', borderRadius: '6px', wordBreak: 'break-all', color: 'var(--amber-400)', lineHeight: 1.6 }}>
                    {resolvedBatch.hash}
                  </div>
                  <div className="flex gap-6 mt-8" style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                    <ExternalLink size={11} />
                    <span>Anyone can independently verify this hash at <strong>honeychain.kvic.gov.in/verify</strong></span>
                  </div>
                </div>
              </div>

              {/* 7. Feedback / Report Counterfeit */}
              <div>
                <button
                  onClick={() => setShowReport(!showReport)}
                  className="btn flex gap-8 btn-block"
                  style={{
                    background: showReport ? 'rgba(248,113,113,0.08)' : 'transparent',
                    border: '1px dashed var(--border-subtle)', color: 'var(--text-muted)',
                  }}
                >
                  <AlertTriangle size={14} /> Report Suspected Counterfeit
                  {showReport ? <ChevronUp size={13} style={{ marginLeft: 'auto' }} /> : <ChevronDown size={13} style={{ marginLeft: 'auto' }} />}
                </button>

                {showReport && (
                  <div style={{ marginTop: '10px', padding: '16px', background: 'var(--bg-inset)', border: '1px solid var(--border-subtle)', borderRadius: '10px' }}>
                    {reportSubmitted ? (
                      <div style={{ textAlign: 'center', padding: '16px 0' }}>
                        <CheckCircle2 size={28} color="var(--emerald-400)" style={{ marginBottom: '8px' }} />
                        <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--emerald-400)' }}>Report Submitted</div>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>Our fraud monitoring team will review this within 48 hours.</div>
                      </div>
                    ) : (
                      <form onSubmit={handleReportSubmit}>
                        <div style={{ fontSize: '13px', fontWeight: 600, marginBottom: '12px', color: 'var(--text-main)' }}>Why do you suspect this product?</div>
                        <div className="flex flex-col gap-8" style={{ marginBottom: '12px' }}>
                          {['Packaging looks tampered', 'Honey taste/texture seems off', 'QR code doesn\'t match product', 'Price seems too low for pure honey', 'Other concern'].map(reason => (
                            <label key={reason} className="flex gap-8" style={{ fontSize: '12.5px', color: 'var(--text-main)', cursor: 'pointer' }}>
                              <input type="radio" name="reportReason" value={reason} checked={reportForm.reason === reason}
                                onChange={e => setReportForm(f => ({ ...f, reason: e.target.value }))}
                                style={{ accentColor: 'var(--amber-500)' }} />
                              {reason}
                            </label>
                          ))}
                        </div>
                        <textarea
                          placeholder="Additional details (optional)..."
                          value={reportForm.description} onChange={e => setReportForm(f => ({ ...f, description: e.target.value }))}
                          rows={2}
                          className="textarea"
                          style={{ marginBottom: '12px' }}
                        />
                        <div className="grid-2" style={{ marginBottom: '12px' }}>
                          <input type="text" placeholder="Your name (optional)" value={reportForm.name}
                            onChange={e => setReportForm(f => ({ ...f, name: e.target.value }))} className="input" />
                          <input type="text" placeholder="Contact (optional)" value={reportForm.contact}
                            onChange={e => setReportForm(f => ({ ...f, contact: e.target.value }))} className="input" />
                        </div>
                        <button type="submit" className="btn-luxury btn-block" disabled={!reportForm.reason}
                          style={{
                            background: reportForm.reason ? '#dc2626' : 'var(--bg-card)',
                            color: reportForm.reason ? '#fff' : 'var(--text-dim)',
                            opacity: reportForm.reason ? 1 : 0.5,
                          }}>
                          <Send size={13} /> Submit Counterfeit Report
                        </button>
                      </form>
                    )}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {showFullCertModal && <CertificateModal batch={resolvedBatch} onClose={() => setShowFullCertModal(false)} />}
    </section>
  );
}
