import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { CardRarity, RARITY_DATA, ELEMENTS_DATA, Card, SEASON_CONFIG, TRIBES_DATA, Language, CardStats } from '../types';
import { IconImageText } from './icons/IconImageText';
import * as cardService from '../services/cardService';
import * as configService from '../services/configService';
import { LanguageIcon } from './icons/LanguageIcon';
import { DEFAULT_CONFIG } from '../services/configService';
import { DragonStampIcon } from './icons/DragonStampIcon';

interface CardCollectionViewProps {
    isAdmin: boolean;
    userCards?: Card[];
    allCards?: Card[];
    onCardsUpdate?: () => void;
    seasonBanners: Record<number, string>;
    language: Language;
    onLanguageChange: (lang: Language) => void;
    selectedSeason: number;
    setSelectedSeason: (season: number) => void;
}

const hexToRgba = (hex: string, alpha: number) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

const processImage = (file: File, targetWidth: number, targetHeight: number): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onerror = reject;
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target?.result as string;
            img.onerror = reject;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                canvas.width = targetWidth;
                canvas.height = targetHeight;
                const ctx = canvas.getContext('2d');
                if (!ctx) {
                    return reject(new Error('Could not get canvas context'));
                }
                ctx.drawImage(img, 0, 0, targetWidth, targetHeight);
                resolve(canvas.toDataURL('image/jpeg', 0.85));
            };
        };
    });
};

