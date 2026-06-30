import React, { useState, useEffect } from 'react';
import { Settings, Save, AlertCircle, CheckCircle, Sliders, Briefcase, Zap, AlertTriangle } from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const ICPConfig = () => {
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [statusMsg, setStatusMsg] = useState({ type: '', text: '' });

  // Default structure in case API is empty
  const defaultConfig = {
    target_industries: [],
    target_company_size_range: "50-200 employees",
    required_tech_stack: [],
    minimum_seniority_level: "Director",
    disqualifying_signals: ["Layoffs", "Bankruptcy"],
    product_description: "B2B SaaS platform for automated lead enrichment.",
    value_proposition: "Save 10 hours a week on manual prospecting and increase reply rates by 40%.",
    scoring_formula_weights: {
      icp_fit: 0.5,
      buying_signals: 0.5
    }
  };

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/icp/`);
        if (response.ok) {
          const data = await response.json();
          // If the backend returns an empty object or null, use default
          setConfig(Object.keys(data).length > 0 ? data : defaultConfig);
        } else {
          setConfig(defaultConfig);
        }
      } catch (err) {
        console.error("Failed to fetch ICP config:", err);
        setConfig(defaultConfig);
        setStatusMsg({ type: 'error', text: 'Could not load configuration. Using defaults.' });
      } finally {
        setLoading(false);
      }
    };

    fetchConfig();
  }, []);

  const handleInputChange = (field, value) => {
    setConfig(prev => ({ ...prev, [field]: value }));
  };

  const handleArrayChange = (field, value) => {
    const arrayValue = value.split(',').map(item => item.trim()).filter(Boolean);
    setConfig(prev => ({ ...prev, [field]: arrayValue }));
  };

  const handleWeightChange = (field, value) => {
    const numValue = parseFloat(value) / 100;
    const otherField = field === 'icp_fit' ? 'buying_signals' : 'icp_fit';
    
    setConfig(prev => ({
      ...prev,
      scoring_formula_weights: {
        [field]: numValue,
        [otherField]: +(1 - numValue).toFixed(2)
      }
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    setStatusMsg({ type: '', text: '' });

    try {
      const response = await fetch(`${API_BASE_URL}/icp/`, {
        method: 'POST', // Assuming POST handles both create and update for a singleton config
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      });

      if (!response.ok) throw new Error('Failed to save configuration');
      
      setStatusMsg({ type: 'success', text: 'ICP Configuration updated successfully!' });
      setTimeout(() => setStatusMsg({ type: '', text: '' }), 4000);
    } catch (err) {
      setStatusMsg({ type: 'error', text: 'Error saving configuration. Please try again.' });
    } finally {
      setSaving(false);
    }
  };

  if (loading || !config) {
    return (
      <div style={{ padding: '48px', textAlign: 'center', color: 'var(--text-muted)' }}>
        Loading configuration...
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '32px 24px' }}>
      
      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ margin: '0 0 8px 0', fontSize: '28px', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Settings size={28} color="var(--primary)" />
          Ideal Customer Profile (ICP)
        </h1>
        <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '15px' }}>
          Define the parameters used by the LLM to score leads and generate outreach drafts.
        </p>
      </div>

      {/* Status Messages */}
      {statusMsg.text && (
        <div style={{ 
          padding: '16px', borderRadius: '8px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px',
          backgroundColor: statusMsg.type === 'error' ? '#fef2f2' : '#d1fae5',
          border: `1px solid ${statusMsg.type === 'error' ? '#fca5a5' : '#6ee7b7'}`,
          color: statusMsg.type === 'error' ? '#b91c1c' : 'var(--primary-dark)'
        }}>
          {statusMsg.type === 'error' ? <AlertCircle size={20} /> : <CheckCircle size={20} />}
          <span style={{ fontWeight: 500, fontSize: '14px' }}>{statusMsg.text}</span>
        </div>
      )}

      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
        
        {/* Section 1: Firmographics */}
        <section>
          <h3 style={{ margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-main)' }}>
            <Briefcase size={18} color="var(--secondary)" /> Target Firmographics
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)' }}>
                Target Industries (comma separated)
              </label>
              <input 
                type="text" 
                className="input-field" 
                value={config.target_industries?.join(', ') || ''} 
                onChange={(e) => handleArrayChange('target_industries', e.target.value)}
                placeholder="e.g. SaaS, Healthcare, FinTech"
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)' }}>
                Company Size Range
              </label>
              <input 
                type="text" 
                className="input-field" 
                value={config.target_company_size_range || ''} 
                onChange={(e) => handleInputChange('target_company_size_range', e.target.value)}
                placeholder="e.g. 50-200 employees"
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)' }}>
                Minimum Seniority Level
              </label>
              <input 
                type="text" 
                className="input-field" 
                value={config.minimum_seniority_level || ''} 
                onChange={(e) => handleInputChange('minimum_seniority_level', e.target.value)}
                placeholder="e.g. Director, VP, C-Level"
              />
            </div>
          </div>
        </section>

        <hr style={{ border: 0, borderTop: '1px solid var(--border)' }} />

        {/* Section 2: Technology & Signals */}
        <section>
          <h3 style={{ margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-main)' }}>
            <Zap size={18} color="var(--secondary)" /> Technology & Buying Signals
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)' }}>
                Required Tech Stack (comma separated)
              </label>
              <input 
                type="text" 
                className="input-field" 
                value={config.required_tech_stack?.join(', ') || ''} 
                onChange={(e) => handleArrayChange('required_tech_stack', e.target.value)}
                placeholder="e.g. React, AWS, Salesforce"
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: 600, color: 'var(--error)' }}>
                <AlertTriangle size={14} style={{ display: 'inline', verticalAlign: 'text-bottom', marginRight: '4px' }} />
                Disqualifying Signals (comma separated)
              </label>
              <input 
                type="text" 
                className="input-field" 
                value={config.disqualifying_signals?.join(', ') || ''} 
                onChange={(e) => handleArrayChange('disqualifying_signals', e.target.value)}
                placeholder="e.g. Layoffs, Bankruptcy, Hiring Freeze"
              />
            </div>
          </div>
        </section>

        <hr style={{ border: 0, borderTop: '1px solid var(--border)' }} />

        {/* Section 3: Product Context (For Outreach Generation) */}
        <section>
          <h3 style={{ margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-main)' }}>
            <Settings size={18} color="var(--primary)" /> Product Context (For LLM Outreach)
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)' }}>
                Product Description
              </label>
              <textarea 
                className="input-field" 
                style={{ resize: 'vertical', minHeight: '80px', fontFamily: 'inherit' }}
                value={config.product_description || ''} 
                onChange={(e) => handleInputChange('product_description', e.target.value)}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)' }}>
                Value Proposition
              </label>
              <textarea 
                className="input-field" 
                style={{ resize: 'vertical', minHeight: '80px', fontFamily: 'inherit' }}
                value={config.value_proposition || ''} 
                onChange={(e) => handleInputChange('value_proposition', e.target.value)}
              />
            </div>
          </div>
        </section>

        <hr style={{ border: 0, borderTop: '1px solid var(--border)' }} />

        {/* Section 4: Scoring Weights */}
        <section>
          <h3 style={{ margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-main)' }}>
            <Sliders size={18} color="var(--primary)" /> Scoring Formula Weights
          </h3>
          <div style={{ backgroundColor: 'var(--surface-hover)', padding: '20px', borderRadius: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
              <span style={{ fontSize: '14px', fontWeight: 600 }}>Semantic ICP Fit ({(config.scoring_formula_weights?.icp_fit * 100).toFixed(0)}%)</span>
              <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--secondary-hover)' }}>Buying Signals ({(config.scoring_formula_weights?.buying_signals * 100).toFixed(0)}%)</span>
            </div>
            <input 
              type="range" 
              min="0" 
              max="100" 
              step="5"
              value={(config.scoring_formula_weights?.icp_fit || 0.5) * 100} 
              onChange={(e) => handleWeightChange('icp_fit', e.target.value)}
              style={{ width: '100%', accentColor: 'var(--primary)', cursor: 'pointer' }}
            />
            <p style={{ margin: '12px 0 0 0', fontSize: '12px', color: 'var(--text-muted)', textAlign: 'center' }}>
              Adjust the balance between how closely a lead matches your exact demographic parameters versus the strength of their recent buying signals.
            </p>
          </div>
        </section>

        {/* Save Actions */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px' }}>
          <button 
            className="btn-primary" 
            onClick={handleSave}
            disabled={saving}
          >
            <Save size={18} />
            {saving ? 'Saving...' : 'Save Configuration'}
          </button>
        </div>

      </div>
    </div>
  );
};

export default ICPConfig;