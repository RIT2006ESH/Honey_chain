import React, { useState } from 'react';
import { Package, CheckCircle2, ArrowRight } from 'lucide-react';
import { useApp } from '../../context/AppContext';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:4000';

const PACKAGING_TYPES = [
  'Glass Jar with Tamper-Evident Seal (500g)',
  'Glass Jar with Tamper-Evident Seal (250g)',
  'Glass Jar with Tamper-Evident Seal (1kg)',
  'Plastic Squeeze Bottle (500g)',
  'Tin Container (1kg)',
  'Bulk Pail (5kg)',
];

export default function Packaging() {
  const { sharedBatches, switchView, showNotification } = useApp();
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState('');
  const [result, setResult] = useState(null);

  // Only batches approved by the tester can move to manufacturing/packaging
  const approved = sharedBatches.filter(b => b.status === 'QA_APPROVED');

  const [form, setForm] = useState({
    jarCount: '',
    jarWeight: '',
    sealDate: '',
    bestBefore: '',
    packagingType: '',
    batchNumber: '',
    location: 'Nashik Packing Works',
    notes: '',
  });

  const update = (key, val) => setForm(f => ({ ...f, [key]: val }));
  const batch = sharedBatches.find(b => b.id === selectedBatch);

  // Live final quantity: jar count x jar weight
  const weightKg = (() => {
    const s = (form.jarWeight || '').toLowerCase().trim();
    const n = parseFloat(s);
    if (Number.isNaN(n)) return null;
    return s.includes('kg') ? n : n / 1000;
  })();
  const finalQuantityKg = form.jarCount && weightKg
    ? (parseFloat(form.jarCount) * weightKg).toFixed(2).replace(/\.00$/, '')
    : null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedBatch) return;
    setSubmitting(true);

    try {
      const res = await fetch(`${API_BASE}/api/batches/${selectedBatch}/packaging`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jarCount: parseInt(form.jarCount) || 0,
          jarWeight: form.jarWeight || '500g',
          sealDate: form.sealDate || new Date().toISOString(),
          bestBefore: form.bestBefore || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
          packagingType: form.packagingType,
          packagedBatchId: form.batchNumber || (batch?.productionBatchId ? `PKG-${batch.productionBatchId}` : `PKG-${selectedBatch}`),
          location: form.location,
          notes: form.notes,
        }),
      });
      const data = await res.json();
      if (!data.ok) {
        showNotification(data.error || `Could not package ${selectedBatch}`);
        return;
      }
      setResult(data.batch.packaging);
      setSubmitted(true);
      showNotification(`Packaging complete for ${selectedBatch}`);
    } catch (e) {
      showNotification('Could not package batch. Is backend running?');
    } finally {
      setSubmitting(false);
    }
  };

  const today = new Date().toISOString().split('T')[0];

  return (
    <section className="view-pane active">
        <div className="flow-title-row">
        <div className="eyebrow-badge"><Package size={13} /> Packaging</div>
        <h2>Package Batch</h2>
        <p className="section-lede">Package tester-approved honey: final product batch, quantity, package size, date and location — then generate its QR code.</p>
      </div>

      {submitted ? (
        <div className="result-hero">
          <div className="result-icon success">
            <CheckCircle2 size={32} color="var(--emerald-400)" />
          </div>
          <h3 className="result-title" style={{ color: 'var(--emerald-400)' }}>Packaging Complete</h3>
          <p className="result-sub">
            {selectedBatch} — {result?.jarCount || form.jarCount} jars sealed. QR code ready.
          </p>
          {result && (
            <div className="notice" style={{ maxWidth: '560px', margin: '12px auto 0', textAlign: 'left' }}>
              <div className="grid-2" style={{ gap: '8px 16px' }}>
                <div><span style={{ color: 'var(--text-dim)' }}>Product batch: </span><strong style={{ color: 'var(--amber-400)' }}>{result.packagedBatchId}</strong></div>
                <div><span style={{ color: 'var(--text-dim)' }}>Final quantity: </span><strong>{result.finalQuantityKg != null ? `${result.finalQuantityKg} kg` : `${result.jarCount} × ${result.jarWeight}`}</strong></div>
                <div><span style={{ color: 'var(--text-dim)' }}>Package size: </span><strong>{result.jarCount} × {result.jarWeight}</strong></div>
                <div><span style={{ color: 'var(--text-dim)' }}>Packaged on: </span><strong>{result.sealDate ? new Date(result.sealDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}</strong></div>
                <div style={{ gridColumn: '1 / -1' }}><span style={{ color: 'var(--text-dim)' }}>Location: </span><strong>{result.location}</strong></div>
              </div>
            </div>
          )}
          <div className="result-actions">
            <button onClick={() => switchView('inventory')} className="btn btn-gold">
              View Inventory &amp; QR <ArrowRight size={14} />
            </button>
            <button onClick={() => { setSubmitted(false); setResult(null); setForm({ jarCount: '', jarWeight: '', sealDate: '', bestBefore: '', packagingType: '', batchNumber: '', location: 'Nashik Packing Works', notes: '' }); }} className="btn btn-soft">
              Package Another
            </button>
          </div>
        </div>
      ) : (
        <div style={{ maxWidth: '760px' }}>
          <form onSubmit={handleSubmit} className="panel">
            <div className="field" style={{ marginBottom: '20px' }}>
              <label className="field-label">Select Approved Batch *</label>
              <select value={selectedBatch} onChange={e => setSelectedBatch(e.target.value)} required className="select">
                <option value="">Choose a QA-approved batch...</option>
                {approved.map(b => (
                  <option key={b.id} value={b.id}>{b.id} — {b.honeyType} — {b.quantity}kg</option>
                ))}
              </select>
              {approved.length === 0 && <div className="field-hint">No approved batches. The tester approves processed batches for manufacturing first.</div>}
            </div>

            {batch && (
              <>
                <div className="grid-4 notice">
                  <div><span style={{ color: 'var(--text-dim)' }}>Batch: </span><strong>{batch.id}</strong></div>
                  <div><span style={{ color: 'var(--text-dim)' }}>Type: </span><strong>{batch.honeyType}</strong></div>
                  <div><span style={{ color: 'var(--text-dim)' }}>Qty: </span><strong>{batch.quantity} kg</strong></div>
                  <div><span style={{ color: 'var(--text-dim)' }}>Hive: </span><strong>{batch.hiveId}</strong></div>
                </div>
                {batch.qualityTest && (
                  <div className="field-hint" style={{ marginTop: '-12px', marginBottom: '16px' }}>
                    Approved by {batch.qualityTest.tester || 'Tester'}
                    {batch.qualityTest.testedAt ? ` on ${new Date(batch.qualityTest.testedAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}` : ''}
                    {batch.qualityTest.labName ? ` · ${batch.qualityTest.labName}` : ''}
                  </div>
                )}
              </>
            )}

            <div className="section-title">Packaging Details</div>
            <div className="grid-2">
              <div className="field">
                <label className="field-label">Packaging Type *</label>
                <select value={form.packagingType} onChange={e => update('packagingType', e.target.value)} required className="select">
                  <option value="">Select packaging...</option>
                  {PACKAGING_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div className="field">
                <label className="field-label">Final Product Batch ID</label>
                <input
                  type="text"
                  value={form.batchNumber}
                  onChange={e => update('batchNumber', e.target.value)}
                  placeholder={batch?.productionBatchId ? `PKG-${batch.productionBatchId}` : (selectedBatch ? `PKG-${selectedBatch}` : 'PKG-HC-XXXX')}
                  className="input"
                />
                <div className="field-hint">Unique per product batch; encoded in the QR code.</div>
              </div>
              <div className="field">
                <label className="field-label">Jar Count *</label>
                <input type="number" min="1" value={form.jarCount} onChange={e => update('jarCount', e.target.value)} placeholder="e.g. 24" required className="input" />
              </div>
              <div className="field">
                <label className="field-label">Package Size (per jar)</label>
                <input type="text" value={form.jarWeight} onChange={e => update('jarWeight', e.target.value)} placeholder="500g" className="input" />
                {finalQuantityKg && (
                  <div className="field-hint">Final quantity: <strong>{finalQuantityKg} kg</strong> ({form.jarCount} × {form.jarWeight})</div>
                )}
              </div>
              <div className="field">
                <label className="field-label">Packaging / Seal Date *</label>
                <input type="date" value={form.sealDate || today} onChange={e => update('sealDate', e.target.value)} required className="input" />
              </div>
              <div className="field">
                <label className="field-label">Best Before</label>
                <input type="date" value={form.bestBefore} onChange={e => update('bestBefore', e.target.value)} className="input" />
              </div>
              <div className="field">
                <label className="field-label">Manufacturing Location *</label>
                <input type="text" value={form.location} onChange={e => update('location', e.target.value)} required className="input" placeholder="e.g. Nashik Packing Works" />
                <div className="field-hint">Recorded with the packaging date on the batch record.</div>
              </div>
            </div>

            <div className="field mt-16">
              <label className="field-label">Notes</label>
              <textarea value={form.notes} onChange={e => update('notes', e.target.value)} rows={2} placeholder="Packaging notes..." className="textarea" />
            </div>

            <button type="submit" disabled={submitting || !selectedBatch} className="btn btn-block btn-gold mt-20">
              <Package size={16} />
              {submitting ? 'Packaging...' : 'Complete Packaging & Generate QR'}
            </button>
          </form>
        </div>
      )}
    </section>
  );
}