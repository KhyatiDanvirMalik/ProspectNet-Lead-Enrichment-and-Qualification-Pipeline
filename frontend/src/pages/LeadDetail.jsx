import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Building2, User, Globe, Mail, 
  Zap, Code2, AlertCircle, CheckCircle, Copy, RefreshCw 
} from 'lucide-react';
import ProgressBar from '../components/ProgressBar';
import PipelineSpinner from '../components/PipelineSpinner';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const LeadDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [lead, setLead] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [syncing, setSyncing] = useState(false);
  const [copiedText, setCopiedText] = useState('');

  useEffect(() => {
    const fetchLead = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/leads/${id}`);
        if (!response.ok) throw new Error('Lead not found or server error');
        const data = await response.json();
        setLead(data);
      } catch (err) {
        console.error(err);
        setError("Failed to load lead details.");
      } finally {
        setLoading(false);
      }
    };
    fetchLead();
  }, [id]);

  const handleSyncCRM = async () => {
    setSyncing(true);
    try {
      const response = await fetch(`${API_BASE_URL}/leads/${id}/sync`, { method: 'POST' });
      if (response.ok) {
        const updatedLead = await response.json();
        setLead(updatedLead);
      }
    } catch (err) {
      console.error("Failed to sync CRM:", err);
      alert("Failed to sync with CRM.");
    } finally {
      setSyncing(false);
    }
  };

  const handleCopy = (text, type) => {
    navigator.clipboard.writeText(text);
    setCopiedText(type);
    setTimeout(() => setCopiedText(''), 2000);
  };

  const getStatusBadge = (status) => {
    if (status === 'completed' || status === 'synced') return 'badge badge-success';
    if (status === 'failed') return 'badge'; // Default with red styling below
    return 'badge badge-warning';
  };

  if (loading) {
    return (
      <div style={{ padding: '64px 0' }}>
        <PipelineSpinner message="Loading lead profile..." size="large" />
      </div>
    );
  }

  if (error || !lead) {
    return (
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '32px 24px' }}>
        <button onClick={() => navigate('/')} className="btn-secondary" style={{ marginBottom: '24px', backgroundColor: 'var(--surface)', color: 'var(--text-main)', border: '1px solid var(--border)' }}>
          <ArrowLeft size={16} /> Back to Dashboard
        </button>
        <div style={{ padding: '24px', backgroundColor: '#fef2f2', color: '#b91c1c', borderRadius: '8px', border: '1px solid #fca5a5' }}>
          {error}
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '32px 24px' }}>
      
      {/* Top Navigation & Actions */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
        <button onClick={() => navigate('/')} className="btn-secondary" style={{ backgroundColor: 'var(--surface)', color: 'var(--text-main)', border: '1px solid var(--border)' }}>
          <ArrowLeft size={16} style={{ marginRight: '8px', verticalAlign: 'text-bottom' }} /> 
          Back to Pipeline
        </button>
        
        <div style={{ display: 'flex', gap: '12px' }}>
          <button 
            className="btn-primary" 
            onClick={handleSyncCRM} 
            disabled={syncing || lead.crm_sync_status === 'synced'}
            style={{ 
              backgroundColor: lead.crm_sync_status === 'synced' ? 'var(--primary-light)' : 'var(--primary)',
              cursor: lead.crm_sync_status === 'synced' ? 'not-allowed' : 'pointer'
            }}
          >
            {syncing ? <RefreshCw size={16} className="spin" /> : <RefreshCw size={16} />}
            {lead.crm_sync_status === 'synced' ? 'CRM Synced' : 'Sync to CRM'}
          </button>
        </div>
      </div>

      {/* Header Profile Section */}
      <div className="card" style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '4px solid var(--primary)' }}>
        <div>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
            <span className={getStatusBadge(lead.enrichment_status)} style={lead.enrichment_status === 'failed' ? { backgroundColor: '#fee2e2', color: '#b91c1c' } : {}}>
              Enrichment: {lead.enrichment_status}
            </span>
            <span className={getStatusBadge(lead.crm_sync_status)} style={lead.crm_sync_status === 'failed' ? { backgroundColor: '#fee2e2', color: '#b91c1c' } : {}}>
              CRM: {lead.crm_sync_status}
            </span>
            <span className="badge badge-pending">Source: {lead.source.replace('_', ' ')}</span>
          </div>
          
          <h1 style={{ margin: '0 0 8px 0', fontSize: '32px', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '12px' }}>
            {lead.name || 'Unknown Contact'}
          </h1>
          <h2 style={{ margin: 0, fontSize: '18px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 500 }}>
            <Building2 size={18} /> {lead.company_name || 'Unknown Company'}
            {lead.domain && (
              <a href={`https://${lead.domain}`} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--secondary-hover)', marginLeft: '8px', display: 'flex', alignItems: 'center', gap: '4px', textDecoration: 'none' }}>
                <Globe size={14} /> {lead.domain}
              </a>
            )}
          </h2>
        </div>
        
        {/* Big ICP Score Indicator */}
        <div style={{ textAlign: 'right', minWidth: '200px' }}>
          <p style={{ margin: '0 0 8px 0', fontSize: '14px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
            ICP Qualification Score
          </p>
          <ProgressBar score={lead.icp_score} />
          {lead.is_icp && (
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', marginTop: '12px', color: 'var(--primary-dark)', backgroundColor: '#d1fae5', padding: '4px 12px', borderRadius: '16px', fontSize: '13px', fontWeight: 700 }}>
              <CheckCircle size={14} /> Qualified Target
            </div>
          )}
        </div>
      </div>

      {/* Main Grid Content */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        
        {/* Left Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Firmographics & Personas */}
          <div className="card">
            <h3 style={{ margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid var(--border)', paddingBottom: '12px' }}>
              <User size={18} color="var(--primary)" /> Profile & Firmographics
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <p style={{ margin: '0 0 4px 0', fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Role</p>
                <p style={{ margin: 0, fontWeight: 500 }}>{lead.role || '--'}</p>
              </div>
              <div>
                <p style={{ margin: '0 0 4px 0', fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Seniority</p>
                <p style={{ margin: 0, fontWeight: 500 }}>{lead.seniority || '--'}</p>
              </div>
              <div>
                <p style={{ margin: '0 0 4px 0', fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Industry</p>
                <p style={{ margin: 0, fontWeight: 500 }}>{lead.industry || '--'}</p>
              </div>
              <div>
                <p style={{ margin: '0 0 4px 0', fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Company Size</p>
                <p style={{ margin: 0, fontWeight: 500 }}>{lead.company_size || '--'}</p>
              </div>
            </div>
          </div>

          {/* Tech Stack */}
          <div className="card">
            <h3 style={{ margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid var(--border)', paddingBottom: '12px' }}>
              <Code2 size={18} color="var(--secondary)" /> Detected Tech Stack
            </h3>
            {lead.tech_stack && lead.tech_stack.length > 0 ? (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {lead.tech_stack.map((tech, idx) => (
                  <span key={idx} style={{ backgroundColor: 'var(--surface-hover)', border: '1px solid var(--border)', padding: '6px 12px', borderRadius: '16px', fontSize: '13px', fontWeight: 500 }}>
                    {tech}
                  </span>
                ))}
              </div>
            ) : (
              <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '14px' }}>No technology data detected.</p>
            )}
          </div>
        </div>

        {/* Right Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Buying Signals */}
          <div className="card">
            <h3 style={{ margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid var(--border)', paddingBottom: '12px' }}>
              <Zap size={18} color="var(--secondary-hover)" /> Buying Signals
            </h3>
            
            {lead.buying_signals && lead.buying_signals.length > 0 ? (
              <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {lead.buying_signals.map((signal, idx) => (
                  <li key={idx} style={{ padding: '12px', backgroundColor: '#fef3c7', borderRadius: '8px', display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                    <AlertCircle size={16} color="var(--secondary-hover)" style={{ marginTop: '2px', flexShrink: 0 }} />
                    <div>
                      <span style={{ fontWeight: 600, fontSize: '14px', color: 'var(--text-main)', display: 'block', marginBottom: '4px' }}>
                        {signal.type} (Score: {signal.weight})
                      </span>
                      <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{signal.signal}</span>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '14px' }}>No actionable buying signals detected.</p>
            )}
          </div>

        </div>
      </div>

      {/* Full Width: Outreach Drafts */}
      <div className="card" style={{ marginTop: '24px' }}>
        <h3 style={{ margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid var(--border)', paddingBottom: '12px' }}>
          <Mail size={18} color="var(--primary)" /> AI-Generated Outreach Drafts
        </h3>
        
        {lead.outreach_drafts ? (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
            
            {/* Direct Variant */}
            {lead.outreach_drafts.direct && (
              <div style={{ backgroundColor: 'var(--surface-hover)', borderRadius: '8px', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column' }}>
                <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f8fafc', borderTopLeftRadius: '8px', borderTopRightRadius: '8px' }}>
                  <span style={{ fontWeight: 600, fontSize: '13px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Variant: Direct</span>
                  <button onClick={() => handleCopy(lead.outreach_drafts.direct, 'direct')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', fontWeight: 600 }}>
                    {copiedText === 'direct' ? <CheckCircle size={14} /> : <Copy size={14} />} 
                    {copiedText === 'direct' ? 'Copied!' : 'Copy'}
                  </button>
                </div>
                <div style={{ padding: '16px', fontSize: '14px', lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>
                  {lead.outreach_drafts.direct}
                </div>
              </div>
            )}

            {/* Consultative Variant */}
            {lead.outreach_drafts.consultative && (
              <div style={{ backgroundColor: 'var(--surface-hover)', borderRadius: '8px', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column' }}>
                <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f8fafc', borderTopLeftRadius: '8px', borderTopRightRadius: '8px' }}>
                  <span style={{ fontWeight: 600, fontSize: '13px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Variant: Consultative</span>
                  <button onClick={() => handleCopy(lead.outreach_drafts.consultative, 'consultative')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--secondary-hover)', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', fontWeight: 600 }}>
                    {copiedText === 'consultative' ? <CheckCircle size={14} /> : <Copy size={14} />} 
                    {copiedText === 'consultative' ? 'Copied!' : 'Copy'}
                  </button>
                </div>
                <div style={{ padding: '16px', fontSize: '14px', lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>
                  {lead.outreach_drafts.consultative}
                </div>
              </div>
            )}
            
          </div>
        ) : (
          <div style={{ padding: '32px', textAlign: 'center', backgroundColor: 'var(--surface-hover)', borderRadius: '8px' }}>
            <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '14px' }}>
              Drafts have not been generated for this lead yet.
            </p>
          </div>
        )}
      </div>

    </div>
  );
};

export default LeadDetail;