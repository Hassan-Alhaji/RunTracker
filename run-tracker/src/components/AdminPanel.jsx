import React, { useEffect, useState } from 'react';
import { api } from '../utils/api';
import { Check, X, ShieldAlert, Link as LinkIcon, AlertTriangle } from 'lucide-react';

export default function AdminPanel() {
  const [pending, setPending] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchPending = async () => {
    try {
      setLoading(true);
      const data = await api.getPendingActivities();
      setPending(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPending();
  }, []);

  const handleAction = async (id, action) => {
    try {
      if (action === 'approve') {
         await api.approveActivity(id);
      } else {
         await api.rejectActivity(id);
      }
      // Remove from UI
      setPending(prev => prev.filter(a => a.id !== id));
    } catch (err) {
       alert(err.message);
    }
  };

  // Check if pace is suspiciously fast for walking (< 4:00/km)
  const isSuspicious = (paceStr) => {
    if (!paceStr) return false;
    const parts = paceStr.split(':');
    if (parts.length < 2) return false;
    const mins = parseInt(parts[0], 10);
    return mins < 4; // Faster than 4 mins per km is running/biking
  };

  if (loading) return <div style={{textAlign: 'center', padding: '2rem'}}>جاري جلب الطلبات المعلقة...</div>;

  return (
    <div style={{ padding: '1rem', width: '100%', paddingBottom: '5rem' }}>
      <header style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--primary-color)' }}>
         <ShieldAlert size={24} />
         <h2 style={{ margin: 0 }}>لوحة الإدارة - طلبات المراجعة</h2>
      </header>

      {error && <div style={{ color: 'red', marginBottom: '1rem' }}>{error}</div>}

      {pending.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem 1rem', backgroundColor: 'var(--surface-color)', borderRadius: '16px', color: 'var(--text-secondary)' }}>
           لا توجد أنشطة قيد المراجعة حالياً. أنت بطل! 🥇
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {pending.map(act => {
            const warning = isSuspicious(act.pace);
            
            return (
              <div key={act.id} style={{ backgroundColor: 'var(--surface-color)', padding: '1rem', borderRadius: '12px', border: warning ? '1px solid #ef4444' : '1px solid #333' }}>
                 
                 {/* User Info Header */}
                 <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #333', paddingBottom: '0.5rem', marginBottom: '0.75rem', position: 'relative' }}>
                    <div>
                      <div style={{ fontWeight: 'bold' }}>👤 {act.User.name}</div>
                      <div style={{ fontSize: '0.85rem', color: 'var(--primary-color)', marginTop: '4px' }}>🎯 {act.title}</div>
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{new Date(act.createdAt).toLocaleDateString()}</div>
                 </div>

                 {/* Stats */}
                 <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 1fr 1fr', gap: '0.5rem', marginBottom: '1rem', textAlign: 'center' }}>
                    <div>
                      <div className="text-label">المسافة</div>
                      <div style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>{act.distance} كم</div>
                    </div>
                    <div>
                      <div className="text-label">المدة</div>
                      <div style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>{Math.round(act.duration/60)} د</div>
                    </div>
                    <div>
                      <div className="text-label">البيس</div>
                      <div style={{ fontWeight: 'bold', fontSize: '1.1rem', color: warning ? '#ef4444' : 'inherit' }}>{act.pace}</div>
                    </div>
                 </div>

                 {/* Warning Badge */}
                 {warning && (
                    <div style={{ backgroundColor: '#ef444433', color: '#ef4444', padding: '0.5rem', borderRadius: '8px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '1rem' }}>
                       <AlertTriangle size={16} /> تنبيه: سرعة عالية جداً (دراجة أو جري؟)
                    </div>
                 )}

                 {/* Actions */}
                 <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <a href={act.strava_url} target="_blank" rel="noreferrer" className="btn btn-surface" style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '4px', textDecoration: 'none' }}>
                      <LinkIcon size={16}/> عرض سترافا
                    </a>
                    <button onClick={() => handleAction(act.id, 'reject')} className="btn btn-danger" style={{ padding: '0.75rem' }}>
                      <X size={20}/>
                    </button>
                    <button onClick={() => handleAction(act.id, 'approve')} className="btn btn-primary" style={{ padding: '0.75rem' }}>
                      <Check size={20}/>
                    </button>
                 </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
