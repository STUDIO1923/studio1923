import React, { useEffect, useState } from 'react';
import { CoinIcon } from './icons/CoinIcon';

export interface NotificationData {
  id: number;
  message: string;
  type: 'success' | 'info' | 'quest';
  reward?: number;
}

interface NotificationToastProps extends NotificationData {
  onClose: (id: number) => void;
}

const NotificationToast: React.FC<NotificationToastProps> = ({ id, message, type, reward, onClose }) => {
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setExiting(true);
      setTimeout(() => onClose(id), 500); // Wait for exit animation
    }, 5000); // 5 seconds visible

    return () => clearTimeout(timer);
  }, [id, onClose]);

  const handleClose = () => {
    setExiting(true);
    setTimeout(() => onClose(id), 500);
  };

  const getTitle = () => {
    if (type === 'quest') return 'เควสสำเร็จ!';
    if (type === 'success') return 'สำเร็จ!';
    return 'การแจ้งเตือน';
  };
  
  const getIcon = () => {
     if (type === 'quest') return '🎉';
     if (type === 'success') return '✅';
     return '🔔';
  };

  return (
    <div 
        className={`toast-anim w-[350px] max-w-[90vw] bg-white/80 dark:bg-slate-800/80 backdrop-blur-md border border-slate-300 dark:border-slate-700 rounded-lg shadow-2xl flex items-start p-4 gap-4 overflow-hidden relative ${exiting ? 'exit' : 'enter'}`}
        style={{'--toast-color': type === 'quest' ? '#a78bfa' : '#34d399'} as React.CSSProperties}
    >
      <div className="absolute left-0 top-0 bottom-0 w-1 bg-[var(--toast-color)]"></div>
      <div className="text-2xl pt-1">{getIcon()}</div>
      <div className="flex-1">
        <p className="font-bold text-slate-900 dark:text-white">{getTitle()}</p>
        <p className="text-sm text-slate-600 dark:text-slate-300">{message}</p>
        {type === 'quest' && reward && (
            <div className="flex items-center gap-1.5 mt-2 text-sm text-yellow-700 dark:text-yellow-300 bg-yellow-500/10 px-2 py-1 rounded-md">
              <CoinIcon className="w-4 h-4" />
              <span>รางวัล: +{reward} เหรียญ</span>
            </div>
          )}
      </div>
      <button onClick={handleClose} className="text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white absolute top-2 right-2 text-xl">&times;</button>
    </div>
  );
};

export default NotificationToast;
