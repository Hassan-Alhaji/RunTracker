import React, { useState, useEffect } from 'react';
import { api } from '../utils/api';
import { CloudUpload, Link as LinkIcon, AlertCircle, RefreshCw, Send, Activity, ChevronRight } from 'lucide-react';

export default function SubmitForm({ onSuccess }) {
  const [loading, setLoading] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [activities, setActivities] = useState([]);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [syncing, setSyncing] = useState(false);
  const [submittingId, setSubmittingId] = useState(null);

  // Check connection status on mount
  useEffect(() => {
    checkStatus();
  }, []);

  const checkStatus = async () => {
    try {
      const baseUrl = import.meta.env.VITE_API_URL || '';
      const finalUrl = baseUrl ? `${baseUrl}/api/users/me` : '/api/users/me';
      const res = await fetch(finalUrl, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('site_token')}` }
      });
      const data = await res.json();
      setIsConnected(data.strava_connected);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async () => {
    try {
      const { url } = await api.getStravaAuthUrl();
      window.location.href = url;
    } catch (err) {
      setError(err.message || 'فشل التوجيه لسترافا');
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    setError('');
    try {
      const data = await api.syncStravaActivities();
      setActivities(data);
      if (data.length === 0) setSuccessMsg('لا توجد أنشطة جديدة لمزامنتها حالياً.');
    } catch (err) {
      setError(err.message || 'تعذر جلب البيانات');
    } finally {
      setSyncing(false);
    }
  };

  const handleSubmitActivity = async (act) => {
    setSubmittingId(act.strava_id);
    setError('');
    setSuccessMsg('');
    try {
      await api.submitStravaActivity({
          title: act.title,
          strava_id: act.strava_id,
          strava_url: act.strava_url,
          distance: act.distance,
          duration: act.duration,
          pace: act.pace
      });
      setSuccessMsg(`تم إرسال دورة (${act.title}) بنجاح للإدارة!`);
      
      // Update local state to mark it as submitted
      setActivities(prev => prev.map(a => 
        a.strava_id === act.strava_id ? { ...a, already_submitted: true } : a
      ));

      if (onSuccess) setTimeout(() => onSuccess(), 2000);
    } catch (err) {
      setError(err.message || 'فشل الإرسال');
    } finally {
      setSubmittingId(null);
    }
  };

  if (loading) return <div style={{textAlign: 'center', padding: '3rem'}}><RefreshCw className="spin" /></div>;

  return (
    <div style={{ padding: '1rem', width: '100%', maxWidth: '500px', margin: '0 auto', paddingBottom: '5rem' }}>
       <h2 style={{ textAlign: 'center', marginBottom: '1.5rem', color: 'var(--primary-color)' }}>تسجيل نشاط جديد</h2>
       
       {error && <div style={{ background: '#ff333333', color: '#ff6b6b', padding: '0.75rem', borderRadius: '8px', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}><AlertCircle size={20}/> {error}</div>}
       {successMsg && <div style={{ background: '#10B98133', color: '#10B981', padding: '0.75rem', borderRadius: '8px', marginBottom: '1rem', textAlign: 'center' }}>✅ {successMsg}</div>}

       {!isConnected ? (
          <div style={{ backgroundColor: 'var(--surface-color)', padding: '2rem 1.5rem', borderRadius: '16px', border: '1px solid #333', textAlign: 'center' }}>
             <Activity size={48} color="#fc4c02" style={{ margin: '0 auto 1rem'}} />
             <h3 style={{marginBottom: '1rem'}}>الربط الذكي بسترافا</h3>
             <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', lineHeight: 1.6 }}>
               لجعل تجربتك أسهل، يمكنك الآن ربط حسابك في سترافا لمرة واحدة فقط. 
               المنصة ستقوم بجلب تمارينك بضغطة زر دون الحاجة لنسخ أي رابط بعد اليوم!
             </p>
             <button onClick={handleConnect} className="btn w-full" style={{ backgroundColor: '#fc4c02', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                <LinkIcon size={18} /> ربط حسابي في سترافا
             </button>
          </div>
       ) : (
          <div>
            <button 
              onClick={handleSync} 
              disabled={syncing}
              className="btn btn-primary w-full" 
              style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', marginBottom: '1.5rem' }}
            >
              {syncing ? <><RefreshCw size={20} className="spin" /> جاري سحب التمارين...</> : <><CloudUpload size={20} /> جلب أحدث تمارين سترافا</>}
            </button>

            {activities.length > 0 && (
               <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {activities.map(act => (
                     <div key={act.strava_id} style={{ 
                         backgroundColor: act.already_submitted ? 'var(--surface-color)' : 'var(--surface-color-light)', 
                         padding: '1rem', 
                         borderRadius: '12px', 
                         border: '1px solid #333',
                         opacity: act.already_submitted ? 0.6 : 1
                     }}>
                        <div style={{ fontWeight: 'bold', marginBottom: '0.5rem', color: '#fff' }}>{act.title}</div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                           <span>🏃 {act.distance} كم</span>
                           <span>⏱️ {act.pace} بيس</span>
                           <span dir="ltr">{new Date(act.date).toLocaleDateString()}</span>
                        </div>
                        {act.already_submitted ? (
                            <div style={{ textAlign: 'center', color: 'var(--primary-color)', fontSize: '0.9rem', padding: '0.5rem' }}>
                              تم إرسال هذا النشاط مسبقاً 💯
                            </div>
                        ) : (
                            <button 
                                onClick={() => handleSubmitActivity(act)}
                                disabled={submittingId === act.strava_id}
                                className="btn w-full"
                                style={{ backgroundColor: '#333', color: '#fff', opacity: submittingId === act.strava_id ? 0.7 : 1 }}
                            >
                               {submittingId === act.strava_id ? 'جاري الإرسال...' : 'إرسال للإدارة للتدقيق'} <Send size={16} style={{marginRight: '8px'}} />
                            </button>
                        )}
                     </div>
                  ))}
               </div>
            )}
          </div>
       )}
       
       <style>{`
        .spin { animation: spin 1s linear infinite; }
        @keyframes spin { 100% { transform: rotate(360deg); } }
       `}</style>
    </div>
  );
}
