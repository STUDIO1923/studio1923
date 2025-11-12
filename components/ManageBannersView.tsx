import React, { useState, useEffect, useCallback } from 'react';
import * as configService from '../services/configService';
import { SEASON_CONFIG, PET_QUEST_BACKGROUND_THEMES, PetBackgroundItem } from '../types';
import { IconImageText } from './icons/IconImageText';
import { DUNGEON_DATABASE } from '../services/dungeonDatabase';

interface ManageBannersViewProps {
  onConfigChange: () => void;
}

const fileToBase64 = (file: File, quality = 0.85): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
             const img = new Image();
             img.src = reader.result as string;
             img.onload = () => {
                const canvas = document.createElement('canvas');
                const MAX_WIDTH = 800;
                const MAX_HEIGHT = 800;
                let width = img.width;
                let height = img.height;

                if (width > height) {
                    if (width > MAX_WIDTH) {
                        height *= MAX_WIDTH / width;
                        width = MAX_WIDTH;
                    }
                } else {
                    if (height > MAX_HEIGHT) {
                        width *= MAX_HEIGHT / height;
                        height = MAX_HEIGHT;
                    }
                }
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx?.drawImage(img, 0, 0, width, height);
                resolve(canvas.toDataURL('image/jpeg', quality));
             }
        };
        reader.onerror = error => reject(error);
    });
};

const ConfigImageUploader: React.FC<{
    configKey: string;
    title: string;
    currentImageUrl?: string;
    onSave: (key: string, base64: string) => Promise<void>;
    aspectRatio?: string;
    sizeRecommendation?: string;
    maxSizeMB?: number;
}> = ({ configKey, title, currentImageUrl, onSave, aspectRatio = 'aspect-video', sizeRecommendation = '1920x1080px', maxSizeMB = 2 }) => {
    const [previewImage, setPreviewImage] = useState<string | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > maxSizeMB * 1024 * 1024) {
            alert(`ขนาดไฟล์ต้องไม่เกิน ${maxSizeMB}MB`);
            return;
        }

        setIsProcessing(true);
        try {
            const base64 = await fileToBase64(file);
            setPreviewImage(base64);
        } catch (error) {
            alert("เกิดข้อผิดพลาดในการประมวลผลรูปภาพ");
        } finally {
            setIsProcessing(false);
        }
    };

    const handleSave = async () => {
        if (!previewImage) return;
        setIsProcessing(true);
        await onSave(configKey, previewImage);
        setIsProcessing(false);
        setPreviewImage(null);
    };

    const handleRemove = async () => {
        if (window.confirm('คุณต้องการนำรูปภาพนี้ออกหรือไม่?')) {
            setIsProcessing(true);
            await onSave(configKey, ''); // Save an empty string to remove
            setIsProcessing(false);
            setPreviewImage(null);
        }
    };

    const displayImage = previewImage || currentImageUrl;

    return (
        <div className="bg-slate-900/50 p-4 rounded-lg border border-slate-700 flex flex-col">
            <h3 className="font-semibold text-white mb-3 text-center sm:text-left">{title}</h3>
            <div className={`${aspectRatio} bg-slate-800 rounded-md flex items-center justify-center mb-3`}>
                {displayImage ? (
                    <img src={displayImage} alt={title} className="w-full h-full object-cover rounded-md" />
                ) : (
                    <IconImageText className="w-12 h-12 text-slate-600" />
                )}
            </div>
            <div className="mt-auto space-y-2">
                <div className="flex items-center gap-2 justify-center flex-wrap">
                    <label className={`inline-block ${isProcessing ? 'bg-slate-600 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700 cursor-pointer'} text-white font-bold py-2 px-4 rounded-md transition text-sm`}>
                        {isProcessing ? 'กำลัง...' : 'เปลี่ยนรูป'}
                        <input type="file" className="sr-only" onChange={handleFileChange} accept="image/*" disabled={isProcessing} />
                    </label>
                    {currentImageUrl && !previewImage && (
                         <button onClick={handleRemove} disabled={isProcessing} className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-md transition text-sm disabled:opacity-50">นำออก</button>
                    )}
                    {previewImage && !isProcessing && (
                        <>
                            <button onClick={handleSave} className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-md transition text-sm">บันทึก</button>
                            <button onClick={() => setPreviewImage(null)} className="bg-slate-600 hover:bg-slate-700 text-white font-bold py-2 px-4 rounded-md transition text-sm">ยกเลิก</button>
                        </>
                    )}
                </div>
                 <p className="text-xs text-slate-500 text-center">แนะนำ: {sizeRecommendation}</p>
            </div>
        </div>
    );
};

