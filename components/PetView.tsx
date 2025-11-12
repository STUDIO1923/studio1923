import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { PetData, PetStatus, EMOJIS, PetSpeciesData, PetStats, Quest, InventoryItem, QuestLogEntry, PetBackgroundItem, QuestTheme, StackedInventoryItem } from '../types';
import * as petSpeciesService from '../services/petSpeciesService';
import * as itemGenerationService from '../services/itemGenerationService';
import * as auditService from '../services/auditService';
import { QUEST_DATABASE } from '../services/questDatabase';
import { QUEST_LOG_DATABASE } from '../services/questLogDatabase';
import { ITEM_DATABASE } from '../services/itemDatabase';
import { WarningIcon } from './icons/WarningIcon';
import { PointIcon } from './icons/PointIcon';


// Props definition
interface PetViewProps {
  nickname: string;
  coins: number;
  points: number;
  onQuestComplete: (petName: string, questName: string, reward: number, pointsReward: number) => void;
  onCareCost: (cost: number) => void;
  onFindCardPack: () => void;
  onCurrencyChange: (coinChange: number, pointChange: number) => void;
  pet: PetData | null;
  setPet: React.Dispatch<React.SetStateAction<PetData | null>>;
  questBackgrounds: Record<string, string>;
  homeBackgrounds: PetBackgroundItem[];
  siteConfig: Record<string, string>;
}

const CARE_COSTS = {
    FEED: 10,
    PLAY: 10,
    HEAL: 50,
};

const EXP_GAINS = {
    CARE: 5,
};

const STAT_ICONS: Record<keyof PetStats, string> = {
    hp: '💖', sp: '🔮', atk: '⚔️', def: '🛡️', agi: '💨', dex: '🎯', luk: '🍀'
};

const STAT_NAMES: Record<keyof PetStats, string> = {
    hp: 'พลังชีวิต', sp: 'มานา', atk: 'โจมตี', def: 'ป้องกัน', agi: 'ความเร็ว', dex: 'แม่นยำ', luk: 'โชค'
};

const ProgressBar: React.FC<{ value: number; maxValue: number; color: string; label: string }> = ({ value, maxValue, color, label }) => (
    <div>
        <div className="flex justify-between mb-1">
            <span className="text-sm font-medium text-slate-300">{label}</span>
            <span className="text-sm font-medium text-white">{value} / {maxValue}</span>
        </div>
        <div className="w-full bg-slate-700 rounded-full h-4">
            <div className={`${color} h-4 rounded-full transition-all duration-500`} style={{ width: `${(value / maxValue) * 100}%` }}></div>
        </div>
    </div>
);

const triggerRandomEvent = (p: PetData): PetData => {
    if (!p.questRecommendedLevel) return p;

    const possibleEvents = QUEST_LOG_DATABASE.filter(e =>
        e.minLevel <= p.questRecommendedLevel! && e.maxLevel >= p.questRecommendedLevel!
    );
    if (possibleEvents.length === 0) return p;

    const event = possibleEvents[Math.floor(Math.random() * possibleEvents.length)];

    if (Math.random() * 100 > event.chance) return p;

    let newLogs = [...(p.questLog || [])];
    let newHealth = p.currentHealth;
    let newPet = { ...p };

    if (event.type === 'combat') {
        let damageTaken = 0;
        const questLevel = p.questRecommendedLevel!;

        if (event.damage) { // New high-damage event
            const damagePercent = event.damage.min + Math.random() * (event.damage.max - event.damage.min);
            const baseDamage = questLevel * 2.5; // High base damage for these events
            const rawDamage = baseDamage * (damagePercent / 100);
            // Defense is less effective against overwhelming attacks
            damageTaken = Math.max(questLevel, Math.floor(rawDamage - (p.stats.def * 0.2)));
        } else { // Original logic for normal combat
            const monsterDamage = (questLevel * 1.5) + (Math.random() * questLevel);
            const petDefense = p.stats.def * 0.5;
            damageTaken = Math.max(1, Math.floor(monsterDamage - petDefense));
        }
        
        newHealth -= damageTaken;
        newLogs.push({ text: event.text + ` คุณเสีย HP ${damageTaken} หน่วย!`, type: 'damage' });

    } else if (event.type === 'trap' && event.statCheck) {
        const { stat, difficulty, successText, failureText, rewardItem } = event.statCheck;
        const petRoll = Math.floor(Math.random() * 20) + 1 + p.stats[stat];
        if (petRoll >= difficulty) {
            newLogs.push({ text: successText, type: 'success' });
            if (rewardItem === 'CardFragment') {
                const fragmentTemplate = ITEM_DATABASE.find(item => item.id === 'special_card_fragment');
                if (fragmentTemplate) {
                     // In PetView, we can't directly modify inventory like this anymore. This logic is illustrative.
                     // The item adding should be handled in LoggedInView.
                }
            }
        } else {
            const trapDamage = (p.questRecommendedLevel! * 1.2) + (Math.random() * 5);
            const damageTaken = Math.max(1, Math.floor(trapDamage - p.stats.def * 0.25));
            newHealth -= damageTaken;
            newLogs.push({ text: failureText + ` คุณเสีย HP ${damageTaken} หน่วย!`, type: 'damage' });
        }
    } else { // info or discovery
        newLogs.push({ text: event.text, type: 'info' });
    }

    if (newHealth <= 0) {
        const failLog: QuestLogEntry = { text: 'สัตว์เลี้ยงของคุณพ่ายแพ้...', type: 'fail' };
        newLogs.push(failLog);
        newPet = { ...newPet, status: 'recovering', currentHealth: 0, questEndTime: null, questLog: newLogs };
    } else {
        newPet = { ...newPet, currentHealth: newHealth, questLog: newLogs };
    }

    return newPet;
};

