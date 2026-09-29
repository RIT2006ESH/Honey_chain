import React, { useState } from 'react';
import { Layers, CheckCircle2, Circle, Truck } from 'lucide-react';
import { useApp } from '../../context/AppContext';

const PIPELINE = [
  { key: 'HARVEST_CREATED', label: 'Harvest' },
  { key: 'HARVEST_VERIFIED', label: 'Verified' },
  { key: 'PROCESSED', label: 'Processed' },
  { key: 'QA_APPROVED', label: 'QA Approved' },
  { key: 'PACKAGED', label: 'Packaged' },
];

// Statuses that can still be handed over to the processing facility
const SENDABLE = ['HARVEST_CREATED', 'HARVEST_VERIFIED', 'QUALITY_VERIFIED', 'CERTIFIED'];

function stageIndex(status) {
  if (status === 'QUALITY_VERIFIED' || status === 'CERTIFIED') return 1;
  const idx = PIPELINE.findIndex(p => p.key === status);
  return idx === -1 ? 0 : idx;
}

function formatSentAt(iso) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
}

export default function MyBatches() {
  const { sharedBatches, switchView, setBatchIdInput, sendToProcessor } = useApp();
  const [sendingId, setSendingId] = useState(null);

  const handleSend = async (batchId) => {
    setSendingId(batchId);
    await sendToProcessor(batchId);
    setSendingId(null);
  };

  return (
    <section className="view-pane active" id="view-my-batches">
      <div className="flow-title-row">
        <div className="eyebrow-badge"><Layers size={13} /> My Harvest Batches</div>
        <h2>My Batches</h2>
        <p className="section-lede">Track every batch you've registered as it moves through quality testing, processing and packaging — and send each harvest on to the processor.</p>
      </div>

      <div className="flex-col gap-20">
        {sharedBatches.map(batch => {
          const idx = stageIndex(batch.status);
          const canSend = SENDABLE.includes(batch.status) && !batch.handoff;
          return (
            <div key={batch.id} className="glass-card">
              <div className="panel-head">
                <div>
                  <h3 style={{ margin: 0, color: 'var(--amber-400)' }}>{batch.id}</h3>
                  <div className="muted" style={{ marginTop: '4px' }}>
                    Hive: {batch.hiveId} • {batch.honeyType} • {batch.quantity} kg
                  </div>
                </div>
                <div className="flex" style={{ gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                  {batch.handoff && (
                    <span
                      className="pill pill-sm"
                      style={{ background: 'var(--emerald-bg)', color: 'var(--emerald-400)', border: '1px solid var(--emerald-border)' }}
                      title={batch.handoff.note}
                    >
                      <Truck size={12} style={{ marginRight: '5px' }} />
                      Sent to processor · {formatSentAt(batch.handoff.sentAt)}
                    </span>
                  )}
                  {canSend && (
                    <button
                      className="btn-luxury btn-luxury-primary btn-sm"
                      onClick={() => handleSend(batch.id)}
                      disabled={sendingId === batch.id}
                      style={{ opacity: sendingId === batch.id ? 0.6 : 1 }}
                    >
                      <Truck size={13} />
                      {sendingId === batch.id ? 'Sending…' : 'Send to Processor'}
                    </button>
                  )}
                  <button
                    className="btn-luxury btn-luxury-ghost btn-sm"
                    onClick={() => { setBatchIdInput(batch.id); switchView('chain'); }}
                  >
                    View Full Trace →
                  </button>
                </div>
              </div>

              <div className="flex table-scroll">
                {PIPELINE.map((stage, i) => (
                  <React.Fragment key={stage.key}>
                    <div className="flex-col flex-center" style={{ minWidth: '90px' }}>
                      {i <= idx
                        ? <CheckCircle2 size={20} color="var(--emerald-400)" />
                        : <Circle size={20} color="var(--border-subtle)" />}
                      <div style={{ fontSize: '11.5px', marginTop: '6px', color: i <= idx ? 'var(--text-main)' : 'var(--text-muted)', textAlign: 'center' }}>
                        {stage.label}
                      </div>
                    </div>
                    {i < PIPELINE.length - 1 && (
                      <div style={{ flex: 1, height: '2px', background: i < idx ? 'var(--emerald-400)' : 'var(--border-subtle)', marginBottom: '20px' }} />
                    )}
                  </React.Fragment>
                ))}
              </div>
            </div>
          );
        })}
        {sharedBatches.length === 0 && (
          <div className="glass-card state-empty">
            No batches yet — register a harvest from Hive Monitor to start one.
          </div>
        )}
      </div>
    </section>
  );
}