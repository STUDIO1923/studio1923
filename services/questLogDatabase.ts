import { QuestLogEvent } from "../types";

const generateQuestLogEvents = (): QuestLogEvent[] => {
    const events: QuestLogEvent[] = [];
    let idCounter = 0;

    const locations = ['ป่า', 'ถ้ำ', 'ภูเขา', 'แม่น้ำ', 'ทุ่งหญ้า', 'ซากปรักหักพัง', 'ชายหาด', 'หนองน้ำ', 'สุสาน', 'หมู่บ้านร้าง', 'หุบเขาลึก', 'ป่าสนธยา'];
    const positiveAdjectives = ['สวยงาม', 'เงียบสงบ', 'น่าทึ่ง', 'สดชื่น', 'อบอุ่น', 'ลึกลับแต่น่าค้นหา', 'ตระการตา'];
    const neutralAdjectives = ['ธรรมดา', 'กว้างใหญ่', 'ชื้น', 'เย็น', 'มืด', 'แปลกตา', 'โบราณ'];
    const negativeAdjectives = ['อันตราย', 'น่าขนลุก', 'ร้อนระอุ', 'หนาวเหน็บ', 'ต้องคำสาป', 'อึดอัด'];

    const monsters = ['สไลม์', 'ก็อบลิน', 'หมาป่า', 'ค้างคาว', 'โกเลม', 'ออร์ค', 'โครงกระดูก', 'ซอมบี้', 'แมงมุมยักษ์', 'ภูติพฤกษา'];
    const monsterAdjectives = ['ดุร้าย', 'เจ้าเล่ห์', 'กลายพันธุ์', 'หิวโหย', 'ยักษ์', 'เกราะหนา'];

    const traps = ['หลุมพราง', 'ลูกดอกพิษ', 'ตาข่าย', 'หินถล่ม', 'กับดักหนาม', 'ผนังบีบ'];
    const discoveries = ['ลำธารใสสะอาด', 'ดอกไม้เรืองแสง', 'รูปปั้นโบราณ', 'หีบสมบัติเล็กๆ', 'ทางลับ', 'ผลไม้ทิพย์', 'ศาลเจ้าเล็กๆ ที่ถูกลืม', 'แผนที่สมบัติที่ขาดรุ่งริ่ง', 'ร่องรอยของสัตว์ในตำนาน'];

    const infoTexts = [
        'เสียงน้ำหยดดังก้อง', 'ลมเย็นๆ พัดผ่าน', 'ได้ยินเสียงคำรามจากที่ไกลๆ', 'คบเพลิงบนผนังสั่นไหว', 'เห็นเงาแปลกๆ แต่ก็หายไป',
        'พื้นสั่นสะเทือนเล็กน้อย', 'กลิ่นอับชื้นโชยมา', 'ใยแมงมุมหนาเตอะขวางทาง', 'พบรอยเท้าขนาดใหญ่บนพื้น',
    ];

    // Generate INFO events (Approx. 2500)
    for (let i = 0; i < 2500; i++) {
        const loc = locations[Math.floor(Math.random() * locations.length)];
        let adj;
        const rand = Math.random();
        if (rand < 0.5) adj = positiveAdjectives[Math.floor(Math.random() * positiveAdjectives.length)];
        else if (rand < 0.8) adj = neutralAdjectives[Math.floor(Math.random() * neutralAdjectives.length)];
        else adj = negativeAdjectives[Math.floor(Math.random() * negativeAdjectives.length)];
        
        const textOptions = [
            `เดินทางผ่าน${loc}ที่${adj}`,
            `ลมพัดเบาๆ ใน${loc}`,
            `คุณหยุดพักที่${loc}สักครู่`,
            `ได้ยินเสียงแปลกๆ จาก${loc}ที่อยู่ไกลออกไป`,
            `สะดุดรากไม้แต่กลิ้งตัวลงอย่างเท่`,
            `พบกับพ่อค้าพเนจรแต่ไม่มีอะไรจะแลกเปลี่ยน`,
            `หยุดพักชมผีเสื้อเรืองแสง`,
            `เกือบจะเหยียบดอกไม้หายากโดยไม่ได้ตั้งใจ`,
            `ได้ยินเสียงเพลงลึกลับลอยมาตามลม`
        ];

        events.push({
            id: ++idCounter,
            text: textOptions[Math.floor(Math.random() * textOptions.length)],
            type: 'info',
            minLevel: 1,
            maxLevel: 100,
            chance: 30, // High chance for ambient text
        });
    }

    // Generate COMBAT events (Approx. 2000)
    for (let i = 0; i < 2000; i++) {
        const monster = monsters[Math.floor(Math.random() * monsters.length)];
        const adj = monsterAdjectives[Math.floor(Math.random() * monsterAdjectives.length)];
        const level = 1 + Math.floor(Math.random() * 80);

        const textOptions = [
            `${monster}${adj}กระโจนเข้าใส่!`,
            `คุณถูกซุ่มโจมตีโดย${monster}!`,
            `เผชิญหน้ากับ${monster}${adj}โดยไม่คาดคิด!`,
        ];

        events.push({
            id: ++idCounter,
            text: textOptions[Math.floor(Math.random() * textOptions.length)],
            type: 'combat',
            minLevel: Math.max(1, level - 5),
            maxLevel: Math.min(100, level + 10),
            chance: 40,
        });
    }
    
    // Generate HIGH-RISK COMBAT events (500)
    const highTierMonsters = ['มังกรโบราณ', 'ไททัน', 'เบฮีมอธ', 'ลิช', 'อาร์คเดมอน', 'ปีศาจเงา'];
    for (let i = 0; i < 500; i++) {
        const monster = highTierMonsters[Math.floor(Math.random() * highTierMonsters.length)];
        events.push({
            id: ++idCounter,
            text: `ถูกซุ่มโจมตีโดย ${monster} ที่แข็งแกร่งเกินไป!`,
            type: 'combat',
            minLevel: 50,
            maxLevel: 100,
            chance: 25,
            damage: { min: 35, max: 70, type: 'percent' },
        });
    }

    // Generate TRAP events (Approx. 1500)
    for (let i = 0; i < 1500; i++) {
        const trap = traps[Math.floor(Math.random() * traps.length)];
        const stat = (['agi', 'dex', 'luk'] as const)[Math.floor(Math.random() * 3)];
        const level = 1 + Math.floor(Math.random() * 99);
        const difficulty = 5 + level + Math.floor(Math.random() * 10);

        events.push({
            id: ++idCounter,
            text: `คุณเดินไปเจอ${trap}!`,
            type: 'trap',
            minLevel: Math.max(1, level - 5),
            maxLevel: Math.min(100, level + 5),
            chance: 25,
            statCheck: {
                stat: stat,
                difficulty: difficulty,
                successText: `คุณหลบ${trap}ได้อย่างหวุดหวิด!`,
                failureText: `คุณติด${trap}!`,
            },
        });
    }

    // Generate DISCOVERY events (Approx. 750)
    for (let i = 0; i < 750; i++) {
        const discovery = discoveries[Math.floor(Math.random() * discoveries.length)];
        const level = 1 + Math.floor(Math.random() * 99);
        
        events.push({
            id: ++idCounter,
            text: `คุณค้นพบ${discovery}!`,
            type: 'discovery',
            minLevel: Math.max(1, level - 10),
            maxLevel: Math.min(100, level + 10),
            chance: 15,
        });
    }

    // Generate Card Fragment Discovery Events (1250)
    const fragmentDiscoveryTexts = [
        "คุณสังเกตเห็นบางอย่างแวววาวในพุ่มไม้...",
        "มีกระดาษเก่าๆ ชิ้นหนึ่งติดอยู่บนกิ่งไม้...",
        "คุณสะดุดเข้ากับหีบไม้เล็กๆ ที่ผุพัง...",
        "นกตัวหนึ่งคาบบางอย่างมาทิ้งไว้ใกล้ๆ คุณ...",
        "คุณรู้สึกเหมือนมีคนแอบมอง แต่กลับเจอเพียงชิ้นส่วนกระดาษ...",
        "ท่ามกลางซากปรักหักพัง คุณพบชิ้นส่วนที่ดูไม่เข้าพวก...",
    ];
    for (let i = 0; i < 1250; i++) {
        const text = fragmentDiscoveryTexts[Math.floor(Math.random() * fragmentDiscoveryTexts.length)];
        const stat = (['luk', 'dex'] as const)[Math.floor(Math.random() * 2)];
        const level = 1 + Math.floor(Math.random() * 99);
        const difficulty = 8 + level + Math.floor(Math.random() * 8);

        events.push({
            id: ++idCounter,
            text: text,
            type: 'discovery',
            minLevel: 1,
            maxLevel: 100,
            chance: 20,
            statCheck: {
                stat: stat,
                difficulty: difficulty,
                successText: "คุณพบเศษการ์ด 1 ชิ้น!",
                failureText: "เมื่อเข้าไปดูใกล้ๆ กลับไม่พบอะไรเลย",
                rewardItem: 'CardFragment'
            }
        });
    }
    
    return events;
}

export const QUEST_LOG_DATABASE: QuestLogEvent[] = generateQuestLogEvents();