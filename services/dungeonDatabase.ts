import { Dungeon, QuestTheme } from '../types';

export const DUNGEON_DATABASE: Dungeon[] = [
    {
        id: 'dungeon_1',
        name: 'ป่ากระซิบ',
        levelRange: { min: 1, max: 10 },
        duration: 10 * 60 * 1000, // 10 minutes
        description: 'ป่าที่เต็มไปด้วยสิ่งมีชีวิตระดับต่ำและสมบัติเล็กน้อย เหมาะสำหรับนักผจญภัยมือใหม่',
        theme: 'Forest',
        rewardTiers: {
            common: { item: 'ขวดประสบการณ์ (เล็ก)', quantity: 1 },
            uncommon: { item: 'ขวดประสบการณ์ (เล็ก)', quantity: 2 },
            rare: { item: 'ขวดประสบการณ์ (กลาง)', quantity: 1 },
        }
    },
    {
        id: 'dungeon_2',
        name: 'ถ้ำผลึกสะท้อน',
        levelRange: { min: 11, max: 20 },
        duration: 20 * 60 * 1000, // 20 minutes
        description: 'ถ้ำที่เต็มไปด้วยผลึกเรืองแสงและมอนสเตอร์ที่อันตรายกว่าเดิม',
        theme: 'Cave',
        rewardTiers: {
            common: { item: 'ขวดประสบการณ์ (เล็ก)', quantity: 2 },
            uncommon: { item: 'ขวดประสบการณ์ (กลาง)', quantity: 1 },
            rare: { item: 'ขวดประสบการณ์ (กลาง)', quantity: 2 },
        }
    },
    {
        id: 'dungeon_3',
        name: 'ซากปรักหักพังที่ถูกลืม',
        levelRange: { min: 21, max: 30 },
        duration: 30 * 60 * 1000, // 30 minutes
        description: 'เมืองโบราณที่เต็มไปด้วยกับดักและวิญญาณผู้พิทักษ์',
        theme: 'Ruins',
        rewardTiers: {
            common: { item: 'ขวดประสบการณ์ (กลาง)', quantity: 1 },
            uncommon: { item: 'ขวดประสบการณ์ (กลาง)', quantity: 2 },
            rare: { item: 'ขวดประสบการณ์ (ใหญ่)', quantity: 1 },
        }
    },
    {
        id: 'dungeon_4',
        name: 'ภูเขาไฟพิโรธ',
        levelRange: { min: 31, max: 40 },
        duration: 45 * 60 * 1000, // 45 minutes
        description: 'เส้นทางอันร้อนระอุที่นำไปสู่ใจกลางภูเขาไฟที่ยังคุกรุ่น',
        theme: 'Mountain',
        rewardTiers: {
            common: { item: 'ขวดประสบการณ์ (กลาง)', quantity: 2 },
            uncommon: { item: 'ขวดประสบการณ์ (ใหญ่)', quantity: 1 },
            rare: { item: 'ขวดประสบการณ์ (ใหญ่)', quantity: 1 },
        }
    },
    {
        id: 'dungeon_5',
        name: 'หนองน้ำต้องสาป',
        levelRange: { min: 41, max: 50 },
        duration: 60 * 60 * 1000, // 1 hour
        description: 'หนองน้ำที่เต็มไปด้วยไอพิษและสิ่งมีชีวิตกลายพันธุ์',
        theme: 'Water',
        rewardTiers: {
            common: { item: 'ขวดประสบการณ์ (กลาง)', quantity: 3 },
            uncommon: { item: 'ขวดประสบการณ์ (ใหญ่)', quantity: 1 },
            rare: { item: 'ขวดประสบการณ์ (ใหญ่)', quantity: 2 },
        }
    },
    {
        id: 'dungeon_6',
        name: 'ทุ่งราบสายฟ้า',
        levelRange: { min: 51, max: 60 },
        duration: 75 * 60 * 1000, // 75 minutes
        description: 'ทุ่งราบกว้างที่เกิดพายุฝนฟ้าคะนองอย่างต่อเนื่อง',
        theme: 'Plains',
        rewardTiers: {
            common: { item: 'ขวดประสบการณ์ (ใหญ่)', quantity: 1 },
            uncommon: { item: 'ขวดประสบการณ์ (ใหญ่)', quantity: 2 },
            rare: { item: 'ขวดประสบการณ์ (ใหญ่)', quantity: 2 },
        }
    },
    {
        id: 'dungeon_7',
        name: 'สุสานราชันย์',
        levelRange: { min: 61, max: 70 },
        duration: 90 * 60 * 1000, // 90 minutes
        description: 'สุสานโบราณของกษัตริย์ที่ถูกลืม ปกป้องโดยกองทัพอมตะ',
        theme: 'Ruins',
        rewardTiers: {
            common: { item: 'ขวดประสบการณ์ (ใหญ่)', quantity: 2 },
            uncommon: { item: 'ขวดประสบการณ์ (ใหญ่)', quantity: 3 },
            rare: { item: 'ขวดประสบการณ์ (ใหญ่)', quantity: 3 },
        }
    },
    {
        id: 'dungeon_8',
        name: 'หุบเขามังกร',
        levelRange: { min: 71, max: 80 },
        duration: 120 * 60 * 1000, // 2 hours
        description: 'ดินแดนศักดิ์สิทธิ์ที่มังกรโบราณหลับใหลอยู่',
        theme: 'Mountain',
        rewardTiers: {
            common: { item: 'ขวดประสบการณ์ (ใหญ่)', quantity: 3 },
            uncommon: { item: 'ขวดประสบการณ์ (ใหญ่)', quantity: 4 },
            rare: { item: 'ขวดประสบการณ์ (ใหญ่)', quantity: 4 },
        }
    },
    {
        id: 'dungeon_9',
        name: 'ป้อมปราการลอยฟ้า',
        levelRange: { min: 81, max: 90 },
        duration: 150 * 60 * 1000, // 2.5 hours
        description: 'ป้อมปราการที่สร้างโดยอารยธรรมโบราณ ลอยอยู่เหนือเมฆ',
        theme: 'Ruins',
        rewardTiers: {
            common: { item: 'ขวดประสบการณ์ (ใหญ่)', quantity: 4 },
            uncommon: { item: 'ขวดประสบการณ์ (ใหญ่)', quantity: 5 },
            rare: { item: 'ขวดประสบการณ์ (ใหญ่)', quantity: 5 },
        }
    },
    {
        id: 'dungeon_10',
        name: 'รอยแยกแห่งอเวจี',
        levelRange: { min: 91, max: 100 },
        duration: 180 * 60 * 1000, // 3 hours
        description: 'ประตูมิติที่เชื่อมต่อกับดินแดนแห่งฝันร้ายและความโกลาหล',
        theme: 'Default',
        rewardTiers: {
            common: { item: 'ขวดประสบการณ์ (ใหญ่)', quantity: 5 },
            uncommon: { item: 'ขวดประสบการณ์ (ใหญ่)', quantity: 6 },
            rare: { item: 'ขวดประสบการณ์ (ใหญ่)', quantity: 7 },
        }
    },
    {
        id: 'dungeon_hardcore',
        name: 'ดันเจี้ยน Hardcore',
        levelRange: { min: 100, max: 101 },
        duration: 4 * 60 * 60 * 1000, // 4 hours
        description: 'การทดสอบขั้นสูงสุดสำหรับผู้กล้าที่แท้จริง รางวัลสูง แต่ความเสี่ยงก็สูงเช่นกัน การ์ดที่พ่ายแพ้จะถูกทำลายทันที',
        theme: 'Default',
        rewardTiers: {
            common: { item: 'ขวดประสบการณ์ (ใหญ่)', quantity: 10 },
            uncommon: { item: 'ขวดประสบการณ์ (ใหญ่)', quantity: 12 },
            rare: { item: 'ขวดประสบการณ์ (ใหญ่)', quantity: 15 },
        }
    },
];