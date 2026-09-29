import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { initialHives } from '../data/mockData';
import { VIEW_PATHS, viewForPath } from '../routeConfig';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:4000';

const AppContext = createContext(null);

// Legacy seeds carry no approvalStatus -> treat them as already live.
export function hiveApprovalStatus(hive) {
  return (hive && hive.approvalStatus) || 'APPROVED';
}

export function isHiveLive(hive) {
  return hiveApprovalStatus(hive) === 'APPROVED';
}

function stateForHealth(health) {
  if (health === 'WARNING') return 'warn';
  if (health === 'CRITICAL' || health === 'POOR' || health === 'REJECTED' || health === 'PENDING') return 'low';
  return 'ok';
}

// Normalises a backend hive (or a partially filled one) into the shape every
// dashboard panel expects. Tolerates missing telemetry so nothing throws.
export function mapApiHive(h = {}) {
  const t = h.telemetry || {};
  const buzz = Number(t.acousticFreqHz);
  const gps = h.gps || h.coordinates || null;

  return {
    hiveId: h.hiveId || null,
    loc: h.location,
    cluster: h.cluster || (h.location ? h.location.split(',')[0] : undefined),
    temp: t.internalTemp,
    hum: t.humidity,
    wt: t.weightKg,
    wtDelta: t.weightDelta24h || '+0.0 kg',
    buzzHz: Number.isFinite(buzz) ? buzz : null,
    act: Number.isFinite(buzz)
      ? (buzz > 400 ? `Elevated (${buzz}Hz)` : `Normal (${buzz}Hz)`)
      : 'Awaiting first reading',
    batt: t.batteryLevel,
    powerSource: h.powerSource || 'Solar-assisted',
    co2: t.co2Ppm,
    extTemp: t.ambientTemp,
    weather: h.weather,
    floral: h.floralSource,
    queenStatus: h.queenStatus,
    health: h.colonyHealth,
    healthScore: h.healthScore,
    swarmRisk: h.swarmRisk,
    diseaseRisk: h.diseaseRisk,
    yieldForecastKg: h.yieldForecastKg,
    alertSeverity: h.alertSeverity,
    beekeeper: h.beekeeper,
    gps: gps && gps.lat != null ? gps : null,
    firmware: h.firmwareVersion || h.firmware,
    calibrationDue: h.calibrationDue,
    lastUpdated: t.lastUpdated || null,
    approvalStatus: hiveApprovalStatus(h),
    approval: h.approval || null,
    state: stateForHealth(h.colonyHealth),
  };
}

