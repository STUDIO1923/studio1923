import React, { useState, useEffect, useMemo } from 'react';
import { CoinIcon } from './icons/CoinIcon';
import { CardPack, PetData, CardRarity } from '../types';
import * as packService from '../services/packService';

interface ShopViewProps {
  coins: number;
  onBuyPack: (pack: CardPack, quantity: number) => boolean;
  pet: PetData | null;
  onRedeemCardFragments: () => void;
  addNotification: (message: string, type: 'success' | 'error') => void;
}

const PACK_RARITY_RATES: { name: string; rate: string; color: string }[] = [
    { name: 'Common', rate: '70.0%', color: '#94a3b8' },
    { name: 'Rare', rate: '24.9%', color: '#60a5fa' },
    { name: 'Super Rare', rate: '4.0%', color: '#a78bfa' },
    { name: 'Ultra Rare', rate: '0.8%', color: '#f472b6' },
    { name: 'Ultimate Rare', rate: '0.2%', color: '#ef4444' },
    { name: 'Secret Rare', rate: '0.07%', color: '#eab308' },
    { name: 'Parallel Rare', rate: '0.02%', color: '#2dd4bf' },
    { name: 'Legendary Rare', rate: '0.01%', color: '#FFFFFF' },
];

const ShopView: React.FC<ShopViewProps> = ({ coins, onBuyPack, pet, onRedeemCardFragments, addNotification }) => {
    const [packsForSale, setPacksForSale] = useState<CardPack[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

    const cardFragmentCount = useMemo(() => {
        if (!pet) return 0;
        return pet.inventory.filter(item => item?.name === 'เศษการ์ด').length;
    }, [pet]);

    useEffect(() => {
        const fetchPacks = async () => {
            setIsLoading(true);
            try {
                const packs = await packService.getAllPacks();
                setPacksForSale(packs.sort((a, b) => a.id - b.id)); // Sort by season
            } catch (error) {
                console.error("Failed to load packs for shop:", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchPacks();
    }, []);

    const handleBuy = (pack: CardPack, quantity: number) => {
        const success = onBuyPack(pack, quantity);
        if (success) {
            setFeedback({ type: 'success', message: `คุณซื้อ ${pack.name} x${quantity} สำเร็จ!` });
        } else {
            setFeedback({ type: 'error', message: 'เหรียญของคุณไม่เพียงพอ' });
        }

        setTimeout(() => setFeedback(null), 3000);
    };
    
    const handleRedeemClick = () => {
        if (cardFragmentCount >= 10) {
            onRedeemCardFragments();
        } else {
            addNotification("มีเศษการ์ดไม่เพียงพอ", "error");
        }
    };

    const getRarityColor = (cost: number) => {
        if (cost >= 2000) return { bg: 'from-yellow-600 to-yellow-800', border: 'border-yellow-500' };
        if (cost >= 700) return { bg: 'from-indigo-700 to-indigo-800', border: 'border-indigo-500' };
        return { bg: 'from-slate-700 to-slate-800', border: 'border-slate-600' };
    };

    return (
        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-lg p-6 shadow-xl max-w-6xl mx-auto space-y-12">
            <div>
                <div className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4">
                    <h2 className="text-3xl font-bold text-white tracking-wide">
                    ร้านค้า
                    </h2>
                    <div className="flex items-center gap-2 bg-slate-900/50 px-4 py-2 rounded-full border border-slate-600">
                        <span className="text-slate-400">เหรียญของคุณ:</span>
                        <CoinIcon className="w-6 h-6 text-yellow-400" />
                        <span className="font-bold text-white text-lg">{coins.toLocaleString()}</span>
                    </div>
                </div>

                {feedback && (
                    <div className={`mb-6 p-3 rounded-lg text-center font-semibold animate-fade-in ${
                        feedback.type === 'success' 
                            ? 'bg-green-500/20 text-green-300 border border-green-500/30' 
                            : 'bg-red-500/20 text-red-300 border border-red-500/30'
                    }`}>
                        {feedback.message}
                    </div>
                )}
                
                <div className="mb-12">
                    <h3 className="text-2xl font-bold text-white tracking-wide mb-6 border-l-4 border-purple-500 pl-4">อัตราการได้รับการ์ด</h3>
                    <div className="bg-slate-900/50 p-6 rounded-lg border border-slate-700">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {PACK_RARITY_RATES.map(rarity => (
                                <div key={rarity.name} className="flex items-center justify-between bg-slate-800 p-3 rounded-md">
                                    {rarity.name === 'Legendary Rare' ? (
                                        <span className="font-semibold text-sm legendary-text">{rarity.name}</span>
                                    ) : (
                                        <span className="font-semibold text-sm" style={{ color: rarity.color }}>{rarity.name}</span>
                                    )}
                                    <span className="font-mono font-bold text-white">{rarity.rate}</span>
                                </div>
                            ))}
                        </div>
                        <p className="text-xs text-slate-500 mt-4 text-center">*อัตราต่อการ์ด 1 ใบ และมีการันตีการ์ดระดับ "Rare" หรือสูงกว่า 1 ใบต่อซอง</p>
                    </div>
                </div>

                <h3 className="text-2xl font-bold text-white tracking-wide mb-6 border-l-4 border-indigo-500 pl-4">ซองการ์ด</h3>
                {isLoading ? <p className="text-center text-slate-400 py-16">กำลังโหลดร้านค้า...</p> :
                packsForSale.length === 0 ? <p className="text-center text-slate-500 py-16">ขออภัย, ยังไม่มีซองการ์ดวางขายในขณะนี้</p> :
                (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {packsForSale.map(pack => {
                            const colors = getRarityColor(pack.cost);
                            return (
                                <div key={pack.id} className={`bg-gradient-to-br ${colors.bg} border ${colors.border} rounded-lg p-6 flex flex-col shadow-lg hover:shadow-2xl hover:-translate-y-1 transition-all duration-300`}>
                                    <div className="h-48 flex items-center justify-center mb-4">
                                        <img src={pack.image} alt={pack.name} className="max-h-full max-w-full object-contain" />
                                    </div>
                                    <h3 className="text-2xl font-bold text-white text-center mb-2">{pack.name}</h3>
                                    <p className="text-slate-300 text-center text-sm flex-grow mb-6">{pack.description}</p>
                                    
                                    <div className="mt-auto space-y-2">
                                        <button 
                                            onClick={() => handleBuy(pack, 1)}
                                            disabled={coins < pack.cost}
                                            className={`w-full font-bold py-3 px-4 rounded-lg transition-colors transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2 ${
                                                coins >= pack.cost 
                                                    ? 'bg-white/90 hover:bg-white text-slate-900' 
                                                    : 'bg-slate-600 text-slate-400'
                                            }`}
                                        >
                                            <span>ซื้อ x1</span>
                                            <span className="flex items-center gap-1"><CoinIcon className="w-5 h-5"/>{pack.cost.toLocaleString()}</span>
                                        </button>
                                        <div className="grid grid-cols-3 gap-2">
                                            {[3, 5, 10].map(qty => (
                                                <button
                                                    key={qty}
                                                    onClick={() => handleBuy(pack, qty)}
                                                    disabled={coins < pack.cost * qty}
                                                    className="w-full bg-slate-900/50 hover:bg-slate-900/80 text-white font-semibold py-2 rounded-md transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                    x{qty}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}
            </div>

            {pet && (
                <div className="space-y-8">
                    <h3 className="text-2xl font-bold text-white tracking-wide border-l-4 border-cyan-500 pl-4">แลกเปลี่ยนไอเท็ม</h3>
                     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {/* Card Fragment Redemption */}
                        <div className="bg-gradient-to-br from-cyan-700 to-cyan-900 border border-cyan-600 rounded-lg p-6 flex flex-col items-center shadow-lg">
                            <h3 className="text-xl font-bold text-white text-center mb-2">แลกรับการ์ดสุ่ม</h3>
                            <p className="text-slate-300 text-center text-sm flex-grow mb-6">ใช้เศษการ์ด 10 ชิ้นเพื่อสุ่มรับการ์ด 1 ใบ! (ความหายากขึ้นอยู่กับค่าสถานะสัตว์เลี้ยง)</p>
                            <div className="flex items-center justify-center gap-4 mb-6">
                                <div className="flex items-center gap-2 text-white">
                                    <span className="text-4xl">🧩</span>
                                    <span className="text-lg font-bold">x10</span>
                                </div>
                                <span className="text-2xl font-light text-cyan-300">→</span>
                                <div className="flex items-center gap-2 text-white">
                                    <span className="text-4xl">🃏</span>
                                    <span className="text-lg font-bold">x1</span>
                                </div>
                            </div>
                            <p className="text-sm text-cyan-200 mb-4">คุณมีเศษการ์ด: {cardFragmentCount} / 10</p>
                            <button
                                onClick={handleRedeemClick}
                                disabled={cardFragmentCount < 10}
                                className={`w-full font-bold py-3 px-4 rounded-lg transition-colors transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none ${
                                    cardFragmentCount >= 10
                                        ? 'bg-white/90 hover:bg-white text-slate-900'
                                        : 'bg-slate-600 text-slate-400'
                                }`}
                            >
                                แลกเปลี่ยน
                            </button>
                        </div>
                    </div>
                </div>
            )}
            <style>{`
                @keyframes rainbow-text-anim {
                    0% { background-position: 0% 50%; }
                    50% { background-position: 100% 50%; }
                    100% { background-position: 0% 50%; }
                }
                .legendary-text {
                    background: linear-gradient(90deg, #ff6565, #ffab2c, #ffff65, #65ff65, #6565ff, #ab65ff, #ff65ff);
                    background-size: 200% auto;
                    -webkit-background-clip: text;
                    background-clip: text;
                    -webkit-text-fill-color: transparent;
                    animation: rainbow-text-anim 3s linear infinite;
                    font-weight: 700 !important;
                }
                .animate-fade-in { animation: fadeIn 0.5s ease-in-out; } @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
            `}</style>
        </div>
    );
};

export default ShopView;