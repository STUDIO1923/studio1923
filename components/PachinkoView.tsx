import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { PetData, View } from '../types';
import { CoinIcon } from './icons/CoinIcon';
import { PointIcon } from './icons/PointIcon';
import GameHeader from './GameHeader';
import * as auditService from '../services/auditService';

interface PachinkoViewProps {
    nickname: string;
    coins: number;
    onCost: (cost: number) => void;
    onWin: (coinAmount: number, pointAmount: number) => void;
    onNavigate: (view: View) => void;
}

const COST_TO_PLAY = 10;
const PRIZE_SLOTS_CONFIG: { coins: number, points: number, color: string, label?: string }[] = [
    { coins: 5, points: 0, color: '#64748b' }, // Loss
    { coins: 20, points: 0, color: '#3b82f6' }, // Small Win
    { coins: 0, points: 5, color: '#8b5cf6' }, // Point Win
    { coins: 50, points: 0, color: '#ef4444' }, // Good Win
    { coins: 10, points: 0, color: '#10b981' }, // Break Even
    { coins: 250, points: 10, color: '#f59e0b', label: 'JACKPOT' }, // JACKPOT
    { coins: 10, points: 0, color: '#10b981' }, // Break Even
    { coins: 50, points: 0, color: '#ef4444' }, // Good Win
    { coins: 0, points: 5, color: '#8b5cf6' }, // Point Win
    { coins: 20, points: 0, color: '#3b82f6' }, // Small Win
    { coins: 5, points: 0, color: '#64748b' }, // Loss
];


const BOARD_WIDTH = 700;
const BOARD_HEIGHT = 900;
const LAUNCH_AREA_HEIGHT = 80;
const PRIZE_AREA_HEIGHT = 50;
const PIN_RADIUS = 5;

const PLAY_COUNT_KEY = 'pachinko_play_count_v3_';
const TOTAL_PLAY_COUNT_KEY = 'pachinko_total_play_count_v3';
const GLOBAL_RECENT_WINS_KEY = 'pachinko_global_recent_wins_v3';

const shuffleArray = <T,>(array: T[]): T[] => {
    return [...array].sort(() => Math.random() - 0.5);
};


