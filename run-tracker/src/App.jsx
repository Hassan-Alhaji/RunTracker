import React, { useState, useEffect } from 'react';
import { api } from './utils/api';
import AuthScreen from './components/AuthScreen';
import UserDashboard from './components/UserDashboard';
import SubmitForm from './components/SubmitForm';
import AdminPanel from './components/AdminPanel';
import StravaCallback from './components/StravaCallback';
import { Home, PlusCircle, Shield, LogOut } from 'lucide-react';

export default function App() {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(true);

  // Check auth on mount
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const token = localStorage.getItem('site_token');
    if (storedUser && token) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const handleLogin = (userData) => {
    setUser(userData);
    setActiveTab('dashboard');
  };

  const handleLogout = () => {
    api.logout();
    setUser(null);
  };

  if (loading) return null;

  // OAuth Callback Route Interceptor
  if (window.location.pathname === '/strava-callback') {
    return (
      <div style={styles.container}>
         <StravaCallback />
      </div>
    );
  }

  // Not logged in -> Show Auth Screen
  if (!user) {
    return (
       <div style={styles.container}>
          <AuthScreen onLoginSuccess={handleLogin} />
       </div>
    );
  }

  // Logged In -> Show App Router
  return (
    <div style={styles.container}>
      {/* Top Header */}
      <header style={styles.header}>
        <div style={styles.logoBadge}>
           منصة الإحصائيات (فريق الشرقية)
        </div>
        <button onClick={handleLogout} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
          خروج <LogOut size={16} />
        </button>
      </header>

      {/* Main Content Area */}
      <main style={{ flexGrow: 1, overflowY: 'auto' }}>
         {activeTab === 'dashboard' && <UserDashboard user={user} />}
         {activeTab === 'submit' && (
           <SubmitForm 
             onSuccess={() => setActiveTab('dashboard')} 
           />
         )}
         {activeTab === 'admin' && user.role === 'admin' && <AdminPanel />}
      </main>

      {/* Bottom Navigation */}
      <nav style={styles.controlsBar}>
         <div style={{display: 'flex', width: '100%', gap: '1rem', justifyContent: 'space-around'}}>
            <NavTab 
              active={activeTab === 'dashboard'} 
              onClick={() => setActiveTab('dashboard')} 
              icon={<Home/>} 
              label="حسابي" 
            />
            
            <button className="btn btn-primary" style={{flexGrow: 1, borderRadius: '99px', display: 'flex', justifyContent: 'center', fontSize: '1rem', flex: 1.5}} onClick={() => setActiveTab('submit')}>
               <PlusCircle size={22} fill="#000" style={{marginLeft: '8px'}} /> رفع نتيجة
            </button>
            
            {user.role === 'admin' && (
              <NavTab 
                 active={activeTab === 'admin'} 
                 onClick={() => setActiveTab('admin')} 
                 icon={<Shield/>} 
                 label="الإدارة" 
              />
            )}
         </div>
      </nav>
    </div>
  );
}

// Navigation Icon
const NavTab = ({ active, onClick, icon, label }) => (
  <button onClick={onClick} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: active ? 'var(--primary-color)' : 'var(--text-secondary)', background: 'none', border: 'none' }}>
    <div style={{marginBottom: '4px'}}>{icon}</div>
    <div style={{fontSize: '0.7rem', fontWeight: active ? 'bold' : 'normal'}}>{label}</div>
  </button>
);

// Inline Styles
const styles = {
  container: {
    maxWidth: '500px',
    margin: '0 auto',
    padding: '1rem 0', // Removed horizontal padding for full bleed
    display: 'flex',
    flexDirection: 'column',
    height: '100vh',
    direction: 'rtl',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '1.5rem',
    padding: '0 1rem'
  },
  logoBadge: {
    backgroundColor: 'var(--surface-color)',
    color: 'var(--primary-color)',
    padding: '6px 16px',
    borderRadius: '8px',
    fontWeight: '800',
    fontSize: '0.85rem',
    letterSpacing: '0.5px'
  },
  controlsBar: {
    position: 'fixed',
    bottom: '0',
    left: '0',
    right: '0',
    padding: '1.5rem 1rem',
    background: 'linear-gradient(to top, rgba(0,0,0,1) 60%, rgba(0,0,0,0.5))',
    display: 'flex',
    justifyContent: 'center',
    maxWidth: '500px',
    margin: '0 auto',
    zIndex: 10,
    backgroundColor: '#000'
  }
};
