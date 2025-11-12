import { Achievement } from '../types';

export const ACHIEVEMENT_DATABASE: Achievement[] = [
    // Collection
    {
        id: 'collect_total_10', name: 'นักสะสมมือใหม่', description: 'สะสมการ์ดให้ครบ 10 ใบ', category: 'collection',
        criteria: { type: 'COLLECT_TOTAL_CARDS', value: 10 }, reward: { type: 'coins', amount: 100 }, icon: '📚'
    },
    {
        id: 'collect_total_100', name: 'นักสะสมตัวยง', description: 'สะสมการ์ดให้ครบ 100 ใบ', category: 'collection',
        criteria: { type: 'COLLECT_TOTAL_CARDS', value: 100 }, reward: { type: 'points', amount: 50 }, icon: '📚'
    },
    {
        id: 'collect_s1_all_common', name: 'สามัญชนแห่งปฐมกาล', description: 'สะสมการ์ด Common ซีซั่น 1 ทั้งหมด', category: 'collection',
        criteria: { type: 'COLLECT_RARITY_CARDS', value: 50, season: 1, rarity: 'Common' }, reward: { type: 'coins', amount: 500 }, icon: '📜'
    },
    {
        id: 'collect_s1_gold', name: 'ตำนานแห่งปฐมกาล', description: 'ได้รับการ์ด Legendary Rare ของซีซั่น 1', category: 'collection',
        criteria: { type: 'COLLECT_RARITY_CARDS', value: 1, season: 1, rarity: 'Legendary Rare' }, reward: { type: 'points', amount: 250 }, icon: '🏆'
    },

    // Pet
    {
        id: 'pet_level_10', name: 'คู่หูเลเวล 10', description: 'อัปเลเวลสัตว์เลี้ยงถึงเลเวล 10', category: 'pet',
        criteria: { type: 'PET_LEVEL', value: 10 }, reward: { type: 'item', itemId: 'ขวดประสบการณ์ (เล็ก)', amount: 3 }, icon: '🐾'
    },
    {
        id: 'pet_level_30', name: 'เพื่อนซี้เลเวล 30', description: 'อัปเลเวลสัตว์เลี้ยงถึงเลเวล 30', category: 'pet',
        criteria: { type: 'PET_LEVEL', value: 30 }, reward: { type: 'item', itemId: 'ขวดประสบการณ์ (กลาง)', amount: 2 }, icon: '🐾'
    },
    {
        id: 'pet_quests_10', name: 'นักผจญภัยฝึกหัด', description: 'ทำเควสสัตว์เลี้ยงสำเร็จ 10 ครั้ง', category: 'pet',
        criteria: { type: 'PET_QUESTS_COMPLETED', value: 10 }, reward: { type: 'coins', amount: 200 }, icon: '🗺️'
    },
    {
        id: 'pet_quests_100', name: 'นักสำรวจผู้ช่ำชอง', description: 'ทำเควสสัตว์เลี้ยงสำเร็จ 100 ครั้ง', category: 'pet',
        criteria: { type: 'PET_QUESTS_COMPLETED', value: 100 }, reward: { type: 'points', amount: 100 }, icon: '🗺️'
    },

    // Dungeon
    {
        id: 'dungeon_quests_1', name: 'ก้าวแรกสู่ความมืด', description: 'เคลียร์ดันเจี้ยนสำเร็จครั้งแรก', category: 'dungeon',
        criteria: { type: 'DUNGEON_QUESTS_COMPLETED', value: 1 }, reward: { type: 'item', itemId: 'ขวดประสบการณ์ (เล็ก)', amount: 1 }, icon: '⚔️'
    },
    {
        id: 'dungeon_quests_50', name: 'จ้าวแห่งดันเจี้ยน', description: 'เคลียร์ดันเจี้ยนสำเร็จ 50 ครั้ง', category: 'dungeon',
        criteria: { type: 'DUNGEON_QUESTS_COMPLETED', value: 50 }, reward: { type: 'points', amount: 150 }, icon: '⚔️'
    },
    {
        id: 'dungeon_hardcore_1', name: 'ผู้ท้าทายความตาย', description: 'เคลียร์ดันเจี้ยน Hardcore สำเร็จ', category: 'dungeon',
        criteria: { type: 'DUNGEON_HARDCORE_COMPLETED', value: 1 }, reward: { type: 'points', amount: 500 }, icon: '💀'
    },

    // Economy
    {
        id: 'earn_coins_10000', name: 'เศรษฐีฝึกหัด', description: 'มีเหรียญสะสมครบ 10,000 เหรียญ', category: 'economy',
        criteria: { type: 'EARN_TOTAL_COINS', value: 10000 }, reward: { type: 'points', amount: 20 }, icon: '💰'
    },
    {
        id: 'earn_points_1000', name: 'นักสะสมแต้ม', description: 'มีแต้มสะสมครบ 1,000 แต้ม', category: 'economy',
        criteria: { type: 'EARN_TOTAL_POINTS', value: 1000 }, reward: { type: 'coins', amount: 1000 }, icon: '⭐'
    },
    {
        id: 'market_sold_10', name: 'พ่อค้ามือใหม่', description: 'ขายไอเท็มในตลาดสำเร็จ 10 ชิ้น', category: 'economy',
        criteria: { type: 'MARKET_SOLD_ITEMS', value: 10 }, reward: { type: 'coins', amount: 300 }, icon: '⚖️'
    },

    // Games
    {
        id: 'games_slots_20', name: 'นักเสี่ยงโชค', description: 'เล่นสล็อต 20 ครั้ง', category: 'games',
        criteria: { type: 'GAMES_SLOTS_PLAYED', value: 20 }, reward: { type: 'coins', amount: 50 }, icon: '🎰'
    },
    {
        id: 'games_pachinko_20', name: 'เซียนปาจิงโกะ', description: 'เล่นปาจิงโกะ 20 ครั้ง', category: 'games',
        criteria: { type: 'GAMES_PACHINKO_PLAYED', value: 20 }, reward: { type: 'coins', amount: 100 }, icon: '👾'
    },
];