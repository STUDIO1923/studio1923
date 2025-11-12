import React, { useEffect } from 'react';
import { CoinIcon } from './icons/CoinIcon';

interface FreeCoinNotificationProps {
    show: boolean;
    amount: number;
    onAnimationEnd: () => void;
}

const FreeCoinNotification: React.FC<FreeCoinNotificationProps> = ({ show, amount, onAnimationEnd }) => {
    useEffect(() => {
        if (show) {
            const timer = setTimeout(() => {
                onAnimationEnd();
            }, 2000); // Animation duration
            return () => clearTimeout(timer);
        }
    }, [show, onAnimationEnd]);

    if (!show) {
        return null;
    }

    return (
        <div className="absolute -top-12 left-1/2 -translate-x-1/2 z-10 flex items-center justify-center pointer-events-none animate-coin-pop">
            <div className="flex items-center gap-2 bg-yellow-400/80 backdrop-blur-sm text-black font-bold px-4 py-2 rounded-full shadow-lg border-2 border-yellow-300">
                <CoinIcon className="w-6 h-6" />
                <span>+{amount}</span>
            </div>
            <style>{`
                @keyframes coin-pop {
                    0% {
                        transform: translate(-50%, 0) scale(0.5);
                        opacity: 0;
                    }
                    20%, 80% {
                        transform: translate(-50%, -20px) scale(1);
                        opacity: 1;
                    }
                    100% {
                        transform: translate(-50%, -40px) scale(0.8);
                        opacity: 0;
                    }
                }
                .animate-coin-pop {
                    animation: coin-pop 2s ease-out forwards;
                }
            `}</style>
        </div>
    );
};

export default FreeCoinNotification;