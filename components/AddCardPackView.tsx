import React, { useState, useEffect } from 'react';
import { SEASON_CONFIG, CardPack } from '../types';
import * as packService from '../services/packService';
import { IconImageText } from './icons/IconImageText';
import { CoinIcon } from './icons/CoinIcon';

interface AddCardPackViewProps {
  onBack: () => void;
}

const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = error => reject(error);
    });
};

const PackFormModal: React.FC<{
    season: number;
    existingPack?: CardPack;
    onClose: () => void;
    onSave: (pack: CardPack) => void;
}> = ({ season, existingPack, onClose, onSave }) => {
    const [name, setName] = useState(existingPack?.name || `ซองการ์ด ซีซั่น ${season}`);
    const [description, setDescription] = useState(existingPack?.description || `สุ่มรับการ์ด 5 ใบจาก ซีซั่น ${season}`);
    const [cost, setCost] = useState(existingPack?.cost || 150);
    const [image, setImage] = useState<string | null>(existingPack?.image || null);
    const [error, setError] = useState<string | null>(null);
    const title = existingPack ? 'แก้ไขซองการ์ด' : 'เพิ่มซองการ์ดใหม่';

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        setImage(null);
        setError(null);

        if (!file) return;

        const MAX_SIZE = 5 * 1024 * 1024; // 5MB
        if (file.size > MAX_SIZE) {
            setError('ขนาดไฟล์ต้องไม่เกิน 5MB');
            return;
        }

        try {
            const base64 = await fileToBase64(file);
            setImage(base64);
        } catch {
            setError('ไม่สามารถอ่านไฟล์ได้');
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name || !description || !cost || !image) {
            alert('กรุณากรอกข้อมูลและอัปโหลดรูปภาพให้ครบถ้วน');
            return;
        }
        onSave({ id: season, name, description, cost, image });
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 shadow-xl w-full max-w-md relative">
                <button onClick={onClose} className="absolute top-3 right-3 text-slate-400 hover:text-white text-2xl">&times;</button>
                <h3 className="text-xl font-bold text-white mb-4">{title} - {SEASON_CONFIG.find(s => s.season === season)?.name}</h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">รูปภาพซองการ์ด</label>
                        <div className="mt-1 flex justify-center items-center px-6 pt-5 pb-6 border-2 border-slate-600 border-dashed rounded-md">
                            {image ? (
                                <div className="relative group">
                                    <img src={image} alt="preview" className="h-40 object-contain" />
                                    <label htmlFor="pack-upload" className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white cursor-pointer">เปลี่ยนรูป</label>
                                </div>
                            ) : (
                                <div className="space-y-1 text-center">
                                    <IconImageText className="mx-auto h-12 w-12 text-slate-500" />
                                    <label htmlFor="pack-upload" className="cursor-pointer text-indigo-400 hover:text-indigo-300 font-medium">เลือกไฟล์</label>
                                </div>
                            )}
                        </div>
                        <input id="pack-upload" type="file" className="sr-only" onChange={handleFileChange} accept="image/*" />
                        {error && <p className="text-red-400 text-xs mt-1">{error}</p>}
                        <p className="text-xs text-slate-500 mt-2 text-center">ขนาดไฟล์ต้องไม่เกิน 5MB</p>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">ชื่อซองการ์ด</label>
                        <input type="text" value={name} onChange={e => setName(e.target.value)} required className="w-full bg-slate-900 border border-slate-600 rounded-md p-2 text-white" />
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">คำอธิบาย</label>
                        <textarea value={description} onChange={e => setDescription(e.target.value)} required rows={2} className="w-full bg-slate-900 border border-slate-600 rounded-md p-2 text-white" />
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">ราคา (เหรียญ)</label>
                        <input type="number" value={cost} onChange={e => setCost(Number(e.target.value))} required min="0" className="w-full bg-slate-900 border border-slate-600 rounded-md p-2 text-white" />
                    </div>
                    <div className="flex justify-end gap-3 pt-4">
                        <button type="button" onClick={onClose} className="bg-slate-600 hover:bg-slate-500 text-white font-bold py-2 px-4 rounded-md">ยกเลิก</button>
                        <button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-md">บันทึก</button>
                    </div>
                </form>
            </div>
        </div>
    );
};


const AddCardPackView: React.FC<AddCardPackViewProps> = ({ onBack }) => {
  const [packs, setPacks] = useState<Map<number, CardPack>>(new Map());
  const [modalState, setModalState] = useState<{ season: number; pack?: CardPack } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadPacks = async () => {
      setIsLoading(true);
      try {
          const fetchedPacks = await packService.getAllPacks();
          const packMap = new Map<number, CardPack>();
          fetchedPacks.forEach(p => packMap.set(p.id, p));
          setPacks(packMap);
      } catch (error) {
          console.error("Failed to load packs:", error);
      } finally {
          setIsLoading(false);
      }
  };

  useEffect(() => {
      loadPacks();
  }, []);

  const handleSavePack = async (pack: CardPack) => {
      await packService.savePack(pack);
      setModalState(null);
      await loadPacks();
  };

  return (
    <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-lg p-6 shadow-xl max-w-5xl mx-auto">
      {modalState && (
        <PackFormModal 
          season={modalState.season} 
          existingPack={modalState.pack}
          onClose={() => setModalState(null)} 
          onSave={handleSavePack} 
        />
      )}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold text-white tracking-wide">
          จัดการซองการ์ด
        </h2>
        <button onClick={onBack} className="bg-slate-700 hover:bg-slate-600 text-white font-bold py-2 px-4 rounded-md transition">
          &larr; กลับ
        </button>
      </div>
      
      {isLoading ? <p className="text-center text-slate-400">กำลังโหลด...</p> : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {SEASON_CONFIG.map(seasonConfig => {
                const pack = packs.get(seasonConfig.season);
                return (
                    <div key={seasonConfig.season} className="bg-slate-900/50 p-4 rounded-lg border border-slate-700">
                        <h3 className="font-bold text-xl text-white mb-4">{seasonConfig.name}</h3>
                        {pack ? (
                            <div className="flex gap-4">
                                <img src={pack.image} alt={pack.name} className="w-24 h-32 object-contain rounded-md bg-slate-800 flex-shrink-0" />
                                <div className="text-sm">
                                    <p className="font-semibold text-slate-200">{pack.name}</p>
                                    <p className="text-slate-400 text-xs mt-1">{pack.description}</p>
                                    <div className="flex items-center gap-2 mt-2 text-yellow-400 font-semibold">
                                        <CoinIcon className="w-4 h-4" />
                                        <span>{pack.cost.toLocaleString()} เหรียญ</span>
                                    </div>
                                    <button onClick={() => setModalState({ season: seasonConfig.season, pack })} className="mt-3 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold py-1 px-3 rounded-md">แก้ไข</button>
                                </div>
                            </div>
                        ) : (
                            <div className="flex items-center justify-center h-32">
                                <button onClick={() => setModalState({ season: seasonConfig.season })} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-md">
                                    + เพิ่มซองการ์ด
                                </button>
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
      )}
    </div>
  );
};

export default AddCardPackView;
