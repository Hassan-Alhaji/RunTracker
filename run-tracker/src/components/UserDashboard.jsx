import React, { useEffect, useState } from 'react';
import { api } from '../utils/api';
import { Activity, Clock, CheckCircle, Clock3, XCircle } from 'lucide-react';

export default function UserDashboard({ user }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async () => {
    try {
      const data = await api.getUserData();
      setProfile(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  if (loading || !profile) return <div style={{textAlign: 'center', padding: '2rem'}}>جاري جلب الإحصائيات...</div>;

  return (
    <div style={{ padding: '1rem', width: '100%', paddingBottom: '5rem' }}>
      <header style={{ marginBottom: '2rem', textAlign: 'center' }}>
        <h2 style={{ color: 'var(--primary-color)', margin: 0 }}>أهلاً يا {profile.name.split(' ')[0]} 👋</h2>
        <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>بطل من أبطال فريق الشرقية للمشي</div>
      </header>

      {/* Main Stats Card */}
      <div style={{ backgroundColor: 'var(--surface-color)', padding: '1.5rem', borderRadius: '16px', marginBottom: '1.5rem', textAlign: 'center', border: '1px solid var(--primary-color)' }}>
        <div className="text-label">إجمالي المسافة المعتمدة لك</div>
        <div style={{ fontSize: '2.5rem', fontWeight: 'bold', margin: '0.5rem 0' }}>
          {parseFloat(profile.total_distance || 0).toFixed(2)} <span style={{fontSize: '1rem', color: 'var(--primary-color)'}}>كم</span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '2rem' }}>
        <div style={{ backgroundColor: '#1a1a1a', padding: '1rem', borderRadius: '12px', textAlign: 'center'}}>
          <div style={{fontSize: '1.5rem', fontWeight: 'bold'}}>{profile.Activities.length}</div>
          <div className="text-label">إجمالي المشاركات</div>
        </div>
        <div style={{ backgroundColor: '#1a1a1a', padding: '1rem', borderRadius: '12px', textAlign: 'center'}}>
          <div style={{fontSize: '1.5rem', fontWeight: 'bold'}}>{profile.Activities.filter(a => a.status === 'approved').length}</div>
          <div className="text-label">الأنشطة المعتمدة</div>
        </div>
      </div>

      <h3 style={{ marginBottom: '1rem', fontSize: '1.1rem' }}>سجل التحديات الخاص بك</h3>
      
      {profile.Activities.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '2rem', backgroundColor: 'var(--surface-color-light)', borderRadius: '12px', color: 'var(--text-secondary)' }}>
           لم تقم بمشاركة أي نشاط بعد.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {profile.Activities.map(act => (
             <div key={act.id} style={{ padding: '1rem', backgroundColor: 'var(--surface-color)', borderRadius: '12px', borderLeft: `4px solid ${getStatusColor(act.status)}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1 }}>
                     <div style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>{act.distance} كم</div>
                     <div style={{ fontSize: '0.85rem', color: 'var(--primary-color)', marginTop: '4px' }}>🎯 {act.title}</div>
                  </div>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                     {new Date(act.createdAt).toLocaleDateString('ar-SA')}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: '1rem', fontSize: '0.9rem', marginBottom: '0.5rem' }}>
                   <span>⏱️ {formatMins(act.duration)} د</span>
                   <span>⚡ {act.pace} د/كم</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', color: getStatusColor(act.status) }}>
                   {getStatusIcon(act.status)} {getStatusText(act.status)}
                </div>
             </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Helpers
function getStatusColor(status) {
  if (status === 'approved') return '#10B981'; // Green
  if (status === 'rejected') return '#EF4444'; // Red
  return '#F59E0B'; // Yellow
}
function getStatusText(status) {
  if (status === 'approved') return 'معتمد رسمياً';
  if (status === 'rejected') return 'نعتذر، لم يقبل الإداري النشاط';
  return 'قيد مراجعة المشرف';
}
function getStatusIcon(status) {
  if (status === 'approved') return <CheckCircle size={14} />;
  if (status === 'rejected') return <XCircle size={14} />;
  return <Clock3 size={14} />;
}
function formatMins(sec) {
  return Math.max(1, Math.round(sec / 60));
}
