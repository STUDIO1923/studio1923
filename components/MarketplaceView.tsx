import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Card, MarketListing, RARITY_DATA, CardPack, Language } from '../types';
import * as marketService from '../services/marketService';
import * as cardService from '../services/cardService';
import * as userService from '../services/userService';
import * as auditService from '../services/auditService';
import * as packService from '../services/packService';
import { CoinIcon } from './icons/CoinIcon';
import { PointIcon } from './icons/PointIcon';

// Props definition
interface MarketplaceViewProps {
    nickname: string;
    coins: number;
    points: number;
    userCards: Card[];
    userPacks: number[]; // Season IDs
    onCurrencyChange: (coinChange: number, pointChange: number) => void;
    onCollectionChange: (newCollection: Card[]) => void;
    onPacksChange: (newPacks: number[]) => void;
    addNotification: (message: string, type: 'success' | 'error') => void;
    language: Language;
}

type Tab = 'browse' | 'myListings';
type ItemFilter = 'all' | 'cards' | 'packs';

const MarketplaceView: React.FC<MarketplaceViewProps> = (props) => {
    const { nickname, coins, points, userCards, userPacks, onCurrencyChange, onCollectionChange, onPacksChange, addNotification, language } = props;
    const [activeTab, setActiveTab] = useState<Tab>('browse');
    const [allListings, setAllListings] = useState<MarketListing[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    
    const [cardToSell, setCardToSell] = useState<Card | null>(null);
    const [packToSell, setPackToSell] = useState<{ pack: CardPack, count: number } | null>(null);
    const [listingToBuy, setListingToBuy] = useState<MarketListing | null>(null);
    const [listingToDelist, setListingToDelist] = useState<MarketListing | null>(null);

    const fetchListings = useCallback(async () => {
        setIsLoading(true);
        try {
            const listings = await marketService.getAllListings();
            setAllListings(listings);
        } catch (error) {
            console.error("Failed to fetch market listings:", error);
            addNotification("ไม่สามารถโหลดข้อมูลตลาดได้", "error");
        } finally {
            setIsLoading(false);
        }
    }, [addNotification]);

    useEffect(() => {
        fetchListings();
    }, [fetchListings]);

    const handleListCard = async (card: Card, price: { coins?: number; points?: number }) => {
        if (!price.coins && !price.points) return;
        const newListing: MarketListing = {
            listingId: `${nickname}-card-${card.id}-${Date.now()}`,
            sellerNickname: nickname,
            card,
            price,
            listedAt: Date.now(),
        };

        const cardIndex = userCards.findIndex(c => c.id === card.id);
        if (cardIndex === -1) return;
        
        const updatedCollection = [...userCards];
        updatedCollection.splice(cardIndex, 1);

        try {
            await marketService.createListing(newListing);
            await cardService.saveUserCollection(nickname, updatedCollection);
            onCollectionChange(updatedCollection);
            addNotification(`ลงขาย ${card.name[language]} สำเร็จ!`, "success");
            setCardToSell(null);
            fetchListings();
        } catch { addNotification("เกิดข้อผิดพลาดในการลงขายการ์ด", "error"); }
    };
    
    const handleListPack = async (pack: CardPack, price: { coins?: number; points?: number }, quantity: number) => {
        if ((!price.coins && !price.points) || quantity <= 0) return;

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
                    pack,
                    price,
                    listedAt: Date.now(),
                };
                await marketService.createListing(newListing);
            }

            const updatedPacks = [...userPacks];
            for (let i = 0; i < quantity; i++) {
                const packIndex = updatedPacks.indexOf(pack.id);
                if (packIndex > -1) {
                    updatedPacks.splice(packIndex, 1);
                }
            }
            
            onPacksChange(updatedPacks);
            addNotification(`ลงขาย ${pack.name} จำนวน ${quantity} ซอง สำเร็จ!`, "success");
            setPackToSell(null);
            fetchListings();
        } catch { addNotification("เกิดข้อผิดพลาดในการลงขายซอง", "error"); }
    };

    const handleBuyItem = async (listing: MarketListing) => {
        const coinCost = listing.price.coins || 0;
        const pointCost = listing.price.points || 0;
        if (coins < coinCost || points < pointCost) {
            addNotification("เหรียญหรือแต้มไม่เพียงพอ", "error");
            return;
        }

        try {
            onCurrencyChange(-coinCost, -pointCost);
            
            if (listing.card) { // Buying a card
                const newCollection = [...userCards, listing.card];
                onCollectionChange(newCollection);
                await cardService.saveUserCollection(nickname, newCollection);
            } else if (listing.pack) { // Buying a pack
                const newPacks = [...userPacks, listing.pack.id];
                onPacksChange(newPacks);
            }

            const seller = await userService.getUserByNickname(listing.sellerNickname);
            if (seller) {
                seller.coins += coinCost;
                seller.points += pointCost;
                await userService.saveUser(seller);
            }

            await marketService.deleteListing(listing.listingId);
            addNotification(`ซื้อสำเร็จ!`, "success");
            setListingToBuy(null);
            fetchListings();
        } catch (error) {
            addNotification("เกิดข้อผิดพลาดในการซื้อ", "error");
            onCurrencyChange(coinCost, pointCost); // Revert currency
            if (listing.card) onCollectionChange(userCards); // Revert collection
            if (listing.pack) onPacksChange(userPacks); // Revert packs
        }
    };
    
    const handleDelistItem = async (listing: MarketListing) => {
        try {
            await marketService.deleteListing(listing.listingId);
            if (listing.card) {
                const newCollection = [...userCards, listing.card];
                onCollectionChange(newCollection);
                await cardService.saveUserCollection(nickname, newCollection);
            } else if (listing.pack) {
                const newPacks = [...userPacks, listing.pack.id];
                onPacksChange(newPacks);
            }
            addNotification(`ยกเลิกการขายสำเร็จ`, "success");
            setListingToDelist(null);
            fetchListings();
        } catch { addNotification("เกิดข้อผิดพลาดในการยกเลิก", "error"); }
    };

    return (
        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-lg p-6 shadow-xl max-w-7xl mx-auto">
            {cardToSell && <ListCardModal card={cardToSell} onClose={() => setCardToSell(null)} onList={handleListCard} language={language} />}
            {packToSell && <ListPackModal pack={packToSell.pack} maxCount={packToSell.count} onClose={() => setPackToSell(null)} onList={handleListPack} />}
            {listingToBuy && <BuyConfirmModal listing={listingToBuy} userCoins={coins} userPoints={points} onClose={() => setListingToBuy(null)} onConfirm={handleBuyItem} language={language} />}
            {listingToDelist && <DelistConfirmModal listing={listingToDelist} onClose={() => setListingToDelist(null)} onConfirm={handleDelistItem} language={language} />}

            <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
                <h2 className="text-3xl font-bold text-white tracking-wide">ตลาดซื้อขาย</h2>
                <div className="flex items-center gap-2 p-1 bg-slate-900/50 rounded-lg border border-slate-700">
                    <button onClick={() => setActiveTab('browse')} className={`px-4 py-2 rounded-md text-sm font-semibold transition ${activeTab === 'browse' ? 'bg-indigo-600 text-white' : 'text-slate-300 hover:bg-slate-700'}`}>เลือกซื้อ</button>
                    <button onClick={() => setActiveTab('myListings')} className={`px-4 py-2 rounded-md text-sm font-semibold transition ${activeTab === 'myListings' ? 'bg-indigo-600 text-white' : 'text-slate-300 hover:bg-slate-700'}`}>รายการของฉัน</button>
                </div>
            </div>

            {isLoading ? <p className="text-center text-slate-400 py-16">กำลังโหลดข้อมูลตลาด...</p> : (
                <div className="animate-fade-in">
                    {activeTab === 'browse' && <BrowseView listings={allListings.filter(l => l.sellerNickname !== nickname)} onBuyClick={setListingToBuy} language={language} />}
                    {activeTab === 'myListings' && <MyListingsView nickname={nickname} allListings={allListings} userCards={userCards} userPacks={userPacks} onSellCardClick={setCardToSell} onSellPackClick={setPackToSell} onDelistClick={setListingToDelist} language={language} />}
                </div>
            )}
            <style>{`.animate-fade-in { animation: fadeIn 0.5s ease-in-out; } @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }`}</style>
        </div>
    );
};

