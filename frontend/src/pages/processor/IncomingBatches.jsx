import React, { useState } from 'react';
import { Inbox, ArrowRight, CheckCircle2, Clock, Truck } from 'lucide-react';
import { useApp } from '../../context/AppContext';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:4000';

function formatSentAt(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
}

export default function IncomingBatches() {
  const { sharedBatches, switchView, fetchBatches, showNotification } = useApp();
  const [processing, setProcessing] = useState(null);
  const [receiving, setReceiving] = useState(null);

  // Raw honey is with the beekeeper until it is handed over and received here
  const PRE_PROCESSING = ['HARVEST_CREATED', 'HARVEST_VERIFIED', 'QUALITY_VERIFIED', 'CERTIFIED'];
  // Received consignments ready for extraction
  const incoming = sharedBatches.filter(b => PRE_PROCESSING.includes(b.status) && b.handoff && b.received);
  // Handed over by a beekeeper but not yet accepted at the facility
  const inTransit = sharedBatches.filter(b => PRE_PROCESSING.includes(b.status) && b.handoff && !b.received);
  // Processed — now waiting for the tester's lab test
  const inProgress = sharedBatches.filter(b => b.status === 'PROCESSED');

  const handleStartProcessing = async (batch) => {
    setProcessing(batch.id);
    try {
      if (batch.handoff && !batch.received) {
        const r = await fetch(`${API_BASE}/api/batches/${batch.id}/receive`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            receiver: 'Satara Processing Unit',
            acceptedQuantity: batch.quantity,
            note: `Accepted ${batch.honeyType} consignment from ${batch.handoff?.sender || 'beekeeper'}`,
          }),
        });
        const rd = await r.json();
        if (!rd.ok) {
          showNotification(rd.error || 'Could not receive the consignment');
          setProcessing(null);
          return;
        }
      }
      const res = await fetch(`${API_BASE}/api/batches/${batch.id}/process`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ startedAt: new Date().toISOString() }),
      });
      const data = await res.json();
      if (data.ok) {
        showNotification(`${batch.id} processing started`);
        fetchBatches();
      } else {
        showNotification(data.error || 'Could not start processing');
      }
    } catch (e) {
      showNotification('Could not start processing. Is backend running?');
    }
    setProcessing(null);
  };

  const handleReceive = async (batch) => {
    setReceiving(batch.id);
    try {
      const res = await fetch(`${API_BASE}/api/batches/${batch.id}/receive`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          receiver: 'Satara Processing Unit',
          acceptedQuantity: batch.quantity,
          note: `Accepted ${batch.honeyType} consignment from ${batch.handoff?.sender || 'beekeeper'}`,
        }),
      });
      const data = await res.json();
      if (data.ok) {
        showNotification(`${batch.id} received — ${batch.quantity} kg accepted`);
        fetchBatches();
      } else {
        showNotification(data.error || 'Could not receive batch');
      }
    } catch (e) {
      showNotification('Could not receive batch. Is backend running?');
    }
    setReceiving(null);
  };

  return (
    <section className="view-pane active">
      <div className="flow-title-row">
        <div className="eyebrow-badge"><Inbox size={13} /> Incoming Batches</div>
        <h2>Ready for Processing</h2>
        <p className="section-lede">Raw consignments received from beekeepers, awaiting extraction and processing.</p>
      </div>

      <div className="summary-strip">
        <span>Ready: <strong style={{ color: 'var(--amber-400)' }}>{incoming.length}</strong></span>
        <span>Processing: <strong style={{ color: '#60a5fa' }}>{inProgress.length}</strong></span>
        <span>In transit: <strong style={{ color: 'var(--emerald-400)' }}>{inTransit.length}</strong></span>
      </div>

      <div className="flex-col gap-12">
        {inTransit.length > 0 && (
          <>
            <div className="panel-title">In Transit from Beekeepers</div>
            {inTransit.map(batch => (
              <div key={batch.id} className="glass-card" style={{ borderColor: 'rgba(16, 185, 129, 0.3)' }}>
                <div className="flex-between">
                  <div className="flex gap-12">
                    <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: 'var(--emerald-bg)', border: '1px solid var(--emerald-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--emerald-400)' }}>
                      <Truck size={20} />
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '14px', color: 'var(--amber-400)' }}>{batch.id}</div>
                      <div className="muted">
                        From: {batch.handoff.sender} → {batch.handoff.receiver} · Sent {formatSentAt(batch.handoff.sentAt)}
                      </div>
                      <div className="muted">
                        Hive: {batch.hiveId} | {batch.honeyType} | {batch.quantity} kg ·{' '}
                        {batch.received
                          ? <>Accepted {batch.received.acceptedQuantity ?? batch.quantity} kg · {formatSentAt(batch.received.receivedAt)}</>
                          : <>In transit from {batch.handoff.sender}</>}
                      </div>
                    </div>
                  </div>
                  {batch.received ? (
                    <span className="pill pill-sm" style={{ background: 'rgba(167, 139, 250, 0.12)', color: '#a78bfa', border: '1px solid rgba(167, 139, 250, 0.3)' }}>
                      <CheckCircle2 size={12} style={{ marginRight: '4px' }} /> Received · {batch.received.receiver}
                    </span>
                  ) : (
                    <div className="flex gap-8" style={{ flexShrink: 0 }}>
                      <span className="pill pill-sm" style={{ background: 'var(--emerald-bg)', color: 'var(--emerald-400)', border: '1px solid var(--emerald-border)' }}>
                        In transit
                      </span>
                      <button
                        onClick={() => handleReceive(batch)}
                        disabled={receiving === batch.id}
                        className="btn btn-gold btn-sm"
                      >
                        {receiving === batch.id ? 'Receiving...' : 'Receive'}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </>
        )}

        {incoming.map(batch => (
          <div key={batch.id} className="glass-card">
            <div className="flex-between">
              <div className="flex gap-12">
                <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: 'var(--emerald-bg)', border: '1px solid var(--emerald-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--emerald-400)' }}>
                  <CheckCircle2 size={20} />
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '14px', color: 'var(--amber-400)' }}>{batch.id}</div>
                  <div className="muted">
                    Hive: {batch.hiveId} | {batch.honeyType} | {batch.quantity} kg | Beekeeper: {batch.beekeeper || 'Unknown'}
                    {batch.handoff && <> | Sent by: {batch.handoff.sender}</>}
                  </div>
                </div>
              </div>
              <button
                onClick={() => handleStartProcessing(batch)}
                disabled={processing === batch.id}
                className="btn btn-gold"
              >
                {processing === batch.id ? 'Starting...' : 'Start Processing'} <ArrowRight size={14} />
              </button>
            </div>
          </div>
        ))}

        {inProgress.length > 0 && (
          <>
            <div className="panel-title mt-8">Sent to Tester</div>
            {inProgress.map(batch => (
              <div key={batch.id} className="glass-card" style={{ borderColor: 'rgba(96, 165, 250, 0.3)' }}>
                <div className="flex-between">
                  <div className="flex gap-12">
                    <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: 'rgba(96, 165, 250, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#60a5fa' }}>
                      <Clock size={20} />
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '14px', color: '#60a5fa' }}>{batch.id}</div>
                      <div className="muted">
                        {batch.honeyType} | {batch.quantity} kg | Awaiting lab test &amp; approval for manufacturing
                      </div>
                    </div>
                  </div>
                  <button onClick={() => switchView('processing-log')} className="btn btn-soft btn-sm">
                    Log Details →
                  </button>
                </div>
              </div>
            ))}
          </>
        )}

        {incoming.length === 0 && inProgress.length === 0 && inTransit.length === 0 && (
          <div className="glass-card" style={{ textAlign: 'center' }}>
            <Inbox size={40} style={{ marginBottom: '12px', opacity: 0.3 }} />
            <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '4px' }}>No Incoming Batches</div>
            <div className="muted">Waiting for beekeeper consignments — batches appear here once sent and received.</div>
          </div>
        )}
      </div>
    </section>
  );
}
