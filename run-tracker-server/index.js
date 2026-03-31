const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const { sequelize, User, Activity } = require('./database');

const app = express();
app.use(cors());
app.use(express.json());

const JWT_SECRET = 'sharqiah-super-secret-key-1234';

// ----------------------------------------------------
// Middleware to authenticate JWT token
// ----------------------------------------------------
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.sendStatus(401);

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Access denied. Custom Admin area.' });
  }
  next();
};

// ----------------------------------------------------
// OTP Authentication endpoints
// ----------------------------------------------------

// 1. Request OTP
app.post('/api/auth/request-otp', async (req, res) => {
  try {
    const { email, name, role_secret } = req.body;
    
    if (!email) return res.status(400).json({ error: 'البريد الإلكتروني مطلوب' });

    // Generate 4-digit OTP
    const otpCode = Math.floor(1000 + Math.random() * 9000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now

    // Check if user exists
    let user = await User.findOne({ where: { email } });
    
    if (!user) {
        // Create new user if they don't exist
        const userRole = role_secret === 'MAKE_ME_ADMIN_9900' ? 'admin' : 'user';
        user = await User.create({
            email,
            name: name || 'عضو جديد',
            role: userRole,
            otp_code: otpCode,
            otp_expires_at: expiresAt
        });
    } else {
        // Update existing user with new OTP
        user.otp_code = otpCode;
        user.otp_expires_at = expiresAt;
        await user.save();
    }

    // [LOCAL PROTOTYPING]: Log it to console so developer can see it
    console.log(`\n======================================`);
    console.log(`💬 OTP REQUIRED FOR: ${email}`);
    console.log(`💬 YOUR CODE IS: ${otpCode}`);
    console.log(`======================================\n`);

    // In Production: send via Nodemailer / SendGrid here.

    // Also return it in API response for easy client-side prototyping as requested by user
    res.json({ message: 'تم إرسال رمز التحقق لمحطة التحكم', otpForTesting: otpCode });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 2. Verify OTP
app.post('/api/auth/verify-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) return res.status(400).json({ error: 'البيانات غير مكتملة' });

    const user = await User.findOne({ where: { email } });
    
    if (!user) {
        return res.status(404).json({ error: 'المستخدم غير موجود' });
    }

    // Check if OTP matches
    if (user.otp_code !== otp.toString()) {
        return res.status(401).json({ error: 'الرمز السري غير صحيح' });
    }

    // Check if OTP is expired
    if (new Date() > new Date(user.otp_expires_at)) {
        return res.status(401).json({ error: 'الرمز السري انتهت صلاحيته، الرجاء طلب رمز جديد' });
    }

    // OTP is valid! Clear it.
    user.otp_code = null;
    user.otp_expires_at = null;
    await user.save();

    // Issue JWT Token
    const token = jwt.sign({ id: user.id, role: user.role, name: user.name }, JWT_SECRET, { expiresIn: '7d' });
    
    res.json({ 
        token, 
        user: { 
            id: user.id, 
            name: user.name, 
            role: user.role, 
            totalDistance: user.total_distance 
        } 
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get User Profile
app.get('/api/users/me', authenticateToken, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: ['id', 'name', 'email', 'total_distance', 'strava_access_token'],
      include: [{ model: Activity, order: [['createdAt', 'DESC']] }]
    });
    
    // Convert DB output safely without returning tokens to client
    const userData = user.toJSON();
    const stravaConnected = !!userData.strava_access_token;
    delete userData.strava_access_token;

    res.json({ ...userData, strava_connected: stravaConnected });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ----------------------------------------------------
// Official Strava OAuth 2.0 Integration
// ----------------------------------------------------
const axios = require('axios');

const STRAVA_CLIENT_ID = '218696';
const STRAVA_CLIENT_SECRET = '843bea6406c9e654123a6b374095c6c4b72a2f92';

app.get('/api/strava/auth-url', (req, res) => {
   const origin = req.headers.origin || req.headers.referer?.replace(/\/$/, '') || 'https://localhost:5173';
   const dynamicRedirectUri = `${origin}/strava-callback`;
   const url = `https://www.strava.com/oauth/authorize?client_id=${STRAVA_CLIENT_ID}&response_type=code&redirect_uri=${dynamicRedirectUri}&approval_prompt=force&scope=activity:read_all`;
   res.json({ url });
});

app.post('/api/strava/callback', authenticateToken, async (req, res) => {
   try {
     const { code } = req.body;
     if (!code) return res.status(400).json({ error: 'لم يتم استلام كود الربط' });

     const tokenRes = await axios.post('https://www.strava.com/oauth/token', {
        client_id: STRAVA_CLIENT_ID,
        client_secret: STRAVA_CLIENT_SECRET,
        code,
        grant_type: 'authorization_code'
     });

     const { access_token, refresh_token, expires_at } = tokenRes.data;

     const user = await User.findByPk(req.user.id);
     user.strava_access_token = access_token;
     user.strava_refresh_token = refresh_token;
     // expires_at is in seconds since epoch
     user.strava_token_expires_at = new Date(expires_at * 1000);
     await user.save();

     res.json({ message: 'تم ربط حساب سترافا بنجاح!' });
   } catch (err) {
      console.error('Strava Token Error:', err.response?.data || err.message);
      res.status(500).json({ error: 'الربط غير صالح، أو الكود منتهي الصلاحية.' });
   }
});

app.get('/api/strava/sync', authenticateToken, async (req, res) => {
    try {
        const user = await User.findByPk(req.user.id);
        if (!user || !user.strava_access_token) {
            return res.status(401).json({ error: 'حساب غير مربوط بسترافا' });
        }

        // Check if token expired
        if (new Date() >= user.strava_token_expires_at) {
             const refreshRes = await axios.post('https://www.strava.com/oauth/token', {
                 client_id: STRAVA_CLIENT_ID,
                 client_secret: STRAVA_CLIENT_SECRET,
                 grant_type: 'refresh_token',
                 refresh_token: user.strava_refresh_token
             });
             user.strava_access_token = refreshRes.data.access_token;
             user.strava_refresh_token = refreshRes.data.refresh_token;
             user.strava_token_expires_at = new Date(refreshRes.data.expires_at * 1000);
             await user.save();
        }

        const statsRes = await axios.get('https://www.strava.com/api/v3/athlete/activities', {
             headers: { Authorization: `Bearer ${user.strava_access_token}` },
             params: { per_page: 15 } // Fetch last 15 activities
        });

        // Map Strava Data to simpler format
        const activities = statsRes.data
            // Optional: Filter for Run/Walk only
            .filter(a => a.type === 'Run' || a.type === 'Walk' || a.sport_type === 'Run' || a.sport_type === 'Walk')
            .map(a => {
               // duration in seconds
               const durationSecs = a.moving_time; 
               // distance in km
               const distanceKm = a.distance / 1000;
               
               let paceStr = '00:00';
               if (distanceKm > 0) {
                 const paceDecimalMins = (durationSecs / 60) / distanceKm;
                 const mins = Math.floor(paceDecimalMins);
                 const secs = Math.round((paceDecimalMins - mins) * 60);
                 paceStr = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
               }

               return {
                  title: a.name,
                  strava_id: a.id.toString(),
                  distance: distanceKm.toFixed(2),
                  duration: durationSecs,
                  pace: paceStr,
                  date: a.start_date_local,
                  strava_url: `https://www.strava.com/activities/${a.id}`
               };
            });

        // Filter out activities that were already approved or submitted to our database!
        const existingIds = await Activity.findAll({
             where: { UserId: user.id },
             attributes: ['strava_id']
        });
        const submittedSet = new Set(existingIds.map(e => e.strava_id).filter(id => id != null));
        
        const unsyncedActivities = activities.map(act => ({
            ...act,
            already_submitted: submittedSet.has(act.strava_id)
        }));

        res.json(unsyncedActivities);

    } catch (err) {
        console.error('Strava Sync Error:', err.response?.data || err.message);
        res.status(500).json({ error: 'لا يمكن جلب البيانات من سترافا حالياً' });
    }
});


app.post('/api/activities', authenticateToken, async (req, res) => {
  try {
    const { title, strava_url, distance, duration, pace, strava_id } = req.body;
    
    if (!title || !strava_id) {
       return res.status(400).json({ error: 'الرجاء توفير بيانات النشاط كاملة' });
    }

    // Check if duplicate submission
    const duplicate = await Activity.findOne({ where: { strava_id } });
    if (duplicate) {
       return res.status(400).json({ error: 'تم إرسال هذا النشاط مسبقاً.' });
    }

    const newActivity = await Activity.create({
      title,
      strava_id,
      strava_url,
      distance: distance.toString(), 
      duration: duration || 1, 
      pace: pace || '00:00',
      UserId: req.user.id,
      status: 'pending'
    });

    res.status(201).json({ message: 'تم إرسال نشاطك بنجاح للتدقيق!', data: newActivity });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/activities/pending', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const pendingActivities = await Activity.findAll({
      where: { status: 'pending' },
      include: [{ model: User, attributes: ['name', 'email'] }],
      order: [['createdAt', 'DESC']]
    });
    res.json(pendingActivities);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/activities/:id/approve', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const activity = await Activity.findByPk(req.params.id);
    if (!activity || activity.status === 'approved') return res.status(400).json({ error: 'النشاط غير صالح للاعتماد' });

    activity.status = 'approved';
    await activity.save();

    const user = await User.findByPk(activity.UserId);
    if (user) {
      user.total_distance += parseFloat(activity.distance);
      await user.save();
    }
    res.json({ message: 'تم الاعتماد بنجاح', activity });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/activities/:id/reject', authenticateToken, requireAdmin, async (req, res) => {
  try {
     const activity = await Activity.findByPk(req.params.id);
     if (!activity) return res.status(404).json({ error: 'النشاط غير موجود' });
     activity.status = 'rejected';
     await activity.save();
     res.json({ message: 'تم رفض النشاط', activity });
  } catch (err) {
     res.status(500).json({ error: err.message });
  }
});

// INIT SERVER
const PORT = process.env.PORT || 4000;
sequelize.sync({ alter: true }).then(() => {
  console.log('Database synced. Server listening on port', PORT);
  app.listen(PORT, () => {
    console.log(`Team Sharqiah API Running`);
  });
});