export function AppProvider({ children }) {
  const location = useLocation();
  const navigate = useNavigate();

  const [theme, setTheme] = useState('light');
  const activeView = useMemo(() => viewForPath(location.pathname), [location.pathname]);

  const setActiveView = useCallback((viewName) => {
    const path = VIEW_PATHS[viewName];
    if (path && path !== location.pathname) {
      navigate(path);
    }
  }, [location.pathname, navigate]);
  const [hives, setHives] = useState(initialHives);
  const [activeHive, setActiveHive] = useState('H001');
  const [batchIdInput, setBatchIdInput] = useState('KVIC-HC-2026-0417');
  const [isScanned, setIsScanned] = useState(false);
  const [showFullCertModal, setShowFullCertModal] = useState(false);

  // Auth state
  const [currentUser, setCurrentUser] = useState(null);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginError, setLoginError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Shared prototype data
  const [sharedBatches, setSharedBatches] = useState([]);
  const [notification, setNotification] = useState(null);
  const [dashboardStats, setDashboardStats] = useState(null);
  const [ledger, setLedger] = useState(null);

  const [activePopover, setActivePopover] = useState(null);
  const [productionRange, setProductionRange] = useState('30');

  const showNotification = useCallback((msg) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 4000);
  }, []);

  const fetchBatches = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/batches`);
      const data = await res.json();
      if (data.ok) setSharedBatches(data.batches);
    } catch (err) { /* backend not running in static demo mode */ }
  }, []);

  const fetchHives = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/iot/hives`);
      const data = await res.json();
      if (!data.ok || !data.hives || data.hives.length === 0) return;
      const hivesMap = {};
      data.hives.forEach(h => { hivesMap[h.hiveId] = mapApiHive(h); });
      setHives(hivesMap);
      setActiveHive(prev => (hivesMap[prev] ? prev : Object.keys(hivesMap)[0]));
    } catch (err) { /* keep mock hives */ }
  }, []);

  useEffect(() => {
    fetchBatches();
    const iv = setInterval(fetchBatches, 10000);
    return () => clearInterval(iv);
  }, [fetchBatches]);

  // Keep hive telemetry in sync with the backend (approval state + live values)
  useEffect(() => {
    fetchHives();
    const iv = setInterval(fetchHives, 8000);
    return () => clearInterval(iv);
  }, [fetchHives]);

  const switchView = useCallback((viewName) => {
    setActiveView(viewName);
  }, [setActiveView]);

  const handleLogin = useCallback(async (e) => {
    e.preventDefault();
    setLoginError('');
    try {
      const res = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail })
      });
      const data = await res.json();
      if (data.ok) {
        setCurrentUser(data.user);
        setActiveView('overview');
      } else {
        setLoginError(data.error);
      }
    } catch (err) {
      setLoginError('Login failed. Is backend running?');
    }
  }, [loginEmail, setActiveView]);

  const handleRegisterHarvest = useCallback(async (e) => {
    e.preventDefault();
    const honeyType = e.target.elements.honeyType.value;
    const extractionMethod = e.target.elements.extractionMethod.value;
    const quantity = parseFloat(e.target.elements.harvestQty.value);
    const harvestDate = e.target.elements.harvestDate.value;

    try {
      const res = await fetch(`${API_BASE}/api/batches`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hiveId: activeHive, honeyType, extractionMethod, quantity, harvestDate })
      });
      const data = await res.json();
      if (data.ok) {
        showNotification(`Batch ${data.batch.id} created!`);
        fetchBatches();
        setActiveView('overview');
      }
    } catch (err) { /* no-op in static demo mode */ }
  }, [activeHive, fetchBatches, showNotification, setActiveView]);

  const handleVerifyBatch = useCallback(async (batchId) => {
    try {
      await fetch(`${API_BASE}/api/batches/${batchId}/verify`, { method: 'POST' });
      showNotification(`Batch ${batchId} verified!`);
      fetchBatches();
    } catch (err) { /* no-op */ }
  }, [fetchBatches, showNotification]);

  const handleQualitySubmit = useCallback(async (e, batchId) => {
    e.preventDefault();
    try {
      await fetch(`${API_BASE}/api/batches/${batchId}/quality`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          moisture: e.target.elements.moisture.value,
          purity: e.target.elements.purity.value,
          hmf: e.target.elements.hmf.value,
          result: e.target.elements.result.value
        })
      });
      showNotification(`Quality metrics submitted for ${batchId}`);
      fetchBatches();
    } catch (err) { /* no-op */ }
  }, [fetchBatches, showNotification]);

  const handleProcessSubmit = useCallback(async (e, batchId) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_BASE}/api/batches/${batchId}/process`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          center: e.target.elements.center.value,
          qtyProcessed: e.target.elements.qtyProcessed.value
        })
      });
      const data = await res.json();
      if (data.ok) {
        showNotification(`Batch ${batchId} processed!`);
        fetchBatches();
      } else {
        showNotification(data.error || `Could not process batch ${batchId}`);
      }
    } catch (err) {
      showNotification('Could not process batch. Is backend running?');
    }
  }, [fetchBatches, showNotification]);

  const handlePackageSubmit = useCallback(async (batchId) => {
    try {
      await fetch(`${API_BASE}/api/batches/${batchId}/package`, { method: 'POST' });
      showNotification(`Batch ${batchId} packaged & QR generated!`);
      fetchBatches();
    } catch (err) { /* no-op */ }
  }, [fetchBatches, showNotification]);

  // Beekeeper hands a harvested batch over to the processing facility
  const sendToProcessor = useCallback(async (batchId) => {
    try {
      const res = await fetch(`${API_BASE}/api/batches/${batchId}/handoff`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sender: (currentUser && currentUser.name) || undefined })
      });
      const data = await res.json();
      if (data.ok) {
        showNotification(`${batchId} sent to the processor`);
        fetchBatches();
        return true;
      }
      showNotification(data.error || 'Could not send batch to the processor');
    } catch (err) {
      showNotification('Could not send batch. Is backend running?');
    }
    return false;
  }, [currentUser, fetchBatches, showNotification]);

  const handleAddHive = useCallback(async (hiveData) => {
    try {
      const res = await fetch(`${API_BASE}/api/iot/hives`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(hiveData)
      });
      const data = await res.json();
      if (data.ok && data.hive) {
        const h = data.hive;
        setHives(prev => ({ ...prev, [h.hiveId]: mapApiHive(h) }));
        showNotification(`${h.hiveId} submitted — awaiting review`);
        return h.hiveId;
      }
      showNotification(data.error || 'Failed to register hive');
    } catch (err) {
      showNotification('Failed to add hive. Is backend running?');
    }
    return null;
  }, [showNotification]);

  // Review of a hive registration request (approve / reject)
  const reviewHive = useCallback(async (hiveId, decision) => {
    try {
      const res = await fetch(`${API_BASE}/api/iot/hives/${hiveId}/${decision}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-role': (currentUser && currentUser.role) || ''
        },
        body: JSON.stringify({
          reviewer: (currentUser && currentUser.name) || 'Reviewer',
          note: decision === 'approve' ? 'Approved from Hive Monitor' : 'Rejected from Hive Monitor'
        })
      });
      const data = await res.json();
      if (data.ok && data.hive) {
        const mapped = mapApiHive(data.hive);
        setHives(prev => ({ ...prev, [hiveId]: { ...prev[hiveId], ...mapped } }));
        showNotification(
          decision === 'approve'
            ? `${hiveId} approved — live telemetry now streaming`
            : `${hiveId} rejected — it stays out of the monitoring network`
        );
        return mapped;
      }
      showNotification(data.error || 'Review failed');
    } catch (err) {
      showNotification('Review failed. Is backend running?');
    }
    return null;
  }, [currentUser, showNotification]);

  const approveHive = useCallback((hiveId) => reviewHive(hiveId, 'approve'), [reviewHive]);
  const rejectHive = useCallback((hiveId) => reviewHive(hiveId, 'reject'), [reviewHive]);

  // Dynamic data fetched on mount (falls back silently to mock hives if backend absent)
  useEffect(() => {
    fetch(`${API_BASE}/api/kvic/dashboard`)
      .then(res => res.json())
      .then(data => { if (data.ok && data.stats) setDashboardStats(data.stats); })
      .catch(() => { /* no-op */ });

    fetch(`${API_BASE}/api/ledger`)
      .then(res => res.json())
      .then(data => { if (data.ok && data.blockchain) setLedger(data.blockchain); })
      .catch(() => { /* no-op */ });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync theme attribute to HTML root
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // Live telemetry tick for every hive so readings never look static.
  useEffect(() => {
    const round1 = v => Math.round(v * 10) / 10;
    const timer = setInterval(() => {
      setHives(prev => {
        let dirty = false;
        const next = { ...prev };
        Object.entries(prev).forEach(([id, hive]) => {
          if (hiveApprovalStatus(hive) !== 'APPROVED') return;
          if (hive.temp == null) return;
          dirty = true;

          const buzzHz = Number.isFinite(hive.buzzHz)
            ? Math.min(470, Math.max(190, Math.round(hive.buzzHz + (Math.random() - 0.5) * 14)))
            : hive.buzzHz;
          const deltaBase = parseFloat(String(hive.wtDelta || '+0.4').replace('+', '')) || 0.4;
          const newDelta = round1(Math.min(3, Math.max(-1, deltaBase + (Math.random() - 0.5) * 0.1)));

          next[id] = {
            ...hive,
            temp: round1(hive.temp + (Math.random() - 0.5) * 0.15),
            hum: Math.min(78, Math.max(40, Math.round((hive.hum ?? 58) + (Math.random() - 0.5) * 0.7))),
            wt: round1(Math.max(1, (hive.wt || 20) + Math.random() * 0.03)),
            wtDelta: `${newDelta >= 0 ? '+' : ''}${newDelta} kg`,
            buzzHz,
            act: Number.isFinite(buzzHz)
              ? (buzzHz > 400 ? `Elevated (${buzzHz}Hz)` : `Normal (${buzzHz}Hz)`)
              : hive.act,
            co2: Math.min(1250, Math.max(360, Math.round((hive.co2 ?? 520) + (Math.random() - 0.5) * 18))),
            extTemp: hive.extTemp != null ? round1(hive.extTemp + (Math.random() - 0.5) * 0.25) : hive.extTemp,
            lastSyncSec: 2 + Math.floor(Math.random() * 16)
          };
        });
        return dirty ? next : prev;
      });
    }, 3000);
    return () => clearInterval(timer);
  }, []);

  const curHive = hives[activeHive] || Object.values(hives)[0] || initialHives.H001;

  const tempSeriesData = useMemo(() => {
    const base = curHive.temp || 34.0;
    return Array.from({ length: 24 }, (_, i) => base + Math.sin(i / 3) * 1.4 + Math.cos(i / 2) * 0.3);
  }, [curHive.temp]);

  const weightSeriesData = useMemo(() => {
    const base = curHive.wt || 30.0;
    return Array.from({ length: 24 }, (_, i) => base - 1.8 + i * (1.8 / 23) + Math.sin(i / 4) * 0.1);
  }, [curHive.wt]);

  const value = {
    theme, setTheme,
    activeView, setActiveView, switchView,
    hives, setHives, activeHive, setActiveHive, curHive,
    tempSeriesData, weightSeriesData,
    batchIdInput, setBatchIdInput,
    isScanned, setIsScanned,
    showFullCertModal, setShowFullCertModal,
    currentUser, setCurrentUser,
    loginEmail, setLoginEmail,
    loginError, setLoginError,
    showPassword, setShowPassword,
    sharedBatches, setSharedBatches, fetchBatches,
    fetchHives, approveHive, rejectHive,
    notification, showNotification,
    dashboardStats, ledger,
    activePopover, setActivePopover,
    productionRange, setProductionRange,
    handleLogin, handleRegisterHarvest, handleVerifyBatch,
    handleQualitySubmit, handleProcessSubmit, handlePackageSubmit, handleAddHive,
    sendToProcessor,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within an AppProvider');
  return ctx;
}
