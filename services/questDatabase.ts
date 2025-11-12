import { Quest, QuestTheme } from '../types';

const getThemeFromLocation = (location: string): QuestTheme => {
    if (['ป่า', 'ป่าลึก', 'ป่าสนธยา', 'ป่าชายเลน'].includes(location)) return 'Forest';
    if (['ถ้ำ', 'ถ้ำลึกลับ'].includes(location)) return 'Cave';
    if (['ภูเขา', 'ภูเขาไฟ', 'เทือกเขา', 'หุบเขา'].includes(location)) return 'Mountain';
    if (['ที่ราบ', 'ทุ่งหญ้า', 'ชายหาด', 'ทะเลทราย'].includes(location)) return 'Plains';
    if (['ซากปรักหักพัง', 'สุสาน', 'หมู่บ้านร้าง', 'หอคอยร้าง', 'วิหารลอยฟ้า', 'ป้อมปราการ'].includes(location)) return 'Ruins';
    if (['แม่น้ำ', 'หนองน้ำ', 'ทะเลสาบใต้ดิน', 'ท่าเรือ'].includes(location)) return 'Water';
    return 'Default';
}

// Helper function to generate a large number of quests programmatically
const generateQuests = (): Quest[] => {
    const quests: Quest[] = [];
    const templates = [
        { type: 'เก็บของ', action: 'เก็บ', item: ['สมุนไพร', 'ผลไม้', 'แร่', 'คริสตัล', 'ดอกไม้', 'เห็ด', 'น้ำศักดิ์สิทธิ์'], location: ['ป่า', 'ถ้ำ', 'ภูเขา', 'แม่น้ำ', 'ทุ่งหญ้า', 'ซากปรักหักพัง', 'ชายหาด'], adjective: ['หายาก', 'เรืองแสง', 'โบราณ', 'วิเศษ', 'ต้องคำสาป', 'บริสุทธิ์', 'ยักษ์'] },
        { type: 'ล่า', action: 'ล่า', item: ['สไลม์', 'ก็อบลิน', 'หมาป่า', 'ค้างคาว', 'โกเลม', 'ออร์ค', 'โครงกระดูก', 'ซอมบี้'], location: ['ที่ราบ', 'ป่าลึก', 'ซากปรักหักพัง', 'สุสาน', 'หนองน้ำ', 'ภูเขาไฟ', 'หุบเขา'], adjective: ['ดุร้าย', 'เจ้าเล่ห์', 'ยักษ์', 'ว่องไว', 'กลายพันธุ์', 'เกรี้ยวกราด', 'โบราณ'] },
        { type: 'ส่งของ', action: 'ส่ง', item: ['จดหมาย', 'พัสดุ', 'ยา', 'เครื่องราง', 'แผนที่', 'วัตถุดิบ', 'อาวุธ'], location: ['หมู่บ้าน', 'เมืองหลวง', 'หอคอย', 'ค่ายทหาร', 'วัด', 'ท่าเรือ', 'ป้อมปราการ'], adjective: ['ลับ', 'ด่วน', 'สำคัญ', 'ศักดิ์สิทธิ์', 'เปราะบาง', 'ต้องสาป', 'เร่งด่วน'] },
        { type: 'สำรวจ', action: 'สำรวจ', item: ['ซากปรักหักพัง', 'ถ้ำลึกลับ', 'ป่าต้องห้าม', 'หอคอยร้าง', 'ทะเลสาบใต้ดิน', 'วิหารลอยฟ้า', 'สุสานโบราณ'], location: ['เทือกเขา', 'หุบเขา', 'เกาะลอยฟ้า', 'ทะเลทราย', 'ป่าสนธยา', 'ที่ราบน้ำแข็ง', 'ป่าชายเลน'], adjective: ['ที่ถูกลืม', 'โบราณ', 'ต้องมนต์', 'อันตราย', 'ที่ยังไม่ได้ค้นพบ', 'ศักดิ์สิทธิ์', 'ต้องห้าม'] },
    ];

    let questCount = 0;
    while (questCount < 3000) {
        const template = templates[Math.floor(Math.random() * templates.length)];
        const action = template.action;
        const item = template.item[Math.floor(Math.random() * template.item.length)];
        const location = template.location[Math.floor(Math.random() * template.location.length)];
        const adjective = template.adjective[Math.floor(Math.random() * template.adjective.length)];
        
        const level = Math.ceil(Math.random() * 100); // Levels 1-100 for more variety
        const duration = (level * 1.5 + Math.floor(Math.random() * 10)) * 60000; // Duration based on level (1.5 min per level + random)
        const coinReward = level * 8 + Math.floor(Math.random() * level * 5);
        const pointsReward = Math.ceil(level / 3) + Math.floor(Math.random() * (level / 5 + 1));

        let name = '';
        let description = '';

        switch (template.type) {
            case 'เก็บของ':
                name = `${action}${item}${adjective}`;
                description = `ตามหาและ${action}${item}${adjective}จาก${location}`;
                break;
            case 'ล่า':
                name = `${action}${item}${adjective}`;
                description = `กำจัด${item}${adjective}ที่อาศัยอยู่ใน${location}`;
                break;
            case 'ส่งของ':
                name = `${action}${item}${adjective}`;
                description = `นำ${item}${adjective}ไปส่งที่${location}อย่างปลอดภัย`;
                break;
            case 'สำรวจ':
                name = `${action}${item}${adjective}`;
                description = `เดินทางไป${action}${item}${adjective}ที่อยู่ใน${location}`;
                break;
        }

        const quest: Quest = {
            name,
            description,
            duration,
            reward: coinReward,
            pointsReward,
            recommendedLevel: level,
            theme: getThemeFromLocation(location),
        };

        const specialRewards: ('CardPack' | 'CardFragment')[] = [];
        // Add a chance for special rewards based on quest level and random chance.
        // Card Pack: ~5% chance for higher level quests.
        if (Math.random() < 0.01 + (level / 100) * 0.08) {
            specialRewards.push('CardPack');
        }
        // Card Fragment: ~20% chance for higher level quests.
        if (Math.random() < 0.05 + (level / 100) * 0.3) {
            specialRewards.push('CardFragment');
        }

        if (specialRewards.length > 0) {
            quest.specialRewards = specialRewards;
        }

        quests.push(quest);
        questCount++;
    }
    return quests;
};

export const QUEST_DATABASE: Quest[] = generateQuests();