import { DungeonLogType } from "../types";

export interface DungeonEvent {
    text: string;
    type: DungeonLogType;
    damage?: { min: number; max: number; type: 'flat' | 'percent' };
    statCheck?: { stat: 'attack' | 'defense' | 'speed', difficulty: number; };
    rewardItem?: { itemName: string, chance: number };
}

// Programmatically generate a large pool of events
const generateEvents = (): DungeonEvent[] => {
    const events: DungeonEvent[] = [];

    const locations = ['ห้องโถง', 'ทางเดินแคบ', 'สะพาน', 'ห้องลับ', 'อุโมงค์', 'ลานกว้าง', 'แท่นบูชา'];
    const adjectives = ['โบราณ', 'มืดมิด', 'ชื้นแฉะ', 'ต้องคำสาป', 'ที่ถูกลืม', 'เรืองแสง'];
    const monsters = ['ก็อบลิน', 'สไลม์', 'โครงกระดูก', 'ซอมบี้', 'ค้างคาว', 'แมงมุมยักษ์', 'ออร์ค', 'โกเลม'];
    const monsterAdj = ['ดุร้าย', 'เจ้าเล่ห์', 'กลายพันธุ์', 'หิวโหย', 'ยักษ์', 'เกราะหนา'];
    const traps = ['หลุมพราง', 'ลูกดอกพิษ', 'ตาข่าย', 'หินถล่ม', 'กับดักหนาม', 'ผนังบีบ'];
    const discoveries = ['หีบสมบัติเก่า', 'ศพนักผจญภัย', 'น้ำพุลึกลับ', 'กองเหรียญทอง', 'อักษรรูนโบราณ', 'แผนที่ขาดๆ'];
    const infoTexts = [
        'เสียงน้ำหยดดังก้อง', 'ลมเย็นๆ พัดผ่าน', 'ได้ยินเสียงคำรามจากที่ไกลๆ', 'คบเพลิงบนผนังสั่นไหว', 'เห็นเงาแปลกๆ แต่ก็หายไป',
        'พื้นสั่นสะเทือนเล็กน้อย', 'กลิ่นอับชื้นโชยมา', 'ใยแมงมุมหนาเตอะขวางทาง', 'พบรอยเท้าขนาดใหญ่บนพื้น',
    ];

    // Info Events (2000)
    for (let i = 0; i < 2000; i++) {
        events.push({
            text: infoTexts[Math.floor(Math.random() * infoTexts.length)],
            type: 'info',
        });
    }

    // Combat Events (2000)
    for (let i = 0; i < 2000; i++) {
        const monster = monsters[Math.floor(Math.random() * monsters.length)];
        const adj = monsterAdj[Math.floor(Math.random() * monsterAdj.length)];
        events.push({
            text: `เผชิญหน้ากับ ${monster} ${adj}!`,
            type: 'combat',
            damage: { min: 5, max: 20, type: 'percent' },
        });
    }

    // Trap Events (1500)
    for (let i = 0; i < 1500; i++) {
        const trap = traps[Math.floor(Math.random() * traps.length)];
        const stat = (['speed', 'defense'] as const)[Math.floor(Math.random() * 2)];
        events.push({
            text: `เดินไปติด ${trap}!`,
            type: 'trap',
            damage: { min: 10, max: 25, type: 'percent' },
            statCheck: { stat, difficulty: 50 + Math.floor(Math.random() * 50) },
        });
    }

    // Discovery Events (1000)
    for (let i = 0; i < 1000; i++) {
        const discovery = discoveries[Math.floor(Math.random() * discoveries.length)];
        const stat = (['attack', 'speed'] as const)[Math.floor(Math.random() * 2)];
        const item = (['ขวดประสบการณ์ (เล็ก)', 'เศษการ์ด'] as const)[Math.floor(Math.random() * 2)];
        events.push({
            text: `ค้นพบ ${discovery}!`,
            type: 'discovery',
            statCheck: { stat, difficulty: 40 + Math.floor(Math.random() * 40) },
            rewardItem: { itemName: item, chance: 40 }, // 40% chance to get an item on successful discovery
        });
    }

    return events;
};

export const DUNGEON_EVENT_DATABASE: DungeonEvent[] = generateEvents();
