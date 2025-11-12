import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { CardRarity, RARITY_DATA, Card, ELEMENTS_DATA, CardPack, MarketListing, SEASON_CONFIG, Language, TRIBES_DATA } from '../types';
import * as cardService from '../services/cardService';
import * as packService from '../services/packService';
import * as marketService from '../services/marketService';
import * as configService from '../services/configService';
import { CoinIcon } from './icons/CoinIcon';
import { PointIcon } from './icons/PointIcon';

interface ListPackModalProps {
    pack: CardPack;
    maxCount: number;
    onClose: () => void;
    onList: (pack: CardPack, price: { coins?: number; points?: number }, quantity: number) => void;
}

const ListPackModal: React.FC<ListPackModalProps> = ({ pack, maxCount, onClose, onList }) => {
    const [coins, setCoins] = useState('');
    const [points, setPoints] = useState('');
    const [quantity, setQuantity] = useState('1');

    const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = parseInt(e.target.value, 10);
        if (isNaN(value) || value < 1) {
            setQuantity('');
        } else if (value > maxCount) {
            setQuantity(maxCount.toString());
        } else {
            setQuantity(value.toString());
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const coinPrice = parseInt(coins, 10);
        const pointPrice = parseInt(points, 10);
        const quant = parseInt(quantity, 10);

        if (isNaN(coinPrice) && isNaN(pointPrice)) {
            alert("กรุณากำหนดราคาอย่างน้อยหนึ่งอย่าง");
            return;
        }
        if (isNaN(quant) || quant < 1) {
            alert('กรุณาระบุจำนวนที่ถูกต้อง');
            return;
        }
        onList(pack, { coins: isNaN(coinPrice) ? undefined : coinPrice, points: isNaN(pointPrice) ? undefined : pointPrice }, quant);
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <form onSubmit={handleSubmit} className="bg-slate-800 border border-slate-700 rounded-lg p-6 shadow-xl w-full max-w-md relative">
                <button type="button" onClick={onClose} className="absolute top-3 right-3 text-slate-400 hover:text-white text-2xl">&times;</button>
                <h3 className="text-xl font-bold text-white mb-4">ตั้งราคาขายซองการ์ด</h3>
                <div className="flex gap-4 items-start">
                    <div className="w-1/3 flex-shrink-0">
                        <img src={pack.image} alt={pack.name} className="w-full object-contain" />
                    </div>
                    <div className="flex-grow space-y-4">
                        <p className="font-semibold text-white">{pack.name}</p>
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2 flex items-center gap-2"><CoinIcon className="w-5 h-5 text-yellow-400"/> ราคา (เหรียญ)</label>
                            <input type="number" value={coins} onChange={e => setCoins(e.target.value)} min="0" className="w-full bg-slate-900 border border-slate-600 rounded-md p-2 text-white" placeholder="ไม่บังคับ"/>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2 flex items-center gap-2"><PointIcon className="w-5 h-5 text-cyan-400"/> ราคา (แต้ม)</label>
                            <input type="number" value={points} onChange={e => setPoints(e.target.value)} min="0" className="w-full bg-slate-900 border border-slate-600 rounded-md p-2 text-white" placeholder="ไม่บังคับ"/>
                        </div>
                         <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">จำนวน (สูงสุด: {maxCount})</label>
                            <input type="number" value={quantity} onChange={handleQuantityChange} min="1" max={maxCount} className="w-full bg-slate-900 border border-slate-600 rounded-md p-2 text-white" required/>
                        </div>
                    </div>
                </div>
                <div className="flex justify-end gap-3 pt-6">
                    <button type="button" onClick={onClose} className="bg-slate-600 hover:bg-slate-500 text-white font-bold py-2 px-4 rounded-md">ยกเลิก</button>
                    <button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-md">ยืนยันการขาย</button>
                </div>
            </form>
        </div>
    );
};

interface CardPackOpeningViewProps {
    nickname: string;
    userPacks: number[]; // Array of season IDs
    onPackOpened: (cards: Card[], season: number) => void;
    onPacksChange: (newPacks: number[]) => void;
    onBack: () => void;
    addNotification: (message: string, type: 'success' | 'error') => void;
    language: Language;
    userCardCollection: Card[];
}

