// Use VITE_API_URL injected by Render, or fallback to relative for local proxy
const baseUrl = import.meta.env.VITE_API_URL || '';
const API_URL = baseUrl ? `${baseUrl}/api` : '/api';

const getHeaders = () => {
  const token = localStorage.getItem('site_token');
  return {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` })
  };
};

export const api = {
  // --- AUTH OTP ---
  requestOtp: async (email, name, role_secret) => {
    const res = await fetch(`${API_URL}/auth/request-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, name, role_secret })
    });
    if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'فشل إرسال الرمز');
    }
    return res.json();
  },

  verifyOtp: async (email, otp) => {
    const res = await fetch(`${API_URL}/auth/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, otp })
    });
    if (!res.ok) {
       const error = await res.json();
       throw new Error(error.error || 'الرمز غير صحيح');
    }
    const data = await res.json();
    localStorage.setItem('site_token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    return data;
  },

  logout: () => {
    localStorage.removeItem('site_token');
    localStorage.removeItem('user');
  },

  getUserData: async () => {
    const res = await fetch(`${API_URL}/users/me`, { headers: getHeaders() });
    if (!res.ok) throw new Error('يرجى تسجيل الدخول مجدداً.');
    return res.json();
  },

  // --- ACTIVITIES ---
  submitStravaActivity: async (activityData) => {
    // ActivityData expects { title, strava_id, strava_url, distance, duration, pace }
    const res = await fetch(`${API_URL}/activities`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(activityData)
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || 'فشل إرسال النشاط');
    }
    return res.json();
  },

  // --- STRAVA API INTEGRATION ---
  getStravaAuthUrl: async () => {
    const res = await fetch(`${API_URL}/strava/auth-url`, { headers: getHeaders() });
    return res.json();
  },

  linkStravaAccount: async (code) => {
    const res = await fetch(`${API_URL}/strava/callback`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ code })
    });
    if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'فشل ربط الحساب');
    }
    return res.json();
  },

  syncStravaActivities: async () => {
    const res = await fetch(`${API_URL}/strava/sync`, { headers: getHeaders() });
    if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'فشل جلب الأنشطة');
    }
    return res.json();
  },

  getPendingActivities: async () => {
    const res = await fetch(`${API_URL}/activities/pending`, { headers: getHeaders() });
    if (!res.ok) throw new Error('فشل التحديث');
    return res.json();
  },

  approveActivity: async (id) => {
    const res = await fetch(`${API_URL}/activities/${id}/approve`, {
      method: 'PUT',
      headers: getHeaders()
    });
    if (!res.ok) throw new Error('Failed to approve');
    return res.json();
  },

  rejectActivity: async (id) => {
    const res = await fetch(`${API_URL}/activities/${id}/reject`, {
      method: 'PUT',
      headers: getHeaders()
    });
    if (!res.ok) throw new Error('Failed to reject');
    return res.json();
  }
};
