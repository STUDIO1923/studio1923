import React, { useState, useEffect, useCallback, useMemo } from 'react';
import * as auditService from '../services/auditService';

interface LuckyDrawViewProps {
  nickname: string;
  onPrizeWon: (type: 'coin' | 'point' | 'none', amount: number) => void;
}

interface Prize {
  label: string;
  type: 'coin' | 'point' | 'none';
  amount: number;
  color: string; // Used for modal feedback
  icon?: string;
}

const PRIZES: Prize[] = [
    { label: '50 Coins', type: 'coin', amount: 50, color: '#f59e0b', icon: '💰' },
    { label: '10 Points', type: 'point', amount: 10, color: '#3b82f6', icon: '⭐' },
    { label: 'Try Again', type: 'none', amount: 0, color: '#6b7280', icon: '😢' },
    { label: '250 Coins', type: 'coin', amount: 250, color: '#ef4444', icon: '💰' },
    { label: '5 Points', type: 'point', amount: 5, color: '#8b5cf6', icon: '⭐' },
    { label: 'JACKPOT', type: 'coin', amount: 1000, color: '#fde047', icon: '🎉' },
    { label: '25 Points', type: 'point', amount: 25, color: '#ec4899', icon: '⭐' },
    { label: '100 Coins', type: 'coin', amount: 100, color: '#10b981', icon: '💰' },
];

const segmentAngle = 360 / PRIZES.length;

// SVG Helpers
const polarToCartesian = (centerX: number, centerY: number, radius: number, angleInDegrees: number) => {
    const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0;
    return {
        x: centerX + radius * Math.cos(angleInRadians),
        y: centerY + radius * Math.sin(angleInRadians),
    };
};

const describeWedge = (x: number, y: number, radius: number, startAngle: number, endAngle: number) => {
    const start = polarToCartesian(x, y, radius, endAngle);
    const end = polarToCartesian(x, y, radius, startAngle);
    const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1';
    return [
        'M', x, y,
        'L', start.x, start.y,
        'A', radius, radius, 0, largeArcFlag, 0, end.x, end.y,
        'Z'
    ].join(' ');
};

const describeTextArc = (x: number, y: number, radius: number, startAngle: number, endAngle: number) => {
    const start = polarToCartesian(x, y, radius, startAngle);
    const end = polarToCartesian(x, y, radius, endAngle);
    const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1';
    // For text path, we want the arc to go the "long way" visually, so sweep flag is 1
    return [
        'M', start.x, start.y,
        'A', radius, radius, 0, largeArcFlag, 1, end.x, end.y,
    ].join(' ');
};


