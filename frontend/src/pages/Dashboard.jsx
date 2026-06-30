import React, { useState, useEffect, useMemo } from 'react';
import { Users, Target, RefreshCw, TrendingUp, AlertCircle } from 'lucide-react';
import LeadTable from '../components/LeadTable';
import PipelineSpinner from '../components/PipelineSpinner';

// Point this to your backend URL (Railway or Localhost)
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const Dashboard = () => {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sortConfig, setSortConfig] = useState({ key: 'id', direction: 'desc' });

  const fetchLeads = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/leads/`);
      if (!response.ok) {
        throw new Error(`Server returned ${response.status}: ${response.statusText}`);
      }
      const data = await response.json();
      setLeads(data);
    } catch (err) {
      console.error("Failed to fetch leads:", err);
      setError("Unable to connect to the backend server. Please ensure it is running.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, []);

  // Calculate high-level stats
  const stats = useMemo(() => {
    if (!leads.length) return { total: 0, avgScore: 0, syncRate: 0 };
    
    const total = leads.length;
    const totalScore = leads.reduce((sum, lead) => sum + (lead.icp_score || 0), 0);
    const syncedCount = leads.filter(l => l.crm_sync_status === 'synced').length;
    
    return {
      total,
      avgScore: Math.round(totalScore / total),
      syncRate: Math.round((syncedCount / total) * 100)
    };
  }, [leads]);

  // Handle column sorting
  const requestSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const sortedLeads = useMemo(() => {
    let sortableLeads = [...leads];
    if (sortConfig.key !== null) {
      sortableLeads.sort((a, b) => {
        let aValue = a[sortConfig.key];
        let bValue = b[sortConfig.key];
        
        // Handle nulls gracefully
        if (aValue === null) aValue = '';
        if (bValue === null) bValue = '';
        
        if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return sortableLeads;
  }, [leads, sortConfig]);

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '32px 24px' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div>
          <h1 style={{ margin: '0 0 8px 0', fontSize: '28px', color: 'var(--text-main)', letterSpacing: '-0.5px' }}>
            Pipeline Overview
          </h1>
          <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '15px' }}>
            Monitor and manage your enriched prospects.
          </p>
        </div>
        
        <button className="btn-secondary" onClick={fetchLeads} disabled={loading}>
          <RefreshCw size={16} className={loading ? "spin" : ""} style={{ marginRight: '8px' }} />
          Refresh Data
        </button>
      </div>

      {/* Error Banner */}
      {error && (
        <div style={{ 
          backgroundColor: '#fef2f2', border: '1px solid #fca5a5', color: '#b91c1c', 
          padding: '16px', borderRadius: '8px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px' 
        }}>
          <AlertCircle size={20} />
          <span style={{ fontWeight: 500, fontSize: '14px' }}>{error}</span>
        </div>
      )}

      {/* Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px', marginBottom: '32px' }}>
        
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ backgroundColor: '#d1fae5', padding: '16px', borderRadius: '12px', color: 'var(--primary-dark)' }}>
            <Users size={28} />
          </div>
          <div>
            <p style={{ margin: '0 0 4px 0', color: 'var(--text-muted)', fontSize: '13px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total Prospects</p>
            <h2 style={{ margin: 0, fontSize: '32px', color: 'var(--text-main)', letterSpacing: '-1px' }}>{stats.total}</h2>
          </div>
        </div>

        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ backgroundColor: '#fef3c7', padding: '16px', borderRadius: '12px', color: 'var(--secondary-hover)' }}>
            <Target size={28} />
          </div>
          <div>
            <p style={{ margin: '0 0 4px 0', color: 'var(--text-muted)', fontSize: '13px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Average ICP Fit</p>
            <h2 style={{ margin: 0, fontSize: '32px', color: 'var(--text-main)', letterSpacing: '-1px' }}>{stats.avgScore}<span style={{ fontSize: '18px', color: 'var(--text-muted)', marginLeft: '4px' }}>/100</span></h2>
          </div>
        </div>

        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ backgroundColor: '#e0f2fe', padding: '16px', borderRadius: '12px', color: '#0369a1' }}>
            <TrendingUp size={28} />
          </div>
          <div>
            <p style={{ margin: '0 0 4px 0', color: 'var(--text-muted)', fontSize: '13px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>CRM Sync Rate</p>
            <h2 style={{ margin: 0, fontSize: '32px', color: 'var(--text-main)', letterSpacing: '-1px' }}>{stats.syncRate}<span style={{ fontSize: '24px' }}>%</span></h2>
          </div>
        </div>

      </div>

      {/* Main Table Area */}
      <div>
        <h3 style={{ margin: '0 0 16px 0', fontSize: '18px', color: 'var(--text-main)' }}>Recent Enrichments</h3>
        
        {loading ? (
          <div className="card" style={{ display: 'flex', justifyContent: 'center', padding: '64px 0' }}>
            <PipelineSpinner message="Loading your leads..." size="large" />
          </div>
        ) : (
          <LeadTable 
            leads={sortedLeads} 
            sortConfig={sortConfig} 
            requestSort={requestSort} 
          />
        )}
      </div>

    </div>
  );
};

export default Dashboard;