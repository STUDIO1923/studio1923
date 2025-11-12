import React, { useState, useMemo, useEffect } from 'react';
import { Card, Dungeon, ActiveDungeonQuest, PetData, Language, RARITY_DATA, DungeonLogEntry, InventoryItem, DungeonQuestOutcome, QuestCompletionData, DungeonLogType } from '../types';
import { DUNGEON_DATABASE } from '../services/dungeonDatabase';
import { CollectionIcon } from './icons/CollectionIcon';
import { CoinIcon } from './icons/CoinIcon';
import { PointIcon } from './icons/PointIcon';

interface DungeonViewProps {
  userCards: Card[];
  pet: PetData | null;
  activeQuests: ActiveDungeonQuest[];
  onStartQuest: (dungeon: Dungeon, party: Card[]) => void;
  onClaimRewards: (questId: string) => Promise<QuestCompletionData | undefined>;
  language: Language;
  siteConfig: Record<string, string>;
}

const QuestLogModal: React.FC<{
    data: QuestCompletionData;
    onClose: () => void;
    language: Language;
}> = ({ data, onClose, language }) => {

    const getLogColorClass = (type: DungeonLogType) => {
        switch (type) {
            case 'damage':
            case 'fail':
            case 'destroyed':
                return 'text-red-400';
            case 'trap':
            case 'combat':
                return 'text-yellow-400';
            case 'success':
            case 'reward':
                return 'text-green-400';
            case 'info':
            case 'discovery':
            default:
                return 'text-blue-400';
        }
    };

    const outcomeSurvived = data.outcomes.filter(o => o.status === 'survived');
    const outcomeDestroyed = data.outcomes.filter(o => o.status === 'destroyed');

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <h3 className="text-2xl font-bold text-white mb-4 flex-shrink-0">บันทึกการเดินทาง: {data.dungeonName}</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 overflow-y-auto">
                    {/* Log Column */}
                    <div className="md:col-span-2 bg-slate-900/50 p-4 rounded-lg">
                        <h4 className="font-bold text-white mb-2">เหตุการณ์ที่เกิดขึ้น</h4>
                        <div className="space-y-1 text-sm h-96 overflow-y-auto pr-2">
                            {data.log.map((entry, index) => (
                                <p key={index} className={getLogColorClass(entry.type)}>{entry.text}</p>
                            ))}
                        </div>
                    </div>
                    {/* Summary Column */}
                    <div className="md:col-span-1 bg-slate-900/50 p-4 rounded-lg space-y-4">
                        <div>
                            <h4 className="font-bold text-white mb-2">ผลลัพธ์ของทีม</h4>
                            <div className="space-y-1 text-sm">
                                {outcomeSurvived.map(o => <p key={o.cardId} className="text-green-400 truncate">✔ {o.cardName[language]}</p>)}
                                {outcomeDestroyed.map(o => <p key={o.cardId} className="text-red-400 truncate">❌ {o.cardName[language]}</p>)}
                            </div>
                        </div>
                         <div>
                            <h4 className="font-bold text-white mb-2">ไอเท็มที่ได้รับ</h4>
                            {data.rewards.length === 0 ? <p className="text-sm text-slate-500">ไม่ได้รับไอเท็ม</p> : (
                                <div className="flex flex-wrap gap-2">
                                    {data.rewards.map(item => <span key={item.id} className="text-3xl" title={item.name}>{item.icon}</span>)}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
                 <div className="flex justify-end mt-6 flex-shrink-0">
                    <button onClick={onClose} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-6 rounded-md">ปิด</button>
                </div>
            </div>
        </div>
    );
};


const PartySelectionModal: React.FC<{
    dungeon: Dungeon;
    availableCards: Card[];
    onClose: () => void;
    onStart: (party: Card[]) => void;
    language: Language;
}> = ({ dungeon, availableCards, onClose, onStart, language }) => {
    const [selectedCardIds, setSelectedCardIds] = useState<Set<string>>(new Set());
    
    const { uniqueCards, cardCounts } = useMemo(() => {
        const counts = new Map<string, number>();
        const uniqueMap = new Map<string, Card>();
        
        availableCards.forEach(card => {
            counts.set(card.id, (counts.get(card.id) || 0) + 1);
            if (!uniqueMap.has(card.id)) {
                uniqueMap.set(card.id, card);
            }
        });
        
        return { uniqueCards: Array.from(uniqueMap.values()), cardCounts: counts };
    }, [availableCards]);

    const party = useMemo(() => uniqueCards.filter(c => selectedCardIds.has(c.id)), [uniqueCards, selectedCardIds]);
    
    const avgPartyLevel = useMemo(() => {
        if (party.length === 0) return 0;
        const totalPower = party.reduce((sum, card) => sum + (card.stats.attack + card.stats.defense + card.stats.speed + card.stats.hp) / 4, 0);
        return Math.round(totalPower / 5);
    }, [party]);

    const toggleCardSelection = (cardId: string) => {
        const newSelection = new Set(selectedCardIds);
        if (newSelection.has(cardId)) {
            newSelection.delete(cardId);
        } else if (newSelection.size < 5) {
            newSelection.add(cardId);
        }
        setSelectedCardIds(newSelection);
    };

    const getRecommendation = () => {
        const diff = dungeon.levelRange.min - avgPartyLevel;
        if (diff > 20) return { text: 'อันตรายมาก!', color: 'text-red-400' };
        if (diff > 10) return { text: 'ท้าทาย', color: 'text-yellow-400' };
        return { text: 'เหมาะสม', color: 'text-green-400' };
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 shadow-xl w-full max-w-4xl relative" onClick={e => e.stopPropagation()}>
                <button type="button" onClick={onClose} className="absolute top-3 right-3 text-slate-400 hover:text-white text-2xl">&times;</button>
                <h3 className="text-xl font-bold text-white mb-1">เลือกทีมสำหรับ: <span className="text-indigo-400">{dungeon.name}</span></h3>
                <p className="text-sm text-slate-400 mb-4">เลเวลแนะนำ: {dungeon.levelRange.min}-{dungeon.levelRange.max > 100 ? '100+' : dungeon.levelRange.max} | เลือกได้สูงสุด 5 ใบ</p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-2 bg-slate-900/50 p-4 rounded-lg h-[60vh] overflow-y-auto">
                        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4">
                            {uniqueCards.map(card => {
                                const rarityInfo = RARITY_DATA.find(r => r.name === card.rarity);
                                const count = cardCounts.get(card.id) || 1;
                                const isSelected = selectedCardIds.has(card.id);

                                return (
                                <button key={card.id} onClick={() => toggleCardSelection(card.id)} className={`relative aspect-[2.5/3.5] rounded-lg overflow-hidden border-2 transition-all duration-200 group ${isSelected ? 'border-indigo-500 scale-105 shadow-lg' : 'border-transparent hover:border-slate-500'}`}>
                                    <img src={card.frontImage} alt={card.name[language]} className="w-full h-full object-cover"/>
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-1 flex flex-col justify-end text-white text-[10px] leading-tight">
                                        <p style={{color: rarityInfo?.color}} className="font-semibold text-xs">{rarityInfo?.thaiName}</p>
                                        <p className="font-bold truncate">{card.name[language]}</p>
                                        <div className="grid grid-cols-2 text-left text-[9px] mt-1 opacity-90">
                                            <span>HP: {card.stats.hp}</span>
                                            <span>ATK: {card.stats.attack}</span>
                                            <span>DEF: {card.stats.defense}</span>
                                            <span>SPD: {card.stats.speed}</span>
                                        </div>
                                    </div>
                                    {count > 1 && <div className="absolute top-1 right-1 bg-black/70 text-white text-[10px] font-bold px-1.5 rounded-full z-10">x{count}</div>}
                                    {isSelected && <div className="absolute inset-0 bg-indigo-500/30"></div>}
                                </button>
                            )})}
                        </div>
                    </div>
                    <div className="md:col-span-1 bg-slate-900/50 p-4 rounded-lg flex flex-col">
                        <h4 className="font-bold text-white mb-2">ทีมที่เลือก ({party.length}/5)</h4>
                        <div className="flex-grow space-y-2 overflow-y-auto">
                            {party.length === 0 && <div className="text-center text-slate-500 pt-8">เลือกการ์ดเพื่อจัดทีม</div>}
                            {party.map(c => <div key={c.id} className="text-sm text-slate-300 bg-slate-800 p-2 rounded truncate">{c.name[language]}</div>)}
                        </div>
                        <div className="mt-4 pt-4 border-t border-slate-700">
                             <div className="flex justify-between text-sm mb-2">
                                <span className="text-slate-400">เลเวลทีมโดยเฉลี่ย:</span>
                                <span className="font-bold text-white">{avgPartyLevel}</span>
                            </div>
                            <div className="flex justify-between text-sm mb-4">
                                <span className="text-slate-400">คำแนะนำ:</span>
                                <span className={`font-bold ${getRecommendation().color}`}>{getRecommendation().text}</span>
                            </div>
                            <button onClick={() => onStart(party)} disabled={party.length === 0} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-md disabled:opacity-50">
                                เริ่มดันเจี้ยน
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const ActiveQuest: React.FC<{ quest: ActiveDungeonQuest, onClaim: (quest: ActiveDungeonQuest) => void, language: Language }> = ({ quest, onClaim, language }) => {
    const [timeLeft, setTimeLeft] = useState('');
    const [logVisible, setLogVisible] = useState(false);

    useEffect(() => {
        const timer = setInterval(() => {
            const now = Date.now();
            const diff = quest.endTime - now;
            if (diff <= 0) {
                setTimeLeft('สำเร็จ!');
                clearInterval(timer);
            } else {
                const h = Math.floor(diff / 3600000).toString().padStart(2, '0');
                const m = Math.floor((diff % 3600000) / 60000).toString().padStart(2, '0');
                const s = Math.floor((diff % 60000) / 1000).toString().padStart(2, '0');
                setTimeLeft(`${h}:${m}:${s}`);
            }
        }, 1000);
        return () => clearInterval(timer);
    }, [quest.endTime]);
    
    const logToShow = useMemo(() => {
        if (!quest.log) return [];
        const entriesToShow = Math.floor(quest.log.length * (quest.progress / 100));
        return quest.log.slice(0, entriesToShow);
    }, [quest.log, quest.progress]);

    const isFinished = Date.now() >= quest.endTime;

    return (
        <div className="bg-slate-800/70 p-4 rounded-lg border border-slate-700 space-y-4">
            <div>
                <h3 className="font-bold text-white text-lg">{quest.dungeon.name}</h3>
                <p className="text-sm text-slate-400">กำลังดำเนินเควส...</p>
            </div>
             <div className="w-full bg-slate-900 rounded-full h-4"><div className="bg-indigo-500 h-4 rounded-full" style={{ width: `${quest.progress}%` }}></div></div>
             <div className="flex justify-between items-center">
                 <div className="flex -space-x-4">
                    {quest.party.slice(0, 5).map(card => <img key={card.id} src={card.frontImage} className="w-10 h-10 rounded-full border-2 border-slate-900 object-cover" title={card.name[language]} />)}
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={() => setLogVisible(!logVisible)} className="text-sm bg-slate-700 hover:bg-slate-600 px-3 py-2 rounded-md">
                        {logVisible ? 'ซ่อน' : 'ดู'}บันทึก
                    </button>
                    {isFinished ? (
                        <button onClick={() => onClaim(quest)} className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-md animate-pulse">รับรางวัล</button>
                    ) : (
                        <div className="text-lg font-mono text-white bg-slate-900/50 px-3 py-1 rounded-md">{timeLeft}</div>
                    )}
                </div>
             </div>
             {logVisible && (
                 <div className="bg-slate-900/50 p-3 rounded-md h-32 overflow-y-auto text-sm space-y-1">
                    {logToShow.map((entry, index) => <p key={index} style={{ color: quest.logColor }}>{entry.text}</p>)}
                 </div>
             )}
        </div>
    );
};


const DungeonView: React.FC<DungeonViewProps> = ({ userCards, pet, activeQuests, onStartQuest, onClaimRewards, language, siteConfig }) => {
    const [selectedDungeon, setSelectedDungeon] = useState<Dungeon | null>(null);
    const [completedQuestData, setCompletedQuestData] = useState<QuestCompletionData | null>(null);

    const availableCards = useMemo(() => {
        const busyCardIds = new Set(activeQuests.flatMap(q => q.party.map(c => c.id)));
        return userCards.filter(card => !busyCardIds.has(card.id));
    }, [userCards, activeQuests]);

    const handleClaimAndShowLog = async (questToClaim: ActiveDungeonQuest) => {
        const result = await onClaimRewards(questToClaim.questId);
        if(result) {
            setCompletedQuestData(result);
        }
    };

    const activeDungeonIds = useMemo(() => new Set(activeQuests.map(q => q.dungeon.id)), [activeQuests]);
    const canStartNewQuest = activeQuests.length < 3;
    
    return (
        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-lg p-6 shadow-xl max-w-6xl mx-auto space-y-8">
            {selectedDungeon && (
                <PartySelectionModal 
                    dungeon={selectedDungeon}
                    availableCards={availableCards}
                    onClose={() => setSelectedDungeon(null)}
                    onStart={(party) => {
                        onStartQuest(selectedDungeon, party);
                        setSelectedDungeon(null);
                    }}
                    language={language}
                />
            )}

            {completedQuestData && (
                <QuestLogModal data={completedQuestData} onClose={() => setCompletedQuestData(null)} language={language} />
            )}
            
            <div>
                <h2 className="text-3xl font-bold text-white tracking-wide mb-6">ดันเจี้ยน ({activeQuests.length}/3 ทีม)</h2>
                {activeQuests.length > 0 && (
                    <div className="mb-8 space-y-4">
                        <h3 className="text-xl font-semibold text-slate-300">เควสที่กำลังดำเนินอยู่</h3>
                        {activeQuests.map(quest => <ActiveQuest key={quest.questId} quest={quest} onClaim={handleClaimAndShowLog} language={language} />)}
                    </div>
                )}

                <div className="space-y-4">
                    <h3 className="text-xl font-semibold text-slate-300">เลือกดันเจี้ยน</h3>
                    {!canStartNewQuest && (
                        <div className="bg-yellow-900/50 border border-yellow-700 text-yellow-300 text-center p-3 rounded-lg">
                            คุณส่งทีมออกสำรวจครบ 3 ทีมแล้ว กรุณารอทีมใดทีมหนึ่งกลับมาก่อน
                        </div>
                    )}
                    {DUNGEON_DATABASE.map(dungeon => {
                        const isBusy = activeDungeonIds.has(dungeon.id);
                        const isDisabled = isBusy || !canStartNewQuest;
                        const backgroundUrl = siteConfig[`dungeon_bg_${dungeon.id}`];

                        return (
                        <div 
                            key={dungeon.id} 
                            className={`p-4 rounded-lg border border-slate-700 flex flex-col sm:flex-row justify-between items-center gap-4 relative overflow-hidden bg-cover bg-center transition-opacity ${isDisabled ? 'opacity-60' : ''}`}
                            style={backgroundUrl ? { backgroundImage: `url('${backgroundUrl}')` } : { backgroundColor: 'rgb(15 23 42 / 0.5)'}}
                        >
                            <div className="absolute inset-0 bg-slate-900/70"></div>
                            <div className="relative z-10 flex-grow">
                                <h4 className="font-bold text-white text-lg">{dungeon.name}</h4>
                                <p className="text-sm text-slate-400">{dungeon.description}</p>
                                <div className="text-xs text-slate-300 mt-2 flex items-center gap-4">
                                    <span>🕒 {(dungeon.duration / 60000)} นาที</span>
                                    <span className={dungeon.levelRange.min >= 100 ? 'text-red-400 font-bold' : 'text-yellow-400'}>🌟 Lv. {dungeon.levelRange.min}{dungeon.levelRange.max > 100 ? '+' : `-${dungeon.levelRange.max}`}</span>
                                </div>
                            </div>
                            <button onClick={() => setSelectedDungeon(dungeon)} disabled={isDisabled} className="relative z-10 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-6 rounded-md transition flex-shrink-0 disabled:bg-slate-600 disabled:cursor-not-allowed">
                                {isBusy ? 'กำลังดำเนินการ' : 'เลือกทีม'}
                            </button>
                        </div>
                    )})}
                </div>
            </div>
        </div>
    );
};

export default DungeonView;