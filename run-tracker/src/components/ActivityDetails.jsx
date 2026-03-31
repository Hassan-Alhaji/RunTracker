import React, { useState } from 'react';
import { ArrowRight, CloudUpload } from 'lucide-react';
import MapDisplay from './MapDisplay';
import { generateGpxString, uploadGpxToStrava, getStravaAuthUrl } from '../utils/strava';

export default function ActivityDetails({ activity, onBack }) {
  const [isExporting, setIsExporting] = useState(false);
  const [exportMsg, setExportMsg] = useState('');

  const handleStravaExport = async () => {
    // Check if token exists
    const token = localStorage.getItem('strava_access_token');
    
    // If no token, redirect to OAuth authorization
    if (!token) {
      // Save current activity ID slightly differently so we know what we were doing when returning
      localStorage.setItem('pending_strava_upload_id', activity.id);
      window.location.href = getStravaAuthUrl();
      return;
    }

    // Perform Export
    try {
      setIsExporting(true);
      setExportMsg("جاري تجهيز المسار...");
      const gpxData = generateGpxString(activity.path, activity.name);
      
      setExportMsg("جاري الرفع إلى سترافا...");
      await uploadGpxToStrava(gpxData, activity.name, token);
      
      setExportMsg("✅ تم الرفع لسترافا والمسار قيد المعالجة!");
    } catch (err) {
      if (err.message.includes('Authorization') || err.message.includes('token')) {
        // Token might be expired, clear it
        localStorage.removeItem('strava_access_token');
        setExportMsg("انتهت صلاحية الربط، يرجى المحاولة مرة أخرى.");
      } else {
        setExportMsg("❌ حدث خطأ: " + err.message);
      }
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="flex-col h-full w-full">
      {/* Header */}
      <header className="flex items-center gap-4 text-accent" style={{marginBottom: '1rem'}}>
        <button className="btn btn-surface" style={{padding: '0.75rem', borderRadius: '50%'}} onClick={onBack}>
          <ArrowRight size={20} />
        </button>
        <h2 style={{ fontSize: '1.25rem', margin: 0 }}>تفاصيل: {activity.name}</h2>
      </header>
      
      {/* Scrollable Content */}
      <div style={{ paddingBottom: '2rem' }}>
        {/* Map Header */}
        <div style={{ height: '280px', borderRadius: '16px', overflow: 'hidden', marginBottom: '1.5rem', border: '1px solid var(--surface-color)' }}>
          <MapDisplay 
            path={activity.path.map(p => [p.lat, p.lng])} 
            currentPosition={activity.path.length > 0 ? [activity.path[0].lat, activity.path[0].lng] : null} 
          />
        </div>

        {/* Global Summary */}
        <div style={{ backgroundColor: 'var(--surface-color)', padding: '1rem', borderRadius: '16px', marginBottom: '1.5rem'}}>
          <div className="flex justify-between items-center" style={{marginBottom: '1rem'}}>
            <div className="text-label">تاريخ ممارسة النشاط</div>
            <div style={{ fontWeight: 'bold' }}>
               {new Date(activity.date).toLocaleDateString("ar-SA", {weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'})}
            </div>
          </div>
          
          <div className="flex justify-between items-center text-secondary" style={{marginBottom: '0.5rem', fontSize: '0.85rem'}}>
             <div>وقت البداية: {activity.start_time}</div>
             <div>وقت النهاية: {activity.end_time}</div>
          </div>
        </div>

        {/* Statistics Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '2rem' }}>
          <Box label="المدة الإجمالية" value={formatSeconds(activity.duration)} />
          <Box label="المسافة المقطوعة" value={`${activity.distance.toFixed(2)} كم / ${Math.floor(activity.distance * 1000)} م`} />
          <Box label="البيس (معدل السرعة)" value={`${activity.pace} د/كم`} />
          <Box label="السرعة (كم/ساعة)" value={activity.avgSpeed || '0.00'} />
          <Box label="الخطوات (تقريبي)" value={activity.steps} />
          <Box label="السعرات (تقريبي)" value={activity.calories} />
        </div>

        {/* Strava Actions */}
        <div style={{ backgroundColor: '#FC4C02', padding: '1rem', borderRadius: '16px', textAlign: 'center' }}>
          <button 
            className="w-full flex justify-center items-center gap-2" 
            style={{ fontWeight: 'bold', fontSize: '1.1rem', backgroundColor: 'transparent', color: '#fff', border: 'none'}}
            onClick={handleStravaExport}
            disabled={isExporting}
          >
            <CloudUpload size={24} /> {isExporting ? 'جاري رفع النشاط بالكامل...' : 'المزامنة وتصدير المسار إلى Strava'}
          </button>
          {exportMsg && <div style={{marginTop: '0.75rem', padding: '0.5rem', background: 'rgba(0,0,0,0.2)', borderRadius: '8px', fontSize: '0.9rem'}}>{exportMsg}</div>}
        </div>
      </div>
    </div>
  );
}

const Box = ({ label, value }) => (
  <div style={{ backgroundColor: 'var(--surface-color)', padding: '1rem', borderRadius: '12px', border: '1px solid var(--surface-color-light)', textAlign: 'center' }}>
    <div className="text-label" style={{fontSize: '0.75rem'}}>{label}</div>
    <div style={{fontSize: '1.25rem', fontWeight: 'bold'}}>{value}</div>
  </div>
);

// Helper
function formatSeconds(totalSeconds) {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return `${h > 0 ? h + ':' : ''}${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}
