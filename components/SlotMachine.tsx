import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { CardRarity, EMOJIS, Card, RARITY_DATA, View, SEASON_CONFIG, Language } from '../types';
import GameHeader from './GameHeader';

interface SlotMachineProps {
  nickname: string;
  onSpin: (cost: number) => void;
  coins: number;
  allCards: Card[];
  onWinCoins: (amount: number) => void;
  onWinCards: (cards: Card[]) => void;
  onWinPoints: (amount: number) => void;
  onNavigate: (view: View) => void;
  language: Language;
}

interface PrizeRule {
    conditionIcon: string;
    text: string;
    prize: string;
    prizeIcon: string;
    chance: string;
}

const ADJUSTED_PRIZE_RULES: PrizeRule[] = [
    { conditionIcon: '🏆', text: 'อิโมจิทั้งหมดเหมือนกัน (10 แบบ)', prize: 'สุ่มการ์ด 10 ใบ (Legendary Rare การันตี 1 ใบ)', prizeIcon: '🎁', chance: '0.001%' },
    { conditionIcon: '💎', text: 'เหมือน 9 แบบ', prize: 'สุ่มการ์ด 10 ใบ (เพิ่มโอกาส Legendary Rare 5%)', prizeIcon: '🏅', chance: '0.01%' },
    { conditionIcon: '💎', text: 'เหมือน 8 แบบ', prize: 'สุ่มการ์ด 10 ใบ (Ultra Rare+ การันตี 1 ใบ)', prizeIcon: '💎', chance: '0.05%' },
    { conditionIcon: '🔶', text: 'เหมือน 7 แบบ', prize: 'สุ่มการ์ด 8 ใบ (Super Rare+ การันตี 1 ใบ)', prizeIcon: '🔹', chance: '0.2%' },
    { conditionIcon: '🔹', text: 'เหมือน 6 แบบ', prize: 'สุ่มการ์ด 5 ใบ (เพิ่มโอกาส Ultra Rare 3%)', prizeIcon: '🟠', chance: '1%' },
    { conditionIcon: '🟣', text: 'เหมือน 5 แบบ', prize: 'สุ่มการ์ด 3 ใบ', prizeIcon: '🔵', chance: '3%' },
    { conditionIcon: '🔵', text: 'เหมือน 4 แบบ', prize: 'รับ 20 เหรียญ', prizeIcon: '💰', chance: '8%' },
    { conditionIcon: '🟠', text: 'เหมือน 3 แบบ', prize: 'รับ 10 เหรียญ', prizeIcon: '💰', chance: '20%' },
    { conditionIcon: '🟡', text: 'เหมือน 2 แบบ', prize: '+2 แต้มสะสม', prizeIcon: '✨', chance: '40%' },
];

const PLAY_COUNT_KEY = 'slot_play_count_v1_';
const TOTAL_PLAY_COUNT_KEY = 'slot_total_play_count_v1';
const GLOBAL_RECENT_WINS_KEY = 'slot_global_recent_wins_v1';

// Base probabilities for card rarities
const RARITY_PROBABILITIES: { rarity: CardRarity, chance: number }[] = [
    { rarity: 'Common', chance: 60 },
    { rarity: 'Rare', chance: 20 },
    { rarity: 'Super Rare', chance: 10 },
    { rarity: 'Ultra Rare', chance: 5 },
    { rarity: 'Ultimate Rare', chance: 2.5 },
    { rarity: 'Secret Rare', chance: 1.5 },
    { rarity: 'Parallel Rare', chance: 0.9 },
    { rarity: 'Legendary Rare', chance: 0.1 },
];