const CardTag: React.FC<{ isNew: boolean }> = ({ isNew }) => {
    if (isNew) {
        return <div className="absolute top-1 right-1 bg-cyan-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full z-20 animate-pulse">NEW</div>
    }
    return <div className="absolute top-1 right-1 bg-slate-900/80 text-slate-300 text-[10px] font-bold px-2 py-0.5 rounded-full z-20">DUPE</div>
};

const RARE_THRESHOLDS: CardRarity[] = ['Super Rare', 'Ultra Rare', 'Ultimate Rare', 'Secret Rare', 'Parallel Rare', 'Legendary Rare'];

const RARITY_PROBABILITIES: { rarity: CardRarity, chance: number }[] = [
    { rarity: 'Common', chance: 70 },
    { rarity: 'Rare', chance: 24.9 },
    { rarity: 'Super Rare', chance: 4 },
    { rarity: 'Ultra Rare', chance: 0.8 },
    { rarity: 'Ultimate Rare', chance: 0.2 },
    { rarity: 'Secret Rare', chance: 0.07 },
    { rarity: 'Parallel Rare', chance: 0.02 },
    { rarity: 'Legendary Rare', chance: 0.01 },
];
const CUMULATIVE_CHANCES = RARITY_PROBABILITIES.reduce((acc, current, index) => {
    const prevChance = index > 0 ? acc[index-1].cumulative : 0;
    acc.push({ rarity: current.rarity, cumulative: prevChance + current.chance });
    return acc;
}, [] as { rarity: CardRarity, cumulative: number }[]);


