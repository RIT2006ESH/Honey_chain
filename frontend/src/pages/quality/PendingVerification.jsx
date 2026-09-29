import React, { useState } from 'react';
import { ShieldCheck, Clock, ChevronDown, ChevronUp, CheckCircle2, ExternalLink } from 'lucide-react';
import { useApp } from '../../context/AppContext';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:4000';

const STATUS_STYLES = {
  HARVEST_CREATED: { bg: 'rgba(251, 191, 36, 0.12)', color: 'var(--amber-400)', border: 'rgba(251, 191, 36, 0.3)', label: 'Awaiting Verification' },
  HARVEST_VERIFIED: { bg: 'rgba(96, 165, 250, 0.12)', color: '#60a5fa', border: 'rgba(96, 165, 250, 0.3)', label: 'Awaiting Handoff to Processor' },
  PROCESSED: { bg: 'rgba(167, 139, 250, 0.12)', color: '#a78bfa', border: 'rgba(167, 139, 250, 0.3)', label: 'Received from Processor' },
  QA_APPROVED: { bg: 'var(--emerald-bg)', color: 'var(--emerald-400)', border: 'var(--emerald-border)', label: 'Approved for Manufacturing' },
  CERTIFIED: { bg: 'var(--emerald-bg)', color: 'var(--emerald-400)', border: 'var(--emerald-border)', label: 'Certified' },
  REJECTED: { bg: 'var(--rose-bg)', color: 'var(--rose-400)', border: 'var(--rose-border)', label: 'Rejected' },
};

