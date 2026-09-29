import React, { useState } from 'react';
import { Settings, CheckCircle2, ArrowRight } from 'lucide-react';
import { useApp } from '../../context/AppContext';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:4000';

const EXTRACTION_UNITS = [
  'SS Centrifugal Extractor — Unit A',
  'SS Centrifugal Extractor — Unit B',
  'Manual Crush & Strain Station',
  'Flow Hive Gravity Drain System',
];

const FILTRATION_METHODS = [
  'Micro-Mesh Sediment Filtration (200 µm)',
  'Fine Cloth Strain',
  'Coarse Strain then Fine Cloth',
  'Pre-filtered — no additional filtration',
];

export default function ProcessingLog() {
  const { sharedBatches, switchView, showNotification, fetchBatches } = useApp();
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState('');
  const [result, setResult] = useState(null);

  const processing = sharedBatches.filter(b =>
    ['HARVEST_CREATED', 'HARVEST_VERIFIED', 'QUALITY_VERIFIED', 'CERTIFIED', 'PROCESSED'].includes(b.status)
  );
  const records = sharedBatches.filter(b => b.production);

  const [form, setForm] = useState({
    extractionUnit: '',
    inputQty: '',
    outputQty: '',
    poolingNote: '',
    temperature: '',
    duration: '',
    filtrationMethod: '',
    settlingHours: '',
    notes: '',
  });

  const update = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const batch = sharedBatches.find(b => b.id === selectedBatch);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedBatch) return;
    setSubmitting(true);

    const payload = {
      extractionUnit: form.extractionUnit,
      inputQuantity: parseFloat(form.inputQty) || batch?.quantity || 0,
      outputQuantity: parseFloat(form.outputQty) || 0,
      poolingNote: form.poolingNote,
      processingTemp: form.temperature ? parseFloat(form.temperature) : null,
      durationMinutes: form.duration ? parseInt(form.duration) : null,
      filtrationMethod: form.filtrationMethod,
      settlingHours: form.settlingHours ? parseFloat(form.settlingHours) : null,
      notes: form.notes,
      processedAt: new Date().toISOString(),
      processor: 'Satara Processing Unit',
    };

    try {
      const res = await fetch(`${API_BASE}/api/batches/${selectedBatch}/process`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!data.ok) {
        showNotification(data.error || `Could not log processing for ${selectedBatch}`);
        return;
      }

      if (form.filtrationMethod || form.settlingHours) {
        try {
          await fetch(`${API_BASE}/api/processing-step`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              batchId: selectedBatch,
              step: 'Filtration & Settling',
              notes: [
                form.filtrationMethod,
                form.settlingHours ? `settled ${form.settlingHours}h` : null,
              ].filter(Boolean).join(' · '),
            }),
          });
        } catch (err) { /* step record is best-effort */ }
      }

      const prod = data.batch.production || {};
      setResult({
        batchId: selectedBatch,
        productionBatchId: data.batch.productionBatchId || null,
        processedAt: prod.processedAt || payload.processedAt,
        location: prod.location || payload.processor,
        outputQty: payload.outputQuantity,
        filtration: form.filtrationMethod || null,
        settlingHours: form.settlingHours || null,
      });
      setSubmitted(true);
      showNotification(`Processing logged for ${selectedBatch}`);
      fetchBatches();
    } catch (e) {
      showNotification('Could not log processing. Is backend running?');
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setForm({ extractionUnit: '', inputQty: '', outputQty: '', poolingNote: '', temperature: '', duration: '', filtrationMethod: '', settlingHours: '', notes: '' });
    setResult(null);
  };

  const fmtDate = (iso) => {
    if (!iso) return '—';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '—';
    return d.toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <section className="view-pane active">
      <div className="flow-title-row">
        <div className="eyebrow-badge"><Settings size={13} /> Processing Log</div>
        <h2>Record Processing</h2>
        <p className="section-lede">Log extraction details: unit used, inputs pooled, output quantity.</p>
      </div>

      {submitted ? (
        <div className="result-hero">
          <div className="result-icon success">
            <CheckCircle2 size={32} color="var(--emerald-400)" />
          </div>
          <h3 className="result-title" style={{ color: 'var(--emerald-400)' }}>Processing Logged</h3>
          <p className="result-sub">
            {selectedBatch} — extraction complete and logged to the blockchain.
          </p>
          {result && (
            <div className="notice" style={{ maxWidth: '560px', margin: '12px auto 0', textAlign: 'left' }}>
              <div className="grid-2" style={{ gap: '8px 16px' }}>
                <div><span style={{ color: 'var(--text-dim)' }}>Production batch: </span><strong style={{ color: 'var(--amber-400)' }}>{result.productionBatchId || '—'}</strong></div>
                <div><span style={{ color: 'var(--text-dim)' }}>Output: </span><strong>{result.outputQty} kg</strong></div>
                <div><span style={{ color: 'var(--text-dim)' }}>Processed at: </span><strong>{fmtDate(result.processedAt)}</strong></div>
                <div><span style={{ color: 'var(--text-dim)' }}>Location: </span><strong>{result.location}</strong></div>
                {result.filtration && (
                  <div style={{ gridColumn: '1 / -1' }}>
                    <span style={{ color: 'var(--text-dim)' }}>Filtration: </span>
                    <strong>{result.filtration}{result.settlingHours ? ` · settled ${result.settlingHours}h` : ''}</strong>
                  </div>
                )}
              </div>
            </div>
          )}
          <div className="result-actions">
            <button onClick={() => { setSubmitted(false); resetForm(); }} className="btn btn-gold">
              Log Another <ArrowRight size={14} />
            </button>
            <button onClick={() => switchView('proc-incoming')} className="btn btn-soft">
              Back to Incoming
            </button>
          </div>
        </div>
      ) : (
        <div style={{ maxWidth: '760px' }}>
          <form onSubmit={handleSubmit} className="panel">
            <div className="field" style={{ marginBottom: '20px' }}>
              <label className="field-label">Select Batch *</label>
              <select value={selectedBatch} onChange={e => setSelectedBatch(e.target.value)} required className="select">
                <option value="">Choose a batch to process...</option>
                {processing.map(b => (
                  <option key={b.id} value={b.id}>{b.id} — {b.hiveId} — {b.honeyType} — {b.quantity}kg — {b.status}</option>
                ))}
              </select>
            </div>

            {batch && (
              <div className="grid-3 notice">
                <div><span style={{ color: 'var(--text-dim)' }}>Hive: </span><strong>{batch.hiveId}</strong></div>
                <div><span style={{ color: 'var(--text-dim)' }}>Type: </span><strong>{batch.honeyType}</strong></div>
                <div><span style={{ color: 'var(--text-dim)' }}>Input Qty: </span><strong>{batch.quantity} kg</strong></div>
              </div>
            )}

            <div className="section-title">Extraction Details</div>
            <div className="grid-2">
              <div className="field">
                <label className="field-label">Extraction Unit *</label>
                <select value={form.extractionUnit} onChange={e => update('extractionUnit', e.target.value)} required className="select">
                  <option value="">Select unit...</option>
                  {EXTRACTION_UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                </select>
              </div>
              <div className="field">
                <label className="field-label">Processing Temp (°C)</label>
                <input type="number" step="0.1" value={form.temperature} onChange={e => update('temperature', e.target.value)} placeholder="e.g. 32 (must be below 35°C)" className="input" />
              </div>
              <div className="field">
                <label className="field-label">Input Quantity (kg) *</label>
                <input type="number" step="0.1" min="0" value={form.inputQty} onChange={e => update('inputQty', e.target.value)} placeholder={batch ? String(batch.quantity) : '0'} required className="input" />
              </div>
              <div className="field">
                <label className="field-label">Output Quantity (kg) *</label>
                <input type="number" step="0.1" min="0" value={form.outputQty} onChange={e => update('outputQty', e.target.value)} placeholder="e.g. 11.2 (after filtering loss)" required className="input" />
              </div>
              <div className="field">
                <label className="field-label">Duration (minutes)</label>
                <input type="number" min="0" value={form.duration} onChange={e => update('duration', e.target.value)} placeholder="e.g. 45" className="input" />
              </div>
              <div className="field">
                <label className="field-label">Pooling Note</label>
                <input type="text" value={form.poolingNote} onChange={e => update('poolingNote', e.target.value)} placeholder="e.g. Pooled from HIVE-BOX-01 & 02" className="input" />
              </div>
            </div>

            <div className="section-title">Filtration &amp; Settling</div>
            <div className="grid-2">
              <div className="field">
                <label className="field-label">Filtration Method</label>
                <select value={form.filtrationMethod} onChange={e => update('filtrationMethod', e.target.value)} className="select">
                  <option value="">Select method...</option>
                  {FILTRATION_METHODS.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
              <div className="field">
                <label className="field-label">Settling Time (hours)</label>
                <input type="number" min="0" step="0.5" value={form.settlingHours} onChange={e => update('settlingHours', e.target.value)} placeholder="e.g. 24" className="input" />
              </div>
            </div>

            <div className="field mt-16">
              <label className="field-label">Notes</label>
              <textarea value={form.notes} onChange={e => update('notes', e.target.value)} rows={3} placeholder="Any observations during processing..." className="textarea" />
            </div>

            <button type="submit" disabled={submitting || !selectedBatch} className="btn btn-block btn-gold mt-20">
              <Settings size={16} />
              {submitting ? 'Logging Processing...' : 'Complete Processing & Log to Blockchain'}
            </button>
          </form>
        </div>
      )}

      {records.length > 0 && (
        <div className="glass-card mt-16">
          <div className="panel-title" style={{ marginBottom: '10px' }}>Processing Records</div>
          <div className="table-scroll">
            <table className="hc-table">
              <thead>
                <tr>
                  {['Batch ID', 'Production Batch', 'Processed At', 'Location', 'Input → Output', 'Filtration'].map(h => (
                    <th key={h}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {records.map(b => (
                  <tr key={b.id}>
                    <td style={{ fontWeight: 600, color: 'var(--amber-400)' }}>{b.id}</td>
                    <td>{b.productionBatchId || '—'}</td>
                    <td className="muted">{fmtDate(b.production.processedAt)}</td>
                    <td>{b.production.location || '—'}</td>
                    <td className="muted">
                      {b.production.inputQuantity ?? b.quantity ?? '—'} kg → {b.production.outputQuantity ?? '—'} kg
                    </td>
                    <td className="muted">
                      {b.production.filtration
                        ? `${b.production.filtration.method}${b.production.filtration.settlingHours != null ? ` · ${b.production.filtration.settlingHours}h` : ''}`
                        : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </section>
  );
}