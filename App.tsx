import React, { useState, useEffect } from 'react';
import AuthPage from './components/AuthPage';
import * as configService from './services/configService';
import * as userService from './services/userService';
import * as cardGenerationService from './services/cardGenerationService';
import { SunIcon } from './components/icons/SunIcon';
import { MoonIcon } from './components/icons/MoonIcon';
import LoadingView from './components/LoadingView';

const App: React.FC = () => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'dark');
  const [loadingStatus, setLoadingStatus] = useState({ message: 'กำลังโหลดแอปพลิเคชัน...', progress: null as number | null });

  useEffect(() => {
    if (theme === 'light') {
        document.documentElement.classList.remove('dark');
        localStorage.setItem('theme', 'light');
    } else {
        document.documentElement.classList.add('dark');
        localStorage.setItem('theme', 'dark');
    }
  }, [theme]);

  useEffect(() => {
    const onProgress = (status: { message: string, progress: number | null }) => {
        setLoadingStatus(status);
    };

    const initApp = async () => {
      try {
        setLoadingStatus({ message: 'กำลังเตรียมการตั้งค่า...', progress: 0 });
        await configService.initializeConfig();
        
        setLoadingStatus({ message: 'กำลังสร้างข้อมูลผู้ใช้...', progress: 5 });
        await userService.initializeUsers();
        
        await cardGenerationService.initializeCardDatabase(onProgress);

      } catch (error) {
        console.error("Failed to initialize app config:", error);
        setLoadingStatus({ message: 'เกิดข้อผิดพลาดระหว่างการเริ่มต้น กรุณารีเฟรช', progress: null });
      } finally {
        setIsInitialized(true);
      }
    };
    initApp();
  }, []);

  const toggleTheme = () => {
    setTheme(prevTheme => (prevTheme === 'light' ? 'dark' : 'light'));
  };

  if (!isInitialized) {
    return <LoadingView message={loadingStatus.message} progress={loadingStatus.progress} />;
  }

  return (
    <div className="min-h-screen bg-transparent text-slate-800 dark:text-slate-200">
       <button
        onClick={toggleTheme}
        className="fixed top-4 right-4 z-[60] p-2 rounded-full bg-slate-200/80 dark:bg-slate-800/80 backdrop-blur-sm text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors"
        aria-label="Toggle theme"
      >
        {theme === 'light' ? <MoonIcon className="w-5 h-5" /> : <SunIcon className="w-5 h-5" />}
      </button>
      <AuthPage />
    </div>
  );
};

export default App;