const CardFormModal: React.FC<{ 
    mode: 'add' | 'edit';
    rarity: CardRarity;
    season: number;
    allCards: Card[];
    prefilledCardNumber?: number;
    onClose: () => void; 
    onSave: (card: Omit<Card, 'backImage'>) => void;
    cardData?: Card | null;
    language: Language;
    position: { top: number; left: number } | null;
}> = ({ mode, rarity, season, allCards, prefilledCardNumber, onClose, onSave, cardData, language, position }) => {
    const title = mode === 'add' ? 'เพิ่มการ์ดใหม่' : 'แก้ไขการ์ด';
    const submitText = mode === 'add' ? 'เพิ่มการ์ด' : 'บันทึกการแก้ไข';
    
    const [name, setName] = useState({ th: '', en: '' });
    const [cardSeason, setCardSeason] = useState(season);
    const [cardNumber, setCardNumber] = useState(1);
    const [element, setElement] = useState(ELEMENTS_DATA[0].name);
    const [tribe, setTribe] = useState(TRIBES_DATA[0].en);
    const [description, setDescription] = useState({ th: '', en: '' });
    const [story, setStory] = useState({ th: '', en: '' });
    const [stats, setStats] = useState<CardStats>({ attack: 0, defense: 0, speed: 0, hp: 0 });

    const [frontImage, setFrontImage] = useState<string | null>(null);
    const [errors, setErrors] = useState<{ front?: string }>({});

    useEffect(() => {
        let baseCard: Card | null | undefined = null;
        if (mode === 'edit' && cardData) {
            baseCard = cardData;
        } else if (mode === 'add') {
             baseCard = allCards.find(c => c.season === season && c.rarity === rarity && c.cardNumber === prefilledCardNumber);
        }

        if(baseCard) {
            setName(baseCard.name || { th: '', en: '' });
            setCardSeason(baseCard.season);
            setCardNumber(baseCard.cardNumber);
            setElement(baseCard.element);
            setTribe(baseCard.tribe);
            setDescription(baseCard.description || { th: '', en: '' });
            setStory(baseCard.story || { th: '', en: '' });
            setStats(baseCard.stats);
            const isDefaultImage = baseCard.frontImage.includes('unsplash');
            setFrontImage(isDefaultImage ? null : baseCard.frontImage);
        }
    }, [mode, cardData, season, prefilledCardNumber, allCards, rarity]);
    
    const handleStatChange = (stat: keyof CardStats, value: string) => {
        setStats(prev => ({ ...prev, [stat]: Number(value) || 0 }));
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        setFrontImage(null);
        setErrors(prev => ({ ...prev, front: undefined }));

        if (!file) return;
        
        try {
            const optimizedBase64 = await processImage(file, 400, 560);
            setFrontImage(optimizedBase64);
        } catch (error) {
            console.error("Error processing image:", error);
            setErrors(prev => ({ ...prev, front: 'ไม่สามารถประมวลผลไฟล์รูปภาพได้' }));
        }
    };
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.th || !name.en || !frontImage) {
            alert('กรุณากรอกชื่อ (ไทยและอังกฤษ) และอัปโหลดรูปภาพหน้าการ์ดให้ครบถ้วน');
            return;
        }

        const existingCardForSlot = allCards.find(
            c => c.season === cardSeason && c.rarity === rarity && c.cardNumber === cardNumber
        );
    
        if (mode === 'add' && existingCardForSlot && !existingCardForSlot.name.th.startsWith('[ข้อมูลชั่วคราว]')) {
             if (!window.confirm(`มีข้อมูลการ์ด "${existingCardForSlot.name[language]}" อยู่ในช่องนี้แล้ว คุณต้องการเขียนทับหรือไม่?`)) {
                return;
            }
        }
        
        onSave({
            id: existingCardForSlot?.id || cardData?.id || `${cardSeason}-${rarity}-${cardNumber}`,
            name,
            rarity,
            season: cardSeason,
            cardNumber,
            element,
            tribe,
            description,
            story,
            stats,
            frontImage,
        });
    };
    
    const modalStyle = position ? {
        position: 'absolute' as 'absolute',
        top: `${position.top}px`,
        left: `${position.left}px`,
        transform: 'translate(-50%, -50%)',
      } : {};

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 p-4">
            <div style={modalStyle} className="bg-slate-800 border border-slate-700 rounded-lg p-6 shadow-xl w-full max-w-2xl relative overflow-auto max-h-[90vh] modal-content-container">
                <button onClick={onClose} className="absolute top-3 right-3 text-slate-400 hover:text-white text-2xl">&times;</button>
                <h3 className="text-xl font-bold text-white mb-4">{title}: ระดับ <span style={{ color: RARITY_DATA.find(r => r.name === rarity)?.color }}>{RARITY_DATA.find(r => r.name === rarity)?.thaiName}</span></h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">รูปภาพหน้าการ์ด</label>
                        <div className={`mt-1 flex justify-center items-center px-6 pt-5 pb-6 border-2 ${errors.front ? 'border-red-500' : 'border-slate-600'} border-dashed rounded-md`}>
                            {frontImage ? (
                                <div className="relative group">
                                    <img src={frontImage} alt={`front preview`} className="h-48 object-contain rounded-md" />
                                     <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center gap-2 rounded-md transition-opacity">
                                        <label htmlFor={`front-card-upload`} className="cursor-pointer bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold py-2 px-4 rounded transition">
                                            เปลี่ยนรูป
                                        </label>
                                        <button
                                            type="button"
                                            onClick={() => setFrontImage(null)}
                                            className="bg-red-600 hover:bg-red-500 text-white text-xs font-bold py-2 px-4 rounded transition"
                                        >
                                            นำออก
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-1 text-center">
                                    <IconImageText className="mx-auto h-12 w-12 text-slate-500" />
                                    <div className="flex text-sm text-slate-400">
                                        <label htmlFor={`front-card-upload`} className="relative cursor-pointer bg-slate-700 rounded-md font-medium text-indigo-400 hover:text-indigo-300 px-2">
                                            <span>เลือกไฟล์</span>
                                        </label>
                                    </div>
                                </div>
                            )}
                        </div>
                        <input id={`front-card-upload`} name={`front-card-upload`} type="file" className="sr-only" onChange={handleFileChange} accept="image/png, image/jpeg, image/gif, image/webp"/>
                        <p className="text-xs text-slate-500 mt-2 text-center">รูปภาพจะถูกปรับให้มีขนาด 400x560px และบีบอัดไฟล์</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">ชื่อภาษาไทย</label>
                            <input type="text" value={name.th} onChange={e => setName(p => ({...p, th: e.target.value}))} className="w-full bg-slate-900 border border-slate-600 rounded-md p-2 text-white" required />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">ชื่อภาษาอังกฤษ</label>
                            <input type="text" value={name.en} onChange={e => setName(p => ({...p, en: e.target.value}))} className="w-full bg-slate-900 border border-slate-600 rounded-md p-2 text-white" required />
                        </div>
                    </div>
                     <div className="grid grid-cols-3 gap-4">
                        <div className="col-span-1">
                            <label className="block text-sm font-medium text-slate-300 mb-2">หมายเลข</label>
                            <input type="number" value={cardNumber} onChange={e => setCardNumber(Number(e.target.value))} className="w-full bg-slate-900 border border-slate-600 rounded-md p-2 text-white" required min="1" readOnly={mode === 'add'}/>
                        </div>
                        <div className="col-span-2">
                            <label className="block text-sm font-medium text-slate-300 mb-2">ซีซั่น</label>
                            <select value={cardSeason} onChange={e => setCardSeason(Number(e.target.value))} className="w-full bg-slate-900 border border-slate-600 rounded-md p-2 text-white">
                                {SEASON_CONFIG.map(s => (
                                    <option key={s.season} value={s.season}>{s.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">ธาตุ</label>
                            <select value={element} onChange={e => setElement(e.target.value)} className="w-full bg-slate-900 border border-slate-600 rounded-md p-2 text-white">
                                {ELEMENTS_DATA.map(el => (
                                    <option key={el.name} value={el.name}>{el.emoji} {el.thaiName}</option>
                                ))}
                            </select>
                        </div>
                         <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">เผ่าพันธุ์</label>
                            <select value={tribe} onChange={e => setTribe(e.target.value)} className="w-full bg-slate-900 border border-slate-600 rounded-md p-2 text-white">
                                {TRIBES_DATA.map(t => (
                                    <option key={t.en} value={t.en}>{t.th}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">คำอธิบาย (ไทย)</label>
                            <textarea rows={2} value={description.th} onChange={e => setDescription(p => ({...p, th: e.target.value}))} className="w-full bg-slate-900 border border-slate-600 rounded-md p-2 text-white"/>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">คำอธิบาย (อังกฤษ)</label>
                            <textarea rows={2} value={description.en} onChange={e => setDescription(p => ({...p, en: e.target.value}))} className="w-full bg-slate-900 border border-slate-600 rounded-md p-2 text-white"/>
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">เรื่องราว (ไทย)</label>
                        <textarea rows={4} value={story.th} onChange={e => setStory(p => ({...p, th: e.target.value}))} className="w-full bg-slate-900 border border-slate-600 rounded-md p-2 text-white"/>
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">เรื่องราว (อังกฤษ)</label>
                        <textarea rows={4} value={story.en} onChange={e => setStory(p => ({...p, en: e.target.value}))} className="w-full bg-slate-900 border border-slate-600 rounded-md p-2 text-white"/>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">ค่าพลัง</label>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                            {Object.keys(stats).map(statKey => (
                                <div key={statKey}>
                                    <label className="block text-xs font-medium text-slate-400 capitalize">{statKey}</label>
                                    <input type="number" value={stats[statKey as keyof CardStats]} onChange={e => handleStatChange(statKey as keyof CardStats, e.target.value)} className="w-full bg-slate-900 border border-slate-600 rounded-md p-1 text-white text-sm" />
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="flex justify-end gap-3 pt-4">
                         <button type="button" onClick={onClose} className="bg-slate-600 hover:bg-slate-500 text-white font-bold py-2 px-4 rounded-md">ยกเลิก</button>
                         <button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-md">{submitText}</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const DeleteConfirmationModal: React.FC<{ 
    cardName: string; 
    onClose: () => void; 
    onDelete: () => void;
    position: { top: number; left: number } | null;
}> = ({ cardName, onClose, onDelete, position }) => {
    const modalStyle = position ? {
        position: 'absolute' as 'absolute',
        top: `${position.top}px`,
        left: `${position.left}px`,
        transform: 'translate(-50%, -50%)',
      } : {};

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 p-4">
            <div style={modalStyle} className="bg-slate-800 border border-slate-700 rounded-lg p-6 shadow-xl w-full max-w-md relative">
                <button onClick={onClose} className="absolute top-3 right-3 text-slate-400 hover:text-white text-2xl">&times;</button>
                <h3 className="text-xl font-bold text-white mb-4">ยืนยันการลบการ์ด</h3>
                <p className="text-slate-300 mb-6">
                    คุณแน่ใจหรือไม่ว่าต้องการลบการ์ด <span className="font-bold text-white">"{cardName}"</span>? การกระทำนี้ไม่สามารถย้อนกลับได้
                </p>
                <div className="flex justify-end gap-3">
                    <button type="button" onClick={onClose} className="bg-slate-600 hover:bg-slate-500 text-white font-bold py-2 px-4 rounded-md">ยกเลิก</button>
                    <button
                        type="button"
                        onClick={onDelete}
                        className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-md"
                    >
                        ยืนยันการลบ
                    </button>
                </div>
            </div>
        </div>
    );
};

const GlobalImageUploader: React.FC<{
    title: string;
    description: string;
    currentImageUrl: string;
    defaultImageUrl: string;
    onSave: (base64: string) => void;
}> = ({ title, description, currentImageUrl, defaultImageUrl, onSave }) => {
    const [newImage, setNewImage] = useState<string | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsProcessing(true);
        try {
            const optimizedBase64 = await processImage(file, 400, 560);
            setNewImage(optimizedBase64);
        } catch (error) {
            console.error("Failed to process image:", error);
            alert("เกิดข้อผิดพลาดในการประมวลผลรูปภาพ");
        } finally {
            setIsProcessing(false);
        }
    };

    const handleSaveClick = async () => {
        if (!newImage) return;
        setIsProcessing(true);
        try {
            await onSave(newImage);
            setNewImage(null);
        } catch (error) {
            console.error("Failed to save image:", error);
            alert("เกิดข้อผิดพลาดในการบันทึกรูปภาพ");
        } finally {
            setIsProcessing(false);
        }
    };
    
    const handleRemoveClick = async () => {
         if (window.confirm('คุณต้องการรีเซ็ตภาพนี้กลับเป็นค่าเริ่มต้นหรือไม่?')) {
            setIsProcessing(true);
            try {
                await onSave(defaultImageUrl);
                setNewImage(null); 
            } catch (error) {
                 alert("เกิดข้อผิดพลาดในการรีเซ็ต");
            } finally {
                setIsProcessing(false);
            }
        }
    };

    const handleCancelClick = () => {
        setNewImage(null);
    };

    const displayImageUrl = newImage || currentImageUrl;
    const isCustomImage = displayImageUrl !== defaultImageUrl;

    return (
        <div className="bg-slate-900/50 p-4 rounded-lg border border-slate-700 h-full">
            <h3 className="font-semibold text-white mb-3 text-xl">{title}</h3>
            <div className="flex flex-col sm:flex-row gap-4 items-center">
                <div className="w-32 h-44 bg-slate-800 rounded-md flex items-center justify-center flex-shrink-0">
                    {displayImageUrl ? (
                        <img src={displayImageUrl} alt={title} className="w-full h-full object-cover rounded-md" />
                    ) : (
                        <IconImageText className="w-12 h-12 text-slate-600" />
                    )}
                </div>
                <div className="flex-grow text-center sm:text-left">
                    <p className="text-sm text-slate-400 mb-4">{description}</p>
                    <div className="flex items-center gap-2 justify-center sm:justify-start flex-wrap">
                        <label className={`inline-block ${isProcessing ? 'bg-slate-600 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700 cursor-pointer'} text-white font-bold py-2 px-4 rounded-md transition text-sm`}>
                            {isProcessing ? 'กำลัง...' : 'เปลี่ยนรูปภาพ'}
                            <input type="file" className="sr-only" onChange={handleFileChange} accept="image/*" disabled={isProcessing} />
                        </label>
                         {isCustomImage && !newImage && (
                            <button onClick={handleRemoveClick} disabled={isProcessing} className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-md transition text-sm disabled:opacity-50">
                                นำออก
                            </button>
                        )}
                        {newImage && !isProcessing && (
                            <>
                                <button onClick={handleSaveClick} className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-md transition text-sm">
                                    บันทึก
                                </button>
                                <button onClick={handleCancelClick} className="bg-slate-600 hover:bg-slate-700 text-white font-bold py-2 px-4 rounded-md transition text-sm">
                                    ยกเลิก
                                </button>
                            </>
                        )}
                    </div>
                    <p className="text-xs text-slate-500 mt-2">แนะนำ: 400x560px</p>
                </div>
            </div>
        </div>
    );
};

const CardTrackingTable: React.FC<{ userCards: Card[], selectedSeason: number, allCards: Card[] }> = ({ userCards, selectedSeason, allCards }) => {
    const currentSeasonConfig = useMemo(() => SEASON_CONFIG.find(s => s.season === selectedSeason), [selectedSeason]);
    
    const { ownedCardsMap, ownedCardCounts } = useMemo(() => {
        const existenceMap = new Map<CardRarity, Set<number>>();
        const countMap = new Map<string, number>();
        const seasonUserCards = userCards.filter(c => c.season === selectedSeason);

        for (const card of seasonUserCards) {
            if (!existenceMap.has(card.rarity)) {
                existenceMap.set(card.rarity, new Set());
            }
            existenceMap.get(card.rarity)!.add(card.cardNumber);

            const countKey = `${card.rarity}-${card.cardNumber}`;
            countMap.set(countKey, (countMap.get(countKey) || 0) + 1);
        }
        return { ownedCardsMap: existenceMap, ownedCardCounts: countMap };
    }, [userCards, selectedSeason]);


    if (!currentSeasonConfig) return null;

    return (
        <div className="bg-slate-900/50 p-4 rounded-lg border border-slate-700 space-y-4">
            {RARITY_DATA.map(rarityInfo => {
                const totalSlots = currentSeasonConfig.slots[rarityInfo.name] || 0;
                if (totalSlots === 0) return null;

                const ownedSet = ownedCardsMap.get(rarityInfo.name) || new Set();
                const ownedCount = ownedSet.size;
                const percentage = totalSlots > 0 ? (ownedCount / totalSlots) * 100 : 0;

                return (
                    <div key={rarityInfo.name}>
                        <h4 className={`font-semibold text-lg ${rarityInfo.name === 'Legendary Rare' ? 'legendary-text' : ''}`} style={{ color: rarityInfo.name === 'Legendary Rare' ? undefined : rarityInfo.color }}>
                            {rarityInfo.thaiName} ({ownedCount}/{totalSlots})
                        </h4>
                        <div className="w-full bg-slate-700 rounded-full h-2.5 mt-1">
                            <div 
                                className="h-2.5 rounded-full transition-all duration-500" 
                                style={{ 
                                    width: `${percentage}%`,
                                    backgroundColor: rarityInfo.color 
                                }}
                            ></div>
                        </div>
                        <div className="grid grid-cols-8 sm:grid-cols-10 md:grid-cols-12 lg:grid-cols-15 xl:grid-cols-20 gap-2 mt-2">
                            {Array.from({ length: totalSlots }).map((_, i) => {
                                const cardNumber = i + 1;
                                const isOwned = ownedSet.has(cardNumber);
                                const count = ownedCardCounts.get(`${rarityInfo.name}-${cardNumber}`) || 0;
                                return (
                                    <div 
                                        key={cardNumber}
                                        className={`relative w-full aspect-square flex items-center justify-center rounded text-xs font-mono transition-colors ${
                                            isOwned 
                                                ? 'bg-indigo-500/30 text-indigo-200 border border-indigo-500/50' 
                                                : 'bg-slate-800 text-slate-500 border border-slate-700'
                                        }`}
                                        title={isOwned ? `คุณมีการ์ด #${cardNumber} จำนวน ${count} ใบ` : `ยังไม่มีการ์ด #${cardNumber}`}
                                    >
                                        <span className="absolute inset-0 flex items-center justify-center text-slate-700 dark:text-slate-600 text-lg font-bold opacity-50">{cardNumber}</span>
                                        {isOwned && <DragonStampIcon className="relative z-10 w-4/5 h-4/5 text-indigo-400 opacity-70" />}
                                        {count > 1 && (
                                            <div className="absolute -top-1 -right-1 bg-cyan-600 text-white text-[10px] font-bold rounded-full h-4 w-4 flex items-center justify-center z-20 border-2 border-slate-800">
                                                {count}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                );
            })}
        </div>
    );
};


const CardCollectionView: React.FC<CardCollectionViewProps> = ({ isAdmin, userCards = [], allCards = [], onCardsUpdate, seasonBanners, language, onLanguageChange, selectedSeason, setSelectedSeason }) => {
    const [modalState, setModalState] = useState<{ mode: 'add' | 'edit'; rarity?: CardRarity; card?: Card | null; prefilledCardNumber?: number; } | null>(null);
    const [deletingCard, setDeletingCard] = useState<Card | null>(null);
    const [flippedCardId, setFlippedCardId] = useState<string | null>(null);
    const [selectedCard, setSelectedCard] = useState<Card | null>(null);
    const [globalCardBack, setGlobalCardBack] = useState('');
    const [globalCardFrontPlaceholder, setGlobalCardFrontPlaceholder] = useState('');
    const [modalPosition, setModalPosition] = useState<{ top: number; left: number } | null>(null);

    const [searchFilter, setSearchFilter] = useState('');
    const [rarityFilter, setRarityFilter] = useState<CardRarity | 'all'>('all');
    const [elementFilter, setElementFilter] = useState<string | 'all'>('all');
    const [showTracker, setShowTracker] = useState(false);
    
    const rarityOffsets = useMemo(() => {
        const offsets = new Map<CardRarity, number>();
        let cumulativeOffset = 0;
        // All seasons have the same slot configuration, so using the first one is fine.
        const seasonConf = SEASON_CONFIG[0];

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

    const currentSeasonConfig = SEASON_CONFIG.find(s => s.season === selectedSeason);
    const currentBanner = seasonBanners[selectedSeason];
    
     useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                setSelectedCard(null);
                setModalPosition(null);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    useEffect(() => {
        const loadGlobalImages = async () => {
            const config = await configService.getConfig();
            setGlobalCardBack(config.global_card_back_image);
            setGlobalCardFrontPlaceholder(config.global_card_front_image_placeholder);
        };
        loadGlobalImages();
    }, []);

    useEffect(() => {
        const isModalOpen = modalState || deletingCard || selectedCard;
        if (isModalOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'auto';
        }
        return () => {
            document.body.style.overflow = 'auto';
        };
    }, [modalState, deletingCard, selectedCard]);


    const handleSaveCard = async (card: Omit<Card, 'backImage'>) => {
        const seasonConf = SEASON_CONFIG.find(s => s.season === card.season);
        const maxSlots = seasonConf?.slots[card.rarity] || 0;
        if (card.cardNumber < 1 || (maxSlots > 0 && card.cardNumber > maxSlots)) {
            alert(`หมายเลขการ์ดต้องอยู่ระหว่าง 1 ถึง ${maxSlots} สำหรับระดับความหายากนี้`);
            return;
        }
        
        const cardToSave: Card = {
            ...card,
            backImage: globalCardBack
        };

        await cardService.saveCard(cardToSave);
        onCardsUpdate?.();
        setModalState(null);
        setModalPosition(null);
    };

    const handleDeleteCard = async () => {
        if (!deletingCard) return;
        await cardService.deleteCard(deletingCard.id);
        onCardsUpdate?.();
        setDeletingCard(null);
        setModalPosition(null);
    };

    const cardsForCurrentView = useMemo(() => {
        const sourceCards = isAdmin ? allCards : userCards;
        return sourceCards.filter(c => c.season === selectedSeason);
    }, [isAdmin, allCards, userCards, selectedSeason]);
    
    const renderLightboxCard = () => {
        if (!selectedCard) return null;
        const rarityData = RARITY_DATA.find(r => r.name === selectedCard.rarity);
        const cardId = getCardIdString(selectedCard);
        const elementData = ELEMENTS_DATA.find(el => el.name === selectedCard.element);
        const tribeData = TRIBES_DATA.find(t => t.en === selectedCard.tribe);
        
        const modalStyle = modalPosition ? {
            position: 'absolute' as 'absolute',
            top: `${modalPosition.top}px`,
            left: `${modalPosition.left}px`,
            transform: 'translate(-50%, -50%)',
          } : {};

        return (
            <div 
                className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 p-4 animate-fade-in"
                onClick={() => { setSelectedCard(null); setModalPosition(null); }}
            >
                <div 
                    style={modalStyle}
                    className="w-full max-w-sm aspect-[2.5/3.5] relative animate-pop-in" 
                    onClick={(e) => e.stopPropagation()}
                >
                     <div 
                        className="w-full h-full" 
                        style={{ perspective: '1200px' }} 
                    >
                        <div className={`card-flipper ${flippedCardId === selectedCard.id ? 'is-flipped' : ''}`} onClick={() => setFlippedCardId(flippedCardId === selectedCard.id ? null : selectedCard.id)}>
                            <div className={`card-face card-front-face bg-cover bg-center border-4 rounded-xl shadow-2xl relative ${selectedCard.rarity === 'Legendary Rare' ? 'legendary-border' : ''}`} style={{backgroundImage: `url(${selectedCard.frontImage})`, borderColor: selectedCard.rarity === 'Legendary Rare' ? 'transparent' : rarityData?.color}}>
                                <div className="absolute top-2 left-2 bg-black/70 text-white text-xs font-bold px-2 py-1 rounded z-10">{cardId}</div>
                                <div className="absolute top-2 right-2 bg-black/70 text-2xl p-1 rounded-full z-10 leading-none">
                                    {elementData?.emoji}
                                </div>

                                <div className="absolute left-3 right-3 bottom-24 bg-black/70 backdrop-blur-sm p-2 rounded-lg text-white space-y-1 text-center">
                                    <div className="text-xs font-semibold text-slate-300">
                                        <span>{tribeData ? tribeData.th : selectedCard.tribe}</span>
                                        <span className="mx-2">|</span>
                                        <span>{elementData ? elementData.thaiName : selectedCard.element}</span>
                                    </div>
                                    <p className="text-xs text-slate-200 max-h-16 overflow-y-auto small-scrollbar px-1">
                                        {selectedCard.description[language] || 'ไม่มีคำอธิบาย'}
                                    </p>
                                </div>

                                <div className="absolute bottom-2 left-2 right-2 text-white bg-black/70 px-2 py-1 rounded text-center">
                                    <p className="truncate font-bold text-lg">{selectedCard.name[language]}</p>
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
                                    <h4 className="font-bold text-white text-lg">{selectedCard.name[language]}</h4>
                                    <p className="text-slate-300 mt-2">{selectedCard.story[language] || 'ไม่มีเรื่องราวสำหรับการ์ดใบนี้'}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    };
    
    const matchesFilters = (card: Card) => {
        if (rarityFilter !== 'all' && card.rarity !== rarityFilter) return false;
        if (elementFilter !== 'all' && card.element !== elementFilter) return false;
        if (searchFilter && !card.name.th.toLowerCase().includes(searchFilter.toLowerCase()) && !card.name.en.toLowerCase().includes(searchFilter.toLowerCase())) return false;
        return true;
    };

    return (
        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-lg p-6 shadow-xl max-w-7xl mx-auto">
            {isAdmin && modalState && modalState.rarity && (
              <CardFormModal 
                mode={modalState.mode} 
                rarity={modalState.card?.rarity || modalState.rarity}
                season={modalState.card?.season || selectedSeason}
                prefilledCardNumber={modalState.prefilledCardNumber}
                cardData={modalState.card} 
                allCards={allCards}
                onClose={() => { setModalState(null); setModalPosition(null); }} 
                onSave={handleSaveCard}
                language={language}
                position={modalPosition}
              />
            )}
            {isAdmin && deletingCard && (
                <DeleteConfirmationModal
                    cardName={deletingCard.name[language]}
                    onClose={() => { setDeletingCard(null); setModalPosition(null); }}
                    onDelete={handleDeleteCard}
                    position={modalPosition}
                />
            )}
            {renderLightboxCard()}
            
            {isAdmin && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                    <GlobalImageUploader
                        title="ภาพหน้าการ์ด (เริ่มต้น)"
                        description="ภาพนี้จะถูกใช้เป็นหน้าการ์ดเริ่มต้น สำหรับช่องที่ยังไม่มีการ์ด"
                        currentImageUrl={globalCardFrontPlaceholder}
                        defaultImageUrl={DEFAULT_CONFIG.global_card_front_image_placeholder}
                        onSave={async (base64) => {
                            await configService.saveConfig('global_card_front_image_placeholder', base64);
                            setGlobalCardFrontPlaceholder(base64);
                        }}
                    />
                    <GlobalImageUploader
                        title="ภาพหลังการ์ด (ใช้ร่วมกันทั้งหมด)"
                        description="อัปโหลดภาพหลังการ์ดเพียงครั้งเดียว รูปภาพนี้จะถูกใช้เป็นการ์ดด้านหลังสำหรับทุกใบ"
                        currentImageUrl={globalCardBack}
                        defaultImageUrl={DEFAULT_CONFIG.global_card_back_image}
                        onSave={async (base64) => {
                            await configService.saveConfig('global_card_back_image', base64);
                            setGlobalCardBack(base64);
                            const confirmUpdate = window.confirm("คุณต้องการอัปเดตภาพหลังการ์ดสำหรับทุกใบที่มีอยู่หรือไม่? (อาจใช้เวลาสักครู่)");
                            if (confirmUpdate) {
                                const allCardsToUpdate = await cardService.getAllCards();
                                const updatedCards = allCardsToUpdate.map(card => ({...card, backImage: base64}));
                                await cardService.saveCards(updatedCards);
                                onCardsUpdate?.();
                            }
                        }}
                    />
                </div>
            )}

            <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
                <div className="flex-grow">
                     {!isAdmin && (
                        <button onClick={() => setShowTracker(!showTracker)} className="bg-slate-700 hover:bg-slate-600 text-white font-semibold py-2 px-4 rounded-md text-sm">
                            {showTracker ? 'ซ่อนตารางติดตาม' : 'แสดงตารางติดตาม'}
                        </button>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={() => onLanguageChange(language === 'th' ? 'en' : 'th')} className="p-2 bg-slate-800 border border-slate-600 rounded-md text-white hover:bg-slate-700" title="สลับภาษา">
                        <LanguageIcon className="w-5 h-5" />
                    </button>
                    <select 
                        value={selectedSeason}
                        onChange={e => setSelectedSeason(Number(e.target.value))}
                        className="bg-slate-800 border border-slate-600 rounded-md p-2 text-white w-full sm:w-auto"
                    >
                        {SEASON_CONFIG.map(season => (
                            <option key={season.season} value={season.season}>{season.name}</option>
                        ))}
                    </select>
                </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 mb-8 p-4 bg-slate-900/50 rounded-lg border border-slate-700 items-center">
                <input 
                    type="text" 
                    placeholder={`ค้นหาด้วยชื่อ (ไทย/อังกฤษ)...`}
                    value={searchFilter} 
                    onChange={e => setSearchFilter(e.target.value)}
                    className="bg-slate-800 border border-slate-600 rounded-md p-2 text-white w-full sm:flex-grow"
                />
                 <select 
                    value={rarityFilter} 
                    onChange={e => setRarityFilter(e.target.value as CardRarity | 'all')}
                    className="bg-slate-800 border border-slate-600 rounded-md p-2 text-white w-full sm:w-auto"
                >
                    <option value="all">ทุกระดับ</option>
                    {RARITY_DATA.map(r => <option key={r.name} value={r.name}>{r.thaiName}</option>)}
                </select>
                <select 
                    value={elementFilter} 
                    onChange={e => setElementFilter(e.target.value)}
                    className="bg-slate-800 border border-slate-600 rounded-md p-2 text-white w-full sm:w-auto"
                >
                    <option value="all">ทุกธาตุ</option>
                    {ELEMENTS_DATA.map(el => <option key={el.name} value={el.name}>{el.emoji} {el.thaiName}</option>)}
                </select>
            </div>

            {currentBanner && (
                <div className="mb-8 rounded-lg overflow-hidden shadow-lg h-32 sm:h-40">
                    <img 
                        src={currentBanner} 
                        alt={`${currentSeasonConfig?.name} Banner`} 
                        className="w-full h-full object-cover" 
                    />
                </div>
            )}
            
            {!isAdmin && showTracker && (
                <div className="mb-8">
                    <h3 className="text-2xl font-bold text-white mb-4">ตารางติดตามการ์ด</h3>
                    <CardTrackingTable userCards={userCards} selectedSeason={selectedSeason} allCards={allCards} />
                </div>
            )}


            <div className="space-y-8">
                {RARITY_DATA.filter(rarityInfo => rarityFilter === 'all' || rarityInfo.name === rarityFilter)
                .map(rarityInfo => {
                    const totalSlots = currentSeasonConfig?.slots[rarityInfo.name] || 0;
                    if (totalSlots === 0) return null;

                    const cardsOfRarity = cardsForCurrentView.filter(c => c.rarity === rarityInfo.name);
                    const filteredCardsOfRarity = cardsOfRarity.filter(matchesFilters);
                    
                    if (!isAdmin && filteredCardsOfRarity.length === 0) {
                        return null;
                    }
                    
                    const ownedCardCount = isAdmin 
                        ? filteredCardsOfRarity.filter(c => !c.name.th.startsWith('[ข้อมูลชั่วคราว]')).length
                        : filteredCardsOfRarity.length;

                    return (
                        <div key={rarityInfo.name}>
                             <div className="flex justify-between items-center p-3 rounded-t-lg" style={{borderLeft: `4px solid ${rarityInfo.color}`}}>
                                <h3 className={`font-semibold text-slate-200 text-xl ${rarityInfo.name === 'Legendary Rare' ? 'legendary-text' : ''}`}>{rarityInfo.thaiName} ({ownedCardCount} / {totalSlots})</h3>
                             </div>
                             <div className="p-4 rounded-b-lg border-t-0" style={rarityInfo.name === 'Legendary Rare' ? {background: 'radial-gradient(ellipse at center, rgba(255, 220, 150, 0.08) 0%, transparent 70%)'} : {background: `radial-gradient(ellipse at center, ${hexToRgba(rarityInfo.color, 0.1)} 0%, transparent 70%)`}}>
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                                     {isAdmin ? (
                                        // Admin View: Show all slots
                                        Array.from({ length: totalSlots }).map((_, index) => {
                                            const slotNumber = index + 1;
                                            const card = cardsOfRarity.find(c => c.cardNumber === slotNumber);
                                            const elementData = card ? ELEMENTS_DATA.find(el => el.name === card.element) : null;
                                            const isVisible = !searchFilter && rarityFilter === 'all' && elementFilter === 'all' ? true : !card || matchesFilters(card);
                                            const isPlaceholder = !card || card.name.th.startsWith('[ข้อมูลชั่วคราว]');
                                            const isLegendary = card?.rarity === 'Legendary Rare';

                                            if (!isVisible) return null;

                                            return !isPlaceholder && card ? (
                                                <div key={card.id} className="aspect-[2.5/3.5] relative group">
                                                    <div className="absolute top-1 left-1 bg-black/70 text-white text-[10px] font-bold px-1.5 py-0.5 rounded z-10">{getCardIdString(card)}</div>
                                                    <div className="absolute top-1 right-1 bg-black/70 text-xl px-1 rounded-full z-10 leading-none">
                                                        {elementData?.emoji}
                                                    </div>
                                                    <div className={`absolute inset-0 bg-cover bg-center border-2 rounded-lg ${isLegendary ? 'legendary-border' : ''}`} style={{backgroundImage: `url(${card.frontImage})`, borderColor: isLegendary ? 'transparent' : RARITY_DATA.find(r=>r.name === card.rarity)?.color}}></div>
                                                    <div className="absolute bottom-1 left-1 right-1 text-white bg-black/60 px-1 py-0.5 rounded text-center text-xs truncate font-bold">{card.name[language]}</div>
                                                    <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 rounded-lg z-20">
                                                        <button onClick={(e) => { e.stopPropagation(); setModalPosition({ top: e.clientY, left: e.clientX }); setSelectedCard(card); }} className="bg-green-600 hover:bg-green-500 text-white text-xs font-bold py-1 px-3 rounded">ดูตัวอย่าง</button>
                                                        <button onClick={(e) => { e.stopPropagation(); setModalPosition({ top: e.clientY, left: e.clientX }); setModalState({ mode: 'edit', card, rarity: card.rarity }); }} className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold py-1 px-3 rounded">แก้ไข</button>
                                                        <button onClick={(e) => { e.stopPropagation(); setModalPosition({ top: e.clientY, left: e.clientX }); setDeletingCard(card); }} className="bg-red-600 hover:bg-red-500 text-white text-xs font-bold py-1 px-3 rounded">ลบ</button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <button 
                                                    key={`add-${slotNumber}`} 
                                                    onClick={(e) => { setModalPosition({ top: e.clientY, left: e.clientX }); setModalState({mode: 'add', rarity: rarityInfo.name, prefilledCardNumber: slotNumber}); }} 
                                                    className="aspect-[2.5/3.5] bg-cover bg-center border-2 border-dashed border-slate-600 rounded-lg group relative hover:border-indigo-500 transition"
                                                    style={{ backgroundImage: `url(${globalCardFrontPlaceholder})` }}
                                                >
                                                    <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white rounded-lg">
                                                        <span className="text-3xl font-bold">+</span>
                                                        <span className="text-xs">เพิ่มการ์ด #{slotNumber}</span>
                                                    </div>
                                                </button>
                                            );
                                        })
                                     ) : (
                                        // User View: Show only owned cards
                                        filteredCardsOfRarity.map(card => {
                                            const elementData = ELEMENTS_DATA.find(el => el.name === card.element);
                                            const isLegendary = card.rarity === 'Legendary Rare';
                                            return (
                                            <div key={card.id} className="aspect-[2.5/3.5] relative group cursor-pointer" onClick={(e) => { setModalPosition({ top: e.clientY, left: e.clientX }); setSelectedCard(card); }}>
                                                 <div className="absolute top-1 left-1 bg-black/70 text-white text-[10px] font-bold px-1.5 py-0.5 rounded z-10">{getCardIdString(card)}</div>
                                                 <div className="absolute top-1 right-1 bg-black/70 text-xl px-1 rounded-full z-10 leading-none">
                                                    {elementData?.emoji}
                                                 </div>
                                                 <div className={`absolute inset-0 bg-cover bg-center border-2 rounded-lg ${isLegendary ? 'legendary-border' : ''}`} style={{backgroundImage: `url(${card.frontImage})`, borderColor: isLegendary ? 'transparent' : RARITY_DATA.find(r=>r.name === card.rarity)?.color}}></div>
                                                <div className="absolute bottom-1 left-1 right-1 text-white bg-black/60 px-1 py-0.5 rounded text-center text-xs truncate font-bold">{card.name[language]}</div>
                                            </div>
                                        )})
                                     )}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
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
                .modal-content-container::-webkit-scrollbar { width: 8px; }
                .modal-content-container::-webkit-scrollbar-track { background: #1e293b; }
                .modal-content-container::-webkit-scrollbar-thumb { background: #475569; }
                .card-flipper {
                    width: 100%; height: 100%; position: relative;
                    transform-style: preserve-3d; transition: transform 0.6s; cursor: pointer;
                }
                .card-flipper.is-flipped { transform: rotateY(180deg); }
                .card-face {
                    position: absolute; width: 100%; height: 100%;
                    backface-visibility: hidden; -webkit-backface-visibility: hidden;
                    border-radius: 0.75rem; /* rounded-xl */
                }
                .card-back-face { transform: rotateY(180deg); }
                 .small-scrollbar::-webkit-scrollbar { width: 4px; }
                .small-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .small-scrollbar::-webkit-scrollbar-thumb { background: #475569; border-radius: 10px; }
                .animate-fade-in { animation: fadeIn 0.3s ease-out; }
                @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
                .animate-pop-in { animation: popIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275); }
                @keyframes popIn { from { opacity: 0; transform: scale(0.9); } to { opacity: 1; transform: scale(1); } }
            `}</style>
        </div>
    );
};

export default CardCollectionView;