const CardPackOpeningView: React.FC<CardPackOpeningViewProps> = ({ nickname, userPacks, onPackOpened, onPacksChange, onBack, addNotification, language, userCardCollection }) => {
    const [viewState, setViewState] = useState<'inventory' | 'opening' | 'revealing' | 'finished'>('inventory');
    const [allCards, setAllCards] = useState<Card[]>([]);
    const [allPackData, setAllPackData] = useState<CardPack[]>([]);
    const [openingPack, setOpeningPack] = useState<CardPack | null>(null);
    const [openedCardsInfo, setOpenedCardsInfo] = useState<{ card: Card, isNew: boolean }[]>([]);
    const [revealedIndices, setRevealedIndices] = useState<number[]>([]);
    const [isRevealingAll, setIsRevealingAll] = useState(false);
    const [packToSell, setPackToSell] = useState<{ pack: CardPack; count: number } | null>(null);
    const revealIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const [globalCardBack, setGlobalCardBack] = useState('');

    const [selectedCardForDetail, setSelectedCardForDetail] = useState<Card | null>(null);
    const [isCardFlipped, setIsCardFlipped] = useState(false);

    // Grid reveal states
    const [rareCardToShow, setRareCardToShow] = useState<Card | null>(null);
    const [isAutoFlipping, setIsAutoFlipping] = useState(false);
    const autoFlipIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const existingCardIds = useMemo(() => {
        const idSet = new Set<string>();
        userCardCollection.forEach(card => idSet.add(card.id));
        return idSet;
    }, [userCardCollection]);

    useEffect(() => {
        const loadInitialData = async () => {
            try {
                const [cards, packs, config] = await Promise.all([
                    cardService.getAllCards(),
                    packService.getAllPacks(),
                    configService.getConfig()
                ]);
                setAllCards(cards);
                setAllPackData(packs);
                setGlobalCardBack(config.global_card_back_image);
            } catch (error) {
                console.error("Failed to load data for pack opening:", error);
            }
        };
        loadInitialData();
    }, []);
    
    useEffect(() => {
        return () => {
            if (revealIntervalRef.current) clearInterval(revealIntervalRef.current);
            if (autoFlipIntervalRef.current) clearInterval(autoFlipIntervalRef.current);
        };
    }, []);

    const clearAutoFlipInterval = useCallback(() => {
        if (autoFlipIntervalRef.current) {
            clearInterval(autoFlipIntervalRef.current);
            autoFlipIntervalRef.current = null;
        }
    }, []);

    useEffect(() => {
        if (viewState === 'revealing' && openedCardsInfo.length > 5 && isAutoFlipping && !rareCardToShow) {
            autoFlipIntervalRef.current = setInterval(() => {
                setRevealedIndices(currentRevealed => {
                    const nextIndex = openedCardsInfo.findIndex((_, i) => !currentRevealed.includes(i));
                    if (nextIndex === -1) {
                        clearAutoFlipInterval();
                        setIsAutoFlipping(false);
                        setTimeout(() => setViewState('finished'), 1000);
                        return currentRevealed;
                    }

                    const { card } = openedCardsInfo[nextIndex];
                    const isRare = RARE_THRESHOLDS.includes(card.rarity);
                    
                    if (isRare) {
                        clearAutoFlipInterval();
                        setIsAutoFlipping(false);
                        setRareCardToShow(card);
                    }
                    return [...currentRevealed, nextIndex];
                });
            }, 400); // Flip speed
        } else {
            clearAutoFlipInterval();
        }
        return clearAutoFlipInterval;
    }, [viewState, openedCardsInfo, isAutoFlipping, rareCardToShow, clearAutoFlipInterval]);

    const handleContinueOpening = () => {
        setRevealedIndices(current => [...current, openedCardsInfo.findIndex(info => info.card.id === rareCardToShow?.id)]);
        setRareCardToShow(null);
        setIsAutoFlipping(true);
    };

    const handleSkipAnimation = () => {
        clearAutoFlipInterval();
        setIsAutoFlipping(false);
        setRareCardToShow(null);
        const allIndices = openedCardsInfo.map((_, i) => i);
        setRevealedIndices(allIndices);
        setTimeout(() => setViewState('finished'), 500);
    };

    const userPackCounts = useMemo(() => {
        const counts = new Map<number, number>();
        userPacks.forEach(seasonId => {
            counts.set(seasonId, (counts.get(seasonId) || 0) + 1);
        });
        return Array.from(counts.entries()).sort((a, b) => a[0] - b[0]);
    }, [userPacks]);

    const handleOpenPackClick = (pack: CardPack, count: number) => {
        if (allCards.length === 0) {
            addNotification("ไม่มีการ์ดในระบบ", "error");
            return;
        }
        setOpeningPack(pack);
        
        const seasonCards = allCards.filter(c => c.season === pack.id);
        const cardsByRarity = new Map<CardRarity, Card[]>();
        RARITY_DATA.forEach(r => cardsByRarity.set(r.name, []));
        seasonCards.forEach(c => {
            cardsByRarity.get(c.rarity)?.push(c);
        });

        const getRandomCard = (forcedRarity?: CardRarity): Card => {
            let chosenRarity: CardRarity = 'Common';
            if (forcedRarity) {
                chosenRarity = forcedRarity;
            } else {
                const rand = Math.random() * 100;
                for (const chance of CUMULATIVE_CHANCES) {
                    if (rand < chance.cumulative) {
                        chosenRarity = chance.rarity;
                        break;
                    }
                }
            }
            
            const availableCards = cardsByRarity.get(chosenRarity);
            if (availableCards && availableCards.length > 0) {
                return availableCards[Math.floor(Math.random() * availableCards.length)];
            }
            // Fallback to Common if no card of the chosen rarity exists
            const commonCards = cardsByRarity.get('Common')!;
            return commonCards[Math.floor(Math.random() * commonCards.length)];
        };

        const allNewCards: Card[] = [];
        for (let i = 0; i < count; i++) {
            const packContents: Card[] = [];
            let hasRareOrBetter = false;
            
            // Draw 4 cards randomly
            for (let j = 0; j < 4; j++) {
                const card = getRandomCard();
                packContents.push(card);
                if (RARITY_DATA.findIndex(r => r.name === card.rarity) >= 1) { // 1 is index of 'Rare'
                    hasRareOrBetter = true;
                }
            }
            
            // Draw 5th card with pity mechanic
            if (hasRareOrBetter) {
                packContents.push(getRandomCard());
            } else {
                packContents.push(getRandomCard('Rare'));
            }
            allNewCards.push(...packContents);
        }
        
        const combinedIdsForThisPack = new Set(existingCardIds);
        const cardsWithStatus = allNewCards.map(card => {
            const isNew = !combinedIdsForThisPack.has(card.id);
            combinedIdsForThisPack.add(card.id);
            return { card, isNew };
        });
        
        const shuffledCardsWithStatus = cardsWithStatus.sort(() => Math.random() - 0.5);
        setOpenedCardsInfo(shuffledCardsWithStatus);

        setRevealedIndices([]);
        setRareCardToShow(null);
        setIsRevealingAll(false);
        
        if (count === 1) {
            setViewState('opening');
            setTimeout(() => setViewState('revealing'), 1500);
        } else {
            setIsAutoFlipping(true);
            setViewState('revealing');
        }
    };

    const handleRevealCard = (index: number) => {
        if (viewState !== 'revealing' || revealedIndices.includes(index) || isRevealingAll || openedCardsInfo.length > 5) return;
        const newRevealed = [...revealedIndices, index];
        setRevealedIndices(newRevealed);
        if (newRevealed.length === openedCardsInfo.length) {
            setTimeout(() => setViewState('finished'), 1000);
        }
    };
    
    const handleRevealAll = () => {
        if (viewState !== 'revealing' || isRevealingAll || openedCardsInfo.length > 5) return;
        setIsRevealingAll(true);
        const revealNextCard = () => {
            setRevealedIndices(current => {
                const nextIndex = openedCardsInfo.findIndex((_, i) => !current.includes(i));
                if (nextIndex === -1) {
                    if (revealIntervalRef.current) clearInterval(revealIntervalRef.current);
                    setTimeout(() => setViewState('finished'), 1000);
                    return current;
                }
                return [...current, nextIndex];
            });
        };
        revealNextCard();
        revealIntervalRef.current = setInterval(revealNextCard, 400);
    };

    const handleFinish = () => {
        if (!openingPack) return;
        const openedCards = openedCardsInfo.map(info => info.card);
        const packsToRemoveCount = openedCards.length / 5;
        
        onPackOpened(openedCards, openingPack.id);
        
        const newPacks = [...userPacks];
        for(let i=0; i < packsToRemoveCount; i++) {
             const indexToRemove = newPacks.indexOf(openingPack.id);
            if (indexToRemove > -1) {
                newPacks.splice(indexToRemove, 1);
            }
        }
        onPacksChange(newPacks);

        setViewState('inventory');
        setOpeningPack(null);
        setOpenedCardsInfo([]);
        setRevealedIndices([]);
        setIsRevealingAll(false);
        setRareCardToShow(null);
        setIsAutoFlipping(false);
    };
    
    const handleListPack = async (pack: CardPack, price: { coins?: number; points?: number }, quantity: number) => {
        const currentPackCount = userPacks.filter(pId => pId === pack.id).length;
        if (quantity > currentPackCount) {
            addNotification("จำนวนซองการ์ดในคลังไม่เพียงพอ", "error");
            return;
        }

        try {
            for (let i = 0; i < quantity; i++) {
                const newListing: MarketListing = {
                    listingId: `${nickname}-pack-${pack.id}-${Date.now()}-${i}`,
                    sellerNickname: nickname,
                    pack: pack,
                    price,
                    listedAt: Date.now(),
                };
                await marketService.createListing(newListing);
            }

            const newPacks = [...userPacks];
            for (let i = 0; i < quantity; i++) {
                const indexToRemove = newPacks.indexOf(pack.id);
                if (indexToRemove > -1) {
                    newPacks.splice(indexToRemove, 1);
                }
            }
            onPacksChange(newPacks);
            addNotification(`ลงขาย ${pack.name} จำนวน ${quantity} ซอง สำเร็จ!`, "success");
            setPackToSell(null);
        } catch (error) {
            addNotification("เกิดข้อผิดพลาดในการลงขาย", "error");
        }
    };

    const rarityOffsets = useMemo(() => {
        const offsets = new Map<CardRarity, number>();
        let cumulativeOffset = 0;
        const seasonConf = SEASON_CONFIG[0]; // All seasons have same rarity counts
        for (const rarityInfo of RARITY_DATA) {
            offsets.set(rarityInfo.name, cumulativeOffset);
            cumulativeOffset += seasonConf.slots[rarityInfo.name];
        }
        return offsets;
    }, []);

    const getCardIdString = useCallback((card: Card) => {
        const offset = rarityOffsets.get(card.rarity) || 0;
        const seasonalCardNumber = offset + card.cardNumber;
        return `SS${String(card.season).padStart(2, '0')}-${String(seasonalCardNumber).padStart(3, '0')}`;
    }, [rarityOffsets]);

    const renderDetailModal = (card: Card | null, onClose: () => void) => {
        if (!card) return null;
        const rarityData = RARITY_DATA.find(r => r.name === card.rarity);
        const cardId = getCardIdString(card);
        const elementData = ELEMENTS_DATA.find(el => el.name === card.element);
        const tribeData = TRIBES_DATA.find(t => t.en === card.tribe);

        return (
            <div 
                className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[100] p-4 animate-fade-in"
                onClick={onClose}
            >
                <div 
                    className="w-full max-w-sm aspect-[2.5/3.5] relative animate-pop-in" 
                    style={{ perspective: '1200px' }} 
                    onClick={(e) => e.stopPropagation()}
                >
                    <div 
                        className={`card-flipper ${isCardFlipped ? 'is-flipped' : ''}`} 
                        onClick={() => setIsCardFlipped(!isCardFlipped)}
                    >
                        <div className={`card-face card-front-face bg-cover bg-center border-4 rounded-xl shadow-2xl relative ${card.rarity === 'Legendary Rare' ? 'legendary-border' : ''}`} style={{backgroundImage: `url(${card.frontImage})`, borderColor: card.rarity === 'Legendary Rare' ? 'transparent' : rarityData?.color}}>
                             <div className="absolute top-2 left-2 bg-black/70 text-white text-xs font-bold px-2 py-1 rounded z-10">{cardId}</div>
                             <div className="absolute top-2 right-2 bg-black/70 text-2xl p-1 rounded-full z-10 leading-none">
                                {elementData?.emoji}
                            </div>
                            <div className="absolute left-3 right-3 bottom-24 bg-black/70 backdrop-blur-sm p-2 rounded-lg text-white space-y-1 text-center">
                                <div className="text-xs font-semibold text-slate-300">
                                    <span>{tribeData ? tribeData.th : card.tribe}</span>
                                    <span className="mx-2">|</span>
                                    <span>{elementData ? elementData.thaiName : card.element}</span>
                                </div>
                                <p className="text-xs text-slate-200 max-h-16 overflow-y-auto small-scrollbar px-1">
                                    {card.description[language] || 'ไม่มีคำอธิบาย'}
                                </p>
                            </div>
                            <div className="absolute bottom-2 left-2 right-2 text-white bg-black/70 px-2 py-1 rounded text-center">
                                <p className="truncate font-bold text-lg">{card.name[language]}</p>
                                {rarityData && (
                                     <p className={`text-sm font-semibold truncate ${rarityData.name === 'Legendary Rare' ? 'legendary-text' : ''}`} style={{ color: rarityData.name === 'Legendary Rare' ? undefined : rarityData.color, textShadow: '1px 1px 3px #000' }}>
                                        {rarityData.thaiName}
                                    </p>
                                )}
                            </div>
                        </div>
                        <div className="card-face card-back-face bg-cover bg-center border-2 rounded-xl p-4 flex flex-col justify-between shadow-2xl" style={{backgroundImage: `url(${globalCardBack})`}}>
                            <div className="absolute inset-0 bg-black/70 rounded-lg"></div>
                            <div className="relative z-10 overflow-y-auto text-sm small-scrollbar p-1">
                                <h4 className="font-bold text-white text-lg">{card.name[language]}</h4>
                                <p className="text-slate-300 mt-2">{card.story[language] || 'ไม่มีเรื่องราวสำหรับการ์ดใบนี้'}</p>
                            </div>
                        </div>
                    </div>
                </div>
                {onClose !== handleContinueOpening && ( // Only show on regular detail view
                    <button onClick={onClose} className="absolute top-4 right-4 text-white text-3xl">&times;</button>
                )}
            </div>
        );
    };
    
    if (viewState === 'finished') {
        const cardsToShow = openedCardsInfo;
        return (
            <div className="flex flex-col items-center justify-center min-h-[70vh] text-white p-4 w-full h-full">
                <h2 className="text-3xl font-bold mb-4">ผลลัพธ์จากการเปิด {cardsToShow.length / 5} ซอง</h2>
                <div className="w-full max-w-5xl h-[60vh] overflow-y-auto p-4 bg-slate-900/50 rounded-lg border border-slate-700">
                    <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-4">
                        {cardsToShow.map(({ card, isNew }, index) => {
                            const rarityData = RARITY_DATA.find(r => r.name === card.rarity)!;
                            const isLegendary = card.rarity === 'Legendary Rare';
                            return (
                                <div key={`${card.id}-${index}`} className={`relative aspect-[2.5/3.5] bg-cover bg-center border-2 rounded-lg ${isLegendary ? 'legendary-border' : ''}`} style={{backgroundImage: `url(${card.frontImage})`, borderColor: isLegendary ? 'transparent' : rarityData.color}}>
                                    <CardTag isNew={isNew} />
                                    <div className="absolute bottom-1 left-1 right-1 text-white bg-black/60 px-1 py-0.5 rounded text-center">
                                        <p className="text-[10px] truncate font-bold">{card.name[language]}</p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
                <div className="mt-6">
                    <button onClick={handleFinish} className="bg-indigo-600 hover:bg-indigo-700 font-bold py-3 px-8 rounded-lg text-lg">เก็บการ์ด</button>
                </div>
            </div>
        );
    }
    
    if (viewState !== 'inventory') {
        const isMultiOpenGrid = openedCardsInfo.length > 5;

        return (
            <div className="flex flex-col items-center justify-center min-h-[80vh] text-white overflow-hidden p-4 relative w-full h-full">
                {/* Initial pack animation for single pack */}
                {!isMultiOpenGrid && (
                    <div className={`relative w-48 h-64 transition-transform duration-500 ${viewState === 'opening' ? 'pack-opening-anim' : 'opacity-0 -translate-y-full'}`}>
                        {openingPack && <img src={openingPack.image} alt="Opening pack" className="w-full h-full object-contain" />}
                    </div>
                )}

                {isMultiOpenGrid && viewState === 'revealing' && (
                     <h2 className="text-2xl font-bold mb-4 absolute top-0">ผลการเปิด {openedCardsInfo.length / 5} ซอง</h2>
                )}

                <div className={`${isMultiOpenGrid ? 'grid grid-cols-5 sm:grid-cols-10 gap-2 w-full max-w-6xl mt-12' : 'absolute inset-0 flex items-center justify-center gap-4'}`}>
                    {openedCardsInfo.map(({ card, isNew }, index) => {
                        const isRevealed = revealedIndices.includes(index);
                        const rarityData = RARITY_DATA.find(r => r.name === card.rarity)!;
                        const isLegendary = card.rarity === 'Legendary Rare';
                        return (
                            <div 
                                key={index}
                                className={`card-container ${isMultiOpenGrid ? 'static-card' : ''} ${viewState === 'revealing' || viewState === 'finished' ? 'card-enter' : ''}`}
                                style={{ '--delay': `${index * 0.15}s`, '--x-offset': `${(index - (openedCardsInfo.length - 1) / 2) * 120}%` } as React.CSSProperties}
                                onClick={() => {
                                    if (!isRevealed && !isMultiOpenGrid) {
                                        handleRevealCard(index);
                                    } else if (isRevealed) {
                                        setSelectedCardForDetail(card);
                                        setIsCardFlipped(false);
                                    }
                                }}
                            >
                                <div className={`card-inner ${isRevealed ? 'is-flipped' : ''}`}>
                                    <div className="card-face card-back bg-slate-700 border-2 border-slate-500 rounded-lg flex items-center justify-center" style={{backgroundImage: `url(${globalCardBack})`}}>
                                        <div className="absolute inset-0 bg-black/70 rounded-lg"></div>
                                    </div>
                                    <div className={`card-face card-front rounded-lg flex flex-col justify-end text-center p-1 bg-cover bg-center relative border-2 ${isLegendary ? 'legendary-border' : ''}`} style={{ backgroundImage: `url(${card.frontImage})`, borderColor: isLegendary ? 'transparent' : rarityData.color }}>
                                        <CardTag isNew={isNew} />
                                        <div className={`rarity-glow ${isRevealed && RARE_THRESHOLDS.includes(card.rarity) ? 'active' : ''} ${isLegendary ? 'legendary-glow-active' : ''}`} style={{'--glow-color': rarityData.color} as React.CSSProperties}></div>
                                        <div className="relative text-white bg-black/60 px-1 py-0.5 rounded w-full">
                                            <p className="text-[10px] truncate font-bold">{card.name[language]}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
                
                <div className="absolute bottom-4 sm:bottom-10 flex gap-4 z-20">
                    {!isMultiOpenGrid && viewState === 'revealing' && revealedIndices.length < openedCardsInfo.length && !isRevealingAll && (
                        <div className="animate-fade-in"><button onClick={handleRevealAll} className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-8 rounded-lg text-lg transition transform hover:scale-105">เปิดทั้งหมด</button></div>
                    )}
                    {viewState === 'finished' && (
                        <div className="animate-fade-in"><button onClick={handleFinish} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-8 rounded-lg text-lg transition transform hover:scale-105">เก็บการ์ด</button></div>
                    )}
                </div>

                {isMultiOpenGrid && viewState === 'revealing' && (
                    <div className="absolute top-4 right-4 z-30">
                        <button onClick={handleSkipAnimation} className="bg-slate-800/80 hover:bg-slate-700 text-white font-bold py-2 px-6 rounded-lg">ข้าม</button>
                    </div>
                )}
                
                {rareCardToShow && (
                    <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex flex-col items-center justify-center z-[100] p-4 animate-fade-in">
                        <h2 className="text-3xl font-bold text-yellow-300 mb-4 animate-pulse">การ์ดหายาก!</h2>
                        {renderDetailModal(rareCardToShow, handleContinueOpening)}
                        <button onClick={handleContinueOpening} className="mt-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-8 rounded-lg">เปิดต่อ</button>
                    </div>
                )}

                {selectedCardForDetail && renderDetailModal(selectedCardForDetail, () => setSelectedCardForDetail(null))}

                <style>{`
                    @keyframes rainbow-text-anim { 0% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } 100% { background-position: 0% 50%; } }
                    .legendary-text {
                        background: linear-gradient(90deg, #ff6565, #ffab2c, #ffff65, #65ff65, #6565ff, #ab65ff, #ff65ff);
                        background-size: 200% auto;
                        -webkit-background-clip: text;
                        background-clip: text;
                        -webkit-text-fill-color: transparent;
                        animation: rainbow-text-anim 3s linear infinite;
                        font-weight: 700 !important;
                    }
                    @keyframes rainbow-border-anim {
                        0%, 100% { border-color: #ff6565; box-shadow: 0 0 12px #ff6565, inset 0 0 6px #ff6565; }
                        14% { border-color: #ffab2c; box-shadow: 0 0 12px #ffab2c, inset 0 0 6px #ffab2c; }
                        28% { border-color: #ffff65; box-shadow: 0 0 12px #ffff65, inset 0 0 6px #ffff65; }
                        42% { border-color: #65ff65; box-shadow: 0 0 12px #65ff65, inset 0 0 6px #65ff65; }
                        57% { border-color: #6565ff; box-shadow: 0 0 12px #6565ff, inset 0 0 6px #6565ff; }
                        71% { border-color: #ab65ff; box-shadow: 0 0 12px #ab65ff, inset 0 0 6px #ab65ff; }
                        85% { border-color: #ff65ff; box-shadow: 0 0 12px #ff65ff, inset 0 0 6px #ff65ff; }
                    }
                    .legendary-border {
                        border-width: 3px !important;
                        animation: rainbow-border-anim 4s linear infinite;
                    }
                    .animate-fade-in { animation: fadeIn 0.5s ease-in-out; } @keyframes fadeIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
                    @keyframes pack-opening { 0% { transform: scale(1) rotate(0); } 20% { transform: scale(1.1) rotate(-5deg); } 40% { transform: scale(1.1) rotate(5deg); } 100% { transform: scale(3) rotate(0); opacity: 0; } }
                    .pack-opening-anim { animation: pack-opening 1.5s ease-in-out forwards; }
                    .card-container { position: absolute; width: 120px; height: 168px; perspective: 1000px; opacity: 0; transform: translateY(100px); transition: all 0.6s ease-out; cursor: pointer; }
                    .card-container.static-card { position: relative; width: auto; height: auto; aspect-ratio: 2.5/3.5; opacity: 1; transform: none; transition: none; }
                    .card-enter { opacity: 1; transform: translateY(0) translateX(var(--x-offset)); transition-delay: var(--delay); }
                    .card-inner { position: relative; width: 100%; height: 100%; transition: transform 0.6s; transform-style: preserve-3d; }
                    .card-inner.is-flipped { transform: rotateY(180deg); }
                    .card-face { position: absolute; width: 100%; height: 100%; backface-visibility: hidden; -webkit-backface-visibility: hidden; border-radius: 0.5rem; }
                    .card-front { transform: rotateY(180deg); }
                    .card-back { background-size: cover; background-position: center; }
                    .rarity-glow { position: absolute; inset: -2px; border-radius: 6px; box-shadow: 0 0 10px var(--glow-color), 0 0 20px var(--glow-color); opacity: 0; transition: opacity 0.5s; z-index: -1; }
                    .rarity-glow.active { animation: card-glow 2s infinite ease-in-out; }
                    @keyframes card-glow { 0%, 100% { opacity: 0.6; } 50% { opacity: 1; } }
                    .legendary-glow-active { animation: rainbow-border-anim 4s linear infinite; }
                    
                    /* Flipper and Modal Styles */
                    .card-flipper { width: 100%; height: 100%; position: relative; transform-style: preserve-3d; transition: transform 0.6s; cursor: pointer; }
                    .card-flipper.is-flipped { transform: rotateY(180deg); }
                    .card-back-face { transform: rotateY(180deg); }
                    .small-scrollbar::-webkit-scrollbar { width: 4px; }
                    .small-scrollbar::-webkit-scrollbar-track { background: transparent; }
                    .small-scrollbar::-webkit-scrollbar-thumb { background: #475569; border-radius: 10px; }
                    @keyframes popIn { from { opacity: 0; transform: scale(0.9); } to { opacity: 1; transform: scale(1); } }
                    .animate-pop-in { animation: popIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275); }
                `}</style>
            </div>
        );
    }
    
    return (
        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-lg p-6 shadow-xl max-w-6xl mx-auto">
            {packToSell && <ListPackModal pack={packToSell.pack} maxCount={packToSell.count} onClose={() => setPackToSell(null)} onList={handleListPack} />}
            <h2 className="text-3xl font-bold text-white tracking-wide mb-6">คลังซองการ์ดของคุณ</h2>
            
            {userPackCounts.length === 0 ? (
                <div className="text-center py-16">
                    <p className="text-slate-400 text-lg">คุณยังไม่มีซองการ์ด</p>
                    <p className="text-slate-500 mt-2">คุณสามารถหาซองการ์ดได้จากร้านค้า, สล็อต, หรือให้สัตว์เลี้ยงของคุณออกไปสำรวจ!</p>
                </div>
            ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {userPackCounts.map(([seasonId, count]) => {
                        const packData = allPackData.find(p => p.id === seasonId);
                        if (!packData) return null;
                        
                        return (
                            <div key={seasonId} className="bg-slate-900/50 p-4 rounded-lg flex flex-col items-center gap-4 border border-slate-700 group relative">
                                <div className="absolute -top-3 -right-3 bg-indigo-600 text-white text-sm font-bold rounded-full h-8 w-8 flex items-center justify-center border-4 border-slate-800 shadow-lg">
                                    x{count}
                                </div>
                                <div className="h-48 flex items-center justify-center">
                                    <img src={packData.image} alt={packData.name} className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform duration-300"/>
                                </div>
                                <div className="text-center">
                                    <h3 className="font-bold text-white">{packData.name}</h3>
                                </div>
                                <div className="w-full mt-auto space-y-2">
                                    <div className="grid grid-cols-2 gap-2">
                                        {[1, 3, 5, 10].map(amount => {
                                            if (amount > count && amount !== 1) return null;
                                            const openAmount = Math.min(amount, count);
                                            if (openAmount === 0 || (amount > 1 && openAmount < amount)) return null;

                                            return (
                                            <button 
                                                key={amount}
                                                onClick={() => handleOpenPackClick(packData, openAmount)}
                                                className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 rounded-md transition text-sm disabled:opacity-50"
                                                disabled={viewState !== 'inventory' || openAmount === 0}
                                            >
                                                เปิด x{openAmount}
                                            </button>
                                        )})}
                                    </div>
                                    <button
                                        onClick={() => setPackToSell({ pack: packData, count: count })}
                                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 rounded-md transition text-sm"
                                    >
                                        ตั้งขาย
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default CardPackOpeningView;