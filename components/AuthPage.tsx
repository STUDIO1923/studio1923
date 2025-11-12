import React, { useState, useCallback, useEffect } from 'react';
import { AuthView } from '../types';
import { PremiumLogoIcon } from './icons/PremiumLogoIcon';
import LoggedInView from './LoggedInView';
import { GoogleIcon } from './icons/GoogleIcon';
import * as configService from '../services/configService';

const AuthPage: React.FC = () => {
  const [view, setView] = useState<AuthView>(AuthView.Login);
  const [email, setEmail] = useState('');
  const [nickname, setNickname] = useState('');
  const [password, setPassword] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [initialCoins, setInitialCoins] = useState(100);
  const [initialPoints, setInitialPoints] = useState(10);
  const [rememberMe, setRememberMe] = useState(false);
  const [backgroundUrl, setBackgroundUrl] = useState('');

  useEffect(() => {
    const savedEmail = localStorage.getItem('rememberedEmail');
    if (savedEmail) {
      setEmail(savedEmail);
      setRememberMe(true);
    }

    const loadBackground = async () => {
        const config = await configService.getConfig();
        setBackgroundUrl(config.auth_background);
    };
    loadBackground();
  }, []);


  const clearMessages = () => {
    setError(null);
    setSuccessMessage(null);
  };

  const handleAuthAction = useCallback(<T,>(action: () => Promise<T>, successMessageText: string, successView: AuthView) => {
    clearMessages();
    setIsLoading(true);
    setTimeout(() => {
      try {
        action();
        setSuccessMessage(successMessageText);
        setTimeout(() => {
          setView(successView);
          clearMessages();
        }, 1500);
      } catch (err) {
        if (err instanceof Error) {
            setError(err.message);
        } else {
            setError("เกิดข้อผิดพลาดที่ไม่รู้จัก");
        }
      } finally {
        setIsLoading(false);
      }
    }, 1000); // Simulate network delay
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();

    if (rememberMe) {
        localStorage.setItem('rememberedEmail', email);
    } else {
        localStorage.removeItem('rememberedEmail');
    }

    // Test account checks
    if (email === '1234' && password === '1234') {
        setNickname('AdminUser');
        setIsAdmin(true);
        setInitialCoins(9999);
        setInitialPoints(1250);
        handleAuthAction(
            async () => console.log("Simulating admin user login..."),
            `ยินดีต้อนรับ, ผู้ดูแลระบบ AdminUser! กำลังเข้าสู่ระบบ...`,
            AuthView.LoggedIn
        );
        return;
    }
    
    if (email === '123' && password === '123') {
        setNickname('MemberTest');
        setIsAdmin(false);
        setInitialCoins(100);
        setInitialPoints(10);
        handleAuthAction(
            async () => console.log("Simulating member user login..."),
            `ยินดีต้อนรับ, MemberTest! กำลังเข้าสู่ระบบ...`,
            AuthView.LoggedIn
        );
        return;
    }

    if (!email || !password) {
      setError("กรุณากรอกอีเมลและรหัสผ่าน");
      return;
    }
    if (email.includes('test')) {
        setNickname('TestUser');
        setIsAdmin(false);
        setInitialCoins(100);
        setInitialPoints(10);
    }

    handleAuthAction(
      async () => console.log("Simulating login..."),
      `ยินดีต้อนรับกลับมา! กำลังเข้าสู่ระบบ...`,
      AuthView.LoggedIn
    );
  };

  const handleGoogleLogin = () => {
    // Simulate successful Google login
    setNickname('GoogleUser');
    setIsAdmin(false);
    setInitialCoins(100);
    setInitialPoints(10);
    handleAuthAction(
        async () => console.log("Simulating Google login..."),
        `ยินดีต้อนรับ, GoogleUser! กำลังเข้าสู่ระบบ...`,
        AuthView.LoggedIn
    );
  };

  const handleSignup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !nickname || !password) {
      setError("กรุณากรอกข้อมูลให้ครบถ้วน");
      return;
    }
    handleAuthAction(
      async () => console.log("Simulating signup..."),
      `รหัสยืนยันถูกส่งไปยัง ${email} แล้ว`,
      AuthView.VerifyEmail
    );
  };

  const handleVerifyEmail = (e: React.FormEvent) => {
    e.preventDefault();
    if (verificationCode !== '123456') {
      setError("รหัสยืนยันไม่ถูกต้อง กรุณาลองใหม่อีกครั้ง");
      return;
    }
    handleAuthAction(
      async () => console.log("Simulating email verification..."),
      "ยืนยันบัญชีสำเร็จ! กรุณาเข้าสู่ระบบ",
      AuthView.Login
    );
  };

  const handleForgotPassword = (e: React.FormEvent) => {
    e.preventDefault();
     if (!email) {
      setError("กรุณากรอกอีเมลของคุณ");
      return;
    }
    handleAuthAction(
      async () => console.log("Simulating password reset request..."),
      `รหัสสำหรับรีเซ็ตถูกส่งไปยัง ${email} แล้ว`,
      AuthView.ResetPassword
    );
  };
  
  const handleResetPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (verificationCode !== '654321') {
      setError("รหัสรีเซ็ตไม่ถูกต้อง");
      return;
    }
     if (password.length < 6) {
      setError("รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร");
      return;
    }
    handleAuthAction(
      async () => console.log("Simulating password reset..."),
      "รีเซ็ตรหัสผ่านสำเร็จ กรุณาเข้าสู่ระบบ",
      AuthView.Login
    );
  };

  const renderTitle = () => {
    switch (view) {
      case AuthView.Login: return "เข้าสู่ระบบ";
      case AuthView.Signup: return "สร้างบัญชีใหม่";
      case AuthView.VerifyEmail: return "ยืนยันอีเมล";
      case AuthView.ForgotPassword: return "ลืมรหัสผ่าน";
      case AuthView.ResetPassword: return "ตั้งรหัสผ่านใหม่";
      case AuthView.LoggedIn: return `ยินดีต้อนรับ, ${nickname || 'สมาชิก'}!`;
    }
  };

  const renderForm = () => {
    const inputClasses = "w-full bg-slate-200 dark:bg-slate-800 border border-slate-400 dark:border-slate-600 text-slate-900 dark:text-white p-3 rounded-md focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 placeholder-slate-500 dark:placeholder-slate-400";
    const buttonClasses = "w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-4 rounded-md transition duration-300 ease-in-out transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed";

    switch (view) {
      case AuthView.Login:
        return (
          <>
            <form onSubmit={handleLogin} className="space-y-6">
              <input type="text" placeholder="อีเมล" value={email} onChange={(e) => setEmail(e.target.value)} className={inputClasses} />
              <input type="password" placeholder="รหัสผ่าน" value={password} onChange={(e) => setPassword(e.target.value)} className={inputClasses} />
              
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    id="remember-me"
                    name="remember-me"
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-slate-500 rounded bg-slate-300 dark:bg-slate-700"
                  />
                  <label htmlFor="remember-me" className="ml-2 block text-sm text-slate-600 dark:text-slate-300">
                    จำฉันไว้ในระบบ
                  </label>
                </div>

                <div className="text-sm">
                  <a href="#" onClick={(e) => { e.preventDefault(); setView(AuthView.ForgotPassword); clearMessages(); }} className="hover:text-indigo-500 dark:hover:text-indigo-400 text-slate-500 dark:text-slate-400">
                    ลืมรหัสผ่าน?
                  </a>
                </div>
              </div>
              
              <button type="submit" disabled={isLoading} className={buttonClasses}>
                {isLoading ? "กำลังโหลด..." : "เข้าสู่ระบบ"}
              </button>
            </form>
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-400 dark:border-slate-600"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="bg-white/50 dark:bg-slate-800/50 px-2 text-slate-500 dark:text-slate-400">หรือ</span>
              </div>
            </div>
            <button
              onClick={handleGoogleLogin}
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-3 bg-white hover:bg-slate-200 text-slate-800 font-bold py-3 px-4 rounded-md transition duration-300 ease-in-out transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed border border-slate-300"
            >
              <GoogleIcon className="w-5 h-5" />
              เข้าสู่ระบบด้วย Google
            </button>
          </>
        );

      case AuthView.Signup:
        return (
          <form onSubmit={handleSignup} className="space-y-6">
            <input type="email" placeholder="อีเมล" value={email} onChange={(e) => setEmail(e.target.value)} className={inputClasses} />
            <input type="text" placeholder="ชื่อเล่น" value={nickname} onChange={(e) => setNickname(e.target.value)} className={inputClasses} />
            <input type="password" placeholder="รหัสผ่าน" value={password} onChange={(e) => setPassword(e.target.value)} className={inputClasses} />
            <button type="submit" disabled={isLoading} className={buttonClasses}>
              {isLoading ? "กำลังสร้างบัญชี..." : "สมัครสมาชิก"}
            </button>
          </form>
        );

      case AuthView.VerifyEmail:
        return (
          <form onSubmit={handleVerifyEmail} className="space-y-6">
            <p className="text-slate-600 dark:text-slate-300 text-center text-sm">กรอกรหัส 6 หลักที่ส่งไปยัง <span className="font-bold text-slate-900 dark:text-white">{email}</span></p>
            <input type="text" placeholder="รหัสยืนยัน" value={verificationCode} onChange={(e) => setVerificationCode(e.target.value)} className={`${inputClasses} text-center tracking-[0.5em]`} />
            <button type="submit" disabled={isLoading} className={buttonClasses}>
              {isLoading ? "กำลังยืนยัน..." : "ยืนยัน"}
            </button>
          </form>
        );
        
      case AuthView.ForgotPassword:
        return (
          <form onSubmit={handleForgotPassword} className="space-y-6">
            <p className="text-slate-600 dark:text-slate-300 text-center text-sm">กรอกอีเมลของคุณเพื่อรับรหัสสำหรับรีเซ็ต</p>
            <input type="email" placeholder="อีเมล" value={email} onChange={(e) => setEmail(e.target.value)} className={inputClasses} />
            <button type="submit" disabled={isLoading} className={buttonClasses}>
              {isLoading ? "กำลังส่ง..." : "ส่งรหัสรีเซ็ต"}
            </button>
          </form>
        );

      case AuthView.ResetPassword:
        return (
          <form onSubmit={handleResetPassword} className="space-y-6">
            <p className="text-slate-600 dark:text-slate-300 text-center text-sm">กรอกรหัสรีเซ็ตและรหัสผ่านใหม่ของคุณ</p>
            <input type="text" placeholder="รหัสรีเซ็ต" value={verificationCode} onChange={(e) => setVerificationCode(e.target.value)} className={`${inputClasses} text-center tracking-[0.5em]`} />
            <input type="password" placeholder="รหัสผ่านใหม่" value={password} onChange={(e) => setPassword(e.target.value)} className={inputClasses} />
            <button type="submit" disabled={isLoading} className={buttonClasses}>
              {isLoading ? "กำลังอัปเดต..." : "ตั้งรหัสผ่านใหม่"}
            </button>
          </form>
        );

      default:
        return null;
    }
  };

  const renderFooterLink = () => {
    if (view === AuthView.LoggedIn) return null;

    const linkText = view === AuthView.Login ? "ยังไม่มีบัญชี? สมัครสมาชิก" : "มีบัญชีอยู่แล้ว? เข้าสู่ระบบ";
    const newView = view === AuthView.Login ? AuthView.Signup : AuthView.Login;
    
     if (view === AuthView.VerifyEmail || view === AuthView.ForgotPassword || view === AuthView.ResetPassword) {
        return (
             <div className="mt-6 text-center text-slate-500 dark:text-slate-400 text-sm">
                <a href="#" onClick={(e) => { e.preventDefault(); setView(AuthView.Login); clearMessages(); }} className="hover:text-indigo-500 dark:hover:text-indigo-400">กลับไปหน้าเข้าสู่ระบบ</a>
            </div>
        )
    }

    return (
      <div className="mt-6 text-center text-slate-500 dark:text-slate-400 text-sm">
        <a href="#" onClick={(e) => { e.preventDefault(); setView(newView); clearMessages(); }} className="hover:text-indigo-500 dark:hover:text-indigo-400">{linkText}</a>
      </div>
    );
  };
  
  if (view === AuthView.LoggedIn) {
    return (
        <LoggedInView 
            nickname={nickname}
            isAdmin={isAdmin} 
            initialCoins={initialCoins}
            initialPoints={initialPoints}
            onLogout={() => { 
                setView(AuthView.Login); 
                setEmail(''); 
                setPassword(''); 
                setNickname('');
                setIsAdmin(false); 
            }} 
        />
    );
  }

  return (
    <div className="min-h-screen bg-cover bg-center bg-no-repeat" style={{backgroundImage: `url('${backgroundUrl}')`}}>
      <div className="min-h-screen bg-slate-900/50 dark:bg-slate-900/75">
        <div className="flex items-center justify-center min-h-screen p-4">
          <div className="w-full max-w-sm mx-auto">
            <div className="text-center mb-6">
                <PremiumLogoIcon className="w-16 h-16 mx-auto text-indigo-500" />
                <h1 className="text-5xl font-bold text-white mt-4 font-rajdhani tracking-widest">
                  STUDIO1923
                </h1>
                <p className="text-lg text-slate-300 mt-1 tracking-wider">ซุปเปอร์เซฟโซน</p>
              </div>

            <div className="relative overflow-hidden bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm border border-slate-300 dark:border-slate-700 rounded-lg p-8 shadow-2xl">
              <div className="absolute -top-1 -right-1 w-24 h-24 overflow-hidden" aria-hidden="true">
                  <div className="absolute transform rotate-45 bg-yellow-400 text-center text-black font-semibold py-1 right-[-30px] top-[20px] w-[120px] shadow-md">
                      BETA
                  </div>
              </div>
              <h2 className="text-2xl font-bold text-center text-slate-800 dark:text-slate-200 mb-6">{renderTitle()}</h2>
              
              {error && <div className="bg-red-500/10 border border-red-500/30 text-red-400 dark:text-red-300 p-3 mb-4 text-center rounded-md text-sm">{error}</div>}
              {successMessage && <div className="bg-green-500/10 border border-green-500/30 text-green-400 dark:text-green-300 p-3 mb-4 text-center rounded-md text-sm">{successMessage}</div>}
              
              {renderForm()}
              {renderFooterLink()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;