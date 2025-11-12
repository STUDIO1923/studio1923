import { InventoryItem } from '../types';
import { ITEM_DATABASE } from './itemDatabase';

const FALLBACK_ITEM_TEMPLATE: InventoryItem = { id: 'junk_stick', name: 'กิ่งไม้ธรรมดา', description: 'กิ่งไม้ที่หาได้ทั่วไป อาจจะขายได้เล็กน้อย', icon: '🪵', type: 'material', value: 1 };

export const generateItem = (questLevel: number): InventoryItem | null => {
    // Filter items that are appropriate for the quest level
    const possibleItems = ITEM_DATABASE.filter(item => 
        (item.minLevel || 0) <= questLevel && (item.maxLevel || 100) >= questLevel
    );

    if (possibleItems.length === 0) {
        return FALLBACK_ITEM_TEMPLATE;
    }

    // Simple random selection from the possible items
    const template = possibleItems[Math.floor(Math.random() * possibleItems.length)];
    
    return template;
};