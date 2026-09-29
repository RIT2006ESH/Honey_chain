import React, { useState } from 'react';
import { FlaskConical, CheckCircle2, AlertTriangle, Upload, ArrowRight } from 'lucide-react';
import { useApp } from '../../context/AppContext';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:4000';

export default function QualityTestForm() {
  const { sharedBatches, switchView, showNotification, currentUser } = useApp();
  const [selectedBatch, setSelectedBatch] = useState(window.__testingBatchId || '');
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [certificateName, setCertificateName] = useState('');

  const [form, setForm] = useState({
    labName: '',
    moisturePercent: '17.5',
    nmrPurityScore: '99.2',
    c4SugarAdulteration: 'NEGATIVE',
    hmf: '14.0',
    acidity: '25.0',
    sugarProfile: '',
    pollenDominance: '',
    antibioticResidues: 'NOT DETECTED',
  });

  // Tester receives processed batches from the processor (plus retests of rejected ones)
  const readyForTest = sharedBatches.filter(b => b.status === 'PROCESSED' || b.status === 'REJECTED');

  const update = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedBatch) return;
    setSubmitting(true);

    try {
      const res = await fetch(`${API_BASE}/api/quality-test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          batchId: selectedBatch,
          ...form,
          tester: (currentUser && currentUser.name) || 'Lab Tester',
          certificateName,
        }),
      });
      const data = await res.json();
      if (data.ok) {
        setResult(data.batch);
        setSubmitted(true);
        showNotification(`Quality test submitted for ${selectedBatch}`);
      } else {
        showNotification(data.error || `Could not test ${selectedBatch}`);
      }
    } catch (err) {
      setResult({ status: 'ERROR', id: selectedBatch });
      setSubmitted(true);
    } finally {
      setSubmitting(false);
    }
  };

  const isPass = result?.status === 'CERTIFIED' || result?.status === 'QA_APPROVED';
  const isApproved = result?.status === 'QA_APPROVED';
  const validations = result?.smartContractValidations || {};
  const selectedBatchData = sharedBatches.find(b => b.id === selectedBatch);

  return (
    <section className="view-pane active">
      <div className="flow-title-row">
        <div className="eyebrow-badge"><FlaskConical size={13} /> Lab Test Submission</div>
        <h2>Test Processed Honey</h2>
        <p className="section-lede">Test batches received from the processor: moisture, acidity, HMF, sugar profile and adulteration indicators. Approve passing batches for manufacturing.</p>
      </div>

      {submitted ? (
        <div className="result-hero">
          <div className={'result-icon ' + (isPass ? 'success' : 'danger')}>
            {isPass ? <CheckCircle2 size={32} color="var(--emerald-400)" /> : <AlertTriangle size={32} color="var(--rose-400)" />}
          </div>
          <h3 className="result-title" style={{ color: isPass ? 'var(--emerald-400)' : 'var(--rose-400)' }}>
            {isApproved ? 'Approved for Manufacturing' : isPass ? 'Batch Certified' : 'Batch Rejected'}
          </h3>
          <p className="result-sub" style={{ marginBottom: '16px' }}>
            {selectedBatch} · tested by {result?.qualityTest?.tester || currentUser?.name || 'Lab Tester'}
            {result?.qualityTest?.testedAt ? ` · ${new Date(result.qualityTest.testedAt).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}` : ''}
          </p>

          {!isPass && Object.keys(validations).length > 0 && (
            <div className="panel" style={{ maxWidth: '420px', margin: '0 auto 24px', borderColor: 'var(--rose-border)' }}>
              <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--rose-400)', marginBottom: '10px' }}>Smart Contract Validation Results</div>
              {Object.entries(validations).map(([key, val]) => {
                const passed = String(val).startsWith('PASS');
                return (
                  <div key={key} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 0', borderBottom: '1px solid var(--border-subtle)' }}>
                    <span style={{ color: passed ? 'var(--emerald-400)' : 'var(--rose-400)', fontSize: '13px', fontWeight: 700 }}>{passed ? '✓' : '✗'}</span>
                    <span style={{ fontSize: '12px' }}>{val}</span>
                  </div>
                );
              })}
            </div>
          )}

          {isPass && result?.qualityTest && (
            <div className="panel" style={{ maxWidth: '460px', margin: '0 auto 24px', borderColor: 'var(--emerald-border)' }}>
              <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--emerald-400)', marginBottom: '10px' }}>Quality Test Summary</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '12px' }}>
                <div>Batch: <strong>{result.id}</strong></div>
                <div>Tester: <strong>{result.qualityTest.tester}</strong></div>
                <div>Tested at: <strong>{result.qualityTest.testedAt ? new Date(result.qualityTest.testedAt).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—'}</strong></div>
                <div>NMR Purity: <strong>{result.qualityTest.nmrPurityScore}%</strong></div>
                <div>Moisture: <strong>{result.qualityTest.moisturePercent}%</strong></div>
                <div>Acidity: <strong>{result.qualityTest.acidity != null ? `${result.qualityTest.acidity} meq/kg` : '—'}</strong></div>
                <div>HMF: <strong>{result.qualityTest.hmf} mg/kg</strong></div>
                <div>C4 Sugar: <strong>{result.qualityTest.c4SugarAdulteration}</strong></div>
                {result.qualityTest.sugarProfile && (
                  <div style={{ gridColumn: '1 / -1' }}>Sugar profile: <strong>{result.qualityTest.sugarProfile}</strong></div>
                )}
                {isApproved && (
                  <div style={{ gridColumn: '1 / -1', color: 'var(--emerald-400)', fontWeight: 700 }}>✓ Released to manufacturing</div>
                )}
              </div>
            </div>
          )}
          <div className="result-actions">
            <button onClick={() => switchView('quality')} className="btn btn-gold">
              Back to Queue <ArrowRight size={14} />
            </button>
            <button onClick={() => { setSubmitted(false); setResult(null); setCertificateName(''); }} className="btn btn-soft">
              Test Another Batch
            </button>
          </div>
        </div>
      ) : (
        <div style={{ maxWidth: '760px' }}>
          <form onSubmit={handleSubmit} className="panel">
            <div className="field" style={{ marginBottom: '20px' }}>
              <label className="field-label">Select Batch *</label>
              <select value={selectedBatch} onChange={e => setSelectedBatch(e.target.value)} required className="select">
                <option value="">Choose a processed batch received from the processor...</option>
                {readyForTest.map(b => (
                  <option key={b.id} value={b.id}>{b.id} — {b.hiveId} — {b.honeyType} — {b.quantity}kg — {b.status}</option>
                ))}
              </select>
              {readyForTest.length === 0 && (
                <div className="field-hint">No processed batches yet. The processor hands batches over after extraction.</div>
              )}
            </div>

            {selectedBatchData && (
              <>
                <div className="grid-4" style={{ padding: '12px', background: 'var(--bg-inset)', borderRadius: '8px', marginBottom: '12px', fontSize: '12px' }}>
                  <div><span style={{ color: 'var(--text-dim)' }}>Hive: </span><strong>{selectedBatchData.hiveId}</strong></div>
                  <div><span style={{ color: 'var(--text-dim)' }}>Type: </span><strong>{selectedBatchData.honeyType}</strong></div>
                  <div><span style={{ color: 'var(--text-dim)' }}>Qty: </span><strong>{selectedBatchData.quantity}kg</strong></div>
                  <div><span style={{ color: 'var(--text-dim)' }}>Beekeeper: </span><strong>{selectedBatchData.beekeeper || 'Unknown'}</strong></div>
                </div>
                {selectedBatchData.production && (
                  <div className="grid-4" style={{ padding: '12px', background: 'var(--bg-inset)', borderRadius: '8px', marginBottom: '20px', fontSize: '12px' }}>
                    <div><span style={{ color: 'var(--text-dim)' }}>Processed: </span><strong>{selectedBatchData.production.processedAt ? new Date(selectedBatchData.production.processedAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}</strong></div>
                    <div><span style={{ color: 'var(--text-dim)' }}>Location: </span><strong>{selectedBatchData.production.location || '—'}</strong></div>
                    <div><span style={{ color: 'var(--text-dim)' }}>Output: </span><strong>{selectedBatchData.production.outputQuantity ?? '—'} kg</strong></div>
                    <div><span style={{ color: 'var(--text-dim)' }}>Production batch: </span><strong style={{ color: 'var(--amber-400)' }}>{selectedBatchData.productionBatchId || '—'}</strong></div>
                  </div>
                )}
              </>
            )}

            <div className="section-title">Lab Test Results</div>
            <div className="grid-2">
              <div className="field">
                <label className="field-label">Lab Name *</label>
                <input type="text" value={form.labName} onChange={e => update('labName', e.target.value)} placeholder="e.g. NBL FSSAI Accredited Lab" required className="input" />
              </div>
              <div className="field">
                <label className="field-label">Tester</label>
                <input type="text" value={(currentUser && currentUser.name) || 'Lab Tester'} readOnly className="input" style={{ opacity: 0.75, cursor: 'not-allowed' }} />
                <div className="field-hint">Recorded with the test result and on the ledger.</div>
              </div>
              <div className="field">
                <label className="field-label">NMR Purity Score (%) *</label>
                <input type="number" step="0.1" min="0" max="100" value={form.nmrPurityScore} onChange={e => update('nmrPurityScore', e.target.value)} placeholder="e.g. 99.2" required className="input" />
                <div className="field-hint">{'Pass: >= 98.0% (FSSAI)'}</div>
              </div>
              <div className="field">
                <label className="field-label">Moisture Content (%) *</label>
                <input type="number" step="0.1" min="0" max="40" value={form.moisturePercent} onChange={e => update('moisturePercent', e.target.value)} placeholder="e.g. 17.5" required className="input" />
                <div className="field-hint">{'Pass: <= 20.0% (FSSAI)'}</div>
              </div>
              <div className="field">
                <label className="field-label">HMF Level (mg/kg) *</label>
                <input type="number" step="0.1" min="0" value={form.hmf} onChange={e => update('hmf', e.target.value)} placeholder="e.g. 14.2" required className="input" />
                <div className="field-hint">{'Pass: < 40 mg/kg (FSSAI)'}</div>
              </div>
              <div className="field">
                <label className="field-label">Free Acidity (meq/kg)</label>
                <input type="number" step="0.1" min="0" value={form.acidity} onChange={e => update('acidity', e.target.value)} placeholder="e.g. 25.0" className="input" />
                <div className="field-hint">{'Pass: <= 40.0 meq/kg (FSSAI)'}</div>
              </div>
              <div className="field">
                <label className="field-label">Sugar Profile</label>
                <input type="text" value={form.sugarProfile} onChange={e => update('sugarProfile', e.target.value)} placeholder="e.g. Fructose 38.5% · Glucose 31.2% · F:G 1.23" className="input" />
                <div className="field-hint">Fructose + glucose sum; F:G ratio near 1.0 indicates genuine honey.</div>
              </div>
              <div className="field">
                <label className="field-label">C4 Sugar Adulteration *</label>
                <select value={form.c4SugarAdulteration} onChange={e => update('c4SugarAdulteration', e.target.value)} className="select">
                  <option value="NEGATIVE">NEGATIVE (No adulteration)</option>
                  <option value="POSITIVE">POSITIVE (Adulteration detected)</option>
                </select>
              </div>
              <div className="field">
                <label className="field-label">Pollen Dominance</label>
                <input type="text" value={form.pollenDominance} onChange={e => update('pollenDominance', e.target.value)} placeholder="e.g. 84% Litchi Pollen" className="input" />
              </div>
              <div className="field">
                <label className="field-label">Antibiotic Residues</label>
                <select value={form.antibioticResidues} onChange={e => update('antibioticResidues', e.target.value)} className="select">
                  <option value="NOT DETECTED">NOT DETECTED (0.0 ppm)</option>
                  <option value="DETECTED">DETECTED (Above threshold)</option>
                </select>
              </div>
              <div className="field">
                <label className="field-label">Upload Certificate</label>
                <label className="flex gap-8" style={{ padding: '10px 12px', background: 'var(--bg-input)', border: '1px dashed var(--border-subtle)', borderRadius: '8px', cursor: 'pointer', fontSize: '12px', color: 'var(--text-muted)' }}>
                  <Upload size={14} />
                  {certificateName || 'Choose PDF/image...'}
                  <input type="file" accept=".pdf,.jpg,.png" onChange={e => setCertificateName(e.target.files?.[0]?.name || '')} style={{ display: 'none' }} />
                </label>
              </div>
            </div>

            <button type="submit" disabled={submitting || !selectedBatch} className="btn btn-gold btn-lg btn-block mt-20" style={{ background: submitting || !selectedBatch ? 'var(--text-dim)' : undefined }}>
              <FlaskConical size={16} />
              {submitting ? 'Submitting Test...' : 'Submit Test & Run Smart Contract Validation'}
            </button>
          </form>
        </div>
      )}
    </section>
  );
}