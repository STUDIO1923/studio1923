import React from 'react';
import { PremiumLogoIcon } from './icons/PremiumLogoIcon';

interface LoadingViewProps {
    message: string;
    progress: number | null;
}

const LoadingView: React.FC<LoadingViewProps> = ({ message, progress }) => {
    return (
        <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-white p-4">
            <PremiumLogoIcon className="w-20 h-20 text-indigo-500 animate-pulse" />
            <h1 className="text-4xl font-bold mt-6 font-rajdhani tracking-widest">
                STUDIO1923
            </h1>
            <p className="text-lg text-slate-300 mt-2 tracking-wider">{message}</p>
            
            {progress !== null && (
                <div className="w-full max-w-md mt-6">
                    <div className="w-full bg-slate-700 rounded-full h-2.5">
                        <div 
                            className="bg-indigo-500 h-2.5 rounded-full transition-all duration-500 ease-out" 
                            style={{ width: `${progress}%` }}
                        ></div>
                    </div>
                </div>
            )}
            
            {progress !== null && progress < 95 && message.includes('AI') && (
                 <p className="text-sm text-slate-400 mt-4 text-center">
                    นี่เป็นการตั้งค่าครั้งแรกและอาจใช้เวลาหลายนาที <br />
                    <span className="font-bold text-yellow-400">กรุณาอย่าปิดหน้าต่างนี้</span>
                </p>
            )}
        </div>
    );
};

export default LoadingView;