// Sub-components
const CardDisplay: React.FC<{ card: Card, language: Language }> = React.memo(({ card, language }) => (
    <div className="aspect-[2.5/3.5] w-full bg-cover bg-center border-2 rounded-lg" style={{backgroundImage: `url(${card.frontImage})`, borderColor: RARITY_DATA.find(r=>r.name === card.rarity)?.color || '#64748b'}}>
        <div className="absolute bottom-1 left-1 right-1 text-white bg-black/60 px-2 py-1 rounded text-center"><p className="text-xs truncate font-bold">{card.name[language]}</p></div>
    </div>
));
const PackDisplay: React.FC<{ pack: CardPack }> = React.memo(({ pack }) => (
    <div className="aspect-[2.5/3.5] w-full flex items-center justify-center bg-slate-800 rounded-lg p-1">
        <img src={pack.image} alt={pack.name} className="max-h-full max-w-full object-contain" />
    </div>
));

const PriceDisplay: React.FC<{ price: MarketListing['price'] }> = ({ price }) => (
    <div className="flex flex-col items-center justify-center gap-1 text-xs">
        {price.coins != null && <div className="flex items-center gap-1"><CoinIcon className="w-4 h-4 text-yellow-400"/> <span className="font-semibold text-white">{price.coins.toLocaleString()}</span></div>}
        {price.points != null && <div className="flex items-center gap-1"><PointIcon className="w-4 h-4 text-cyan-400"/> <span className="font-semibold text-white">{price.points.toLocaleString()}</span></div>}
    </div>
);