const PachinkoView: React.FC<PachinkoViewProps> = ({ nickname, coins, onCost, onWin, onNavigate }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [uiState, setUiState] = useState<'idle' | 'aiming' | 'playing' | 'won'>('idle');
    const [aimX, setAimX] = useState(BOARD_WIDTH / 2);
    const [wonPrize, setWonPrize] = useState<{ coins: number, points: number, label?: string } | null>(null);
    const [playCount, setPlayCount] = useState(0);
    const [totalPlayCount, setTotalPlayCount] = useState(0);
    const [recentWins, setRecentWins] = useState<{ prize: string; icon: string; nickname: string }[]>([]);
    const [currentPrizeSlots, setCurrentPrizeSlots] = useState(() => shuffleArray(PRIZE_SLOTS_CONFIG));
    
    const gameWorld = useRef({
        isInitialized: false,
        animationFrameId: 0,
        ball: { x: -100, y: -100, radius: 15, vx: 0, vy: 0, emoji: '⚪️' },
        pins: [] as { x: number, y: number, row: number }[],
        spinners: [] as { x: number, y: number, length: number, angle: number, speed: number, thickness: number }[],
        bumper: { x: 50, y: BOARD_HEIGHT - 200, width: 150, height: 15, vx: 2.5 },
        lastBallPos: { x: 0, y: 0 },
        stuckFrames: 0,
    }).current;

    const storageKeys = useMemo(() => ({
        playCount: `${PLAY_COUNT_KEY}${nickname}`,
        petData: `pet_v3_${nickname}`
    }), [nickname]);

    useEffect(() => {
        try {
            const savedPlayCount = localStorage.getItem(storageKeys.playCount);
            if (savedPlayCount) setPlayCount(parseInt(savedPlayCount, 10));
            
            const savedTotalPlayCount = localStorage.getItem(TOTAL_PLAY_COUNT_KEY);
            if (savedTotalPlayCount) setTotalPlayCount(parseInt(savedTotalPlayCount, 10));

            const savedGlobalRecentWins = localStorage.getItem(GLOBAL_RECENT_WINS_KEY);
            if (savedGlobalRecentWins) setRecentWins(JSON.parse(savedGlobalRecentWins));
            
            const savedPetJSON = localStorage.getItem(storageKeys.petData);
            if (savedPetJSON) {
                const pet: PetData = JSON.parse(savedPetJSON);
                gameWorld.ball.emoji = pet.emoji;
            }
        } catch (error) {
            console.error("Failed to load Pachinko stats:", error);
        }
    }, [storageKeys, gameWorld.ball]);
    
    const randomizeSpinners = useCallback(() => {
        gameWorld.spinners = Array.from({ length: 10 }, () => ({
            x: 100 + Math.random() * (BOARD_WIDTH - 200),
            y: 150 + Math.random() * (BOARD_HEIGHT - 350),
            length: 40,
            angle: Math.random() * Math.PI * 2,
            speed: (Math.random() > 0.5 ? 1 : -1) * (0.02 + Math.random() * 0.03),
            thickness: 4
        }));
    }, [gameWorld]);


    const handleGameEnd = useCallback((prizeIndex: number) => {
        setUiState('won');
        
        if (prizeIndex >= 0 && prizeIndex < currentPrizeSlots.length) {
            const prize = currentPrizeSlots[prizeIndex];
            setWonPrize(prize);
            onWin(prize.coins, prize.points);

            const isJackpot = prize.label === 'JACKPOT';
            if(prize.coins > 0) auditService.logTransaction(nickname, 'coin', prize.coins, isJackpot ? 'Pachinko JACKPOT' : 'Pachinko');
            if(prize.points > 0) auditService.logTransaction(nickname, 'point', prize.points, isJackpot ? 'Pachinko JACKPOT' : 'Pachinko');

            const prizeTxt = isJackpot ? 'JACKPOT!' : [
                prize.coins > 0 ? `${prize.coins} เหรียญ` : '',
                prize.points > 0 ? `${prize.points} แต้ม` : ''
            ].filter(Boolean).join(' และ ');
            
            let icon = '🎁';
            if (isJackpot) icon = '🎉';
            else if (prize.coins >= 50) icon = '💰';
            else if (prize.points > 0) icon = '✨';

            const newWin = { prize: prizeTxt || 'ไม่ได้รางวัล', icon, nickname };
            setRecentWins(prev => {
                const updated = [newWin, ...prev].slice(0, 30);
                localStorage.setItem(GLOBAL_RECENT_WINS_KEY, JSON.stringify(updated));
                return updated;
            });
        }

        setTimeout(() => {
            setUiState('idle');
            setWonPrize(null);
        }, 2000); // Longer delay to show prize
    }, [onWin, nickname, currentPrizeSlots]);

    const handleLaunchBall = useCallback(() => {
        const newPlayCount = playCount + 1;
        setPlayCount(newPlayCount);
        localStorage.setItem(storageKeys.playCount, newPlayCount.toString());

        const newTotalPlayCount = totalPlayCount + 1;
        setTotalPlayCount(newTotalPlayCount);
        localStorage.setItem(TOTAL_PLAY_COUNT_KEY, newTotalPlayCount.toString());
        
        onCost(COST_TO_PLAY);
        setUiState('playing');
        
        randomizeSpinners();
        setCurrentPrizeSlots(shuffleArray(PRIZE_SLOTS_CONFIG));

        gameWorld.ball.x = aimX;
        gameWorld.ball.y = 40;
        gameWorld.ball.vx = (Math.random() - 0.5) * 1.5;
        gameWorld.ball.vy = 0;
        gameWorld.stuckFrames = 0;
    }, [playCount, totalPlayCount, onCost, aimX, storageKeys.playCount, gameWorld, randomizeSpinners]);

    // Game Loop Effect
    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (!canvas || !ctx) return;

        if (!gameWorld.isInitialized) {
            const rows = 15;
            const vSpacing = 50;

            for (let row = 0; row < rows; row++) {
                const isOffset = row % 2 !== 0;
                const spacing = 60;
                
                const cols = isOffset ? 10 : 11; 
                const y = 100 + row * vSpacing;
                
                for (let col = 0; col < cols; col++) {
                    const xOffset = isOffset ? spacing / 2 : 0;
                    const jitter = (Math.random() - 0.5) * 15;
                    const initialX = (BOARD_WIDTH / 2) - ((cols - 1) * spacing / 2) + col * spacing + xOffset + jitter;
                    
                    gameWorld.pins.push({ x: initialX, y: y, row: row });
                }
            }
            randomizeSpinners();
            gameWorld.isInitialized = true;
        }

        const slotWidth = BOARD_WIDTH / currentPrizeSlots.length;

        const gameLoop = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            // Update pin positions for continuous movement
            const pinMovementSpeed = 0.5;
            gameWorld.pins.forEach(pin => {
                const direction = pin.row % 2 === 0 ? 1 : -1;
                pin.x += pinMovementSpeed * direction;
                if (pin.x > BOARD_WIDTH + PIN_RADIUS) pin.x = -PIN_RADIUS;
                else if (pin.x < -PIN_RADIUS) pin.x = BOARD_WIDTH + PIN_RADIUS;
            });
            
            ctx.fillStyle = document.documentElement.classList.contains('dark') ? '#475569' : '#94a3b8';
            gameWorld.pins.forEach(pin => { ctx.beginPath(); ctx.arc(pin.x, pin.y, PIN_RADIUS, 0, Math.PI * 2); ctx.fill(); });
            
            ctx.fillStyle = '#f87171';
            gameWorld.spinners.forEach(s => { s.angle += s.speed; ctx.save(); ctx.translate(s.x, s.y); ctx.rotate(s.angle); ctx.fillRect(-s.length, -s.thickness / 2, s.length * 2, s.thickness); ctx.restore(); });
            
            gameWorld.bumper.x += gameWorld.bumper.vx;
            if (gameWorld.bumper.x < 0 || gameWorld.bumper.x + gameWorld.bumper.width > canvas.width) gameWorld.bumper.vx *= -1;
            ctx.fillStyle = '#a16207';
            ctx.fillRect(gameWorld.bumper.x, gameWorld.bumper.y, gameWorld.bumper.width, gameWorld.bumper.height);
            
            // Draw prize slots
            const glow = (Math.sin(Date.now() / 200) + 1) / 2; // 0 to 1 cycle
            currentPrizeSlots.forEach((slot, i) => {
                ctx.fillStyle = slot.color;
                ctx.fillRect(i * slotWidth, canvas.height - PRIZE_AREA_HEIGHT, slotWidth, PRIZE_AREA_HEIGHT);

                if (slot.label === 'JACKPOT') {
                    ctx.shadowColor = `rgba(255, 223, 128, ${glow * 0.8})`;
                    ctx.shadowBlur = 15 + glow * 10;
                    ctx.fillStyle = `rgba(255, 255, 255, ${0.8 + glow * 0.2})`;
                    ctx.font = 'bold 18px Noto Sans Thai';
                    ctx.fillText(slot.label, i * slotWidth + slotWidth / 2, canvas.height - 22);
                    ctx.shadowBlur = 0;
                } else {
                    const cTxt = slot.coins > 0 ? `${slot.coins}💰` : ''; const pTxt = slot.points > 0 ? `${slot.points}✨` : '';
                    ctx.fillStyle = 'white'; ctx.font = 'bold 14px Noto Sans Thai'; ctx.textAlign = 'center';
                    ctx.fillText(`${cTxt}${pTxt}`, i * slotWidth + slotWidth / 2, canvas.height - 20);
                }
                
                ctx.strokeStyle = '#1e293b'; // slate-800
                ctx.lineWidth = 2;
                ctx.strokeRect(i * slotWidth, canvas.height - PRIZE_AREA_HEIGHT, slotWidth, PRIZE_AREA_HEIGHT);
            });


            if (uiState === 'aiming') {
                ctx.beginPath(); ctx.moveTo(aimX, 0); ctx.lineTo(aimX, LAUNCH_AREA_HEIGHT);
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)'; ctx.setLineDash([5, 5]); ctx.stroke(); ctx.setLineDash([]);
                ctx.font = `${gameWorld.ball.radius * 2}px serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
                ctx.fillText(gameWorld.ball.emoji, aimX, 40);
            }

            if (uiState === 'playing') {
                const { ball } = gameWorld;
                ball.vy += 0.25; ball.x += ball.vx; ball.y += ball.vy;

                if (ball.x + ball.radius > canvas.width || ball.x - ball.radius < 0) { ball.vx *= -0.9; ball.x = ball.x + ball.radius > canvas.width ? canvas.width - ball.radius : ball.radius; }
                
                if (Math.abs(ball.x - gameWorld.lastBallPos.x) < 0.01 && Math.abs(ball.y - gameWorld.lastBallPos.y) < 0.01 && Math.abs(ball.vy) < 0.1) {
                    gameWorld.stuckFrames++;
                } else { gameWorld.stuckFrames = 0; gameWorld.lastBallPos = { x: ball.x, y: ball.y }; }
                if (gameWorld.stuckFrames > 120) { ball.vx += (Math.random() - 0.5) * 0.5; gameWorld.stuckFrames = 0; }
                
                gameWorld.pins.forEach(pin => { const dx = ball.x - pin.x, dy = ball.y - pin.y, dist = Math.sqrt(dx * dx + dy * dy); if (dist < ball.radius + PIN_RADIUS) { const angle = Math.atan2(dy, dx); const overlap = ball.radius + PIN_RADIUS - dist; ball.x += Math.cos(angle) * overlap; ball.y += Math.sin(angle) * overlap; const nx = dx / dist, ny = dy / dist, dot = ball.vx * nx + ball.vy * ny; ball.vx -= 2 * dot * nx * 0.9; ball.vy -= 2 * dot * ny * 0.9; } });
                
                gameWorld.spinners.forEach(s => { const lX = ball.x - s.x, lY = ball.y - s.y; const rX = lX * Math.cos(-s.angle) - lY * Math.sin(-s.angle); const rY = lX * Math.sin(-s.angle) + lY * Math.cos(-s.angle); if (rX > -s.length - ball.radius && rX < s.length + ball.radius && rY > -s.thickness/2 - ball.radius && rY < s.thickness/2 + ball.radius) { const cX = Math.max(-s.length, Math.min(s.length, rX)), cY = Math.max(-s.thickness/2, Math.min(s.thickness/2, rY)); const dX = rX - cX, dY = rY - cY; if (dX*dX + dY*dY < ball.radius*ball.radius) { const nA = Math.atan2(dY, dX) + s.angle, nX = Math.cos(nA), nY = Math.sin(nA), dot = ball.vx * nX + ball.vy * nY; ball.vx -= 2 * dot * nX * 1.2; ball.vy -= 2 * dot * nY * 1.2; const impactDist = Math.sqrt(cX*cX + cY*cY), tanV = s.speed * impactDist; ball.vx += tanV * -Math.sin(s.angle) * 0.8; ball.vy += tanV * Math.cos(s.angle) * 0.8; } } });
                
                const { bumper } = gameWorld;
                if (ball.x > bumper.x - ball.radius && ball.x < bumper.x + bumper.width + ball.radius && ball.y > bumper.y - ball.radius && ball.y < bumper.y + bumper.height + ball.radius) { if (ball.y < bumper.y + bumper.height/2) { ball.vy *= -1.2; ball.y = bumper.y - ball.radius; ball.vx += bumper.vx * 0.5; } }

                if (ball.y + ball.radius > canvas.height - PRIZE_AREA_HEIGHT) {
                    const prizeIndex = Math.floor(ball.x / slotWidth);
                    handleGameEnd(prizeIndex);
                    ball.x = -100;
                } else {
                    ctx.font = `${ball.radius * 2}px serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
                    ctx.fillText(ball.emoji, ball.x, ball.y);
                }
            }
            
            gameWorld.animationFrameId = requestAnimationFrame(gameLoop);
        };
        gameWorld.animationFrameId = requestAnimationFrame(gameLoop);
        
        return () => cancelAnimationFrame(gameWorld.animationFrameId);
    }, [handleGameEnd, uiState, aimX, gameWorld, randomizeSpinners, currentPrizeSlots]);
    
    // Input Handling Effect
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const getMousePos = (e: MouseEvent) => { const rect = canvas.getBoundingClientRect(); return e.clientX - rect.left; };
        
        const handleMouseDown = (e: MouseEvent) => {
            if (uiState === 'idle' && coins >= COST_TO_PLAY) {
                const rect = canvas.getBoundingClientRect();
                const mouseY = e.clientY - rect.top;
                if (mouseY < LAUNCH_AREA_HEIGHT) {
                    setUiState('aiming');
                    setAimX(Math.max(15, Math.min(BOARD_WIDTH - 15, getMousePos(e))));
                }
            }
        };

        const handleMouseMove = (e: MouseEvent) => {
            if (uiState === 'aiming') {
                const newAimX = getMousePos(e);
                setAimX(Math.max(15, Math.min(BOARD_WIDTH - 15, newAimX)));
            }
        };

        const handleMouseUp = () => {
            if (uiState === 'aiming') {
                handleLaunchBall();
            }
        };

        canvas.addEventListener('mousedown', handleMouseDown);
        canvas.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
        
        return () => {
            canvas.removeEventListener('mousedown', handleMouseDown);
            canvas.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [uiState, coins, handleLaunchBall]);

    const getPrizeMessage = () => {
        if (!wonPrize) return null;
        if (wonPrize.label === 'JACKPOT') return '🎉 JACKPOT! 🎉';
        const coinText = wonPrize.coins > 0 ? `${wonPrize.coins} เหรียญ` : '';
        const pointText = wonPrize.points > 0 ? `${wonPrize.points} แต้ม` : '';
        const connector = coinText && pointText ? ' และ ' : '';
        return `คุณได้รับ ${coinText}${connector}${pointText}!`;
    };

    return (
        <>
            <GameHeader currentGame="pachinko" onNavigate={onNavigate} />
            <div className="flex flex-col lg:flex-row gap-6 items-start">
                <div className="flex-grow bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-lg p-6 shadow-xl flex flex-col items-center justify-center space-y-6">
                    <div className="text-center">
                        <h2 className="text-3xl font-bold text-white tracking-wide">Pachinko</h2>
                        <p className="text-slate-400 mt-2">ปล่อย EmojiMon ของคุณเพื่อลุ้นรับรางวัล! ({COST_TO_PLAY} เหรียญต่อครั้ง)</p>
                    </div>
                    <div className="bg-slate-900/50 rounded-lg shadow-inner overflow-hidden border border-slate-700">
                        <canvas ref={canvasRef} width={BOARD_WIDTH} height={BOARD_HEIGHT} />
                    </div>
                    <div className="flex flex-col items-center gap-4 h-16">
                        {(uiState === 'idle' && coins >= COST_TO_PLAY) && <p className="text-slate-400 animate-pulse">คลิกค้างด้านบนเพื่อเล็งและปล่อยเพื่อยิง</p>}
                        {(uiState === 'idle' && coins < COST_TO_PLAY) && <p className="text-red-400">เหรียญไม่เพียงพอ</p>}
                        {uiState === 'aiming' && <p className="text-indigo-300 animate-pulse">ลากเพื่อปรับตำแหน่ง และปล่อยเพื่อยิง!</p>}
                        {wonPrize && uiState === 'won' && (
                            <div className={`text-center font-semibold text-lg p-3 rounded-md animate-fade-in ${wonPrize.label === 'JACKPOT' ? 'bg-yellow-500/20 text-yellow-300' : 'bg-green-500/20 text-green-300'}`}>
                                {getPrizeMessage()}
                            </div>
                        )}
                    </div>
                </div>

                <div className="w-full lg:w-80 flex-shrink-0 bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-lg p-6 shadow-xl">
                    <h2 className="text-2xl font-bold text-white mb-4 text-center">สถิติรวม</h2>
                    
                    <h3 className="text-xl font-bold text-white mb-4 tracking-wide">ประวัติการเล่น</h3>
                    <div className="bg-slate-900/50 p-3 rounded-lg mb-4 space-y-2 text-sm">
                        <div className="flex justify-between items-center">
                            <span className="text-slate-400">ของคุณ:</span>
                            <span className="font-bold text-lg text-white">{playCount.toLocaleString()} ครั้ง</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-slate-400">รวมทั้งหมด:</span>
                            <span className="font-bold text-lg text-white">{totalPlayCount.toLocaleString()} ครั้ง</span>
                        </div>
                    </div>
                    
                    <p className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-2">รางวัลล่าสุด</p>
                    <div className="space-y-2 h-[calc(900px-330px)] overflow-y-auto pr-2 custom-scrollbar">
                        {recentWins.length > 0 ? recentWins.map((win, index) => (
                            <div key={index} className="flex items-center gap-3 bg-slate-900/50 p-2 rounded-md text-sm animate-fade-in-down" style={{animationDelay: `${index * 50}ms`}}>
                                <span className="text-lg w-6 text-center">{win.icon}</span>
                                <div className="flex-1 truncate">
                                <span className="text-slate-300">{win.prize}</span>
                                <span className="text-indigo-400 text-xs ml-2">({win.nickname})</span>
                            </div>
                            </div>
                        )) : <p className="text-slate-500 text-center pt-8">ยังไม่มีประวัติการได้รับรางวัล</p>}
                    </div>
                </div>

                <style>{`
                    canvas { cursor: crosshair; }
                    .animate-fade-in { animation: fadeIn 0.5s ease-in-out; } @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
                    .animate-fade-in-down { animation: fadeInDown 0.3s ease-out both; }
                    @keyframes fadeInDown { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
                    .custom-scrollbar::-webkit-scrollbar { width: 6px; }
                    .custom-scrollbar::-webkit-scrollbar-track { background: #1e293b; }
                    .custom-scrollbar::-webkit-scrollbar-thumb { background: #475569; border-radius: 10px; }
                    .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #64748b; }
                `}</style>
            </div>
        </>
    );
};

export default PachinkoView;