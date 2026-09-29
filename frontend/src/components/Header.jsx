import React, { useEffect, useRef, useState } from 'react';
import {
  Cpu, ShieldCheck, Search, Layers, Award, TrendingUp, Sparkles,
  Sun, Moon, BarChart3, Settings,
  Droplets, Bell, IndianRupee, User, FlaskConical, History, AlertTriangle, BookOpen,
  Inbox, Package, Archive, Truck, Building2, QrCode, Menu, X, LogIn, LogOut
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { BeeMark } from './landing/Illustrations';

const VIEW_ICONS = {
  overview: Award,
  monitor: Cpu,
  ai: Sparkles,
  chain: Layers,
  qr: Search,
  scale: TrendingUp,
  harvest: Droplets,
  'my-batches': Layers,
  'bk-alerts': Bell,
  earnings: IndianRupee,
  'bk-profile': User,
  quality: ShieldCheck,
  'quality-test': FlaskConical,
  'quality-history': History,
  'quality-rejected': AlertTriangle,
  'quality-standards': BookOpen,
  'quality-reports': BarChart3,
  hives: Cpu,
  'proc-incoming': Inbox,
  'processing-log': Settings,
  packaging: Package,
  inventory: Archive,
  dispatch: Truck,
  facility: Building2,
};

const NAV_ITEMS = {
  public: [
    ['overview', 'Overview'],
    ['monitor', 'Hive Monitor'],
    ['ai', 'AI Insights'],
    ['chain', 'Blockchain Trace'],
    ['qr', 'Consumer Scan'],
    ['scale', 'Scale-Up Plan'],
  ],
  BEEKEEPER: [
    ['monitor', 'My Hives'],
    ['ai', 'AI Insights'],
    ['harvest', 'Harvest'],
    ['my-batches', 'My Batches'],
    ['bk-alerts', 'Alerts'],
    ['earnings', 'Earnings'],
    ['bk-profile', 'Profile'],
  ],
  PROCESSOR: [
    ['overview', 'Overview'],
    ['proc-incoming', 'Incoming'],
    ['processing-log', 'Processing'],
  ],
  TESTER: [
    ['overview', 'Overview'],
    ['quality', 'Pending Queue'],
    ['quality-test', 'Lab Test'],
    ['quality-history', 'History'],
    ['quality-rejected', 'Rejected'],
    ['quality-standards', 'Standards'],
    ['quality-reports', 'Reports'],
    ['hives', 'Hives'],
    ['chain', 'Blockchain'],
  ],
  MANUFACTURER: [
    ['overview', 'Overview'],
    ['packaging', 'Packaging'],
    ['inventory', 'Inventory'],
    ['dispatch', 'Dispatch'],
    ['chain', 'Blockchain'],
    ['qr', 'Consumer Scan'],
  ],
};

export default function Header() {
  const { activeView, switchView, currentUser, setCurrentUser, theme, setTheme } = useApp();

  const [collapsed, setCollapsed] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const headerRef = useRef(null);
  const headbarRef = useRef(null);
  const navRef = useRef(null);
  const innerRef = useRef(null);
  const menuRef = useRef(null);
  const hamburgerRef = useRef(null);

  const mode = !currentUser ? 'public' : currentUser.role;
  const items = NAV_ITEMS[mode] || [];

  /* Responsive collapse based on window breakpoint (1024px) to avoid layout measurement feedback loops */
  useEffect(() => {
    const handleResize = () => {
      const isMobile = window.innerWidth <= 1024;
      setCollapsed(isMobile);
      if (!isMobile) {
        setMenuOpen(false);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  /* Close the mobile menu when the view or auth state changes. */
  useEffect(() => {
    setMenuOpen(false);
  }, [activeView, currentUser]);

  /* Close on Escape / outside click while the menu is open. */
  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e) => { if (e.key === 'Escape') setMenuOpen(false); };
    const onPointer = (e) => {
      if (headerRef.current && !headerRef.current.contains(e.target)) setMenuOpen(false);
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('pointerdown', onPointer);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('pointerdown', onPointer);
    };
  }, [menuOpen]);

  /* Focus management: first item on open, back to the hamburger on close. */
  const focusReturnRef = useRef(false);
  useEffect(() => {
    if (menuOpen) {
      const first = menuRef.current && menuRef.current.querySelector('.menu-action');
      if (first) first.focus();
    } else if (focusReturnRef.current && collapsed) {
      if (hamburgerRef.current) hamburgerRef.current.focus();
    }
    focusReturnRef.current = menuOpen;
  }, [menuOpen, collapsed]);

  const renderTabs = (className, iconSize) =>
    items.map(([view, label]) => {
      const Icon = VIEW_ICONS[view] || Sparkles;
      const active = activeView === view;
      return (
        <button
          key={view}
          type="button"
          className={`${className}${active ? ' active' : ''}`}
          onClick={() => switchView(view)}
        >
          <Icon size={iconSize} />
          <span>{label}</span>
          {className === 'menu-action' && active && <span className="menu-active-dot" aria-hidden="true" />}
        </button>
      );
    });

  return (
    <header
      className={`app-header${collapsed ? ' is-collapsed' : ''}`}
      ref={headerRef}
    >
      <div className="headbar" ref={headbarRef}>
        {/* Left: Brand + primary nav */}
        <div className="navbar-left">
          <div className="brand" onClick={() => switchView('overview')}>
            <div className="brand-icon-wrap">
              <BeeMark size={30} />
            </div>
            <div className="brand-text">
              <div className="name">Honey Chain</div>
              <div className="tag">KVIC HONEY MISSION • TRACEABLE HONEY</div>
            </div>
          </div>

          {/* Center: Nav */}
          <nav className="nav-tabs" id="tabs" ref={navRef} aria-label="Primary navigation">
            <div className="nav-tabs-inner" ref={innerRef}>
              {renderTabs('tab-button', 15)}
            </div>
          </nav>
        </div>

        {/* Right: Login/profile + actions + theme + hamburger */}
        <div className="header-right">
          {!currentUser && (
            <button
              className="header-icon-btn header-login-btn"
              aria-label="Login"
              title="Login"
              onClick={() => switchView('login')}
            >
              <User size={17} />
            </button>
          )}
          <button
            className="header-icon-btn header-scan-btn"
            aria-label="QR Scan"
            title="Verify Honey"
            onClick={() => switchView('qr')}
          >
            <QrCode size={17} />
          </button>
          {currentUser && (
            <div className="user-profile">
              <span>👤 {currentUser.name} ({currentUser.role})</span>
              <button
                onClick={() => { setCurrentUser(null); switchView('overview'); }}
              >
                Logout
              </button>
            </div>
          )}
          <div className="header-live-pill">
            <span className="beacon-dot"></span>
            <span>LIVE</span>
          </div>
          <button
            className="theme-toggle-btn"
            title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
            onClick={() => setTheme(prev => (prev === 'dark' ? 'light' : 'dark'))}
          >
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          <button
            ref={hamburgerRef}
            className="hamburger-btn"
            aria-label="Toggle navigation"
            aria-haspopup="true"
            aria-expanded={menuOpen}
            aria-controls="app-mobile-menu"
            onClick={() => setMenuOpen(o => !o)}
          >
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile drawer (shown only while the bar is collapsed) */}
      {collapsed && (
        <div
          className={`mobile-menu${menuOpen ? ' open' : ''}`}
          id="app-mobile-menu"
          ref={menuRef}
          aria-label="Additional navigation"
        >
          <div className="mobile-menu-nav">
            {renderTabs('menu-action', 17)}
          </div>
          <div className="menu-divider" />
          <div className="mobile-menu-extras">
            {currentUser ? (
              <>
                <div className="menu-profile">
                  <span className="menu-profile-name">👤 {currentUser.name}</span>
                  <span className="menu-profile-role">{currentUser.role}</span>
                </div>
                <button
                  type="button"
                  className="menu-action"
                  onClick={() => { setCurrentUser(null); switchView('overview'); setMenuOpen(false); }}
                >
                  <LogOut size={17} /> <span>Logout</span>
                </button>
              </>
            ) : (
              <button
                type="button"
                className="menu-action"
                onClick={() => switchView('login')}
              >
                <LogIn size={17} /> <span>Login</span>
              </button>
            )}
            <button
              type="button"
              className="menu-action"
              onClick={() => {
                setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
                setMenuOpen(false);
              }}
            >
              {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
              <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
}