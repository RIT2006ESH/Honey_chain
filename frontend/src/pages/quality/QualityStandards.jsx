import React, { useState, useEffect } from 'react';
import { BookOpen, Save, Edit3 } from 'lucide-react';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:4000';

export default function QualityStandards() {
  const [standards, setStandards] = useState({});
  const [editing, setEditing] = useState(null);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_BASE}/api/quality/standards`)
      .then(r => r.json())
      .then(data => { if (data.ok) setStandards(data.standards); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async (key) => {
    try {
      await fetch(`${API_BASE}/api/quality/standards`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, ...standards[key] }),
      });
      setSaved(true);
      setEditing(null);
      setTimeout(() => setSaved(false), 2000);
    } catch (e) {}
  };

  const updateField = (key, field, value) => {
    setStandards(s => ({ ...s, [key]: { ...s[key], [field]: value } }));
  };

  return (
    <section className="view-pane active">
      <div className="flow-title-row">
        <div className="eyebrow-badge"><BookOpen size={13} /> Reference Standards</div>
        <h2>Quality Standards &amp; Thresholds</h2>
        <p className="section-lede">Testing criteria for honey quality certification. Lab-editable, tester read-only by default.</p>
      </div>

      {loading ? (
        <div className="state-loading">Loading standards...</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '16px' }}>
          {Object.entries(standards).map(([key, std]) => {
            const isEditing = editing === key;

            return (
              <div key={key} className="panel" style={{ borderColor: isEditing ? 'var(--amber-400)' : undefined }}>
                <div className="flex-between" style={{ marginBottom: '14px' }}>
                  <div>
                    <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--amber-400)' }}>{std.label}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-dim)' }}>Version: {std.version}</div>
                  </div>
                  <button onClick={() => isEditing ? handleSave(key) : setEditing(key)} className="btn btn-soft btn-sm" style={{ background: isEditing ? 'var(--emerald-400)' : undefined, color: isEditing ? '#0f0b04' : undefined }}>
                    {isEditing ? <><Save size={11} /> Save</> : <><Edit3 size={11} /> Edit</>}
                  </button>
                </div>

                <div className="field-hint" style={{ marginBottom: '14px', lineHeight: 1.4 }}>{std.description}</div>

                <div className="flex-col gap-8">
                  {[
                    { field: 'moistureMax', label: 'Moisture Max', unit: '%', icon: '💧' },
                    { field: 'nmrPurityMin', label: 'NMR Purity Min', unit: '%', icon: '🔬' },
                    { field: 'c4SugarMax', label: 'C4 Sugar Max', unit: '%', icon: '🧪' },
                    { field: 'hmfMax', label: 'HMF Max', unit: 'mg/kg', icon: '📊' },
                    { field: 'antibioticMax', label: 'Antibiotic Max', unit: 'ppm', icon: '💊' },
                  ].map(item => (
                    <div key={item.field} className="flex-between" style={{ padding: '6px 0', borderBottom: '1px solid var(--border-subtle)' }}>
                      <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{item.icon} {item.label}</span>
                      {isEditing ? (
                        <div className="flex gap-6">
                          <input type="number" step="0.1" value={std[item.field]} onChange={e => updateField(key, item.field, parseFloat(e.target.value))} className="input" style={{ width: '70px', textAlign: 'right' }} />
                          <span style={{ fontSize: '10px', color: 'var(--text-dim)', minWidth: '36px' }}>{item.unit}</span>
                        </div>
                      ) : (
                        <span style={{ fontSize: '12px', fontWeight: 700 }}>{std[item.field]} {item.unit}</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {saved && (
        <div style={{ position: 'fixed', bottom: '24px', right: '24px', padding: '12px 20px', background: 'var(--emerald-400)', color: '#0f0b04', borderRadius: '8px', fontWeight: 700, fontSize: '13px', zIndex: 9999 }}>
          Standards saved successfully
        </div>
      )}
    </section>
  );
}