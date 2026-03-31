import React, { useEffect, useState } from 'react';
import { api } from '../utils/api';
import { RefreshCw, CheckCircle, AlertCircle } from 'lucide-react';

export default function StravaCallback() {
  const [status, setStatus] = useState('processing'); // processing, success, error
  const [errMsg, setErrMsg] = useState('');

  useEffect(() => {
    const processCode = async () => {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');
        
        if (!code) throw new Error('لم يتم العثور على رمز التفويض من سترافا.');

        await api.linkStravaAccount(code);
        setStatus('success');
        
        setTimeout(() => {
           window.location.href = '/';
        }, 3000);

      } catch (err) {
        setStatus('error');
        setErrMsg(err.message || 'حدث خطأ غير متوقع');
      }
    };
    processCode();
  }, []);

  return (
    <div style={{ padding: '2rem', textAlign: 'center', marginTop: '10vh' }}>
       {status === 'processing' && (
         <div style={{ color: 'var(--primary-color)'}}>
            <RefreshCw size={48} className="spin" style={{ margin: '0 auto 1rem'}} />
            <h2>جاري ربط حسابك بسترافا...</h2>
            <p className="text-secondary">الرجاء الانتظار، لا تغلق هذه الصفحة.</p>
         </div>
       )}

       {status === 'success' && (
         <div style={{ color: '#10B981'}}>
            <CheckCircle size={48} style={{ margin: '0 auto 1rem'}} />
            <h2>تم الربط بنجاح! 🎉</h2>
            <p className="text-secondary">جاري تحويلك للمنصة...</p>
         </div>
       )}

       {status === 'error' && (
         <div style={{ color: '#ef4444'}}>
            <AlertCircle size={48} style={{ margin: '0 auto 1rem'}} />
            <h2>فشل الربط!</h2>
            <p className="text-secondary">{errMsg}</p>
            <button className="btn btn-secondary mt-1" onClick={() => window.location.href = '/'}>
               العودة للرئيسية
            </button>
         </div>
       )}

       <style>{`
        .spin { animation: spin 1s linear infinite; }
        @keyframes spin { 100% { transform: rotate(360deg); } }
        .mt-1 { margin-top: 1rem; }
       `}</style>
    </div>
  );
}
