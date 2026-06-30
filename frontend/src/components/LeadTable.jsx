import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronUp, ChevronDown, Search, Building2, User, Activity, Database } from 'lucide-react';
import ProgressBar from './ProgressBar';

const LeadTable = ({ leads, sortConfig, requestSort }) => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Local filtering based on search and status dropdown
  const filteredLeads = leads.filter((lead) => {
    const searchLower = searchTerm.toLowerCase();
    const nameMatch = (lead.name || '').toLowerCase().includes(searchLower);
    const companyMatch = (lead.company_name || '').toLowerCase().includes(searchLower);
    const domainMatch = (lead.domain || '').toLowerCase().includes(searchLower);
    
    const matchesSearch = nameMatch || companyMatch || domainMatch;
    const matchesStatus = statusFilter === 'all' || lead.enrichment_status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // Helper for dynamic badge styling using our green/yellow theme
  const getStatusStyle = (status) => {
    switch (status?.toLowerCase()) {
      case 'completed':
      case 'synced':
        return 'badge badge-success';
      case 'processing':
      case 'pending':
        return 'badge badge-warning';
      case 'failed':
        return 'badge'; // Base badge with inline error styling
      default:
        return 'badge badge-pending';
    }
  };

  const getSortIcon = (key) => {
    if (sortConfig.key !== key) {
      return <ChevronDown size={14} style={{ opacity: 0.3, marginLeft: '4px' }} />;
    }
    return sortConfig.direction === 'asc' ? 
      <ChevronUp size={14} style={{ color: 'var(--primary)', marginLeft: '4px' }} /> : 
      <ChevronDown size={14} style={{ color: 'var(--primary)', marginLeft: '4px' }} />;
  };

  return (
    <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
      
      {/* Table Controls (Filtering & Search) */}
      <div style={{ padding: '20px', display: 'flex', gap: '16px', borderBottom: '1px solid var(--border)', backgroundColor: 'var(--surface)' }}>
        <div style={{ position: 'relative', flex: 1, maxWidth: '400px' }}>
          <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input 
            type="text" 
            placeholder="Search leads by name or company..." 
            className="input-field"
            style={{ paddingLeft: '40px' }}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <select 
          className="input-field" 
          style={{ width: 'auto', minWidth: '180px' }}
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="all">All Statuses</option>
          <option value="completed">Completed</option>
          <option value="processing">Processing</option>
          <option value="pending">Pending</option>
          <option value="failed">Failed</option>
        </select>
      </div>

      {/* Leads Table */}
      <div style={{ overflowX: 'auto' }}>
        <table className="table-container">
          <thead>
            <tr>
              <th onClick={() => requestSort('name')} style={{ cursor: 'pointer' }}>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <User size={14} style={{ marginRight: '6px' }} /> Name {getSortIcon('name')}
                </div>
              </th>
              <th onClick={() => requestSort('company_name')} style={{ cursor: 'pointer' }}>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <Building2 size={14} style={{ marginRight: '6px' }} /> Company {getSortIcon('company_name')}
                </div>
              </th>
              <th onClick={() => requestSort('icp_score')} style={{ cursor: 'pointer', minWidth: '150px' }}>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <Activity size={14} style={{ marginRight: '6px' }} /> ICP Score {getSortIcon('icp_score')}
                </div>
              </th>
              <th>Top Signal</th>
              <th onClick={() => requestSort('enrichment_status')} style={{ cursor: 'pointer' }}>
                Enrichment {getSortIcon('enrichment_status')}
              </th>
              <th>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <Database size={14} style={{ marginRight: '6px' }} /> CRM
                </div>
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredLeads.length > 0 ? (
              filteredLeads.map((lead) => (
                <tr 
                  key={lead.id} 
                  onClick={() => navigate(`/leads/${lead.id}`)}
                  style={{ cursor: 'pointer' }}
                >
                  <td style={{ fontWeight: 500 }}>{lead.name || <span style={{ color: 'var(--text-muted)' }}>--</span>}</td>
                  <td>
                    <div style={{ fontWeight: 500 }}>{lead.company_name || lead.domain || 'Unknown'}</div>
                  </td>
                  <td>
                    <ProgressBar score={lead.icp_score} />
                  </td>
                  <td style={{ fontSize: '13px', maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {lead.top_buying_signal || <span style={{ color: 'var(--text-muted)' }}>None detected</span>}
                  </td>
                  <td>
                    <span className={getStatusStyle(lead.enrichment_status)}
                          style={lead.enrichment_status === 'failed' ? { backgroundColor: '#fee2e2', color: '#b91c1c' } : {}}>
                      {lead.enrichment_status}
                    </span>
                  </td>
                  <td>
                    <span className={getStatusStyle(lead.crm_sync_status)}
                          style={lead.crm_sync_status === 'failed' ? { backgroundColor: '#fee2e2', color: '#b91c1c' } : {}}>
                      {lead.crm_sync_status}
                    </span>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', padding: '48px', color: 'var(--text-muted)' }}>
                  No leads found matching your criteria.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default LeadTable;