const SlotMachine: React.FC<SlotMachineProps> = ({ nickname, onSpin, coins, allCards, onWinCoins, onWinCards, onWinPoints, onNavigate, language }) => {
    const [reels, setReels] = useState<string[]>(Array(10).fill('❓'));
    const [spinningReels, setSpinningReels] = useState<boolean[]>(Array(10).fill(false));
    const [gameState, setGameState] = useState<'idle' | 'spinning' | 'stopping' | 'finished'>('idle');
    const [stopCount, setStopCount] = useState(0);
    const [resultMessage, setResultMessage] = useState<string | null>(null);
    const [winningIndices, setWinningIndices] = useState<number[]>([]);
    const [wonCards, setWonCards] = useState<Card[]>([]);
    const [rewardMode, setRewardMode] = useState<number | 'normal'>('normal');
    
    const [playCount, setPlayCount] = useState(0);
    const [totalPlayCount, setTotalPlayCount] = useState(0);
    const [recentWins, setRecentWins] = useState<{ prize: string; icon: string; nickname: string }[]>([]);
    
    const [autoSpinCount, setAutoSpinCount] = useState(1);
    const [isAutoSpinning, setIsAutoSpinning] = useState(false);
    const [countdown, setCountdown] = useState<number | null>(null);
    const [countdownMessage, setCountdownMessage] = useState("");

    const reelIntervals = useRef<(ReturnType<typeof setTimeout>)[]>([]);
    const timeouts = useRef<(ReturnType<typeof setTimeout>)[]>([]);
    const pressAndHoldInterval = useRef<ReturnType<typeof setTimeout> | null>(null);
    const autoSpinController = useRef({ isRunning: false, spinsLeft: 0 });

    const storageKeys = useMemo(() => ({
        playCount: `${PLAY_COUNT_KEY}${nickname}`,
    }), [nickname]);
    
    useEffect(() => {
        try {
            const savedPlayCount = localStorage.getItem(storageKeys.playCount);
            if (savedPlayCount) setPlayCount(parseInt(savedPlayCount, 10));

            const savedTotalPlayCount = localStorage.getItem(TOTAL_PLAY_COUNT_KEY);
            if (savedTotalPlayCount) setTotalPlayCount(parseInt(savedTotalPlayCount, 10));
            
            const savedWins = localStorage.getItem(GLOBAL_RECENT_WINS_KEY);
            if (savedWins) {
                setRecentWins(JSON.parse(savedWins));
            }
        } catch (error) {
            console.error("Failed to load slot stats:", error);
        }
    }, [storageKeys.playCount]);

    const clearAllTimers = useCallback(() => {
        reelIntervals.current.forEach(clearInterval);
        timeouts.current.forEach(clearTimeout);
        reelIntervals.current = [];
        timeouts.current = [];
    }, []);

    useEffect(() => {
        return clearAllTimers;
    }, [clearAllTimers]);

    const getRandomCards = useCallback((count: number, options: {
        legendaryRareBoost?: number;
        ultraRareBoost?: number;
        guaranteeSuperOrBetter?: boolean;
        guaranteeUltraOrBetter?: boolean;
        guaranteeLegendaryRare?: boolean;
    } = {}, seasonTarget: number | 'normal' = 'normal'): Card[] => {
        const sourceCards = seasonTarget === 'normal'
            ? allCards
            : allCards.filter(c => c.season === seasonTarget);

        if (sourceCards.length === 0) return [];

        const newCards: Card[] = [];
        const { legendaryRareBoost = 0, ultraRareBoost = 0, guaranteeSuperOrBetter = false, guaranteeUltraOrBetter = false, guaranteeLegendaryRare = false } = options;

        const adjustedProbabilities = RARITY_PROBABILITIES.map(p => ({...p}));
        
        if (legendaryRareBoost > 0) {
            const legendaryRare = adjustedProbabilities.find(p => p.rarity === 'Legendary Rare')!;
            const common = adjustedProbabilities.find(p => p.rarity === 'Common')!;
            legendaryRare.chance += legendaryRareBoost;
            common.chance = Math.max(0, common.chance - legendaryRareBoost);
        }
        if (ultraRareBoost > 0) {
            const ultraRare = adjustedProbabilities.find(p => p.rarity === 'Ultra Rare')!;
            const common = adjustedProbabilities.find(p => p.rarity === 'Common')!;
            ultraRare.chance += ultraRareBoost;
            common.chance = Math.max(0, common.chance - ultraRareBoost);
        }

        const drawRandomCard = (rarityFilter?: CardRarity[], pool: Card[] = sourceCards): Card => {
            let currentProbabilities = adjustedProbabilities;
            if (rarityFilter) {
                currentProbabilities = adjustedProbabilities.filter(p => rarityFilter.includes(p.rarity));
                if (currentProbabilities.length === 0) { 
                   currentProbabilities = adjustedProbabilities;
                }
            }
            
            const currentTotalChance = currentProbabilities.reduce((sum, p) => sum + p.chance, 0);
            const rand = Math.random() * currentTotalChance;
            let cumulativeChance = 0;
            let chosenRarity: CardRarity = currentProbabilities[0]?.rarity || 'Common';

            for (const prob of currentProbabilities) {
                cumulativeChance += prob.chance;
                if (rand <= cumulativeChance) {
                    chosenRarity = prob.rarity;
                    break;
                }
            }

            let availableCards = pool.filter(c => c.rarity === chosenRarity);
            if (availableCards.length > 0) {
                return availableCards[Math.floor(Math.random() * availableCards.length)];
            }
            
            if (rarityFilter) {
                availableCards = pool.filter(c => rarityFilter.includes(c.rarity));
                if (availableCards.length > 0) {
                    return availableCards[Math.floor(Math.random() * availableCards.length)];
                }
            }

            if (pool.length > 0) {
                return pool[Math.floor(Math.random() * pool.length)];
            }
            
            return allCards[Math.floor(Math.random() * allCards.length)];
        };

        const superOrBetterRarities: CardRarity[] = ['Super Rare', 'Ultra Rare', 'Ultimate Rare', 'Secret Rare', 'Parallel Rare', 'Legendary Rare'];
        const ultraOrBetterRarities: CardRarity[] = ['Ultra Rare', 'Ultimate Rare', 'Secret Rare', 'Parallel Rare', 'Legendary Rare'];

        if (guaranteeLegendaryRare && count > 0) {
            newCards.push(drawRandomCard(['Legendary Rare'], sourceCards));
        } else if (guaranteeUltraOrBetter && count > 0) {
            newCards.push(drawRandomCard(ultraOrBetterRarities, sourceCards));
        } else if (guaranteeSuperOrBetter && count > 0) {
            newCards.push(drawRandomCard(superOrBetterRarities, sourceCards));
        }

        const remainingCount = count - newCards.length;
        for (let i = 0; i < remainingCount; i++) {
            newCards.push(drawRandomCard(undefined, sourceCards));
        }

        return newCards;
    }, [allCards]);

    const checkWin = useCallback((finalReels: string[]) => {
        const counts: { [key: string]: number } = {};
        finalReels.forEach(emoji => {
            counts[emoji] = (counts[emoji] || 0) + 1;
        });
        
        const maxCount = Math.max(...Object.values(counts));
        const winningEmoji = Object.keys(counts).find(key => counts[key] === maxCount);

        const rulesByCount: Record<number, PrizeRule> = {
            10: ADJUSTED_PRIZE_RULES[0], 9: ADJUSTED_PRIZE_RULES[1], 8: ADJUSTED_PRIZE_RULES[2],
            7: ADJUSTED_PRIZE_RULES[3], 6: ADJUSTED_PRIZE_RULES[4], 5: ADJUSTED_PRIZE_RULES[5],
            4: ADJUSTED_PRIZE_RULES[6], 3: ADJUSTED_PRIZE_RULES[7], 2: ADJUSTED_PRIZE_RULES[8],
        };

        const matchedRule = rulesByCount[maxCount];
        let prizeCards: Card[] = [];

        let dynamicPrizeText = matchedRule?.prize || "ไม่ได้รางวัล... ลองใหม่อีกครั้ง!";
        if (rewardMode !== 'normal' && matchedRule && matchedRule.prize.includes('การ์ด')) {
             dynamicPrizeText = matchedRule.prize.replace('สุ่มการ์ด', `สุ่มการ์ดซีซั่น ${rewardMode}`);
        }

        if (matchedRule) {
            switch (maxCount) {
                case 10: prizeCards = getRandomCards(10, { guaranteeLegendaryRare: true }, rewardMode); onWinCards(prizeCards); break;
                case 9: prizeCards = getRandomCards(10, { legendaryRareBoost: 5.0 }, rewardMode); onWinCards(prizeCards); break;
                case 8: prizeCards = getRandomCards(10, { guaranteeUltraOrBetter: true }, rewardMode); onWinCards(prizeCards); break;
                case 7: prizeCards = getRandomCards(8, { guaranteeSuperOrBetter: true }, rewardMode); onWinCards(prizeCards); break;
                case 6: prizeCards = getRandomCards(5, { ultraRareBoost: 3.0 }, rewardMode); onWinCards(prizeCards); break;
                case 5: prizeCards = getRandomCards(3, {}, rewardMode); onWinCards(prizeCards); break;
                case 4: onWinCoins(20); break;
                case 3: onWinCoins(10); break;
                case 2: onWinPoints(2); break;
            }

            setResultMessage(`ยินดีด้วย! คุณได้รับ: ${dynamicPrizeText}`);
            setWonCards(prizeCards);

            setRecentWins(prev => {
                const newWin = { prize: dynamicPrizeText, icon: matchedRule.prizeIcon, nickname };
                const updated = [newWin, ...prev].slice(0, 30);
                localStorage.setItem(GLOBAL_RECENT_WINS_KEY, JSON.stringify(updated));
                return updated;
            });
        } else {
            setResultMessage("ไม่ได้รางวัล... ลองใหม่อีกครั้ง!");
        }

        if (winningEmoji && maxCount > 1) {
            setWinningIndices(finalReels.map((emoji, index) => emoji === winningEmoji ? index : -1).filter(i => i !== -1));
        } else {
            setWinningIndices([]);
        }
    }, [getRandomCards, onWinCards, onWinCoins, onWinPoints, nickname, rewardMode]);

    const runSpin = useCallback(() => {
        if (coins < 1) {
            setResultMessage("เหรียญไม่เพียงพอ!");
            autoSpinController.current.isRunning = false;
            setIsAutoSpinning(false);
            setCountdown(null);
            return;
        }

        setPlayCount(prev => {
            const newCount = prev + 1;
            localStorage.setItem(storageKeys.playCount, newCount.toString());
            return newCount;
        });
    
        setTotalPlayCount(prev => {
            const newCount = prev + 1;
            localStorage.setItem(TOTAL_PLAY_COUNT_KEY, newCount.toString());
            return newCount;
        });
        
        onSpin(1);
        setResultMessage(null);
        setWinningIndices([]);
        setWonCards([]);
        setStopCount(0);
        setGameState('spinning');
        setSpinningReels(Array(10).fill(true));
        clearAllTimers();

        reelIntervals.current = Array(10).fill(null).map((_, index) => 
            setInterval(() => {
                setReels(prevReels => {
                    const newReels = [...prevReels];
                    newReels[index] = EMOJIS[Math.floor(Math.random() * EMOJIS.length)];
                    return newReels;
                });
            }, 50)
        );

        if (autoSpinController.current.isRunning) {
            for (let i = 0; i < 10; i++) {
                const stopTimeout = setTimeout(() => {
                    if (reelIntervals.current[i]) {
                        clearInterval(reelIntervals.current[i]);
                    }
                    if (i === 9) { // Last reel stopped
                        setReels(currentReels => {
                            setGameState('finished');
                            checkWin(currentReels);
                             
                            if(autoSpinController.current.spinsLeft <= 1 || coins - 1 < 1) {
                                autoSpinController.current.isRunning = false;
                                setIsAutoSpinning(false);
                            } else {
                                autoSpinController.current.spinsLeft -= 1;
                                startCountdown(3, `เริ่มรอบต่อไปใน `, () => runSpin());
                            }
                            return currentReels;
                        });
                    }
                }, 1000 + i * 100);
                timeouts.current.push(stopTimeout);
            }
        }
    }, [coins, onSpin, checkWin, clearAllTimers, storageKeys.playCount]);
    
    const handleStopReel = () => {
        if (gameState !== 'spinning' && gameState !== 'stopping') return;

        setGameState('stopping');
        
        if (reelIntervals.current[stopCount]) {
            clearInterval(reelIntervals.current[stopCount]);
        }
        setSpinningReels(prev => {
            const newSpinning = [...prev];
            newSpinning[stopCount] = false;
            return newSpinning;
        });
        
        const newStopCount = stopCount + 1;
        setStopCount(newStopCount);

        if (newStopCount === 10) {
            setGameState('finished');
            setReels(currentReels => {
                checkWin(currentReels);
                return currentReels;
            });
        }
    };

    const startCountdown = (duration: number, message: string, onComplete: () => void) => {
        clearAllTimers();
        setCountdown(duration);
        setCountdownMessage(message);
        
        const timer = setInterval(() => {
            setCountdown(prev => {
                if (prev === null || prev <= 1) {
                    clearInterval(timer);
                    setCountdown(null);
                    onComplete();
                    return null;
                }
                return prev - 1;
            });
        }, 1000);
        timeouts.current.push(timer as unknown as ReturnType<typeof setTimeout>);
    };

    const handleAutoSpinClick = () => {
        if (autoSpinController.current.isRunning) {
            autoSpinController.current.isRunning = false;
            setIsAutoSpinning(false);
            setCountdown(null);
            clearAllTimers();
            if(gameState !== 'finished' && gameState !== 'idle') {
                setGameState('finished');
                setResultMessage('ยกเลิกการหมุนอัตโนมัติ');
            }
        } else {
            if (coins < autoSpinCount) {
                setResultMessage("เหรียญไม่เพียงพอสำหรับหมุนอัตโนมัติตามจำนวนที่ตั้งไว้");
                return;
            }
            setIsAutoSpinning(true);
            autoSpinController.current.isRunning = true;
            autoSpinController.current.spinsLeft = autoSpinCount;
            startCountdown(3, 'เริ่มใน ', () => runSpin());
        }
    };
    
    const changeCount = (amount: number) => {
        setAutoSpinCount(prev => {
            const newValue = prev + amount;
            if (newValue < 1) return 1;
            const maxSpins = Math.max(1, coins);
            if (newValue > maxSpins) return maxSpins;
            return newValue;
        })
    }

    const handlePressAndHold = (amount: number) => {
        changeCount(amount);
        pressAndHoldInterval.current = setInterval(() => {
            changeCount(amount);
        }, 100);
    };
    
    const stopPressAndHold = () => {
        if(pressAndHoldInterval.current) clearInterval(pressAndHoldInterval.current);
    }

    const renderButton = () => {
         if (isAutoSpinning || countdown !== null) return null;
         switch (gameState) {
            case 'idle':
            case 'finished':
                return <button onClick={() => runSpin()} disabled={coins < 1} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 px-8 rounded-lg transition duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed">เริ่มเกม (1 เหรียญ)</button>;
            case 'spinning':
            case 'stopping':
                return <button onClick={handleStopReel} className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-4 px-8 rounded-lg transition duration-300 transform hover:scale-105">หยุด ({stopCount + 1}/10)</button>;
        }
    };
    
    const renderAutoSpinButtonText = () => {
        if (countdown !== null) return `${countdownMessage}${countdown}... (คลิกเพื่อยกเลิก)`;
        if (isAutoSpinning) return `หยุด (${autoSpinController.current.spinsLeft} ครั้ง)`;
        return `หมุนอัตโนมัติ (${autoSpinCount} ครั้ง)`;
    };

    return (
        <>
            <GameHeader currentGame="slot" onNavigate={onNavigate} />
            <div className="flex flex-col lg:flex-row gap-6 items-start">
                <div className="flex-grow w-full space-y-6">
                    <div className="bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm border border-slate-300 dark:border-slate-700 rounded-lg p-6 shadow-xl">
                        <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-4 tracking-wide text-center">🏆 ตารางรางวัล 🏆</h2>
                        
                        <div className="flex justify-center items-center gap-2 my-4">
                            <label htmlFor="season-select-slots" className="text-slate-800 dark:text-slate-300 font-semibold">
                                เป้าหมายรางวัลการ์ด:
                            </label>
                            <select 
                                id="season-select-slots"
                                value={rewardMode}
                                onChange={e => setRewardMode(e.target.value === 'normal' ? 'normal' : Number(e.target.value))}
                                className="bg-slate-900 border border-slate-600 rounded-md p-2 text-white"
                            >
                                <option value="normal">สุ่มจากทุกซีซั่น</option>
                                {SEASON_CONFIG.map(s => (
                                    <option key={s.season} value={s.season}>{s.name}</option>
                                ))}
                            </select>
                        </div>
                        
                        <div className="space-y-2 max-w-lg mx-auto">
                            {ADJUSTED_PRIZE_RULES.map((rule) => {
                                let prizeText = rule.prize;
                                if (rewardMode !== 'normal' && prizeText.includes('การ์ด')) {
                                    prizeText = prizeText.replace('สุ่มการ์ด', `สุ่มการ์ด ${SEASON_CONFIG.find(s => s.season === rewardMode)?.name || ''}`);
                                }
                                return (
                                <div key={rule.text} className="flex justify-between items-center bg-white/50 dark:bg-slate-900/50 p-2 rounded-md text-sm">
                                    <div className="flex items-center gap-3 text-slate-700 dark:text-slate-300">
                                        <span className="text-lg w-6 text-center">{rule.conditionIcon}</span>
                                        <span>{rule.text}</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className="font-semibold text-slate-800 dark:text-white text-right flex items-center gap-2">
                                            <span className="text-lg w-6 text-center">{rule.prizeIcon}</span>
                                            <span>{prizeText}</span>
                                        </span>
                                        <span className="text-xs text-yellow-600 dark:text-yellow-400 font-mono bg-yellow-500/10 px-1.5 py-0.5 rounded-md w-16 text-center">{rule.chance}</span>
                                    </div>
                                </div>
                            )})}
                        </div>
                    </div>

                    <div className="bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm border border-slate-300 dark:border-slate-700 rounded-lg p-6 shadow-xl space-y-6">
                        <div className="grid grid-cols-10 justify-center items-center gap-2 bg-slate-200/50 dark:bg-slate-900/50 p-4 rounded-lg border border-slate-300 dark:border-slate-700">
                            {reels.map((emoji, index) => (
                                <div 
                                    key={index} 
                                    className={`w-16 h-16 sm:w-20 sm:h-20 text-4xl sm:text-5xl flex items-center justify-center rounded-md transition-colors duration-200 
                                    ${spinningReels[index] 
                                        ? 'bg-slate-300 dark:bg-slate-800 animate-pulse' 
                                        : `bg-slate-400 dark:bg-slate-600 reel-stopped ${winningIndices.includes(index) ? 'reel-winner' : ''}`
                                    }`}
                                >
                                    {emoji}
                                </div>
                            ))}
                        </div>

                        {resultMessage && countdown === null && (
                            <div className={`text-center font-semibold text-lg p-3 rounded-md animate-fade-in ${
                                resultMessage.startsWith('ยินดีด้วย') 
                                    ? 'bg-green-500/20 text-green-300 border border-green-500/30' 
                                    : 'bg-red-500/20 text-red-300 border border-red-500/30'
                            }`}>
                                {resultMessage}
                            </div>
                        )}

                        {wonCards.length > 0 && countdown === null && (
                            <div className="mt-4 animate-fade-in">
                                <h4 className="font-semibold text-white text-center mb-2">การ์ดที่ได้รับ:</h4>
                                <div className="flex justify-center gap-2 flex-wrap max-h-48 overflow-y-auto p-2 bg-slate-900/30 rounded-md">
                                    {wonCards.map((card, index) => (
                                        <div key={index} className="w-20 relative flex-shrink-0">
                                            <img src={card.frontImage} alt={card.name[language]} className="w-full rounded-md border-2" style={{borderColor: RARITY_DATA.find(r=>r.name === card.rarity)?.color || '#fff'}} />
                                            <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white text-[8px] text-center p-0.5 rounded-b-md truncate">{card.name[language]}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="mt-6 flex flex-col items-center gap-4">
                            {renderButton()}

                             <div className="flex items-center gap-2">
                                <button
                                    onClick={handleAutoSpinClick}
                                    disabled={coins < 1 && !isAutoSpinning}
                                    className={`w-48 text-center font-bold py-2 px-4 rounded-lg transition-colors text-sm ${
                                        isAutoSpinning 
                                            ? 'bg-red-600/80 hover:bg-red-700/80 text-white' 
                                            : 'bg-slate-700/80 hover:bg-slate-600/80 text-white disabled:opacity-50'
                                    }`}
                                >
                                    {renderAutoSpinButtonText()}
                                </button>
                                <div className="flex items-center gap-1 bg-slate-700/80 rounded-lg p-1">
                                    <button onMouseDown={() => handlePressAndHold(-1)} onMouseUp={stopPressAndHold} onMouseLeave={stopPressAndHold} className="px-2 py-1 rounded bg-slate-600 hover:bg-slate-500">-</button>
                                    <input type="number" value={autoSpinCount} readOnly className="w-12 bg-transparent text-center font-bold"/>
                                    <button onMouseDown={() => handlePressAndHold(1)} onMouseUp={stopPressAndHold} onMouseLeave={stopPressAndHold} className="px-2 py-1 rounded bg-slate-600 hover:bg-slate-500">+</button>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>

                <div className="w-full lg:w-80 flex-shrink-0 bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-lg p-6 shadow-xl">
                    <h2 className="text-2xl font-bold text-white mb-4 text-center">สถิติรวม</h2>
                    <div className="bg-slate-900/50 p-3 rounded-lg mb-4 space-y-2 text-sm">
                        <div className="flex justify-between items-center">
                            <span className="text-slate-400">การเล่นของคุณ:</span>
                            <span className="font-bold text-lg text-white">{playCount.toLocaleString()} ครั้ง</span>
                        </div>
                         <div className="flex justify-between items-center">
                            <span className="text-slate-400">รวมทั้งหมด:</span>
                            <span className="font-bold text-lg text-white">{totalPlayCount.toLocaleString()} ครั้ง</span>
                        </div>
                    </div>
                    
                     <h3 className="text-xl font-bold text-white mb-4 tracking-wide border-b-2 border-slate-700 pb-2">รางวัลล่าสุด</h3>
                    <div className="space-y-2 h-[calc(900px-400px)] overflow-y-auto pr-2 custom-scrollbar">
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
            </div>

            <style>{`
                .reel-stopped { animation: reel-stop-anim 0.2s cubic-bezier(0.25, 1, 0.5, 1); }
                @keyframes reel-stop-anim { from { transform: scale(0.8); } to { transform: scale(1); } }
                
                .reel-winner {
                    animation: winner-pulse 1s infinite;
                    border: 2px solid #fde047; /* gold-300 */
                    box-shadow: 0 0 15px #fde047;
                }
                @keyframes winner-pulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.1); } }
                
                .animate-fade-in { animation: fadeIn 0.5s ease-in-out; }
                @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }

                .animate-fade-in-down { animation: fadeInDown 0.3s ease-out both; }
                @keyframes fadeInDown { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }

                .custom-scrollbar::-webkit-scrollbar { width: 6px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: #1e293b; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #475569; border-radius: 10px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #64748b; }
            `}</style>
        </>
    );
};

export default SlotMachine;