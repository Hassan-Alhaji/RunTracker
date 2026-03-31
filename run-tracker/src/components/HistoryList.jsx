import React from 'react';
import { calculatePace } from '../utils/calculations';
import { Calendar, ChevronLeft, MapPin, List } from 'lucide-react';

export default function HistoryList({ activities, onSelectActivity }) {
  if (!activities || activities.length === 0) {
    return (
      <div style={{ textAlign: 'center', marginTop: '4rem', color: 'var(--text-secondary)' }}>
        <List size={48} style={{ opacity: 0.2, marginBottom: '1rem', display: 'inline-block' }} />
        <h3 className="text-accent" style={{ marginBottom: '1rem' }}>لا توجد أنشطة محفوظة بعد</h3>
        <p>قم بالبدء بأول مشي لك وسيسجل هنا!</p>
      </div>
    );
  }

  // 1. Group activities by Day String
  const grouped = activities.reduce((acc, curr) => {
    // Standardize the day key format: "الجمعة 28 مارس 2026"
    const dateObj = new Date(curr.date);
    const dayKey = dateObj.toLocaleDateString('ar-SA', { 
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' 
    });

    if (!acc[dayKey]) acc[dayKey] = [];
    acc[dayKey].push(curr);
    return acc;
  }, {});

  return (
    <div style={{ paddingBottom: '5rem', width: '100%' }}>
      <h2 style={{ textAlign: 'center', marginBottom: '2rem', borderBottom: '1px solid #333', paddingBottom: '1rem' }}>
        سجل الأنشطة
      </h2>

      {Object.entries(grouped).map(([dayKey, dayActivities]) => {
        // Calculate Daily Summary
        const totalActivities = dayActivities.length;
        const totalDistance = dayActivities.reduce((sum, act) => sum + act.distance, 0);
        const totalDuration = dayActivities.reduce((sum, act) => sum + act.duration, 0);
        const totalSteps = dayActivities.reduce((sum, act) => sum + act.steps, 0);
        const avgPace = calculatePace(totalDistance, totalDuration); // Recalculate pace for whole day
        const avgSpeed = totalDuration > 0 ? (totalDistance / (totalDuration / 3600)).toFixed(2) : "0.00";

        return (
          <div key={dayKey} style={{ marginBottom: '3rem' }}>
            {/* Daily Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
              <Calendar size={18} color="var(--primary-color)" />
              <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#fff' }}>{dayKey}</h3>
            </div>

            {/* Daily Summary Card */}
            <div style={{ backgroundColor: '#161616', padding: '1rem', borderRadius: '12px', marginBottom: '1rem' }}>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.5rem', textAlign: 'center' }}>إحصائيات اليوم</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem', textAlign: 'center' }}>
                <MiniStat label="أنشطة" value={totalActivities} />
                <MiniStat label="المسافة (كم)" value={totalDistance.toFixed(2)} />
                <MiniStat label="الوقت إجمالي" value={formatMins(totalDuration)} />
                <MiniStat label="الخطوات" value={totalSteps} />
                <MiniStat label="متوسط بيس" value={avgPace} />
                <MiniStat label="سرعة (كم/س)" value={avgSpeed} />
              </div>
            </div>

            {/* Individual Activity Cards */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {dayActivities.map(activity => (
                <div 
                  key={activity.id} 
                  style={{ backgroundColor: 'var(--surface-color)', padding: '1rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                  onClick={() => onSelectActivity(activity)}
                >
                  <div>
                    <div style={{ fontWeight: 'bold', fontSize: '1.1rem', marginBottom: '0.25rem' }}>{activity.name}</div>
                    <div className="flex items-center gap-2" style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                      <MapPin size={12} /> البداية: {activity.start_time}
                    </div>
                    
                    <div className="flex gap-4">
                      <span className="text-accent" style={{fontWeight: 'bold'}}>{activity.distance.toFixed(2)} كم</span>
                      <span>⏱️ {formatMins(activity.duration)} دقيقة</span>
                      <span>🦶 {activity.steps} خطوة</span>
                    </div>
                  </div>
                  
                  <ChevronLeft color="var(--text-secondary)" size={24} />
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

const MiniStat = ({ label, value }) => (
  <div>
    <div style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>{value}</div>
    <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>{label}</div>
  </div>
);

// Helper
function formatMins(totalSeconds) {
  return Math.max(1, Math.round(totalSeconds / 60));
}