const ManageBannersView: React.FC<ManageBannersViewProps> = ({ onConfigChange }) => {
    const [configs, setConfigs] = useState<Record<string, string>>({});
    const [homeBackgroundOptions, setHomeBackgroundOptions] = useState<PetBackgroundItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    const loadConfigs = useCallback(async () => {
        setIsLoading(true);
        try {
            const fetchedConfigs = await configService.getConfig();
            setConfigs(fetchedConfigs);
            const homeOptions = JSON.parse(fetchedConfigs.pet_home_background_options || '[]');
            const fullHomeOptions: PetBackgroundItem[] = Array(9).fill(null).map((_, i) => 
                homeOptions[i] || { id: `home_bg_opt_${i}`, name: `พื้นหลัง ${i + 1}`, image: '' }
            );
            setHomeBackgroundOptions(fullHomeOptions);
        } catch (error) {
            console.error("Failed to load configs:", error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        loadConfigs();
    }, [loadConfigs]);

    const handleSave = async (key: string, value: string) => {
        await configService.saveConfig(key, value);
        setConfigs(prev => ({...prev, [key]: value}));
        onConfigChange();
    };

    const handleHomeOptionUpdate = (index: number, updatedItem: PetBackgroundItem) => {
        const newItems = [...homeBackgroundOptions];
        newItems[index] = updatedItem;
        setHomeBackgroundOptions(newItems);
    };

    const handleSaveHomeOptions = async () => {
        setIsSaving(true);
        await handleSave('pet_home_background_options', JSON.stringify(homeBackgroundOptions));
        setIsSaving(false);
        alert('บันทึกตัวเลือกพื้นหลังสำเร็จ!');
    };
    
    const BACKGROUND_CONFIGS = [
        { key: 'view_slot_background', title: 'หน้าสล็อต' },
        { key: 'view_shop_background', title: 'หน้าร้านค้า' },
        { key: 'view_market_background', title: 'หน้าตลาด' },
        { key: 'view_chat_background', title: 'หน้าห้องแชท' },
        { key: 'view_packOpening_background', title: 'หน้าเปิดซองการ์ด' },
        { key: 'view_collection_background', title: 'หน้าคอลเลคชั่น' },
        { key: 'view_pets_background', title: 'หน้าสัตว์เลี้ยง (Default)' },
        { key: 'view_luckyDraw_background', title: 'หน้า Lucky Draw' },
        { key: 'view_dungeon_background', title: 'หน้าดันเจี้ยน (Default)' },
    ];

    if (isLoading) {
        return <p className="text-center text-slate-400 py-16">กำลังโหลดการตั้งค่า...</p>;
    }

    return (
        <div className="space-y-12">
            <section>
                <h2 className="text-2xl font-bold text-white mb-4 border-b-2 border-slate-700 pb-2">พื้นหลังสัตว์เลี้ยง</h2>
                <div className="space-y-8">
                    <div>
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-semibold text-slate-300">ตัวเลือกพื้นหลังที่บ้าน (9 ภาพ)</h3>
                            <button onClick={handleSaveHomeOptions} disabled={isSaving} className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-md transition disabled:opacity-50">
                                {isSaving ? 'กำลังบันทึก...' : 'บันทึกการเปลี่ยนแปลง'}
                            </button>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                           {homeBackgroundOptions.map((item, index) => {
                                const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
                                    const file = e.target.files?.[0]; if (!file) return;
                                    const base64 = await fileToBase64(file, 0.8);
                                    handleHomeOptionUpdate(index, {...item, image: base64 });
                                };
                                return (
                                     <div key={item.id} className="bg-slate-900/50 p-4 rounded-lg border border-slate-700 space-y-3">
                                        <div className="aspect-video bg-slate-800 rounded-md flex items-center justify-center relative group">
                                            {item.image ? <img src={item.image} className="w-full h-full object-cover rounded-md" /> : <IconImageText className="w-12 h-12 text-slate-600" />}
                                             <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex flex-col gap-2 items-center justify-center text-white cursor-pointer transition-opacity">
                                                <label className="cursor-pointer bg-blue-600 hover:bg-blue-500 text-xs px-3 py-1.5 rounded">เปลี่ยนรูป<input type="file" className="sr-only" onChange={handleFileChange} /></label>
                                                {item.image && <button onClick={() => handleHomeOptionUpdate(index, {...item, image: ''})} className="bg-red-600 hover:bg-red-500 text-xs px-3 py-1.5 rounded">นำออก</button>}
                                             </div>
                                        </div>
                                        <input type="text" placeholder="ชื่อพื้นหลัง" value={item.name} onChange={e => handleHomeOptionUpdate(index, {...item, name: e.target.value})} className="w-full bg-slate-800 border border-slate-600 rounded-md p-2 text-white text-sm" />
                                    </div>
                                )
                           })}
                        </div>
                    </div>
                     <div>
                        <h3 className="text-xl font-semibold text-slate-300 mb-4">พื้นหลังตอนทำเควส</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                            {PET_QUEST_BACKGROUND_THEMES.map(theme => (
                                <ConfigImageUploader
                                    key={`pet_quest_background_${theme.key}`}
                                    configKey={`pet_quest_background_${theme.key}`}
                                    title={theme.name}
                                    currentImageUrl={configs[`pet_quest_background_${theme.key}`]}
                                    onSave={handleSave}
                                    aspectRatio="aspect-[4/3]"
                                    sizeRecommendation="800x600px, ไม่เกิน 2MB"
                                />
                            ))}
                        </div>
                    </div>
                </div>
            </section>
            
            <section>
                <h2 className="text-2xl font-bold text-white mb-4 border-b-2 border-slate-700 pb-2">หน้าเข้าสู่ระบบ</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                    <ConfigImageUploader 
                        configKey="auth_background"
                        title="พื้นหลังหน้า Login/Register"
                        currentImageUrl={configs.auth_background}
                        onSave={handleSave}
                    />
                </div>
            </section>

             <section>
                <h2 className="text-2xl font-bold text-white mb-4 border-b-2 border-slate-700 pb-2">พื้นหลังดันเจี้ยน</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {DUNGEON_DATABASE.map(dungeon => (
                        <ConfigImageUploader
                            key={`dungeon_bg_${dungeon.id}`}
                            configKey={`dungeon_bg_${dungeon.id}`}
                            title={dungeon.name}
                            currentImageUrl={configs[`dungeon_bg_${dungeon.id}`]}
                            onSave={handleSave}
                        />
                    ))}
                </div>
            </section>
            
            <section>
                 <h2 className="text-2xl font-bold text-white mb-4 border-b-2 border-slate-700 pb-2">แบนเนอร์ประจำซีซั่น</h2>
                 <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {SEASON_CONFIG.map(season => (
                        <ConfigImageUploader
                            key={`season_${season.season}_banner`}
                            configKey={`season_${season.season}_banner`}
                            title={season.name}
                            currentImageUrl={configs[`season_${season.season}_banner`]}
                            onSave={handleSave}
                        />
                    ))}
                 </div>
            </section>
            
            <section>
                 <h2 className="text-2xl font-bold text-white mb-4 border-b-2 border-slate-700 pb-2">พื้นหลังหน้าต่างๆ</h2>
                 <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {BACKGROUND_CONFIGS.map(bg => (
                        <ConfigImageUploader
                            key={bg.key}
                            configKey={bg.key}
                            title={bg.title}
                            currentImageUrl={configs[bg.key]}
                            onSave={handleSave}
                        />
                    ))}
                 </div>
            </section>
        </div>
    );
};

export default ManageBannersView;