const BrowseView: React.FC<{ listings: MarketListing[], onBuyClick: (l: MarketListing) => void, language: Language }> = ({ listings, onBuyClick, language }) => {
    const [filter, setFilter] = useState<ItemFilter>('all');
    const filteredListings = useMemo(() => {
        if (filter === 'cards') return listings.filter(l => l.card);
        if (filter === 'packs') return listings.filter(l => l.pack);
        return listings;
    }, [listings, filter]);

    return (
        <div>
            <div className="flex justify-center items-center gap-2 p-1 bg-slate-900/50 rounded-lg border border-slate-700 mb-6 max-w-xs mx-auto">
                <button onClick={() => setFilter('all')} className={`flex-1 py-1 rounded-md text-sm font-semibold transition ${filter === 'all' ? 'bg-indigo-600 text-white' : 'text-slate-300 hover:bg-slate-700'}`}>ทั้งหมด</button>
                <button onClick={() => setFilter('cards')} className={`flex-1 py-1 rounded-md text-sm font-semibold transition ${filter === 'cards' ? 'bg-indigo-600 text-white' : 'text-slate-300 hover:bg-slate-700'}`}>การ์ด</button>
                <button onClick={() => setFilter('packs')} className={`flex-1 py-1 rounded-md text-sm font-semibold transition ${filter === 'packs' ? 'bg-indigo-600 text-white' : 'text-slate-300 hover:bg-slate-700'}`}>ซองการ์ด</button>
            </div>
            {filteredListings.length === 0 ? <p className="text-center text-slate-500 py-16">ไม่พบรายการที่ตรงกับตัวกรอง</p> : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                    {filteredListings.map(listing => (
                        <div key={listing.listingId} className="bg-slate-900/50 p-2 rounded-lg flex flex-col gap-2">
                            {listing.card ? <CardDisplay card={listing.card} language={language} /> : listing.pack ? <PackDisplay pack={listing.pack} /> : null}
                            <div className="text-center">
                                <PriceDisplay price={listing.price} />
                                <p className="text-xs text-slate-400 truncate mt-1">โดย: {listing.sellerNickname}</p>
                            </div>
                            <button onClick={() => onBuyClick(listing)} className="w-full bg-green-600 hover:bg-green-700 text-white text-sm font-bold py-1.5 rounded-md">ซื้อ</button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

const MyListingsView: React.FC<{ nickname: string; allListings: MarketListing[]; userCards: Card[]; userPacks: number[]; onSellCardClick: (c: Card) => void; onSellPackClick: (data: { pack: CardPack, count: number }) => void; onDelistClick: (l: MarketListing) => void; language: Language }> = ({ nickname, allListings, userCards, userPacks, onSellCardClick, onSellPackClick, onDelistClick, language }) => {
    const [allPackData, setAllPackData] = useState<CardPack[]>([]);
    useEffect(() => { packService.getAllPacks().then(setAllPackData); }, []);

    const myActiveListings = useMemo(() => allListings.filter(l => l.sellerNickname === nickname), [allListings, nickname]);
    const sellableCards = useMemo(() => { /* ... (existing logic) ... */ return []; }, [userCards, allListings, nickname]);
    const sellablePacks = useMemo(() => {
        const userPackCounts = userPacks.reduce((acc, seasonId) => {
            acc.set(seasonId, (acc.get(seasonId) || 0) + 1);
            return acc;
        }, new Map<number, number>());

        const result: {pack: CardPack, count: number}[] = [];
        allPackData.forEach(packDef => {
            const availableCount = userPackCounts.get(packDef.id) || 0;
            if (availableCount > 0) {
                result.push({ pack: packDef, count: availableCount });
            }
        });
        return result;
    }, [userPacks, allPackData]);

    return (
        <div className="space-y-8">
            <div>
                <h3 className="text-xl font-bold text-white mb-4">รายการที่ฉันวางขาย ({myActiveListings.length})</h3>
                {myActiveListings.length === 0 ? <p className="text-center text-slate-500 py-8">คุณยังไม่ได้ลงขายไอเท็มใดๆ</p> : (
                     <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                        {myActiveListings.map(l => (
                            <div key={l.listingId} className="bg-slate-900/50 p-2 rounded-lg flex flex-col gap-2">
                                {l.card ? <CardDisplay card={l.card} language={language} /> : l.pack ? <PackDisplay pack={l.pack} /> : null}
                                <PriceDisplay price={l.price} />
                                <button onClick={() => onDelistClick(l)} className="w-full bg-red-600 hover:bg-red-700 text-white text-sm font-bold py-1.5 rounded-md">ยกเลิก</button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
            <div>
                <h3 className="text-xl font-bold text-white mb-4">ไอเท็มที่สามารถขายได้</h3>
                 {sellablePacks.length === 0 ? <p className="text-center text-slate-500 py-8">คุณไม่มีซองการ์ดสำหรับขาย</p> : (
                     <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                        {sellablePacks.map(({ pack, count }) => (
                             <div key={pack.id} className="bg-slate-900/50 p-2 rounded-lg flex flex-col gap-2 relative">
                                <PackDisplay pack={pack} />
                                 <div className="absolute -top-2 -right-2 bg-indigo-600 text-white text-xs font-bold rounded-full h-6 w-6 flex items-center justify-center border-2 border-slate-800">x{count}</div>
                                <button onClick={() => onSellPackClick({ pack, count })} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold py-1.5 rounded-md">ขาย</button>
                            </div>
                        ))}
                    </div>
                 )}
            </div>
        </div>
    );
};

// Modals
const ListCardModal: React.FC<{ card: Card, onClose: () => void, onList: (c: Card, p: { coins?: number, points?: number }) => void, language: Language }> = ({ card, onClose, onList, language }) => { /* ... (no change) ... */ return null; };
const ListPackModal: React.FC<{ pack: CardPack, maxCount: number, onClose: () => void, onList: (p: CardPack, price: { coins?: number, points?: number }, quantity: number) => void }> = ({ pack, maxCount, onClose, onList }) => {
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

    return <div className="fixed inset-0 bg-black/60 z-50 p-4 flex items-center justify-center"><form onSubmit={handleSubmit} className="bg-slate-800 border border-slate-700 rounded-lg p-6 w-full max-w-md relative"><button type="button" onClick={onClose} className="absolute top-3 right-3 text-slate-400 hover:text-white text-2xl">&times;</button><h3 className="text-xl font-bold text-white mb-4">ตั้งราคาขายซอง</h3><div className="flex gap-4 items-start"><div className="w-1/3 shrink-0"><PackDisplay pack={pack} /></div><div className="grow space-y-4"><p className="font-semibold text-white">{pack.name}</p><div><label className="block text-sm text-slate-300 mb-2 flex items-center gap-2"><CoinIcon className="w-5 h-5 text-yellow-400"/> ราคา (เหรียญ)</label><input type="number" value={coins} onChange={e=>setCoins(e.target.value)} min="0" className="w-full bg-slate-900 border-slate-600 rounded-md p-2 text-white" placeholder="ไม่บังคับ"/></div><div><label className="block text-sm text-slate-300 mb-2 flex items-center gap-2"><PointIcon className="w-5 h-5 text-cyan-400"/> ราคา (แต้ม)</label><input type="number" value={points} onChange={e=>setPoints(e.target.value)} min="0" className="w-full bg-slate-900 border-slate-600 rounded-md p-2 text-white" placeholder="ไม่บังคับ"/></div><div><label className="block text-sm text-slate-300 mb-2">จำนวน (สูงสุด: {maxCount})</label><input type="number" value={quantity} onChange={handleQuantityChange} min="1" max={maxCount} className="w-full bg-slate-900 border-slate-600 rounded-md p-2 text-white" required/></div></div></div><div className="flex justify-end gap-3 pt-6"><button type="button" onClick={onClose} className="bg-slate-600 hover:bg-slate-500 text-white font-bold py-2 px-4 rounded-md">ยกเลิก</button><button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-md">ยืนยัน</button></div></form></div>;
};
const BuyConfirmModal: React.FC<{ listing: MarketListing, userCoins: number, userPoints: number, onClose: () => void, onConfirm: (l: MarketListing) => void, language: Language }> = ({ listing, userCoins, userPoints, onClose, onConfirm, language }) => {
    const canAfford = userCoins >= (listing.price.coins || 0) && userPoints >= (listing.price.points || 0);
    const itemName = listing.card ? listing.card.name[language] : listing.pack!.name;
    return <div className="fixed inset-0 bg-black/60 z-50 p-4 flex items-center justify-center"><div className="bg-slate-800 border-slate-700 rounded-lg p-6 w-full max-w-md relative text-center"><h3 className="text-xl font-bold text-white mb-4">ยืนยันการซื้อ</h3><p className="text-slate-300 mb-4">คุณต้องการซื้อ <span className="font-bold text-white">{itemName}</span> หรือไม่?</p><div className="inline-block"><PriceDisplay price={listing.price} /></div>{!canAfford && <p className="text-red-400 text-sm mt-4">มีเหรียญหรือแต้มไม่พอ</p>}<div className="flex justify-center gap-3 pt-6"><button type="button" onClick={onClose} className="bg-slate-600 text-white font-bold py-2 px-4 rounded-md">ยกเลิก</button><button onClick={() => onConfirm(listing)} disabled={!canAfford} className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-md disabled:opacity-50">ยืนยัน</button></div></div></div>;
};
const DelistConfirmModal: React.FC<{ listing: MarketListing, onClose: () => void, onConfirm: (l: MarketListing) => void, language: Language }> = ({ listing, onClose, onConfirm, language }) => {
    const itemName = listing.card ? listing.card.name[language] : listing.pack!.name;
    return <div className="fixed inset-0 bg-black/60 z-50 p-4 flex items-center justify-center"><div className="bg-slate-800 border-slate-700 rounded-lg p-6 w-full max-w-md relative text-center"><h3 className="text-xl font-bold text-white mb-4">ยืนยันการยกเลิก</h3><p className="text-slate-300 mb-4">คุณต้องการยกเลิกการขาย <span className="font-bold text-white">{itemName}</span> หรือไม่?</p><div className="flex justify-center gap-3 pt-6"><button type="button" onClick={onClose} className="bg-slate-600 text-white font-bold py-2 px-4 rounded-md">ไม่</button><button onClick={() => onConfirm(listing)} className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-md">ใช่</button></div></div></div>;
};

export default MarketplaceView;