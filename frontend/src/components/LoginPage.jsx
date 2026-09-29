import React, { useState } from 'react';
import {
  ShieldCheck, Award, Copy, Eye, EyeOff,
  Leaf, LineChart, Users, QrCode, Shield, User, Cog, Check,
  Mail, Lock, ArrowRight, Hexagon, Sun, Moon
} from 'lucide-react';
import { useApp } from '../context/AppContext';

export default function LoginPage() {
  const {
    switchView,
    theme, setTheme,
    loginEmail, setLoginEmail,
    loginError, handleLogin,
    showPassword, setShowPassword,
  } = useApp();

  const [copiedEmail, setCopiedEmail] = useState(null);
  const [password, setPassword] = useState('');

  const demoAccounts = [
    { role: 'Beekeeper', email: 'beekeeper@honeychain.demo', badge: 'Manage Hives & Batches', icon: <User size={14} />, badgeClass: 'badge-bk' },
    { role: 'Processor', email: 'processor@honeychain.demo', badge: 'Process & Package', icon: <Cog size={14} />, badgeClass: 'badge-proc' },
    { role: 'Tester', email: 'tester@honeychain.demo', badge: 'Verify & Approve', icon: <ShieldCheck size={14} />, badgeClass: 'badge-test' },
    { role: 'Manufacturer', email: 'manufacturer@honeychain.demo', badge: 'Pack & Dispatch', icon: <Award size={14} />, badgeClass: 'badge-mfr' },
  ];

  const handleCopyEmail = (e, email) => {
    e.stopPropagation();
    navigator.clipboard.writeText(email);
    setCopiedEmail(email);
    setTimeout(() => setCopiedEmail(null), 1500);
  };

  const handleDemoClick = (email) => {
    setLoginEmail(email);
    setPassword('demo123');
  };

  return (
    <div className="login-page-dark">
      {/* Animated background */}
      <div className="login-bg-pattern">
        <div className="login-glow-orb login-glow-1" />
        <div className="login-glow-orb login-glow-2" />
        <div className="login-glow-orb login-glow-3" />
      </div>

      <div className="login-dark-container">
        {/* Left side — branding */}
        <div className="login-left">
          <div className="login-left-content">
            <div className="login-logo-row">
              <Hexagon size={32} color="var(--amber-400)" strokeWidth={1.5} />
              <span className="login-logo-text">Honey Chain</span>
            </div>

            <h1 className="login-hero-title">
              From <span className="gold-text">Hive</span><br />
              to a <span className="gold-text">Healthier</span> World
            </h1>

            <p className="login-hero-desc">
              Empowering rural beekeepers with IoT, AI and blockchain for transparent, traceable and authentic honey.
            </p>

            <div className="login-features-grid">
              {[
                { icon: <Leaf size={20} />, label: 'Support Beekeepers' },
                { icon: <LineChart size={20} />, label: 'AI-Powered Monitoring' },
                { icon: <Shield size={20} />, label: 'Blockchain Traceability' },
                { icon: <Users size={20} />, label: 'Authentic Honey for All' },
              ].map(f => (
                <div key={f.label} className="login-feature-item">
                  <div className="login-feature-icon">{f.icon}</div>
                  <span>{f.label}</span>
                </div>
              ))}
            </div>

            <div className="login-stats-row">
              <div className="login-stat"><span className="stat-num">1,000+</span> Hives</div>
              <div className="login-stat-divider" />
              <div className="login-stat"><span className="stat-num">100+</span> Beekeepers</div>
              <div className="login-stat-divider" />
              <div className="login-stat"><span className="stat-num">One</span> Trusted Ecosystem</div>
            </div>
          </div>
        </div>

        {/* Right side — form */}
        <div className="login-right">
          <div className="login-card-dark">
            <div className="lcd-top-bar">
              <div className="lcd-header">
                <div className="lcd-brand">Honey Chain</div>
                <div className="lcd-sub">KVIC HONEY MISSION · BLOCKCHAIN &amp; AIOT</div>
                <div className="lcd-desc">Sign in to access your dashboard</div>
              </div>
              <button className="lcd-theme-toggle" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} title="Toggle theme">
                {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
              </button>
            </div>

            <form onSubmit={handleLogin} className="lcd-form">
              <div className="lcd-field">
                <label>Email / Mobile Number</label>
                <div className="lcd-input-wrap">
                  <Mail size={16} className="lcd-input-icon" />
                  <input
                    type="text"
                    placeholder="Enter your email or mobile number"
                    value={loginEmail}
                    onChange={e => setLoginEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="lcd-field">
                <label>Password</label>
                <div className="lcd-input-wrap lcd-pw-wrap">
                  <Lock size={16} className="lcd-input-icon" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                  />
                  <button type="button" className="lcd-pw-btn" onClick={() => setShowPassword(!showPassword)}>
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div className="lcd-row">
                <label className="lcd-check">
                  <input type="checkbox" defaultChecked /> Remember me
                </label>
                <button type="button" className="lcd-forgot" onClick={() => alert('Not enabled in prototype.')}>Forgot password?</button>
              </div>

              {loginError && <div className="lcd-error">{loginError}</div>}

              <button type="submit" className="lcd-submit">
                Sign In <ArrowRight size={16} />
              </button>
            </form>

            <div className="lcd-or"><span>OR</span></div>

            <button className="lcd-consumer" onClick={() => switchView('qr')}>
              <QrCode size={18} />
              Continue as Consumer
              <small>No login required — scan QR to verify</small>
            </button>

            <div className="lcd-demo-section">
              <div className="lcd-demo-header">
                <span>Demo Credentials</span>
                <span className="lcd-demo-hint">Password: <strong>demo123</strong></span>
              </div>
              <div className="lcd-demo-grid">
                {demoAccounts.map(acc => (
                  <button key={acc.email} className="lcd-demo-card" onClick={() => handleDemoClick(acc.email)}>
                    <div className="lcd-dc-top">
                      <span className="lcd-dc-icon">{acc.icon}</span>
                      <span className="lcd-dc-role">{acc.role}</span>
                      <span className="lcd-dc-copy" onClick={e => handleCopyEmail(e, acc.email)}>
                        {copiedEmail === acc.email ? <Check size={10} color="#4ade80" /> : <Copy size={10} />}
                      </span>
                    </div>
                    <div className="lcd-dc-email">{acc.email}</div>
                    <span className={`lcd-dc-badge ${acc.badgeClass}`}>{acc.badge}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="lcd-footer">
            Honey Chain · Blockchain Honey Traceability for KVIC
            <div className="lcd-footer-links">
              <button type="button" onClick={() => {}}>Privacy</button>
              <button type="button" onClick={() => {}}>Terms</button>
              <button type="button" onClick={() => {}}>Help</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
