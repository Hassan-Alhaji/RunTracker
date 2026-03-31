import React, { useState } from 'react';
import { api } from '../utils/api';
import { Mail, CheckCircle, Smartphone } from 'lucide-react';

export default function AuthScreen({ onLoginSuccess }) {
  const [isLogin, setIsLogin] = useState(true);
  
  // Step 1: Email + Name
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [roleSecret, setRoleSecret] = useState('');
  
  // Step 2: OTP
  const [step, setStep] = useState(1);
  const [otp, setOtp] = useState('');
  const [mockOtpMsg, setMockOtpMsg] = useState('');

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRequestOtp = async (e) => {
    e.preventDefault();
    if (!email || (!isLogin && !name)) {
      setError('يرجى تعبئة الحقول الأساسية');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Both Login and Register now just request an OTP. 
      // If registering, we send the name which the backend will use to create the account.
      const res = await api.requestOtp(email, isLogin ? null : name, roleSecret);
      
      // Move to step 2
      setStep(2);
      
      // For local testing: Show the OTP on screen as requested by user
      if (res.otpForTesting) {
         setMockOtpMsg(`تم الاستلام.. [لغرض التجربة، الرمز هو: ${res.otpForTesting}]`);
      }
      
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (otp.length !== 4) {
      setError('الرمز يجب أن يكون 4 أرقام');
      return;
    }

    setLoading(true);
    setError('');

    try {
       const data = await api.verifyOtp(email, otp);
       onLoginSuccess(data.user);
    } catch (err) {
       setError(err.message);
    } finally {
       setLoading(false);
    }
  };

  return (
    <div style={{ padding: '2rem 1rem', maxWidth: '400px', margin: '0 auto', textAlign: 'center' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ color: 'var(--primary-color)' }}>فريق الشرقية للمشي</h1>
        <p className="text-secondary">تسجيل الدخول الذكي اللامركزي</p>
      </div>

      <div style={{ backgroundColor: 'var(--surface-color)', padding: '2rem 1.5rem', borderRadius: '16px', position: 'relative' }}>
        
        {step === 1 ? (
          <>
            {/* Step 1: Request OTP */}
            <div style={{ display: 'flex', gap: '1rem', borderBottom: '1px solid #333', marginBottom: '1.5rem' }}>
              <button 
                style={{ flex: 1, paddingBottom: '0.5rem', color: isLogin ? 'var(--primary-color)' : '#fff', borderBottom: isLogin ? '2px solid var(--primary-color)' : 'none', background: 'none' }}
                onClick={() => setIsLogin(true)}
              >
                 دخول سريع
              </button>
              <button 
                style={{ flex: 1, paddingBottom: '0.5rem', color: !isLogin ? 'var(--primary-color)' : '#fff', borderBottom: !isLogin ? '2px solid var(--primary-color)' : 'none', background: 'none' }}
                onClick={() => setIsLogin(false)}
              >
                 تسجيل بطل جديد
              </button>
            </div>

            {error && <div className="error-box">{error}</div>}

            <form onSubmit={handleRequestOtp} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {!isLogin && (
                <input 
                  type="text" placeholder="الاسم الكامل" value={name} onChange={e => setName(e.target.value)}
                  style={inputStyle}
                />
              )}

              <input 
                type="email" placeholder="البريد الإلكتروني" value={email} onChange={e => setEmail(e.target.value)}
                style={inputStyle}
                required
              />

              {!isLogin && (
                 <details style={{ textAlign: 'right', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    <summary>أتملك كود الإدارة؟</summary>
                    <input type="password" placeholder="الكود السري" value={roleSecret} onChange={e => setRoleSecret(e.target.value)} style={{...inputStyle, marginTop: '0.5rem'}} />
                 </details>
              )}

              <button type="submit" disabled={loading} className="btn btn-primary w-full" style={{ marginTop: '1rem', display: 'flex', justifyContent: 'center', gap: '8px' }}>
                <Mail size={20}/> إرسال رمز التحقق
              </button>
            </form>
          </>

        ) : (

          <>
             {/* Step 2: Verify OTP */}
             <div style={{ marginBottom: '1.5rem' }}>
                <Smartphone size={40} color="var(--primary-color)" style={{margin: '0 auto 10px'}} />
                <h3 style={{margin: '0 0 5px'}}>أدخل رمز التحقق</h3>
                <p className="text-secondary" style={{fontSize: '0.9rem', margin: 0}}>وصلك رمز من 4 أرقام على {email}</p>
             </div>

             {/* Mock Email Display for Testing */}
             {mockOtpMsg && (
                <div style={{ backgroundColor: '#10B98122', border: '1px dashed #10B981', color: '#10B981', padding: '10px', borderRadius: '8px', marginBottom: '15px', fontSize: '0.85rem' }}>
                   {mockOtpMsg}
                </div>
             )}

             {error && <div className="error-box">{error}</div>}

             <form onSubmit={handleVerifyOtp} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <input 
                  type="text" 
                  inputMode="numeric" 
                  pattern="[0-9]*"
                  maxLength="4"
                  placeholder="----" 
                  value={otp} 
                  onChange={e => setOtp(e.target.value)}
                  style={{ ...inputStyle, textAlign: 'center', fontSize: '2rem', letterSpacing: '0.5rem', fontWeight: 'bold' }}
                  required
                />

                <button type="submit" disabled={loading || otp.length < 4} className="btn btn-primary w-full" style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
                  <CheckCircle size={20}/> تأكيد الدخول
                </button>

                <button type="button" onClick={() => setStep(1)} disabled={loading} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', marginTop: '0.5rem', textDecoration: 'underline' }}>
                   تعديل البريد الإلكتروني
                </button>
             </form>
          </>
        )}
      </div>

      <style>{`
         .error-box { background: #ff333333; color: #ff6b6b; padding: 0.75rem; border-radius: 8px; margin-bottom: 1rem; font-size: 0.9rem; }
      `}</style>
    </div>
  );
}

const inputStyle = {
  width: '100%',
  padding: '1rem',
  backgroundColor: 'var(--surface-color-light)',
  border: '1px solid #333',
  borderRadius: '8px',
  color: '#fff',
  fontSize: '1rem',
  fontFamily: 'inherit',
  outline: 'none',
  direction: 'rtl'
};