const BackgroundSelectionModal: React.FC<{
    homeBackgrounds: PetBackgroundItem[];
    defaultBackground: string;
    onSelect: (id: string) => void;
    onClose: () => void;
}> = ({ homeBackgrounds, defaultBackground, onSelect, onClose }) => {
    const allOptions = [
        ...(defaultBackground ? [{ id: 'default', name: 'พื้นฐาน', image: defaultBackground }] : []),
        ...homeBackgrounds.filter(bg => bg.image && bg.name)
    ];

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 shadow-xl w-full max-w-3xl relative" onClick={e => e.stopPropagation()}>
                <button onClick={onClose} className="absolute top-3 right-3 text-slate-400 hover:text-white text-2xl">&times;</button>
                <h3 className="text-xl font-bold text-white mb-4">เลือกพื้นหลังที่บ้าน</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 max-h-[60vh] overflow-y-auto">
                    {allOptions.map(bg => (
                        <button key={bg.id} onClick={() => onSelect(bg.id)} className="group space-y-2">
                            <div className="aspect-video bg-slate-900 rounded-md overflow-hidden border-2 border-transparent group-hover:border-indigo-500 transition-all">
                                <img src={bg.image} alt={bg.name} className="w-full h-full object-cover"/>
                            </div>
                            <p className="text-sm text-center text-slate-300 group-hover:text-white">{bg.name}</p>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};


const PetView: React.FC<PetViewProps> = ({ nickname, coins, points, onQuestComplete, onCareCost, onFindCardPack, onCurrencyChange, pet, setPet, questBackgrounds, homeBackgrounds, siteConfig }) => {
    const storageKey = useMemo(() => `pet_v3_${nickname}`, [nickname]);
    const questsStorageKey = useMemo(() => `quests_v3_${nickname}`, [nickname]);
    
    const [currentQuests, setCurrentQuests] = useState<Quest[]>([]);
    const [petName, setPetName] = useState('');
    const [selectedEmoji, setSelectedEmoji] = useState(EMOJIS[0]);
    const [selectedSpecies, setSelectedSpecies] = useState<PetSpeciesData | null>(null);
    const [isFetchingQuests, setIsFetchingQuests] = useState(false);
    
    const [timeLeft, setTimeLeft] = useState(0);
    const [questRefreshTimeLeft, setQuestRefreshTimeLeft] = useState('00:00');
    const [isDeparting, setIsDeparting] = useState(false);
    const [selectedItem, setSelectedItem] = useState<{itemStack: StackedInventoryItem, index: number} | null>(null);
    const [isChangingBackground, setIsChangingBackground] = useState(false);
    const [confirmingQuest, setConfirmingQuest] = useState<Quest | null>(null);

    useEffect(() => {
        if (pet) {
            const petToSave = {...pet};
            if(!petToSave.homeBackground) petToSave.homeBackground = 'default';
            localStorage.setItem(storageKey, JSON.stringify(petToSave));
        }
    }, [pet, storageKey]);
    
    const updatePetState = useCallback((updater: (p: PetData) => PetData) => {
        setPet(prevPet => prevPet ? updater(prevPet) : null);
    }, [setPet]);

    const gainExp = useCallback((amount: number) => {
        updatePetState(p => {
            if (p.status === 'recovering') return p;
            let newExp = p.exp + amount;
            let newLevel = p.level;
            let newExpToNextLevel = p.expToNextLevel;
            let newStats = { ...p.stats };
            let levelUps = 0;

            while (newExp >= newExpToNextLevel) {
                levelUps++;
                newExp -= newExpToNextLevel;
                newLevel++;
                newExpToNextLevel = Math.floor(100 * Math.pow(newLevel, 1.5));
                const growth = p.species.growthRates;
                const bonus = Math.floor(p.levelUpStatProgress / 5);
                (Object.keys(newStats) as Array<keyof PetStats>).forEach(key => {
                    newStats[key] += (growth[key] || 1) + bonus;
                });
            }

            if (levelUps > 0) {
                return { 
                    ...p, exp: newExp, level: newLevel, expToNextLevel: newExpToNextLevel,
                    stats: newStats, currentHealth: newStats.hp, currentSp: newStats.sp,
                    levelUpStatProgress: 0,
                };
            }
            return { ...p, exp: newExp };
        });
    }, [updatePetState]);

    const generateQuests = useCallback(() => {
        setIsFetchingQuests(true);
        
        const lowLevelPool = QUEST_DATABASE.filter(q => q.recommendedLevel <= 50);
        const highLevelPool = QUEST_DATABASE.filter(q => q.recommendedLevel > 50);

        const shuffledLow = [...lowLevelPool].sort(() => 0.5 - Math.random());
        const shuffledHigh = [...highLevelPool].sort(() => 0.5 - Math.random());
        
        const selectedQuests = [
            ...shuffledLow.slice(0, 5),
            ...shuffledHigh.slice(0, 5)
        ];

        const finalQuests = selectedQuests.sort(() => 0.5 - Math.random());
        
        setCurrentQuests(finalQuests);
        localStorage.setItem(questsStorageKey, JSON.stringify({ quests: finalQuests, timestamp: Date.now() }));
        setIsFetchingQuests(false);
    }, [questsStorageKey]);

    useEffect(() => {
        const loadQuests = () => {
            const saved = localStorage.getItem(questsStorageKey);
            if (saved) {
                const { quests, timestamp } = JSON.parse(saved);
                if (Date.now() - timestamp < 30 * 60 * 1000) {
                    setCurrentQuests(quests);
                    return;
                }
            }
            generateQuests();
        };
        loadQuests();
        const interval = setInterval(generateQuests, 30 * 60 * 1000);

        const refreshTimer = setInterval(() => {
            const saved = localStorage.getItem(questsStorageKey);
            if(saved) {
                 const { timestamp } = JSON.parse(saved);
                 const nextRefreshTime = timestamp + 30 * 60 * 1000;
                 const diff = Math.max(0, nextRefreshTime - Date.now());
                 const minutes = Math.floor(diff / 60000).toString().padStart(2, '0');
                 const seconds = Math.floor((diff % 60000) / 1000).toString().padStart(2, '0');
                 setQuestRefreshTimeLeft(`${minutes}:${seconds}`);
            }
        }, 1000);

        return () => {
            clearInterval(interval);
            clearInterval(refreshTimer);
        };
    }, [generateQuests, questsStorageKey]);

    useEffect(() => {
        const gameTick = setInterval(() => {
            setPet(p => {
                if (!p) return null;

                if (p.status === 'questing' && p.questEndTime && p.questDuration) {
                    const now = Date.now();
                    
                    if (now >= p.questEndTime) {
                        if (p.status !== 'questing') return p; // Final check
                        
                        const currentQuest = QUEST_DATABASE.find(q => q.name === p.questName);
                        const successLog: QuestLogEntry = { text: "ภารกิจสำเร็จ!", type: 'success' };
                        onQuestComplete(p.name, p.questName || 'a quest', p.questReward || 0, p.questPointsReward || 0);
                        gainExp(p.questReward || 0);
                        
                        if (currentQuest?.specialRewards?.includes('CardPack')) {
                           const packDropChance = (p.stats.luk / 20) + 5; 
                           if (Math.random() * 100 < packDropChance) onFindCardPack();
                        }
                        
                        let itemsToGive: InventoryItem[] = [];
                        const itemDropChance = (p.stats.luk || 5) + (p.questRecommendedLevel || 1) * 2;
                        if (Math.random() * 100 < itemDropChance) {
                            const foundItem = itemGenerationService.generateItem(p.questRecommendedLevel || 1);
                            if (foundItem) itemsToGive.push(foundItem);
                        }
                        
                        let fragmentDropChance = (p.stats.luk / 2) + (p.questRecommendedLevel || 1);
                        if (currentQuest?.specialRewards?.includes('CardFragment')) fragmentDropChance += 20; 
                        if(Math.random() * 100 < fragmentDropChance) {
                            const fragmentTemplate = ITEM_DATABASE.find(item => item.id === 'special_card_fragment');
                            if(fragmentTemplate) itemsToGive.push(fragmentTemplate);
                        }

                        let updatedPet: PetData = {
                            ...p, status: 'idle', questEndTime: null, questReward: null, questPointsReward: null, questName: null,
                            levelUpStatProgress: p.levelUpStatProgress + 1, questLog: [...(p.questLog || []), successLog],
                            questProgress: 100
                        };

                        // Add items to inventory using the stacking logic
                        if (itemsToGive.length > 0) {
                            let newInventory = [...updatedPet.inventory];
                             for (const itemTemplate of itemsToGive) {
                                let itemWasAdded = false;
                                for (let i = 0; i < newInventory.length; i++) {
                                    if (newInventory[i] && newInventory[i]!.item.id === itemTemplate.id) {
                                        newInventory[i]!.quantity++;
                                        itemWasAdded = true;
                                        break;
                                    }
                                }
                                if (!itemWasAdded) {
                                    const emptySlotIndex = newInventory.findIndex(slot => slot === null);
                                    if (emptySlotIndex !== -1) {
                                        newInventory[emptySlotIndex] = { item: itemTemplate, quantity: 1 };
                                    }
                                }
                            }
                            updatedPet.inventory = newInventory;
                        }
                        return updatedPet;
                    } else {
                        const startTime = p.questEndTime - p.questDuration;
                        const elapsedTime = now - startTime;
                        const progress = Math.min(100, (elapsedTime / p.questDuration) * 100);
                        
                        let updatedPet: PetData = { ...p, questProgress: progress };
                        
                        const checkpoints = [15, 30, 45, 60, 75, 90];
                        const newTriggeredCheckpoints = [...(p.triggeredCheckpoints || [])];
                        let eventWasTriggered = false;

                        for (const checkpoint of checkpoints) {
                            if (progress >= checkpoint && !newTriggeredCheckpoints.includes(checkpoint)) {
                                newTriggeredCheckpoints.push(checkpoint);
                                updatedPet = triggerRandomEvent(updatedPet);
                                eventWasTriggered = true;
                                if (updatedPet.status === 'recovering') break;
                            }
                        }

                        if(eventWasTriggered) {
                            updatedPet.triggeredCheckpoints = newTriggeredCheckpoints;
                        }
                        
                        setTimeLeft(Math.max(0, p.questEndTime - now));
                        return updatedPet;
                    }
                }
                return p;
            });
        }, 1000);

        return () => clearInterval(gameTick);
    }, [onQuestComplete, gainExp, onFindCardPack, setPet]);
    
    useEffect(() => {
        if (!pet) {
            const speciesData = petSpeciesService.getPetSpecies(selectedEmoji);
            setSelectedSpecies(speciesData);
        }
    }, [selectedEmoji, pet]);

    const handleCreatePet = () => {
        if (!petName.trim() || !selectedSpecies) return;
        setPet({
            emoji: selectedEmoji, name: petName.trim(), species: selectedSpecies, stats: { ...selectedSpecies.baseStats },
            currentHealth: selectedSpecies.baseStats.hp, currentSp: selectedSpecies.baseStats.sp, level: 1, exp: 0, expToNextLevel: 100,
            levelUpStatProgress: 0, status: 'idle', lastUpdated: Date.now(),
            questEndTime: null, questDuration: 0, questReward: null, questPointsReward: null, questName: null, questLog: null, questRecommendedLevel: null,
            inventory: Array(20).fill(null), homeBackground: 'default'
        });
    };

    const handleFeed = () => {
        if (coins < CARE_COSTS.FEED || !pet || pet.status !== 'idle') return;
        onCareCost(CARE_COSTS.FEED);
        updatePetState(p => ({ ...p, currentHealth: Math.min(p.stats.hp, p.currentHealth + 20) }));
        gainExp(EXP_GAINS.CARE);
    };

    const handlePlay = () => {
        if (coins < CARE_COSTS.PLAY || !pet || pet.status !== 'idle') return;
        onCareCost(CARE_COSTS.PLAY);
        updatePetState(p => ({ ...p, currentSp: Math.min(p.stats.sp, p.currentSp + 20) }));
        gainExp(EXP_GAINS.CARE);
    };

    const handleHeal = () => {
        if (coins < CARE_COSTS.HEAL || !pet) return;
        onCareCost(CARE_COSTS.HEAL);
        updatePetState(p => ({ ...p, currentHealth: p.stats.hp, currentSp: p.stats.sp, status: 'idle', questLog: null }));
        gainExp(EXP_GAINS.CARE * 2);
    };

    const startQuest = (quest: Quest) => {
        setIsDeparting(true);
        setTimeout(() => {
            const initialLog: QuestLogEntry = { text: `[00:00] เริ่มเควส: ${quest.name}`, type: 'info' };
            updatePetState(p => ({
                ...p, 
                status: 'questing', 
                questEndTime: Date.now() + quest.duration, 
                questDuration: quest.duration,
                questProgress: 0,
                triggeredCheckpoints: [],
                questReward: quest.reward, 
                questPointsReward: quest.pointsReward, 
                questName: quest.name, 
                questRecommendedLevel: quest.recommendedLevel,
                questLog: [initialLog]
            }));
            setIsDeparting(false);
        }, 1200);
    };
    
    const handleSendQuest = (quest: Quest) => {
        if (!pet || pet.status !== 'idle' || isDeparting) return;
        
        if (quest.recommendedLevel > pet.level + 10) {
            setConfirmingQuest(quest);
            return;
        }
        
        startQuest(quest);
    };

    const handleRecallPet = useCallback(() => {
        if (points < 50 || !pet || pet.status !== 'questing') return;
        
        if (window.confirm('คุณต้องการเรียกสัตว์เลี้ยงกลับทันทีหรือไม่? (ใช้ 50 แต้ม และจะไม่ได้รับรางวัล)')) {
            onCurrencyChange(0, -50);
            updatePetState(p => ({
                ...p,
                status: 'idle',
                questEndTime: null,
                questDuration: undefined,
                questProgress: undefined,
                triggeredCheckpoints: undefined,
                questReward: null,
                questPointsReward: null,
                questName: null,
                questRecommendedLevel: null,
                questLog: null,
            }));
        }
    }, [points, pet, onCurrencyChange, updatePetState]);

    const handleRefreshQuests = () => {
        if (points < 50 || isFetchingQuests) return;
        onCurrencyChange(0, -50);
        generateQuests();
    };

    const handleUseItem = (itemStack: StackedInventoryItem, index: number) => {
        if (!pet) return;
        const item = itemStack.item;
        
        let petWasUpdated = false;
        let p = { ...pet };

        if (item.effect?.type === 'HEAL_HP') {
            p.currentHealth = Math.min(p.stats.hp, p.currentHealth + (item.effect.value || 0));
            petWasUpdated = true;
        }
        if (item.effect?.type === 'HEAL_SP') {
            p.currentSp = Math.min(p.stats.sp, p.currentSp + (item.effect.value || 0));
            petWasUpdated = true;
        }
        if (item.effect?.type === 'GAIN_EXP') {
            gainExp(item.effect.value || 0);
        }

        const newInventory = [...p.inventory];
        const stackToUpdate = newInventory[index];
        if (stackToUpdate && stackToUpdate.quantity > 1) {
            stackToUpdate.quantity--;
        } else {
            newInventory[index] = null;
        }
        
        if (petWasUpdated) {
            setPet({ ...p, inventory: newInventory });
        } else {
            setPet(prev => prev ? ({ ...prev, inventory: newInventory }) : null);
        }
        setSelectedItem(null);
    };
    
    const handleSellItem = (itemStack: StackedInventoryItem, index: number) => {
        onCurrencyChange(itemStack.item.value || 0, 0);
        auditService.logTransaction(nickname, 'coin', itemStack.item.value || 0, `Sell Item: ${itemStack.item.name}`);
        
        updatePetState(p => {
            const newInventory = [...p.inventory];
            const stackToUpdate = newInventory[index];
            if (stackToUpdate && stackToUpdate.quantity > 1) {
                stackToUpdate.quantity--;
            } else {
                newInventory[index] = null;
            }
            return { ...p, inventory: newInventory };
        });
        setSelectedItem(null);
    };

    const currentBackground = useMemo(() => {
        const defaultBg = siteConfig.view_pets_background || '';
        if (!pet) return defaultBg;
        
        if (pet.status === 'questing' && pet.questName) {
            const currentQuest = QUEST_DATABASE.find(q => q.name === pet.questName);
            const themeKey = `pet_quest_background_${currentQuest?.theme || 'Default'}`;
            return questBackgrounds[themeKey] || defaultBg;
        }
        
        if (pet.homeBackground === 'default') {
            return defaultBg;
        }
        
        const selectedBg = homeBackgrounds.find(bg => bg.id === pet.homeBackground);
        return selectedBg?.image || defaultBg;

    }, [pet, questBackgrounds, homeBackgrounds, siteConfig]);

    if (!pet) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-lg p-8 shadow-xl text-center">
                    <h3 className="text-2xl font-bold text-white mb-4">รับเลี้ยง EmojiMon ของคุณ!</h3>
                    <div className="bg-slate-900 rounded-lg p-4 mb-6">
                        <div className="text-7xl mb-4">{selectedEmoji}</div>
                        <div className="grid grid-cols-8 gap-2 max-h-32 overflow-y-auto">
                            {EMOJIS.slice(0, 40).map(emoji => (
                                <button key={emoji} onClick={() => setSelectedEmoji(emoji)} className={`text-2xl rounded-md p-1 transition ${selectedEmoji === emoji ? 'bg-indigo-600 scale-125' : 'hover:bg-slate-700'}`}>{emoji}</button>
                            ))}
                        </div>
                    </div>
                    <input type="text" value={petName} onChange={e => setPetName(e.target.value)} placeholder="ตั้งชื่อ..." maxLength={12} className="w-full bg-slate-800 border border-slate-600 rounded-md p-3 text-white text-center mb-6"/>
                    <button onClick={handleCreatePet} disabled={!selectedSpecies} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-4 rounded-md transition transform hover:scale-105 disabled:opacity-50">รับเลี้ยง EmojiMon</button>
                </div>
                 <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-lg p-8 shadow-xl min-h-[300px]">
                    <h3 className="text-2xl font-bold text-white mb-4">ข้อมูลสายพันธุ์</h3>
                     {!selectedSpecies ? <p className="text-center text-slate-500">ไม่สามารถโหลดข้อมูลสายพันธุ์ได้</p> :
                     (
                        <div className="space-y-4 animate-fade-in">
                            <div><p className="text-indigo-400 font-semibold">สายพันธุ์</p><p className="text-xl text-white font-bold">{selectedSpecies.speciesName}</p></div>
                            <div><p className="text-indigo-400 font-semibold">คำอธิบาย</p><p className="text-slate-300 text-sm">{selectedSpecies.description}</p></div>
                             <div><p className="text-indigo-400 font-semibold">ค่าสถานะเริ่มต้น</p>
                                <div className="grid grid-cols-3 gap-2 mt-2">
                                    {(Object.keys(selectedSpecies.baseStats) as Array<keyof PetStats>).map(key => (
                                        <div key={key} className="bg-slate-900/50 p-2 rounded-md text-center">
                                            <p className="text-sm text-slate-400">{STAT_ICONS[key]} {STAT_NAMES[key]}</p>
                                            <p className="font-bold text-white">{selectedSpecies.baseStats[key]}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                     )}
                </div>
            </div>
        );
    }
    
    const getStatusInfo = () => {
        switch (pet.status) {
            case 'idle':
                if (pet.currentHealth < pet.stats.hp * 0.3) return { text: "บาดเจ็บ", color: "text-red-400", icon: "🤕" };
                return { text: "ปกติ", color: "text-green-400", icon: "😊" };
            case 'recovering':
                return { text: "หมดสติ", color: "text-red-400 animate-pulse", icon: "💀" };
            case 'questing':
                 const minutes = Math.floor(timeLeft / 60000);
                 const seconds = Math.floor((timeLeft % 60000) / 1000).toString().padStart(2, '0');
                 return { text: `กำลังทำเควส (${minutes}:${seconds})`, color: "text-purple-400", icon: "🗺️" };
        }
    };
    
    const getPetAnimationClass = () => {
        if (isDeparting) return 'pet-departing-anim';
        switch (pet.status) {
            case 'questing': return 'pet-walking-anim';
            case 'idle': return 'pet-idle-bounce-anim';
            case 'recovering': return ''; // Stop animation
            default: return '';
        }
    };

    const statusInfo = getStatusInfo();

    const getLogColor = (type: QuestLogEntry['type']) => {
        switch(type) {
            case 'damage':
            case 'fail':
                return 'text-red-400';
            case 'success':
                return 'text-green-400';
            default:
                return 'text-slate-300';
        }
    };
    
    return (
        <>
        {isChangingBackground && (
            <BackgroundSelectionModal 
                homeBackgrounds={homeBackgrounds}
                defaultBackground={siteConfig.view_pets_background}
                onClose={() => setIsChangingBackground(false)}
                onSelect={(id) => {
                    updatePetState(p => ({ ...p, homeBackground: id }));
                    setIsChangingBackground(false);
                }}
            />
        )}
        {confirmingQuest && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                <div className="bg-slate-800 border border-red-500/50 rounded-lg p-6 shadow-xl w-full max-w-md relative text-center">
                    <h3 className="text-xl font-bold text-yellow-300 mb-4 flex items-center justify-center gap-2"><WarningIcon className="w-6 h-6"/>คำเตือน: เควสความเสี่ยงสูง</h3>
                    <p className="text-slate-300 mb-6">
                        เควส "{confirmingQuest.name}" (Lv. {confirmingQuest.recommendedLevel}) มีเลเวลสูงกว่าสัตว์เลี้ยงของคุณมาก (Lv. {pet?.level}) 
                        <br/>
                        มีความเสี่ยงสูงที่สัตว์เลี้ยงจะพ่ายแพ้และหมดสติ คุณต้องการดำเนินการต่อหรือไม่?
                    </p>
                    <div className="flex justify-center gap-4">
                        <button onClick={() => setConfirmingQuest(null)} className="bg-slate-600 hover:bg-slate-500 text-white font-bold py-2 px-6 rounded-md">ยกเลิก</button>
                        <button 
                            onClick={() => {
                                startQuest(confirmingQuest);
                                setConfirmingQuest(null);
                            }} 
                            className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-6 rounded-md"
                        >
                            ยืนยัน
                        </button>
                    </div>
                </div>
            </div>
        )}
        <div 
            className="grid grid-cols-1 lg:grid-cols-3 gap-8 bg-cover bg-center bg-no-repeat p-4 -m-4 rounded-lg transition-all duration-500"
            style={{ backgroundImage: `url('${currentBackground}')` }}
        >
            <div className="lg:col-span-1 bg-slate-800/70 backdrop-blur-sm border border-slate-700/50 rounded-lg p-6 shadow-xl flex flex-col items-center">
                 <div className="relative">
                    <div className={`text-9xl mb-4 transition-all duration-500 ${pet.status === 'recovering' ? 'opacity-50 grayscale' : ''} ${getPetAnimationClass()}`}>{pet.emoji}</div>
                    {pet.status === 'recovering' && (
                        <div className="absolute inset-0 flex items-center justify-center text-7xl text-red-500/80 animate-pulse" style={{textShadow: '0 0 8px black'}}>💀</div>
                    )}
                 </div>
                 {isDeparting ? (<div className="text-center py-8 flex-grow flex items-center justify-center"><p className="text-lg font-semibold text-white animate-pulse">กำลังออกเดินทาง...</p></div>) : (
                    <>
                        <div className="flex items-baseline gap-2"><h3 className="text-3xl font-bold text-white">{pet.name}</h3><span className="text-lg font-bold text-green-400">Lv. {pet.level}</span></div>
                        <p className="text-sm text-indigo-300">{pet.species.speciesName}</p>
                        <div className={`text-sm font-semibold mt-2 flex items-center gap-2 ${statusInfo.color}`}><span>{statusInfo.icon}</span><span>{statusInfo.text}</span></div>
                        
                        {pet.status === 'recovering' && pet.questLog && (
                            <div className="w-full bg-slate-900/50 p-3 my-4 rounded-lg h-32 flex flex-col">
                                <h4 className="text-center text-white font-semibold mb-2 flex-shrink-0">บันทึกการเดินทางล่าสุด</h4>
                                <div className="text-xs space-y-1 overflow-y-auto flex-grow pr-2 small-scrollbar" ref={(el) => el?.scrollTo(0, el.scrollHeight)}>
                                    {pet.questLog.map((log, i) => <p key={i} className={getLogColor(log.type)}>{log.text}</p>)}
                                </div>
                            </div>
                        )}

                        <div className="w-full space-y-4 mt-6">
                           <ProgressBar label="🌟 ค่าประสบการณ์" value={pet.exp} maxValue={pet.expToNextLevel} color="bg-green-500" />
                           <ProgressBar label="💖 พลังชีวิต" value={pet.currentHealth} maxValue={pet.stats.hp} color="bg-red-500" />
                           <ProgressBar label="🔮 มานา" value={pet.currentSp} maxValue={pet.stats.sp} color="bg-blue-500" />
                        </div>

                        {pet.status === 'idle' && (
                             <button onClick={() => setIsChangingBackground(true)} className="mt-4 bg-slate-700 hover:bg-slate-600 text-white font-bold py-2 px-4 rounded-md w-full">
                                เปลี่ยนพื้นหลัง
                            </button>
                        )}

                        <div className="w-full grid grid-cols-3 gap-3 mt-4">
                           <button onClick={handleFeed} disabled={coins < CARE_COSTS.FEED || pet.status !== 'idle'} className="bg-yellow-600/80 hover:bg-yellow-700 text-white font-bold py-2 rounded-md disabled:opacity-50 disabled:cursor-not-allowed">อาหาร ({CARE_COSTS.FEED})</button>
                           <button onClick={handlePlay} disabled={coins < CARE_COSTS.PLAY || pet.status !== 'idle'} className="bg-blue-600/80 hover:bg-blue-700 text-white font-bold py-2 rounded-md disabled:opacity-50 disabled:cursor-not-allowed">เล่นด้วย ({CARE_COSTS.PLAY})</button>
                           <button onClick={handleHeal} disabled={coins < CARE_COSTS.HEAL || pet.status === 'questing' || (pet.status === 'idle' && pet.currentHealth >= pet.stats.hp)} className="bg-red-600/80 hover:bg-red-700 text-white font-bold py-2 rounded-md disabled:opacity-50 disabled:cursor-not-allowed">รักษา ({CARE_COSTS.HEAL})</button>
                        </div>
                        <div className="w-full bg-slate-900/50 p-3 mt-4 rounded-lg">
                            <h4 className="text-center text-white font-semibold mb-2">ค่าสถานะ</h4>
                            <div className="grid grid-cols-3 gap-x-4 gap-y-2 text-sm">
                                {(Object.keys(pet.stats) as Array<keyof PetStats>).map(key => (
                                    <div key={key} className="flex items-center justify-between"><span className="text-slate-400">{STAT_ICONS[key]} {STAT_NAMES[key]}</span><span className="font-bold text-white">{pet.stats[key]}</span></div>
                                ))}
                            </div>
                        </div>
                        <div className="w-full bg-slate-900/50 p-3 mt-4 rounded-lg">
                            <h4 className="text-center text-white font-semibold mb-2">กระเป๋า</h4>
                            <div className="grid grid-cols-5 gap-2">
                                {pet.inventory.map((itemStack, index) => (
                                    <div key={index} onClick={() => itemStack && setSelectedItem({itemStack, index})} className={`relative aspect-square bg-slate-800 border border-slate-700 rounded-md flex items-center justify-center ${itemStack ? 'cursor-pointer hover:bg-slate-700' : ''}`} title={itemStack ? `${itemStack.item.name}: ${itemStack.item.description}` : 'ช่องว่าง'}>
                                        {itemStack ? (
                                            <>
                                                <span className="text-2xl">{itemStack.item.icon}</span>
                                                {itemStack.quantity > 1 && (
                                                    <div className="absolute bottom-0 right-0 bg-slate-900 text-white text-[10px] font-bold px-1 rounded-tl-md">
                                                        {itemStack.quantity}
                                                    </div>
                                                )}
                                            </>
                                        ) : (
                                            <span className="text-slate-600 text-lg"></span>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </>
                 )}
            </div>

            <div className="lg:col-span-2 bg-slate-800/70 backdrop-blur-sm border border-slate-700/50 rounded-lg p-6 shadow-xl flex flex-col">
                {pet.status === 'questing' ? (
                     <div className="flex flex-col h-full text-white animate-fade-in pt-8 relative">
                        <div className="absolute top-4 right-4 z-20">
                            <button 
                                onClick={handleRecallPet}
                                disabled={points < 50}
                                className="bg-red-800/80 hover:bg-red-700/80 text-white font-bold py-2 px-4 rounded-lg transition-colors text-sm disabled:opacity-50 flex items-center gap-1.5"
                                title="เรียกกลับทันที (ใช้ 50 แต้ม และจะไม่ได้รับรางวัล)"
                            >
                                เรียกกลับ <PointIcon className="w-4 h-4 text-cyan-200"/> 50
                            </button>
                        </div>

                        <h3 className="text-2xl font-bold mb-2 text-center">{statusInfo.text}</h3>
                        <p className="text-lg text-slate-300 mb-6 text-center">{pet.questName}</p>
                        
                        <div className="w-full max-w-lg mx-auto">
                            <div className="flex justify-between text-sm text-slate-400 mb-2">
                                <span>เริ่มต้น</span>
                                <span>{(pet.questProgress || 0).toFixed(0)}%</span>
                                <span>สำเร็จ</span>
                            </div>
                            <div className="w-full bg-slate-900/50 rounded-full h-6 p-1 border border-slate-700 relative overflow-hidden">
                                <div className="relative h-full bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full transition-all duration-1000 ease-linear" style={{ width: `${pet.questProgress || 0}%` }}>
                                     <div className="absolute top-1/2 -right-4 -translate-y-1/2 text-2xl pet-walking-anim-small">
                                        {pet.emoji}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {pet.questLog && (
                            <div className="w-full max-w-lg mx-auto mt-8 bg-slate-900/50 p-4 rounded-lg flex-grow flex flex-col">
                                <h4 className="text-center text-white font-semibold mb-2 flex-shrink-0">บันทึกการเดินทาง</h4>
                                <div className="text-sm space-y-1 overflow-y-auto flex-grow pr-2 small-scrollbar" ref={(el) => el?.scrollTo(0, el.scrollHeight)}>
                                    {pet.questLog.map((log, i) => <p key={i} className={getLogColor(log.type)}>{log.text}</p>)}
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    <>
                         <div className="flex justify-between items-center mb-4">
                            <h3 className="text-2xl font-bold text-white">เควส</h3>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={handleRefreshQuests}
                                    disabled={points < 50 || isFetchingQuests}
                                    className="text-sm bg-slate-700 hover:bg-slate-600 px-3 py-2 rounded-md disabled:opacity-50 flex items-center gap-1.5"
                                    title="ใช้ 50 แต้มเพื่อสุ่มเควสใหม่ทันที"
                                >
                                    รีเฟรชทันที <PointIcon className="w-4 h-4 text-cyan-400" /> 50
                                </button>
                                <div className="text-sm text-slate-400 bg-slate-900/50 px-3 py-1 rounded-full">
                                    รีเฟรชใน: <span className="font-bold text-white">{questRefreshTimeLeft}</span>
                                </div>
                            </div>
                         </div>
                         <div className="space-y-4 flex-grow overflow-y-auto pr-2">
                            {isFetchingQuests ? <p className="text-center text-slate-400 animate-pulse">กำลังสุ่มเควสใหม่...</p> :
                             currentQuests.map((quest, index) => {
                                const isTooHard = quest.recommendedLevel > pet.level + 10;
                                const isEasy = quest.recommendedLevel < pet.level - 10;
                                const canTakeQuest = pet.status === 'idle' && !isDeparting;
                                const borderColorClass = isTooHard ? 'border-red-500/50' : isEasy ? 'border-green-500/50' : 'border-slate-700';
                                const levelColorClass = isTooHard ? 'text-red-400' : isEasy ? 'text-green-400' : 'text-yellow-400';
                                
                                return (
                                    <div key={index} className={`bg-slate-900/50 p-4 rounded-lg border ${borderColorClass} flex flex-col sm:flex-row justify-between sm:items-center gap-4 transition-colors`}>
                                        <div>
                                            <p className="font-bold text-white">{quest.name} <span className={`font-semibold ${levelColorClass}`}>(Lv. {quest.recommendedLevel})</span></p>
                                            <p className="text-sm text-slate-400">{quest.description}</p>
                                            <div className="text-xs text-slate-300 mt-2 flex flex-wrap items-center gap-x-4 gap-y-1">
                                                <span>🕒 {(quest.duration / 60000)} นาที</span>
                                                <span>💰 {quest.reward} เหรียญ</span>
                                                <span>✨ {quest.pointsReward} แต้ม</span>
                                                {quest.specialRewards && (
                                                    <span className="text-cyan-300 font-semibold">
                                                        มีโอกาสได้รับ: {quest.specialRewards.map(r => r === 'CardFragment' ? '🧩 เศษการ์ด' : r === 'CardPack' ? '🎁 ซองการ์ด' : '').join(', ')}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <button onClick={() => handleSendQuest(quest)} disabled={!canTakeQuest} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-md disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0">
                                            เริ่ม
                                        </button>
                                    </div>
                                )
                            })}
                         </div>
                    </>
                )}
            </div>
             {selectedItem && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setSelectedItem(null)}>
                    <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 shadow-xl w-full max-w-sm relative text-center" onClick={(e) => e.stopPropagation()}>
                        <div className="text-6xl mb-4">{selectedItem.itemStack.item.icon}</div>
                        <h3 className="text-xl font-bold text-white">{selectedItem.itemStack.item.name} <span className="text-base font-normal text-slate-400">(x{selectedItem.itemStack.quantity})</span></h3>
                        <p className="text-slate-400 text-sm mt-2 mb-4">{selectedItem.itemStack.item.description}</p>
                        <div className="flex justify-center gap-4">
                            {selectedItem.itemStack.item.type === 'consumable' && (
                                <button onClick={() => handleUseItem(selectedItem.itemStack, selectedItem.index)} className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-md">ใช้ 1 ชิ้น</button>
                            )}
                             <button onClick={() => handleSellItem(selectedItem.itemStack, selectedItem.index)} className="bg-yellow-600 hover:bg-yellow-700 text-white font-bold py-2 px-4 rounded-md">ขาย 1 ชิ้น ({selectedItem.itemStack.item.value || 0} เหรียญ)</button>
                        </div>
                    </div>
                </div>
            )}
            <style>{`
                @keyframes pet-idle-bounce {
                  0%, 100% { transform: translateY(0); }
                  50% { transform: translateY(-10px); }
                }
                .pet-idle-bounce-anim { animation: pet-idle-bounce 1.2s ease-in-out infinite; }

                @keyframes pet-walk {
                  0%, 100% { transform: translateY(0) rotate(-2deg); }
                  50% { transform: translateY(-5px) rotate(2deg); }
                }
                .pet-walking-anim { animation: pet-walk 0.8s ease-in-out infinite; }
                
                 @keyframes pet-depart {
                    0% { transform: translateX(0) scale(1); opacity: 1; }
                    100% { transform: translateX(200px) scale(0); opacity: 0; }
                }
                .pet-departing-anim { animation: pet-depart 1.2s ease-in forwards; }

                @keyframes pet-walk-small {
                  0%, 100% { transform: translateY(0) rotate(-3deg); }
                  50% { transform: translateY(-3px) rotate(3deg); }
                }
                .pet-walking-anim-small { animation: pet-walk-small 0.8s ease-in-out infinite; }

                .animate-fade-in { animation: fadeIn 0.5s ease-in-out; } @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
                .small-scrollbar::-webkit-scrollbar { width: 4px; }
                .small-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .small-scrollbar::-webkit-scrollbar-thumb { background: #475569; border-radius: 10px; }
            `}</style>
        </div>
        </>
    );
};

export default PetView;