import React, { useMemo, useState } from 'react';
import {
  Search, CheckCircle2, Radio, Thermometer, Droplets, Scale, Wind, Cloud, LayoutGrid, List, Plus, X
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import FleetGrid from '../components/hive-monitor/FleetGrid';
import AIHealthSnapshot from '../components/hive-monitor/AIHealthSnapshot';
import AlertsPanel from '../components/hive-monitor/AlertsPanel';
import DeviceMetaPanel from '../components/hive-monitor/DeviceMetaPanel';
import TrendsPanel from '../components/hive-monitor/TrendsPanel';
import { HiveApprovalState, ApprovalQueue } from '../components/hive-monitor/ApprovalPanel';

const STATE_META = {
  ok: { label: 'Online', color: 'var(--emerald-400)' },
  warn: { label: 'Watch', color: 'var(--amber-400)' },
  low: { label: 'Low Batt.', color: '#f87171' },
};

const FLOWERS = ['Litchi Blossom', 'Mustard', 'Wildflower', 'Eucalyptus', 'Sundarbans Mangrove', 'Acacia', 'Coffee Blossom', 'Floral Mix'];

export default function HiveMonitor() {
  const {
    hives, activeHive, setActiveHive, curHive, currentUser,
    handleRegisterHarvest, handleAddHive, approveHive, rejectHive
  } = useApp();
  const [hiveSearch, setHiveSearch] = useState('');
  const [viewMode, setViewMode] = useState('single');
  const [timeRange, setTimeRange] = useState('24H');
  const [showAddModal, setShowAddModal] = useState(false);
  const [addForm, setAddForm] = useState({ location: '', beekeeperName: '', floralSource: 'Wildflower', cluster: '' });
  const [adding, setAdding] = useState(false);
  const [reviewingId, setReviewingId] = useState(null);

  const isApprover = !!currentUser;
  const activeApproval = curHive?.approvalStatus || 'APPROVED';

  const hiveList = useMemo(() => Object.entries(hives).map(([id, h]) => ({
    id,
    loc: h.loc || 'Location unavailable',
    state: h.state || 'ok',
    approval: h.approvalStatus || 'APPROVED',
    beekeeper: h.beekeeper,
    cluster: h.cluster,
  })), [hives]);

  const pendingList = useMemo(
    () => hiveList.filter(h => h.approval === 'PENDING'),
    [hiveList]
  );

  const liveHives = useMemo(() => {
    const out = {};
    Object.entries(hives).forEach(([id, h]) => {
      if ((h.approvalStatus || 'APPROVED') === 'APPROVED') out[id] = h;
    });
    return out;
  }, [hives]);

  const filteredHiveList = useMemo(() => {
    const q = hiveSearch.trim().toLowerCase();
    if (!q) return hiveList;
    return hiveList.filter(h => h.id.toLowerCase().includes(q) || h.loc.toLowerCase().includes(q));
  }, [hiveList, hiveSearch]);

  const goToHive = (id) => { setActiveHive(id); setViewMode('single'); };

  const review = async (decision, hive) => {
    const id = (hive && (hive.id || hive.hiveId)) || activeHive;
    setReviewingId(id);
    const mapped = await (decision === 'approve' ? approveHive(id) : rejectHive(id));
    setReviewingId(null);
    if (mapped && decision === 'approve') goToHive(id);
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    if (!addForm.location.trim()) return;
    setAdding(true);
    const newId = await handleAddHive(addForm);
    setAdding(false);
    if (newId) {
      setActiveHive(newId);
      setViewMode('single');
      setShowAddModal(false);
      setAddForm({ location: '', beekeeperName: '', floralSource: 'Wildflower', cluster: '' });
    }
  };

  return (
    <section className="view-pane active" id="view-monitor">
      <div className="monitor-dashboard-layout">
        {/* LEFT SIDEBAR — HIVES */}
        <div className="monitor-sidebar">
          <div className="ms-controls-row">
            <div className="ms-search-wrap">
              <Search size={14} className="ms-search-icon" />
              <input
                type="text" className="ms-search-input" placeholder="Search Hive ID/location..."
                value={hiveSearch} onChange={e => setHiveSearch(e.target.value)}
              />
            </div>
            <button className="btn-luxury btn-luxury-ghost ms-add-btn" onClick={() => setShowAddModal(true)}>
              <Plus size={14} /> <span>Add Hive</span>
            </button>
          </div>

          {pendingList.length > 0 && (
            <div className={`notice ${isApprover ? 'notice-warn' : 'notice-info'}`} style={{ fontSize: '12px' }}>
              {pendingList.length} registration{pendingList.length > 1 ? 's' : ''} awaiting review
            </div>
          )}

          <div className="ms-hive-list">
            {filteredHiveList.map(h => {
              const meta = STATE_META[h.state] || STATE_META.ok;
              const status = h.approval === 'PENDING'
                ? { label: 'Pending', color: 'var(--amber-400)' }
                : h.approval === 'REJECTED'
                  ? { label: 'Rejected', color: '#f87171' }
                  : meta;
              return (
                <div key={h.id} className={`ms-hive-item ${viewMode === 'single' && h.id === activeHive ? 'active' : ''}`} onClick={() => goToHive(h.id)}>
                  <div className="ms-h-top">
                    <span className="ms-h-id">{h.id}</span>
                    <span className="ms-h-status" style={{ color: status.color }}>● {status.label}</span>
                  </div>
                  <div className="ms-h-loc">{h.loc}</div>
                </div>
              );
            })}
            {filteredHiveList.length === 0 && (
              <div className="muted" style={{ padding: '10px 4px' }}>No hives match "{hiveSearch}".</div>
            )}
          </div>
        </div>

        {/* ADD HIVE MODAL */}
        {showAddModal && (
          <div className="modal-backdrop-blur" onClick={() => setShowAddModal(false)}>
            <div className="passport-modal-window" onClick={e => e.stopPropagation()} style={{ maxWidth: '480px' }}>
              <button className="btn-close-modal" onClick={() => setShowAddModal(false)}><X size={16} /></button>
              <h3 className="modal-title">Register New Hive</h3>
              <p className="muted" style={{ margin: '0 0 20px' }}>
                The hive is queued for review — sensor data goes live only after it is accepted.
              </p>
              <form onSubmit={handleAddSubmit} className="flex-col" style={{ gap: '14px' }}>
                <div>
                  <label className="field-label">Location *</label>
                  <input
                    type="text" required placeholder="e.g. Satara Apiary, Maharashtra"
                    value={addForm.location} onChange={e => setAddForm(f => ({ ...f, location: e.target.value }))}
                    className="input"
                  />
                </div>
                <div>
                  <label className="field-label">Beekeeper Name</label>
                  <input
                    type="text" placeholder="e.g. Ganesh Pawar"
                    value={addForm.beekeeperName} onChange={e => setAddForm(f => ({ ...f, beekeeperName: e.target.value }))}
                    className="input"
                  />
                </div>
                <div className="grid-2">
                  <div>
                    <label className="field-label">Floral Source</label>
                    <select
                      value={addForm.floralSource} onChange={e => setAddForm(f => ({ ...f, floralSource: e.target.value }))}
                      className="select"
                    >
                      {FLOWERS.map(f => <option key={f} value={f}>{f}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="field-label">Cluster</label>
                    <input
                      type="text" placeholder="e.g. Satara"
                      value={addForm.cluster} onChange={e => setAddForm(f => ({ ...f, cluster: e.target.value }))}
                      className="input"
                    />
                  </div>
                </div>
                <button
                  type="submit" className="btn-luxury btn-luxury-primary mt-8"
                  disabled={adding || !addForm.location.trim()}
                  style={{ opacity: adding || !addForm.location.trim() ? 0.6 : 1 }}
                >
                  {adding ? 'Registering...' : 'Register Hive'}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* MAIN CONTENT AREA */}
        <div className="monitor-main-area">
          {/* Registration approval queue (any signed-in role) */}
          {isApprover && (
            <ApprovalQueue
              pending={pendingList}
              onApprove={h => review('approve', h)}
              onReject={h => review('reject', h)}
              busyId={reviewingId}
            />
          )}

          {/* Header card */}
          <div className="mm-header-card glass-card">
            <div className="mm-h-top">
              <div>
                <h2 className="mm-h-title">
                  {viewMode === 'fleet' ? 'All Hives — Fleet View' : `Hive ${activeHive}`}
                  {viewMode === 'single' && activeApproval === 'APPROVED' && <span className="mm-badge-online">Online</span>}
                  {viewMode === 'single' && activeApproval === 'PENDING' && (
                    <span className="pill" style={{ background: 'var(--gold-gradient-soft)', color: 'var(--amber-400)', border: '1px solid var(--border-highlight)' }}>
                      Pending approval
                    </span>
                  )}
                  {viewMode === 'single' && activeApproval === 'REJECTED' && (
                    <span className="pill" style={{ background: 'var(--rose-bg)', color: 'var(--rose-400)', border: '1px solid var(--rose-border)' }}>
                      Rejected
                    </span>
                  )}
                </h2>
                <div className="muted">
                  {viewMode === 'fleet'
                    ? `${Object.keys(liveHives).length} hives across ${new Set(Object.values(liveHives).map(h => h.cluster || h.loc?.split(',')[0])).size} clusters`
                    : (curHive?.loc || 'Location unavailable') + (curHive?.beekeeper ? ` • Beekeeper: ${curHive.beekeeper}` : '')
                  }
                </div>
              </div>
              <div className="flex" style={{ gap: '10px' }}>
                <button
                  className="btn-luxury btn-luxury-ghost"
                  onClick={() => setViewMode(v => (v === 'fleet' ? 'single' : 'fleet'))}
                >
                  {viewMode === 'fleet' ? <><List size={15} /> Single Hive</> : <><LayoutGrid size={15} /> Fleet View</>}
                </button>
                {viewMode === 'single' && activeApproval === 'APPROVED' && (
                  <button className="btn-luxury btn-luxury-primary" onClick={() => alert('Mock: Export Data triggered')}>Export Data</button>
                )}
              </div>
            </div>
          </div>

          {viewMode === 'fleet' ? (
            <>
              {pendingList.length > 0 && (
                <div className="notice notice-warn" style={{ fontSize: '12.5px' }}>
                  {pendingList.length} hive{pendingList.length > 1 ? 's' : ''} awaiting review — hidden from fleet view until accepted.
                </div>
              )}
              <FleetGrid hives={liveHives} onSelectHive={goToHive} />
            </>
          ) : activeApproval !== 'APPROVED' ? (
            <HiveApprovalState
              hive={curHive}
              isApprover={isApprover}
              onApprove={h => review('approve', h)}
              onReject={h => review('reject', h)}
              busy={reviewingId === (curHive?.hiveId || activeHive)}
            />
          ) : (
            <>
              {/* Status strip */}
              <div className="mm-status-strip">
                <div className="mm-ss-item"><CheckCircle2 size={16} color="var(--emerald-400)" /> Online</div>
                <div className="mm-ss-item"><CheckCircle2 size={16} color={curHive.state === 'ok' ? 'var(--emerald-400)' : 'var(--amber-400)'} /> {curHive.health || 'Healthy'}</div>
                <div className="mm-ss-item"><Radio size={16} color="var(--emerald-400)" /> IoT Connected</div>
              </div>

              {/* Core Sensor Readings */}
              <div className="mm-cb-title" style={{ margin: '20px 0 10px' }}>CORE SENSOR READINGS</div>
              <div className="mm-sensor-grid">
                <div className="mm-sensor-card">
                  <div className="mm-sc-label"><Thermometer size={14} /> Internal Temp</div>
                  <div className="mm-sc-val">{(curHive.temp ?? 34.8).toFixed(1)}°C</div>
                  <div className="field-hint" style={{ marginTop: '4px' }}>Brood range 34–35°C</div>
                </div>
                <div className="mm-sensor-card">
                  <div className="mm-sc-label"><Droplets size={14} /> Humidity</div>
                  <div className="mm-sc-val">{Math.round(curHive.hum ?? 63)}%</div>
                  <div className="field-hint" style={{ marginTop: '4px' }}>Optimal 45–70%</div>
                </div>
                <div className="mm-sensor-card">
                  <div className="mm-sc-label"><Scale size={14} /> Hive Weight</div>
                  <div className="mm-sc-val">{(curHive.wt ?? 34.1).toFixed(1)} kg</div>
                  <div className="field-hint" style={{ marginTop: '4px' }}>{curHive.wtDelta || '+0.0 kg'} (24h)</div>
                </div>
                <div className="mm-sensor-card">
                  <div className="mm-sc-label"><Radio size={14} /> Acoustic Buzz</div>
                  <div className="mm-sc-val">{(curHive.act || 'Normal').split(' ')[0]}</div>
                  <div className="field-hint" style={{ marginTop: '4px' }}>{curHive.act || 'Normal (240Hz)'}</div>
                </div>
                <div className="mm-sensor-card">
                  <div className="mm-sc-label"><Cloud size={14} /> Ambient / Weather</div>
                  <div className="mm-sc-val">{curHive.extTemp != null ? `${curHive.extTemp.toFixed(1)}°C` : '—'}</div>
                  <div className="field-hint" style={{ marginTop: '4px' }}>{curHive.weather || 'No data'}</div>
                </div>
                <div className="mm-sensor-card">
                  <div className="mm-sc-label"><Wind size={14} /> CO₂ Level</div>
                  <div className="mm-sc-val">{curHive.co2 ?? '—'} ppm</div>
                  <div className="field-hint" style={{ marginTop: '4px' }}>Ventilation indicator</div>
                </div>
              </div>

              {/* AI Health & Alerts row */}
              <div className="grid-2" style={{ marginTop: '20px' }}>
                <AIHealthSnapshot hive={curHive} />
                <AlertsPanel hive={curHive} />
              </div>

              {/* Trends & History */}
              <div className="mt-20">
                <TrendsPanel hive={curHive} range={timeRange} onChangeRange={setTimeRange} />
              </div>

              {/* Device & Metadata */}
              <div className="mt-20">
                <DeviceMetaPanel hiveId={activeHive} hive={curHive} />
              </div>

              {/* Recent telemetry + event timeline */}
              <div className="mm-bottom-grid mt-20">
                <div className="mm-table-card glass-card">
                  <div className="mm-cb-title">Recent Telemetry</div>
                  <table className="mm-table">
                    <thead><tr><th>Time</th><th>Temp</th><th>Hum</th><th>Weight</th><th>Batt</th><th>Status</th></tr></thead>
                    <tbody>
                      <tr><td>Just now</td><td>{(curHive.temp ?? 34.8).toFixed(1)}°C</td><td>{Math.round(curHive.hum ?? 63)}%</td><td>{(curHive.wt ?? 34.1).toFixed(1)} kg</td><td>{Math.round(curHive.batt ?? 88)}%</td><td className="status-ok">{curHive.health || 'Healthy'}</td></tr>
                      <tr><td>3 mins ago</td><td>{((curHive.temp ?? 34.8) - 0.1).toFixed(1)}°C</td><td>{Math.round(curHive.hum ?? 63)}%</td><td>{(curHive.wt ?? 34.1).toFixed(1)} kg</td><td>{Math.round(curHive.batt ?? 88)}%</td><td className="status-ok">{curHive.health || 'Healthy'}</td></tr>
                      <tr><td>6 mins ago</td><td>{((curHive.temp ?? 34.8) - 0.1).toFixed(1)}°C</td><td>{Math.round((curHive.hum ?? 63) - 1)}%</td><td>{((curHive.wt ?? 34.1) - 0.1).toFixed(1)} kg</td><td>{Math.round(curHive.batt ?? 88)}%</td><td className="status-ok">{curHive.health || 'Healthy'}</td></tr>
                    </tbody>
                  </table>
                </div>

                <div className="mm-timeline-card glass-card">
                  <div className="mm-cb-title">Hive Events &amp; Inspection Log</div>
                  <div className="mm-timeline">
                    <div className="mm-tl-item"><div className="mm-tl-dot ok"></div><div className="mm-tl-content"><div className="mm-tl-time">2 mins ago</div><div className="mm-tl-desc">Data synced successfully</div></div></div>
                    <div className="mm-tl-item"><div className="mm-tl-dot ok"></div><div className="mm-tl-content"><div className="mm-tl-time">1 hr ago</div><div className="mm-tl-desc">Routine health check completed</div></div></div>
                    <div className="mm-tl-item"><div className="mm-tl-dot ok"></div><div className="mm-tl-content"><div className="mm-tl-time">4 hrs ago</div><div className="mm-tl-desc">Temperature within normal range</div></div></div>
                    <div className="mm-tl-item"><div className="mm-tl-dot info"></div><div className="mm-tl-content"><div className="mm-tl-time">12 hrs ago</div><div className="mm-tl-desc">Weight changed by {curHive.wtDelta || '+0.2kg'}</div></div></div>
                    <div className="mm-tl-item"><div className="mm-tl-dot ok"></div><div className="mm-tl-content"><div className="mm-tl-time">1 day ago</div><div className="mm-tl-desc">Battery level normal</div></div></div>
                  </div>
                </div>
              </div>

              {/* Beekeeper: Register Harvest */}
              {currentUser?.role === 'BEEKEEPER' && (
                <div className="glass-card" style={{ marginTop: '20px', borderTop: '2px solid var(--amber-500)' }}>
                  <h4 className="section-title">Register Honey Harvest</h4>
                  <form onSubmit={handleRegisterHarvest} className="grid-4-auto">
                    <div>
                      <label className="field-label" style={{ marginBottom: '8px' }}>Honey Type</label>
                      <select className="select" id="honeyType">
                        <option value="Raw Multifloral Honey">Raw Multifloral Honey</option>
                        <option value="Litchi Monofloral Honey">Litchi Monofloral Honey</option>
                        <option value="Mustard Honey">Mustard Honey</option>
                        <option value="Eucalyptus Honey">Eucalyptus Honey</option>
                        <option value="Wildflower Honey">Wildflower Honey</option>
                        <option value="Sundarbans Mangrove Honey">Sundarbans Mangrove Honey</option>
                        <option value="Acacia Honey">Acacia Honey</option>
                        <option value="Coffee Blossom Honey">Coffee Blossom Honey</option>
                      </select>
                    </div>
                    <div>
                      <label className="field-label" style={{ marginBottom: '8px' }}>Extraction Method</label>
                      <select className="select" id="extractionMethod">
                        <option value="Centrifugal Cold Extraction">Centrifugal Cold Extraction</option>
                        <option value="Stainless Steel Centrifugal">Stainless Steel Centrifugal</option>
                        <option value="Crush and Strain">Crush and Strain</option>
                        <option value="Flow Hive Extraction">Flow Hive Extraction</option>
                        <option value="Manual Comb Uncapping">Manual Comb Uncapping</option>
                        <option value="Pressure Extraction">Pressure Extraction</option>
                      </select>
                    </div>
                    <div>
                      <label className="field-label" style={{ marginBottom: '8px' }}>Quantity (kg)</label>
                      <input type="number" id="harvestQty" defaultValue={8.4} step="0.1" required className="input" />
                    </div>
                    <div>
                      <label className="field-label" style={{ marginBottom: '8px' }}>Harvest Date</label>
                      <input type="date" id="harvestDate" defaultValue={new Date().toISOString().split('T')[0]} required className="input" />
                    </div>
                    <button type="submit" className="btn-luxury btn-luxury-primary btn-lg">Create Batch</button>
                  </form>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </section>
  );
}
