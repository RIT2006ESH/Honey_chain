import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { Twitter, Instagram, Linkedin, CheckCircle2 } from 'lucide-react';
import './styles/index.css';
import { AppProvider, useApp } from './context/AppContext';
import { VIEW_PATHS } from './routeConfig';

import Header from './components/Header';
import LoginPage from './components/LoginPage';
import CertificateModal from './components/CertificateModal';
import { BeeMark } from './components/landing/Illustrations';

import Overview from './pages/Overview';
import HiveMonitor from './pages/HiveMonitor';
import AIInsights from './pages/AIInsights';
import BlockchainTrace from './pages/BlockchainTrace';
import ConsumerScan from './pages/ConsumerScan';
import ScaleUp from './pages/ScaleUp';

import PendingVerification from './pages/quality/PendingVerification';
import QualityTestForm from './pages/quality/QualityTestForm';
import QualityHistory from './pages/quality/QualityHistory';
import RejectedBatches from './pages/quality/RejectedBatches';
import QualityStandards from './pages/quality/QualityStandards';
import QualityReports from './pages/quality/QualityReports';
import HivesView from './pages/quality/HivesView';

import Processing from './pages/processor/Processing';
import IncomingBatches from './pages/processor/IncomingBatches';
import ProcessingLog from './pages/processor/ProcessingLog';
import Packaging from './pages/processor/Packaging';
import Inventory from './pages/processor/Inventory';
import DistributionHandoff from './pages/processor/DistributionHandoff';
import FacilityInfo from './pages/processor/FacilityInfo';
import ProcessorBatches from './pages/processor/ProcessorBatches';

import MyBatches from './pages/beekeeper/MyBatches';
import HarvestSubmission from './pages/beekeeper/HarvestSubmission';
import BeekeeperAlerts from './pages/beekeeper/BeekeeperAlerts';
import BeekeeperEarnings from './pages/beekeeper/BeekeeperEarnings';
import BeekeeperProfile from './pages/beekeeper/BeekeeperProfile';

const VIEWS = {
  overview: Overview,
  monitor: HiveMonitor,
  ai: AIInsights,
  chain: BlockchainTrace,
  qr: ConsumerScan,
  scale: ScaleUp,
  quality: PendingVerification,
  'quality-test': QualityTestForm,
  'quality-history': QualityHistory,
  'quality-rejected': RejectedBatches,
  'quality-standards': QualityStandards,
  'quality-reports': QualityReports,
  hives: HivesView,
  processing: Processing,
  'proc-incoming': IncomingBatches,
  'processing-log': ProcessingLog,
  packaging: Packaging,
  inventory: Inventory,
  dispatch: DistributionHandoff,
  facility: FacilityInfo,
  'proc-batches': ProcessorBatches,
  'my-batches': MyBatches,
  harvest: HarvestSubmission,
  'bk-alerts': BeekeeperAlerts,
  earnings: BeekeeperEarnings,
  'bk-profile': BeekeeperProfile,
};

function NotificationBanner() {
  const { notification } = useApp();
  if (!notification) return null;
  return (
    <div className="app-notice" role="status">
      <CheckCircle2 size={16} /> {notification}
    </div>
  );
}

function AppRoute({ viewKey }) {
  const ActivePage = VIEWS[viewKey] || Overview;
  return <ActivePage />;
}

function AppShell() {
  const { activeView, setActiveView, setBatchIdInput } = useApp();
  const location = useLocation();

  // Scroll to top whenever the URL route changes (incl. back/forward)
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [location.pathname]);

  // Handle URL hash routing for QR code scans: #verify/BATCH_ID
  useEffect(() => {
    const hash = window.location.hash;
    if (hash && hash.startsWith('#verify/')) {
      const batchId = hash.replace('#verify/', '');
      if (batchId) {
        setBatchIdInput(batchId);
        setActiveView('qr');
      }
    }
  }, [setActiveView, setBatchIdInput]);

  if (activeView === 'login') {
    return <LoginPage />;
  }

  return (
    <div className="app-container">
      <div className="comb-overlay"></div>
      <Header />
      <main className="wrap">
        <NotificationBanner />
        <Routes>
          {Object.entries(VIEW_PATHS)
            .filter(([key]) => key !== 'login')
            .map(([key, path]) => (
              <Route key={path} path={path} element={<AppRoute viewKey={key} />} />
            ))}
          <Route path="*" element={<AppRoute viewKey="overview" />} />
        </Routes>
      </main>
      <CertificateModal />
      <AppFooter />
    </div>
  );
}

function AppFooter() {
  const { switchView } = useApp();
  const goSection = (id) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    } else {
      switchView('overview');
      setTimeout(() => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' }), 300);
    }
  };

  return (
    <footer className="app-footer">
      <div className="footer-top">
        <div className="footer-col footer-col-brand">
          <div className="footer-logo"><BeeMark size={34} /></div>
          <div className="footer-name">Honey Chain</div>
          <p className="footer-desc">
            Blockchain honey traceability and smart beekeeping for KVIC's rural
            beekeepers — every jar, verifiable at the source.
          </p>
          <span className="footer-kvic">Made for KVIC Beekeepers</span>
        </div>

        <div className="footer-col">
          <h4 className="footer-title">Quick Links</h4>
          <nav className="footer-col-nav">
            <button onClick={() => { switchView('overview'); window.scrollTo({ top: 0 }); }}>Home</button>
            <button onClick={() => switchView('chain')}>Trace</button>
            <button onClick={() => switchView('monitor')}>Dashboard</button>
            <button onClick={() => goSection('commitment')}>About</button>
          </nav>
        </div>

        <div className="footer-col">
          <h4 className="footer-title">Features</h4>
          <nav className="footer-col-nav">
            <button onClick={() => switchView('chain')}>Blockchain</button>
            <button onClick={() => switchView('monitor')}>IoT Monitor</button>
            <button onClick={() => switchView('ai')}>AI Analytics</button>
            <button onClick={() => switchView('qr')}>QR Verify</button>
          </nav>
        </div>

        <div className="footer-col footer-col-contact">
          <h4 className="footer-title">Contact</h4>
          <div className="footer-info">KVIC Honey Mission Office</div>
          <div className="footer-info">hello@honeychain.in</div>
          <div className="footer-info">+91 98765 43210</div>
          <div className="footer-socials">
            <a href="https://x.com" aria-label="X (Twitter)" target="_blank" rel="noreferrer"><Twitter size={16} /></a>
            <a href="https://instagram.com" aria-label="Instagram" target="_blank" rel="noreferrer"><Instagram size={16} /></a>
            <a href="https://linkedin.com" aria-label="LinkedIn" target="_blank" rel="noreferrer"><Linkedin size={16} /></a>
          </div>
        </div>
      </div>

      <div className="footer-bottom">
        <span>© 2024 Honey Chain · KVIC Honey Mission</span>
        <span className="footer-bottom-tag">Blockchain Traceability · Smart Beekeeping</span>
      </div>
    </footer>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppProvider>
        <AppShell />
      </AppProvider>
    </BrowserRouter>
  );
}
