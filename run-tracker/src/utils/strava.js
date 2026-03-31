// ============================================
// أدخل بيانات تطبيق المطورين من حساب سترافا هنا
// ============================================
const STRAVA_CLIENT_ID = 'YOUR_CLIENT_ID_HERE'; 
const STRAVA_CLIENT_SECRET = 'YOUR_CLIENT_SECRET_HERE';
const REDIRECT_URI = window.location.origin; // e.g., https://10.0.160.31:5173

export const getStravaAuthUrl = () => {
  const params = new URLSearchParams({
    client_id: STRAVA_CLIENT_ID,
    response_type: 'code',
    redirect_uri: REDIRECT_URI,
    approval_prompt: 'force',
    scope: 'activity:write'
  });
  return `https://www.strava.com/oauth/authorize?${params.toString()}`;
};

export const exchangeCodeForToken = async (code) => {
  const res = await fetch('https://www.strava.com/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: STRAVA_CLIENT_ID,
      client_secret: STRAVA_CLIENT_SECRET,
      code,
      grant_type: 'authorization_code'
    })
  });
  const data = await res.json();
  if (data.access_token) {
    localStorage.setItem('strava_access_token', data.access_token);
    localStorage.setItem('strava_refresh_token', data.refresh_token);
    return data.access_token;
  }
  throw new Error("فشل الحصول على تصريح سترافا");
};

// Creates a basic XML string containing GPS track points
export const generateGpxString = (routePoints, activityName) => {
  let gpxHeader = `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="Team Sharqiah Tracker">
  <metadata>
    <name>${activityName}</name>
    <time>${routePoints[0]?.timestamp || new Date().toISOString()}</time>
  </metadata>
  <trk>
    <name>${activityName}</name>
    <type>9</type> <!-- Type 9 is Run/Walk usually -->
    <trkseg>
`;

  let gpxPoints = routePoints.map(pt => `      <trkpt lat="${pt.lat}" lon="${pt.lng}">
        <ele>0</ele>
        <time>${pt.timestamp}</time>
      </trkpt>`).join("\n");

  let gpxFooter = `
    </trkseg>
  </trk>
</gpx>`;

  return gpxHeader + gpxPoints + gpxFooter;
};

// Uploads the generated GPX data blob to Strava
export const uploadGpxToStrava = async (gpxString, activityName, accessToken) => {
  const blob = new Blob([gpxString], { type: 'application/gpx+xml' });
  const file = new File([blob], `${activityName.replace(/\\s+/g, '_')}.gpx`, { type: 'application/gpx+xml' });

  const formData = new FormData();
  formData.append('file', file);
  formData.append('name', activityName);
  formData.append('description', 'تم تسجيل هذا النشاط بواسطة منصة فريق الشرقية للمشي');
  formData.append('trainer', 'false');
  formData.append('commute', 'false');
  formData.append('data_type', 'gpx');
  formData.append('external_id', 'sharqia_' + Date.now() + '.gpx');

  const res = await fetch('https://www.strava.com/api/v3/uploads', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`
    },
    body: formData
  });

  const rawData = await res.json();
  if (!res.ok) {
     throw new Error(rawData.message || 'حدث خطأ أثناء الرفع لسترافا');
  }
  return rawData;
};