const LuckyDrawView: React.FC<LuckyDrawViewProps> = ({ nickname, onPrizeWon }) => {
  const storageKey = useMemo(() => `luckyDraw_${nickname}`, [nickname]);
  
  const [canDraw, setCanDraw] = useState(false);
  const [timeLeft, setTimeLeft] = useState('');
  const [isSpinning, setIsSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [prizeWon, setPrizeWon] = useState<Prize | null>(null);

  const calculateTimeLeft = useCallback(() => {
    const lastDraw = localStorage.getItem(storageKey);
    if (!lastDraw) {
      setCanDraw(true);
      setTimeLeft('');
      return;
    }
    
    const lastDrawTime = parseInt(lastDraw, 10);
    const nextDrawTime = lastDrawTime + 24 * 60 * 60 * 1000;
    const now = Date.now();

    if (now >= nextDrawTime) {
      setCanDraw(true);
      setTimeLeft('');
      return;
    }

    setCanDraw(false);
    const diff = nextDrawTime - now;
    const h = Math.floor(diff / (1000 * 60 * 60));
    const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const s = Math.floor((diff % (1000 * 60)) / 1000);
    setTimeLeft(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`);
  }, [storageKey]);

  useEffect(() => {
    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);
    return () => clearInterval(timer);
  }, [calculateTimeLeft]);

  const handleSpin = () => {
    if (!canDraw || isSpinning) return;
    
    setIsSpinning(true);
    setPrizeWon(null);

    const randomIndex = Math.floor(Math.random() * PRIZES.length);
    const prize = PRIZES[randomIndex];

    const baseRotation = 360 * 8; 
    const prizeAngle = 360 - (randomIndex * segmentAngle);
    const randomOffset = (Math.random() - 0.5) * (segmentAngle * 0.8);
    const finalAngle = baseRotation + prizeAngle - (segmentAngle / 2) + randomOffset;
    
    setRotation(prev => prev + finalAngle);

    setTimeout(() => {
      setIsSpinning(false);
      setPrizeWon(prize);
      onPrizeWon(prize.type, prize.amount);
      if (prize.type !== 'none' && prize.amount > 0) {
        auditService.logTransaction(nickname, prize.type, prize.amount, 'Lucky Draw');
      }
      localStorage.setItem(storageKey, Date.now().toString());
      setCanDraw(false);
      calculateTimeLeft();
    }, 7000); // Match this with CSS animation duration
  };
  
  const renderCenterContent = () => {
      if (isSpinning) return <div className="text-lg sm:text-xl animate-pulse">...</div>;
      if (!canDraw) {
          return (
              <div className="text-center leading-tight">
                  <div className="text-sm font-normal text-slate-400">รอ</div>
                  <div className="text-base sm:text-lg font-bold text-white tracking-tighter">{timeLeft}</div>
              </div>
          );
      }
      return <div className="text-lg sm:text-xl font-bold">หมุน!</div>;
  }

  return (
    <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-lg p-6 shadow-xl flex flex-col items-center justify-center space-y-8 min-h-[60vh] relative overflow-hidden">
        <div className="text-center z-10">
            <h2 className="text-3xl font-bold text-white tracking-wide">Lucky Draw ประจำวัน</h2>
            <p className="text-slate-400 mt-2">หมุนวงล้อเพื่อลุ้นรับรางวัลสุดพิเศษได้วันละ 1 ครั้ง!</p>
        </div>
        
        <div className="relative w-80 h-80 sm:w-96 sm:h-96 flex items-center justify-center z-10">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-4 w-10 h-12 z-20">
              <svg viewBox="0 0 38 48" className="drop-shadow-lg">
                <path d="M19 48C19 48 0 32 0 19C0 8.5 8.5 0 19 0S38 8.5 38 19C38 32 19 48 19 48Z" fill="#ef4444"/>
                <circle cx="19" cy="19" r="6" fill="white"/>
              </svg>
            </div>
            
            <div 
                className="w-full h-full"
                style={{ 
                    transition: 'transform 7s cubic-bezier(0.25, 1, 0.5, 1)',
                    transform: `rotate(${rotation}deg)`,
                }}
            >
                <svg viewBox="0 0 320 320" className="w-full h-full">
                    <defs>
                        {PRIZES.map((prize, i) => {
                            // Define an arc path for the text to follow, slightly inset from the edge
                            const start = i * segmentAngle + segmentAngle * 0.05;
                            const end = (i + 1) * segmentAngle - segmentAngle * 0.05;
                            return (
                                <path 
                                    key={i}
                                    id={`text-path-${i}`}
                                    d={describeTextArc(160, 160, 115, start, end)}
                                />
                            );
                        })}
                    </defs>
                    <g>
                        {PRIZES.map((prize, i) => {
                            const segmentColor = i % 2 === 0 ? '#334155' : '#475569';
                            const isJackpot = prize.label === 'JACKPOT';
                            const jackpotGradientId = `jackpot-gradient-${i}`;
                            
                            return (
                                <g key={i}>
                                    {isJackpot && (
                                        <defs>
                                            <radialGradient id={jackpotGradientId}>
                                                <stop offset="0%" stopColor="#fde047" />
                                                <stop offset="100%" stopColor="#f59e0b" />
                                            </radialGradient>
                                        </defs>
                                    )}
                                    <path 
                                        d={describeWedge(160, 160, 150, i * segmentAngle, (i + 1) * segmentAngle)} 
                                        fill={isJackpot ? `url(#${jackpotGradientId})` : segmentColor} 
                                        stroke="#1e293b" 
                                        strokeWidth="3" 
                                    />
                                    <text 
                                        fill={isJackpot ? '#422006' : '#fff'}
                                        className="text-sm font-bold tracking-wide"
                                    >
                                        <textPath 
                                            xlinkHref={`#text-path-${i}`} 
                                            startOffset="50%" 
                                            textAnchor="middle"
                                        >
                                            {prize.icon} {prize.label}
                                        </textPath>
                                    </text>
                                </g>
                            );
                        })}
                    </g>
                     <circle cx="160" cy="160" r="25" fill="#475569" stroke="#1e293b" strokeWidth="3" />
                </svg>
            </div>

            <button
                onClick={handleSpin}
                disabled={!canDraw || isSpinning}
                className="absolute w-20 h-20 sm:w-24 sm:h-24 bg-slate-800 rounded-full border-4 border-slate-600 flex items-center justify-center text-indigo-400 shadow-inner z-10 hover:bg-slate-700 active:bg-slate-900 transition-colors disabled:cursor-not-allowed disabled:bg-slate-800 disabled:opacity-70"
            >
                {renderCenterContent()}
            </button>
        </div>

        {prizeWon && !isSpinning && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in" onClick={() => setPrizeWon(null)}>
            <div className={`text-center p-8 rounded-lg animate-pop-in border-2 ${prizeWon.type === 'none' ? 'bg-red-900/80 border-red-600' : 'bg-green-900/80 border-green-600'}`}>
                <p className="text-slate-300 text-lg">{prizeWon.type !== 'none' ? 'ยินดีด้วย! คุณได้รับ:' : 'เสียใจด้วย...'}</p>
                <p className="text-4xl sm:text-5xl font-bold text-white mt-2 flex items-center justify-center gap-4">
                  <span>{prizeWon.icon}</span>
                  <span>{prizeWon.label}</span>
                </p>
                <p className="mt-6 text-slate-400 text-sm">คลิกเพื่อปิด</p>
            </div>
          </div>
        )}
        <style>{`
          .animate-fade-in { animation: fadeIn 0.5s ease-in-out; }
          @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }

          .animate-pop-in { animation: popIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275); }
          @keyframes popIn { 
            from { 
              opacity: 0;
              transform: scale(0.5);
            } 
            to { 
              opacity: 1;
              transform: scale(1);
            } 
          }
        `}</style>
    </div>
  );
};

export default LuckyDrawView;