export default function PendingVerification() {
  const { sharedBatches, switchView } = useApp();
  const [expanded, setExpanded] = useState(null);
  const [verifying, setVerifying] = useState(null);

  const pending = sharedBatches.filter(b =>
    b.status === 'HARVEST_CREATED' || b.status === 'HARVEST_VERIFIED' || b.status === 'PROCESSED'
  );

  const handleVerify = async (batchId) => {
    setVerifying(batchId);
    try {
      await fetch(`${API_BASE}/api/batches/${batchId}/verify`, { method: 'POST' });
    } catch (e) {}
    setVerifying(null);
  };

  return (
    <section className="view-pane active">
      <div className="flow-title-row">
        <div className="eyebrow-badge"><ShieldCheck size={13} /> Quality Assurance</div>
        <h2>Pending Tests Queue</h2>
        <p className="section-lede">Approve harvest registrations, track batches heading to the processor, and test processed honey received from the processor.</p>
      </div>

      <div className="flex gap-12" style={{ marginBottom: '20px' }}>
        <div style={{ padding: '10px 18px', background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: '10px', fontSize: '13px' }}>
          <span style={{ color: 'var(--text-dim)' }}>Pending: </span>
          <strong style={{ color: 'var(--amber-400)' }}>{pending.length}</strong>
        </div>
        <div style={{ padding: '10px 18px', background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: '10px', fontSize: '13px' }}>
          <span style={{ color: 'var(--text-dim)' }}>To test: </span>
          <strong style={{ color: '#a78bfa' }}>{pending.filter(b => b.status === 'PROCESSED').length}</strong>
        </div>
        <button onClick={() => switchView('quality-history')} style={{ marginLeft: 'auto', padding: '10px 18px', background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: '10px', fontSize: '12px', color: 'var(--amber-400)', cursor: 'pointer', fontWeight: 600 }}>
          View Test History →
        </button>
      </div>

      <div className="flex-col gap-12">
        {pending.map(batch => {
          const st = STATUS_STYLES[batch.status] || STATUS_STYLES.HARVEST_CREATED;
          const isExpanded = expanded === batch.id;

          return (
            <div key={batch.id} style={{ background: 'var(--bg-card)', border: `1px solid ${st.border}`, borderRadius: '14px', overflow: 'hidden' }}>
              <div
                onClick={() => setExpanded(isExpanded ? null : batch.id)}
                className="flex-between"
                style={{ padding: '16px 20px', cursor: 'pointer' }}
              >
                <div className="flex" style={{ gap: '14px' }}>
                  <div className="flex-center" style={{ width: '40px', height: '40px', borderRadius: '10px', background: st.bg, color: st.color, fontSize: '18px' }}>
                    {batch.status === 'HARVEST_CREATED' ? <Clock size={20} /> : <CheckCircle2 size={20} />}
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '14px', color: 'var(--amber-400)' }}>{batch.id}</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                      Hive: {batch.hiveId} | {batch.honeyType} | {batch.quantity} kg | Beekeeper: {batch.beekeeper || 'Unknown'}
                    </div>
                  </div>
                </div>
                <div className="flex gap-12">
                  <span className="pill" style={{ background: st.bg, color: st.color, border: `1px solid ${st.border}` }}>{st.label}</span>
                  {isExpanded ? <ChevronUp size={16} color="var(--text-dim)" /> : <ChevronDown size={16} color="var(--text-dim)" />}
                </div>
              </div>

              {isExpanded && (
                <div style={{ padding: '0 20px 20px', borderTop: '1px solid var(--border-subtle)' }}>
                  <div className="grid-4 mt-16" style={{ marginBottom: '16px' }}>
                    {[
                      { label: 'Hive', value: batch.hiveId },
                      { label: 'Honey Type', value: batch.honeyType },
                      { label: 'Quantity', value: batch.quantity + ' kg' },
                      { label: 'Extraction', value: batch.extractionMethod || 'Centrifugal' },
                      { label: 'Floral Source', value: batch.floralSource || 'Multifloral' },
                      { label: 'Moisture', value: batch.moisture ? batch.moisture + '%' : 'Not tested' },
                      { label: 'Harvest Date', value: batch.harvestDate ? new Date(batch.harvestDate).toLocaleDateString() : '—' },
                      { label: 'Batch Created', value: batch.transactions?.[0]?.date ? new Date(batch.transactions[0].date).toLocaleDateString() : '—' },
                    ].map(item => (
                      <div key={item.label} style={{ padding: '10px', background: 'var(--bg-inset)', borderRadius: '8px' }}>
                        <div style={{ fontSize: '10px', color: 'var(--text-dim)', marginBottom: '3px' }}>{item.label}</div>
                        <div style={{ fontSize: '12.5px', fontWeight: 600 }}>{item.value}</div>
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-10">
                    {batch.status === 'HARVEST_CREATED' && (
                      <button
                        onClick={() => handleVerify(batch.id)}
                        disabled={verifying === batch.id}
                        style={{ padding: '10px 24px', background: 'var(--emerald-400)', border: 'none', borderRadius: '8px', color: '#0f0b04', fontWeight: 700, cursor: 'pointer', fontSize: '13px' }}
                      >
                        {verifying === batch.id ? 'Approving...' : 'Approve Harvest Registration'}
                      </button>
                    )}
                    {batch.status === 'HARVEST_VERIFIED' && (
                      <span style={{ padding: '10px 16px', fontSize: '12.5px', color: 'var(--text-dim)', background: 'var(--bg-inset)', borderRadius: '8px' }}>
                        Harvest approved — the beekeeper sends it to the processor next.
                      </span>
                    )}
                    {batch.status === 'PROCESSED' && (
                      <button
                        onClick={() => { window.__testingBatchId = batch.id; switchView('quality-test'); }}
                        className="btn btn-gold"
                      >
                        Run Lab Test on Processed Batch →
                      </button>
                    )}
                    <button
                      onClick={() => { window.__testingBatchId = batch.id; switchView('chain'); }}
                      className="btn btn-soft btn-sm"
                    >
                      <ExternalLink size={13} /> Blockchain Trace
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {pending.length === 0 && (
          <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-dim)', background: 'var(--bg-card)', borderRadius: '14px', border: '1px solid var(--border-subtle)' }}>
            <ShieldCheck size={40} style={{ marginBottom: '12px', opacity: 0.3 }} />
            <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '4px' }}>Queue Clear</div>
            <div style={{ fontSize: '12px' }}>No batches pending verification right now.</div>
          </div>
        )}
      </div>
    </section>
  );
}