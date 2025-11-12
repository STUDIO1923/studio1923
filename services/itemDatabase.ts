import { InventoryItem } from "../types";

export const ITEM_DATABASE: InventoryItem[] = [
    // Special Items
    { id: 'special_card_fragment', name: 'เศษการ์ด', description: 'ชิ้นส่วนลึกลับของการ์ดที่ถูกฉีกขาด สะสมครบ 10 ชิ้นเพื่อนำไปแลกรับการ์ดสุ่มได้ที่ร้านค้า', icon: '🧩', type: 'material', value: 0, minLevel: 1, maxLevel: 100 },

    // Junk Items (Value 1-5)
    { id: 'junk_wood_stick', name: 'กิ่งไม้ธรรมดา', description: 'กิ่งไม้ที่หาได้ทั่วไป', icon: '🪵', type: 'material', value: 1, minLevel: 1, maxLevel: 5 },
    { id: 'junk_shiny_pebble', name: 'ก้อนหินมันวาว', description: 'หินที่ดูเหมือนจะไม่มีค่าอะไร', icon: '🪨', type: 'material', value: 2, minLevel: 1, maxLevel: 10 },
    { id: 'junk_old_cloth', name: 'เศษผ้าเก่า', description: 'ผ้าขาดๆ ที่อาจเคยเป็นเสื้อผ้ามาก่อน', icon: '🧣', type: 'material', value: 1, minLevel: 1, maxLevel: 8 },
    { id: 'junk_bird_feather', name: 'ขนนก', description: 'ขนนกธรรมดาที่ร่วงหล่น', icon: '🪶', type: 'material', value: 2, minLevel: 3, maxLevel: 12 },
    { id: 'junk_small_bone', name: 'กระดูกชิ้นเล็ก', description: 'เศษกระดูกของสัตว์ขนาดเล็ก', icon: '🦴', type: 'material', value: 3, minLevel: 5, maxLevel: 15 },

    // Common Materials (Value 5-20)
    { id: 'material_iron_scrap', name: 'เศษเหล็ก', description: 'เศษโลหะที่อาจนำไปใช้ประโยชน์ได้', icon: '🔩', type: 'material', value: 8, minLevel: 5, maxLevel: 20 },
    { id: 'material_tough_leather', name: 'หนังเหนียว', description: 'หนังสัตว์ที่ทนทาน', icon: '👜', type: 'material', value: 10, minLevel: 8, maxLevel: 25 },
    { id: 'material_dull_crystal', name: 'ผลึกเวทย์มนตร์หม่น', description: 'ผลึกที่มีพลังเวทย์อยู่เล็กน้อย', icon: '💎', type: 'material', value: 15, minLevel: 10, maxLevel: 30 },
    { id: 'material_beast_fang', name: 'เขี้ยวอสูร', description: 'เขี้ยวของมอนสเตอร์ระดับต่ำ', icon: '🦷', type: 'material', value: 12, minLevel: 7, maxLevel: 22 },
    { id: 'material_sticky_web', name: 'ใยแมงมุมเหนียว', description: 'ใยแมงมุมที่แข็งแรงเป็นพิเศษ', icon: '🕸️', type: 'material', value: 9, minLevel: 6, maxLevel: 18 },

    // Rare Materials (Value 25-100)
    { id: 'material_silver_ore', name: 'แร่เงิน', description: 'แร่โลหะมีค่าที่ส่องประกายสีเงิน', icon: '🥈', type: 'material', value: 30, minLevel: 15, maxLevel: 35 },
    { id: 'material_dragon_scale', name: 'เกล็ดมังกร', description: 'เกล็ดแข็งจากมังกรชั้นต่ำ', icon: '🐉', type: 'material', value: 50, minLevel: 20, maxLevel: 40 },
    { id: 'material_glowing_crystal', name: 'ผลึกเวทย์มนตร์ส่องสว่าง', description: 'ผลึกที่เปล่งแสงอ่อนๆ เต็มไปด้วยพลัง', icon: '✨', type: 'material', value: 60, minLevel: 25, maxLevel: 45 },
    { id: 'material_golem_core', name: 'หัวใจโกเลม', description: 'แกนพลังงานที่ขับเคลื่อนโกเลม', icon: '⚙️', type: 'material', value: 75, minLevel: 30, maxLevel: 50 },
    { id: 'material_phoenix_feather', name: 'ขนนกฟีนิกซ์', description: 'ขนที่ลุกไหม้ด้วยเปลวไฟศักดิ์สิทธิ์', icon: '🪶', type: 'material', value: 100, minLevel: 40, maxLevel: 100 },

    // Consumables - HP
    { id: 'consumable_heal_herb', name: 'สมุนไพรฟื้นฟู', description: 'สมุนไพรพื้นบ้าน ฟื้นฟู HP 15 หน่วย', icon: '🌿', type: 'consumable', value: 5, effect: { type: 'HEAL_HP', value: 15 }, minLevel: 1, maxLevel: 10 },
    { id: 'consumable_hp_potion_small', name: 'โพชั่นฟื้นฟู (เล็ก)', description: 'ยาที่ปรุงขึ้นอย่างง่ายๆ ฟื้นฟู HP 50 หน่วย', icon: '🧪', type: 'consumable', value: 20, effect: { type: 'HEAL_HP', value: 50 }, minLevel: 5, maxLevel: 20 },
    { id: 'consumable_grilled_meat', name: 'เนื้อย่าง', description: 'เนื้อที่ปรุงสุกอย่างดี ฟื้นฟู HP 120 หน่วย', icon: '🍖', type: 'consumable', value: 50, effect: { type: 'HEAL_HP', value: 120 }, minLevel: 15, maxLevel: 30 },
    { id: 'consumable_hp_potion_large', name: 'โพชั่นฟื้นฟู (ใหญ่)', description: 'ยาคุณภาพสูง ฟื้นฟู HP 250 หน่วย', icon: '🧪', type: 'consumable', value: 100, effect: { type: 'HEAL_HP', value: 250 }, minLevel: 25, maxLevel: 40 },
    { id: 'consumable_elixir', name: 'น้ำทิพย์', description: 'น้ำศักดิ์สิทธิ์ในตำนาน ฟื้นฟู HP จนเต็ม', icon: '💧', type: 'consumable', value: 300, effect: { type: 'HEAL_HP', value: 9999 }, minLevel: 40, maxLevel: 100 },

    // Consumables - SP
    { id: 'consumable_wild_berry', name: 'ผลไม้ป่า', description: 'ผลไม้รสหวานอมเปรี้ยว ฟื้นฟู SP 10 หน่วย', icon: '🍓', type: 'consumable', value: 5, effect: { type: 'HEAL_SP', value: 10 }, minLevel: 1, maxLevel: 10 },
    { id: 'consumable_holy_water', name: 'น้ำมนต์', description: 'น้ำที่ได้รับการปลุกเสก ฟื้นฟู SP 40 หน่วย', icon: '🍶', type: 'consumable', value: 20, effect: { type: 'HEAL_SP', value: 40 }, minLevel: 5, maxLevel: 20 },
    { id: 'consumable_mana_crystal', name: 'คริสตัลมานา', description: 'ผลึกที่เก็บพลังเวทย์ไว้ ฟื้นฟู SP 100 หน่วย', icon: '🔮', type: 'consumable', value: 50, effect: { type: 'HEAL_SP', value: 100 }, minLevel: 15, maxLevel: 30 },
    { id: 'consumable_ether', name: 'อีเทอร์', description: 'ของเหลวระเหยง่าย ฟื้นฟู SP 200 หน่วย', icon: '⚗️', type: 'consumable', value: 100, effect: { type: 'HEAL_SP', value: 200 }, minLevel: 25, maxLevel: 40 },
    { id: 'consumable_wisdom_spring', name: 'น้ำพุแห่งปัญญา', description: 'น้ำจากแหล่งพลังโบราณ ฟื้นฟู SP จนเต็ม', icon: '⛲', type: 'consumable', value: 300, effect: { type: 'HEAL_SP', value: 9999 }, minLevel: 40, maxLevel: 100 },

    // Consumables - EXP Potions
    { id: 'consumable_exp_bottle_small', name: 'ขวดประสบการณ์ (เล็ก)', description: 'มอบค่าประสบการณ์ 50 หน่วยให้กับสัตว์เลี้ยง', icon: '🍼', type: 'consumable', value: 100, effect: { type: 'GAIN_EXP', value: 50 }, minLevel: 1, maxLevel: 100 },
    { id: 'consumable_exp_bottle_medium', name: 'ขวดประสบการณ์ (กลาง)', description: 'มอบค่าประสบการณ์ 250 หน่วยให้กับสัตว์เลี้ยง', icon: '🍶', type: 'consumable', value: 450, effect: { type: 'GAIN_EXP', value: 250 }, minLevel: 20, maxLevel: 100 },
    { id: 'consumable_exp_bottle_large', name: 'ขวดประสบการณ์ (ใหญ่)', description: 'มอบค่าประสบการณ์ 1000 หน่วยให้กับสัตว์เลี้ยง', icon: '🏺', type: 'consumable', value: 1800, effect: { type: 'GAIN_EXP', value: 1000 }, minLevel: 50, maxLevel: 100 },
];