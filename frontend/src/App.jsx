import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, UploadCloud, Settings, Database } from 'lucide-react';

// Import Pages
import Dashboard from './pages/Dashboard';
import LeadDetail from './pages/LeadDetail';
import Upload from './pages/Upload';
import ICPConfig from './pages/ICPConfig';

// A simple navigation component to wrap our routes
const Navigation = () => {
  const location = useLocation();
  
  const navItems = [
    { path: '/', label: 'Dashboard', icon: <LayoutDashboard size={18} /> },
    { path: '/upload', label: 'Bulk Upload', icon: <UploadCloud size={18} /> },
    { path: '/icp-config', label: 'ICP Config', icon: <Settings size={18} /> }
  ];

  return (
    <nav style={{ 
      backgroundColor: 'var(--surface)', 
      borderBottom: '1px solid var(--border)',
      position: 'sticky',
      top: 0,
      zIndex: 100,
      boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
    }}>
      <div style={{ 
        maxWidth: '1200px', 
        margin: '0 auto', 
        padding: '0 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: '64px'
      }}>
        
        {/* Brand Logo */}
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none' }}>
          <div style={{ backgroundColor: 'var(--primary)', color: 'white', padding: '6px', borderRadius: '8px', display: 'flex' }}>
            <Database size={20} />
          </div>
          <span style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-main)', letterSpacing: '-0.5px' }}>
            ProspectNet
          </span>
        </Link>

        {/* Navigation Links */}
        <div style={{ display: 'flex', gap: '8px' }}>
          {navItems.map((item) => {
            const isActive = location.pathname === item.path || (item.path === '/' && location.pathname.startsWith('/leads/'));
            return (
              <Link
                key={item.path}
                to={item.path}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  textDecoration: 'none',
                  padding: '8px 16px',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: 600,
                  color: isActive ? 'var(--primary-dark)' : 'var(--text-muted)',
                  backgroundColor: isActive ? '#d1fae5' : 'transparent',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  if (!isActive) e.currentTarget.style.backgroundColor = 'var(--surface-hover)';
                }}
                onMouseLeave={(e) => {
                  if (!isActive) e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                {item.icon}
                {item.label}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
};

const App = () => {
  return (
    <Router>
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--background)' }}>
        <Navigation />
        
        {/* Main Content Area */}
        <main style={{ flex: 1 }}>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/leads/:id" element={<LeadDetail />} />
            <Route path="/upload" element={<Upload />} />
            <Route path="/icp-config" element={<ICPConfig />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
};

export default App;