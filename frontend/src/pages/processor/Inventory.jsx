import React, { useState, useEffect } from 'react';
import { Archive, Search, QrCode, Truck, Download, X } from 'lucide-react';
import { useApp } from '../../context/AppContext';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:4000';

const STATUS_STYLES = {
  PACKAGED: { bg: 'var(--emerald-bg)', color: 'var(--emerald-400)', border: 'var(--emerald-border)', label: 'Packaged', icon: <QrCode size={12} /> },
  DISPATCHED: { bg: 'rgba(96, 165, 250, 0.12)', color: '#60a5fa', border: 'rgba(96, 165, 250, 0.3)', label: 'Dispatched', icon: <Truck size={12} /> },
};

function fmtDate(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function Inventory() {
  const { switchView, setBatchIdInput } = useApp();
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [qrModal, setQrModal] = useState(null);
  const [qrLoading, setQrLoading] = useState(null);

  const fetchInventory = () => {
    setLoading(true);
    fetch(`${API_BASE}/api/inventory`)
      .then(r => r.json())
      .then(data => { if (data.ok) setInventory(data.inventory); })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchInventory(); }, []);

  const filtered = inventory
    .filter(i => filter === 'all' || i.status === filter)
    .filter(i => !search || i.id.toLowerCase().includes(search.toLowerCase()) || i.honeyType.toLowerCase().includes(search.toLowerCase()));

  const stats = {
    total: inventory.length,
    packaged: inventory.filter(i => i.status === 'PACKAGED').length,
    dispatched: inventory.filter(i => i.status === 'DISPATCHED').length,
    totalKg: inventory.reduce((s, i) => s + (i.quantity || 0), 0),
  };

  const handleGenerateQR = async (batchId) => {
    setQrLoading(batchId);
    try {
      const res = await fetch(`${API_BASE}/api/qr/${batchId}`);
      const data = await res.json();
      if (data.ok) {
        setQrModal({ batchId, dataUrl: data.dataUrl, url: data.verificationUrl });
      }
    } catch (e) {
      console.error('QR generation failed', e);
    } finally {
      setQrLoading(null);
    }
  };

  const handleDownloadQR = (batchId, dataUrl) => {
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = `QR_${batchId}.png`;
    link.click();
  };

  return (
    <section className="view-pane active">
      <div className="flow-title-row">
        <div className="eyebrow-badge"><Archive size={13} /> Inventory</div>
        <h2>Packaged Inventory</h2>
        <p className="section-lede">Packaged batches ready for distribution. Generate QR codes for consumer verification.</p>
      </div>

      <div className="kpi-grid" style={{ marginBottom: '20px' }}>
        {[
          { label: 'Total Items', value: stats.total, color: 'var(--text-main)' },
          { label: 'Packaged', value: stats.packaged, color: 'var(--emerald-400)' },
          { label: 'Dispatched', value: stats.dispatched, color: '#60a5fa' },
          { label: 'Total Kg', value: stats.totalKg.toFixed(1), color: 'var(--amber-400)' },
        ].map(card => (
          <div key={card.label} className="kpi-card">
            <div className="kpi-value" style={{ color: card.color }}>{card.value}</div>
            <div className="kpi-label">{card.label}</div>
          </div>
        ))}
      </div>

      <div className="toolbar">
        <div className="search-field">
          <Search size={14} />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by batch ID or type..." className="input" />
        </div>
        <div className="chip-group">
          {['all', 'PACKAGED', 'DISPATCHED'].map(f => (
            <button key={f} onClick={() => setFilter(f)} className={filter === f ? 'chip active' : 'chip'}>{f === 'all' ? 'All' : f.toLowerCase()}</button>
          ))}
        </div>
      </div>

      <div className="glass-card">
        {loading ? (
          <div className="state-loading">Loading inventory...</div>
        ) : filtered.length === 0 ? (
          <div className="state-empty">No inventory items found.</div>
        ) : (
          <div className="table-scroll">
            <table className="hc-table">
              <thead>
                <tr>
                  {['Batch ID', 'Honey Type', 'Qty', 'Package', 'Production Batch', 'Beekeeper', 'Status', 'QR Code', ''].map(h => (
                    <th key={h}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(item => {
                  const st = STATUS_STYLES[item.status] || STATUS_STYLES.PACKAGED;
                  return (
                    <tr key={item.id}>
                      <td style={{ fontWeight: 600, color: 'var(--amber-400)' }}>{item.id}</td>
                      <td>{item.honeyType}</td>
                      <td>{item.quantity} kg</td>
                      <td>
                        {item.packaging ? (
                          <div>
                            <div style={{ fontWeight: 600 }}>
                              {item.packaging.jarCount} × {item.packaging.jarWeight}
                              {item.packaging.finalQuantityKg != null ? ` (${item.packaging.finalQuantityKg} kg)` : ''}
                            </div>
                            <div className="muted" style={{ fontSize: '11px' }}>
                              {fmtDate(item.packaging.sealDate || item.packaging.packagedAt)} · {item.packaging.location || '—'}
                            </div>
                          </div>
                        ) : '—'}
                      </td>
                      <td className="muted" style={{ fontWeight: 600 }}>
                        {item.packaging?.packagedBatchId || item.productionBatchId || '—'}
                      </td>
                      <td className="muted">{item.beekeeper}</td>
                      <td>
                        <span className="pill" style={{ background: st.bg, color: st.color, border: `1px solid ${st.border}` }}>
                          {st.icon} {st.label}
                        </span>
                      </td>
                      <td>
                        <button
                          onClick={() => handleGenerateQR(item.id)}
                          disabled={qrLoading === item.id}
                          className="btn btn-sm btn-soft"
                          style={{ background: qrLoading === item.id ? 'var(--bg-inset)' : 'var(--emerald-bg)', color: qrLoading === item.id ? 'var(--text-dim)' : 'var(--emerald-400)', cursor: qrLoading === item.id ? 'wait' : 'pointer' }}
                        >
                          <QrCode size={12} />
                          {qrLoading === item.id ? 'Generating...' : 'Generate QR'}
                        </button>
                      </td>
                      <td>
                        <button onClick={() => { setBatchIdInput(item.id); switchView('chain'); }} className="btn btn-sm btn-soft" style={{ color: 'var(--amber-400)' }}>
                          Trace →
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {qrModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '20px' }} onClick={() => setQrModal(null)}>
          <div className="modal-window" style={{ maxWidth: '400px', textAlign: 'center' }} onClick={e => e.stopPropagation()}>
            <div className="panel-head">
              <span className="modal-title">QR Code</span>
              <button onClick={() => setQrModal(null)} style={{ background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer' }}><X size={18} /></button>
            </div>
            <div className="muted" style={{ marginBottom: '16px' }}>Batch: <strong style={{ color: 'var(--amber-400)' }}>{qrModal.batchId}</strong></div>
            <div style={{ background: '#fff', borderRadius: '12px', padding: '16px', display: 'inline-block', marginBottom: '16px' }}>
              <img src={qrModal.dataUrl} alt={`QR for ${qrModal.batchId}`} style={{ width: '220px', height: '220px' }} />
            </div>
            <div className="field-hint" style={{ marginBottom: '16px', wordBreak: 'break-all' }}>
              {qrModal.url}
            </div>
            <button onClick={() => handleDownloadQR(qrModal.batchId, qrModal.dataUrl)} className="btn btn-gold">
              <Download size={14} /> Download QR Code
            </button>
          </div>
        </div>
      )}
    </section>
  );
}