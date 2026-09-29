import React, { useState, useEffect } from 'react';
import { ShieldCheck, ShieldAlert, Clock3, CheckCircle2, XCircle, MapPin, User, Cpu } from 'lucide-react';

// Two-step confirm: the primary button rests on "Are you sure?" and only
// commits on the second click ("Yes, approve").
function useApproveConfirm() {
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    if (!confirming) return undefined;
    const t = setTimeout(() => setConfirming(false), 5000);
    return () => clearTimeout(t);
  }, [confirming]);

  const onApproveClick = (approve) => {
    if (confirming) {
      setConfirming(false);
      approve();
    } else {
      setConfirming(true);
    }
  };

  return { confirming, setConfirming, onApproveClick };
}

function formatWhen(iso) {
  if (!iso) return 'just now';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return 'recently';
  return d.toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
}

const STEPS = [
  { n: '1', label: 'Registration submitted' },
  { n: '2', label: 'Review' },
  { n: '3', label: 'Live telemetry stream' },
];

function Stepper({ current }) {
  return (
    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', margin: '18px 0' }}>
      {STEPS.map((s, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <div
            key={s.n}
            style={{
              flex: '1 1 180px',
              minHeight: '64px',
              padding: '12px 14px',
              borderRadius: '12px',
              border: `1px solid ${active ? 'var(--border-highlight)' : 'var(--border-subtle)'}`,
              background: done ? 'var(--emerald-bg)' : active ? 'var(--gold-gradient-soft)' : 'var(--bg-inset)',
              opacity: done || active ? 1 : 0.65,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
              <span
                className="mono"
                style={{
                  width: '20px', height: '20px', borderRadius: '50%',
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '11px', fontWeight: 700,
                  background: done ? 'var(--emerald-400)' : active ? 'var(--amber-400)' : 'var(--bg-card)',
                  color: done ? '#0f0b04' : active ? '#0f0b04' : 'var(--text-muted)',
                }}
              >
                {done ? '✓' : s.n}
              </span>
              <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-main)' }}>{s.label}</span>
            </div>
            <div className="field-hint" style={{ marginTop: '5px' }}>
              {i === 0 ? 'Hive queued on the registration ledger'
                : i === 1 ? 'A signed-in user must sign off'
                : 'Sensor packets appear in this dashboard'}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// Full-area replacement shown while the selected hive is not live yet.
export function HiveApprovalState({ hive, isApprover, onApprove, onReject, busy }) {
  const { confirming, setConfirming, onApproveClick } = useApproveConfirm();
  const status = hive.approvalStatus || 'APPROVED';
  const pending = status !== 'REJECTED';
  const requestedAt = (hive.approval && hive.approval.requestedAt) || null;

  return (
    <div className="glass-card" data-testid="hive-approval-state">
      <div className="mm-cb-title mm-cb-title--row">
        {pending ? <Clock3 size={14} /> : <ShieldAlert size={14} />}
        {pending ? 'AWAITING REVIEW' : 'REGISTRATION REJECTED'}
      </div>

      <p className="muted" style={{ margin: 0, maxWidth: '62ch', lineHeight: 1.65 }}>
        {pending
          ? `${hive.hiveId || 'This hive'} was registered at ${formatWhen(requestedAt)} and is queued for review. Sensor packets stay hidden until the request is accepted.`
          : `This registration was declined by ${(hive.approval && hive.approval.reviewedBy) || 'a reviewer'} on ${formatWhen(hive.approval && hive.approval.reviewedAt)}. No telemetry will be streamed for it.`}
      </p>

      <Stepper current={pending ? 1 : 2} />

      <div className={`notice ${pending ? 'notice-warn' : 'notice-danger'}`}>
        <div style={{ display: 'flex', gap: '9px', alignItems: 'flex-start' }}>
          {pending ? <ShieldCheck size={16} style={{ flexShrink: 0, marginTop: '1px' }} /> : <XCircle size={16} style={{ flexShrink: 0, marginTop: '1px' }} />}
          <div>
            <div style={{ fontWeight: 700 }}>
              {pending ? 'Review required' : 'Not part of the monitoring network'}
            </div>
            <div style={{ marginTop: '3px', opacity: 0.9 }}>
              {pending
                ? (isApprover
                  ? 'Review the registration details below and approve to start the live data stream.'
                  : 'Sign in with your account to accept or decline this request.')
                : (hive.approval && hive.approval.note) || 'Rejected by reviewer.'}
            </div>
          </div>
        </div>
      </div>

      <div className="divider-top" style={{ marginTop: '18px' }}>
        <div className="grid-3" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: '14px' }}>
          <div>
            <div className="meta-label">Requested hive location</div>
            <div className="meta-value"><MapPin size={12} /> {hive.loc || 'Location TBD'}</div>
          </div>
          <div>
            <div className="meta-label">Beekeeper</div>
            <div className="meta-value"><User size={12} /> {hive.beekeeper || 'Unassigned'}</div>
          </div>
          <div>
            <div className="meta-label">Device / firmware</div>
            <div className="meta-value"><Cpu size={12} /> {hive.firmware || 'v2.3.1'}</div>
          </div>
        </div>
      </div>

      {isApprover && pending && (
        <div className="flex" style={{ gap: '10px', marginTop: '20px', flexWrap: 'wrap' }}>
          <button
            className="btn-luxury btn-luxury-primary"
            onClick={() => onApproveClick(() => onApprove(hive))}
            disabled={busy}
            style={{ opacity: busy ? 0.6 : 1 }}
          >
            <CheckCircle2 size={15} /> {busy ? 'Approving…' : confirming ? 'Yes, approve' : 'Are you sure?'}
          </button>
          <button
            className="btn-luxury btn-luxury-ghost"
            onClick={() => { setConfirming(false); onReject(hive); }}
            disabled={busy}
            style={{ opacity: busy ? 0.6 : 1 }}
          >
            <XCircle size={15} /> Reject
          </button>
        </div>
      )}
    </div>
  );
}

// Queue of every registration still waiting for a decision (shown to signed-in users).
export function ApprovalQueue({ pending, onApprove, onReject, busyId }) {
  const [confirmId, setConfirmId] = useState(null);

  // Auto-disarm the confirm state if the reviewer doesn't commit in time
  useEffect(() => {
    if (!confirmId) return undefined;
    const t = setTimeout(() => setConfirmId(null), 5000);
    return () => clearTimeout(t);
  }, [confirmId]);

  if (!pending.length) return null;

  return (
    <div className="glass-card" style={{ borderTop: '2px solid var(--amber-500)' }} data-testid="approval-queue">
      <div className="mm-cb-title mm-cb-title--row">
        <ShieldCheck size={14} /> HIVE REGISTRATION REQUESTS ({pending.length})
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {pending.map(h => (
          <div
            key={h.id}
            style={{
              display: 'flex', gap: '14px', alignItems: 'center', flexWrap: 'wrap',
              padding: '12px 14px', borderRadius: '12px',
              border: '1px solid var(--border-subtle)', background: 'var(--bg-inset)',
            }}
          >
            <div style={{ flex: '1 1 220px', minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <span className="mono" style={{ fontWeight: 700, fontSize: '13px' }}>{h.id}</span>
                <span className="pill pill-sm" style={{ background: 'var(--gold-gradient-soft)', color: 'var(--amber-400)', border: '1px solid var(--border-highlight)' }}>
                  Pending
                </span>
              </div>
              <div className="muted" style={{ fontSize: '12.5px', marginTop: '4px' }}>
                {h.loc || 'Location TBD'} · {h.beekeeper || 'Unassigned'} · {h.cluster || 'No cluster'}
              </div>
            </div>
            <div className="flex" style={{ gap: '8px' }}>
              <button
                className="btn-luxury btn-luxury-primary"
                onClick={() => {
                  if (confirmId === h.id) {
                    setConfirmId(null);
                    onApprove(h);
                  } else {
                    setConfirmId(h.id);
                  }
                }}
                disabled={busyId === h.id}
                style={{ opacity: busyId === h.id ? 0.6 : 1, padding: '9px 16px', fontSize: '13px' }}
              >
                {busyId === h.id ? 'Approving…' : confirmId === h.id ? 'Yes, approve' : 'Are you sure?'}
              </button>
              <button
                className="btn-luxury btn-luxury-ghost"
                onClick={() => { setConfirmId(null); onReject(h); }}
                disabled={busyId === h.id}
                style={{ opacity: busyId === h.id ? 0.6 : 1, padding: '9px 16px', fontSize: '13px' }}
              >
                Reject
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
