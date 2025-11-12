import { getDb } from './cardService';
import { User, Card } from '../types';
import * as cardService from './cardService';
import { fullCardDatabase } from './fullCardDatabase';

const STORE_NAME = 'user_data';

const realInitialUsers: Omit<User, 'id' | 'icon'>[] = [
  { nickname: 'AdminUser', email: 'admin@example.com', password: 'admin', isAdmin: true, coins: 9999, points: 1250, status: 'Active', lastLogin: Date.now(), ipAddress: '192.168.1.1' },
  { nickname: 'MemberTest', email: 'member@example.com', password: 'member', isAdmin: false, coins: 100, points: 10, status: 'Active', lastLogin: Date.now() - 3600000, ipAddress: '10.0.0.5' },
];

const npcUsers: Omit<User, 'id'>[] = [
    // Top Collectors
    { nickname: 'The Collector (นักสะสมเงา)', email: 'npc1@studio1923.com', password: 'npc', isAdmin: false, coins: 10000, points: 500, status: 'Active', lastLogin: Date.now(), ipAddress: 'NPC', icon: 'villain' },
    { nickname: 'Shadowhand (มือเงา)', email: 'npc2@studio1923.com', password: 'npc', isAdmin: false, coins: 9000, points: 450, status: 'Active', lastLogin: Date.now(), ipAddress: 'NPC', icon: 'villain' },
    { nickname: 'Voidbinder (ผู้ผนึกความว่างเปล่า)', email: 'npc3@studio1923.com', password: 'npc', isAdmin: false, coins: 8000, points: 400, status: 'Active', lastLogin: Date.now(), ipAddress: 'NPC', icon: 'villain' },
    { nickname: 'Archive Fiend (ปีศาจคลังสมบัติ)', email: 'npc4@studio1923.com', password: 'npc', isAdmin: false, coins: 7000, points: 350, status: 'Active', lastLogin: Date.now(), ipAddress: 'NPC', icon: 'villain' },
    { nickname: 'SoulHoarder (ผู้กักตุนวิญญาณ)', email: 'npc5@studio1923.com', password: 'npc', isAdmin: false, coins: 6000, points: 300, status: 'Active', lastLogin: Date.now(), ipAddress: 'NPC', icon: 'villain' },
    { nickname: 'Cardsharp (นักโกงไพ่)', email: 'npc6@studio1923.com', password: 'npc', isAdmin: false, coins: 5000, points: 250, status: 'Active', lastLogin: Date.now(), ipAddress: 'NPC', icon: 'villain' },
    { nickname: 'The Curator (ภัณฑารักษ์มืด)', email: 'npc7@studio1923.com', password: 'npc', isAdmin: false, coins: 4000, points: 200, status: 'Active', lastLogin: Date.now(), ipAddress: 'NPC', icon: 'villain' },
    { nickname: 'Deckmaster (เจ้าแห่งเด็ค)', email: 'npc8@studio1923.com', password: 'npc', isAdmin: false, coins: 3000, points: 150, status: 'Active', lastLogin: Date.now(), ipAddress: 'NPC', icon: 'villain' },
    { nickname: 'The Gambler (นักพนัน)', email: 'npc9@studio1923.com', password: 'npc', isAdmin: false, coins: 2000, points: 100, status: 'Active', lastLogin: Date.now(), ipAddress: 'NPC', icon: 'villain' },
    { nickname: 'Page Turner (ผู้พลิกหน้ากระดาษ)', email: 'npc10@studio1923.com', password: 'npc', isAdmin: false, coins: 1000, points: 50, status: 'Active', lastLogin: Date.now(), ipAddress: 'NPC', icon: 'villain' },
    // Richest Users
    { nickname: 'Goldfinger (ราชันย์เหรียญทอง)', email: 'npc11@studio1923.com', password: 'npc', isAdmin: false, coins: 1000000, points: 50000, status: 'Active', lastLogin: Date.now(), ipAddress: 'NPC', icon: 'villain' },
    { nickname: 'Diamond Eye (เนตรเพชร)', email: 'npc12@studio1923.com', password: 'npc', isAdmin: false, coins: 900000, points: 45000, status: 'Active', lastLogin: Date.now(), ipAddress: 'NPC', icon: 'villain' },
    { nickname: 'The Broker (นายหน้ายมโลก)', email: 'npc13@studio1923.com', password: 'npc', isAdmin: false, coins: 800000, points: 40000, status: 'Active', lastLogin: Date.now(), ipAddress: 'NPC', icon: 'villain' },
    { nickname: 'Coin Monger (พ่อค้าเหรียญ)', email: 'npc14@studio1923.com', password: 'npc', isAdmin: false, coins: 700000, points: 35000, status: 'Active', lastLogin: Date.now(), ipAddress: 'NPC', icon: 'villain' },
    { nickname: 'Point Baron (ขุนนางแต้ม)', email: 'npc15@studio1923.com', password: 'npc', isAdmin: false, coins: 600000, points: 30000, status: 'Active', lastLogin: Date.now(), ipAddress: 'NPC', icon: 'villain' },
    { nickname: 'The Treasurer (เจ้าคลัง)', email: 'npc16@studio1923.com', password: 'npc', isAdmin: false, coins: 500000, points: 25000, status: 'Active', lastLogin: Date.now(), ipAddress: 'NPC', icon: 'villain' },
    { nickname: 'High Roller (เจ้ามือ)', email: 'npc17@studio1923.com', password: 'npc', isAdmin: false, coins: 400000, points: 20000, status: 'Active', lastLogin: Date.now(), ipAddress: 'NPC', icon: 'villain' },
    { nickname: 'Cash King (ราชาเงินสด)', email: 'npc18@studio1923.com', password: 'npc', isAdmin: false, coins: 300000, points: 15000, status: 'Active', lastLogin: Date.now(), ipAddress: 'NPC', icon: 'villain' },
    { nickname: 'The Investor (นักลงทุน)', email: 'npc19@studio1923.com', password: 'npc', isAdmin: false, coins: 200000, points: 10000, status: 'Active', lastLogin: Date.now(), ipAddress: 'NPC', icon: 'villain' },
    { nickname: 'Lucky Penny (เหรียญนำโชค)', email: 'npc20@studio1923.com', password: 'npc', isAdmin: false, coins: 100000, points: 5000, status: 'Active', lastLogin: Date.now(), ipAddress: 'NPC', icon: 'villain' },
];

const allInitialUsers = [...realInitialUsers, ...npcUsers];


const setupNpcCollections = async () => {
    const collectorNpcs = npcUsers.slice(0, 10);
    for (let i = 0; i < collectorNpcs.length; i++) {
        const npc = collectorNpcs[i];
        try {
            const existingCollection = await cardService.getUserCollection(npc.nickname);
            if (existingCollection.length === 0) {
                const cardCount = 1200 - (i * 100);
                
                const mockCards: Card[] = [];
                const shuffledFullDB = [...fullCardDatabase].sort(() => 0.5 - Math.random());
                for(let j = 0; j < cardCount; j++) {
                    mockCards.push(shuffledFullDB[j % shuffledFullDB.length]);
                }
                
                await cardService.saveUserCollection(npc.nickname, mockCards);
            }
        } catch (error) {
            console.error(`Failed to set up collection for NPC ${npc.nickname}:`, error);
        }
    }
};

const setupTestUserCollection = async () => {
    const testUserNickname = 'MemberTest';
    try {
        const existingCollection = await cardService.getUserCollection(testUserNickname);
        if (existingCollection.length === 0) {
            console.log(`Setting up initial collection for ${testUserNickname}...`);
            const startingCards: Card[] = [];
            // Add 5 random cards from season 1
            const season1Cards = fullCardDatabase.filter(c => c.season === 1);
            for (let i = 0; i < 5; i++) {
                startingCards.push(season1Cards[Math.floor(Math.random() * season1Cards.length)]);
            }
             // Add 5 random cards from season 7
            const season7Cards = fullCardDatabase.filter(c => c.season === 7);
            for (let i = 0; i < 5; i++) {
                startingCards.push(season7Cards[Math.floor(Math.random() * season7Cards.length)]);
            }
            await cardService.saveUserCollection(testUserNickname, startingCards);
        }
    } catch (error) {
        console.error(`Failed to set up collection for test user ${testUserNickname}:`, error);
    }
};


export const initializeUsers = async (): Promise<void> => {
    const db = await getDb();
    
    // Phase 1: Ensure users exist
    const userTransaction = db.transaction(STORE_NAME, 'readwrite');
    const userStore = userTransaction.objectStore(STORE_NAME);
    const userIndex = userStore.index('nickname');

    const userPromises = allInitialUsers.map(user => {
        return new Promise<void>(resolve => {
            const checkReq = userIndex.get(user.nickname);
            checkReq.onsuccess = () => {
                if (!checkReq.result) {
                    const fullUser: User = { ...user, id: `user-${Date.now()}-${Math.random()}` };
                    userStore.add(fullUser);
                }
                resolve();
            };
            checkReq.onerror = () => {
                console.error(`Error checking for user ${user.nickname}`);
                resolve(); // Resolve anyway to not block initialization
            };
        });
    });

    await Promise.all(userPromises);

    await new Promise<void>(resolve => {
        userTransaction.oncomplete = () => resolve();
        userTransaction.onerror = () => {
            console.error("User initialization transaction failed");
            resolve();
        };
    });
    
    // Phase 2: Set up collections
    await setupNpcCollections();
    await setupTestUserCollection();
};

export const getUsers = async (): Promise<User[]> => {
    const db = await getDb();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.getAll();
        request.onerror = () => reject('Error fetching users');
        request.onsuccess = () => resolve(request.result);
    });
};

export const saveUser = async (user: User): Promise<void> => {
    const db = await getDb();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.put(user);
        request.onerror = () => reject('Error saving user');
        request.onsuccess = () => resolve();
    });
};

export const deleteUser = async (userId: string): Promise<void> => {
    const db = await getDb();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.delete(userId);
        request.onerror = () => reject('Error deleting user');
        request.onsuccess = () => resolve();
    });
};

export const getUser = async (userId: string): Promise<User | undefined> => {
    const db = await getDb();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.get(userId);
        request.onerror = () => reject('Error fetching user');
        request.onsuccess = () => resolve(request.result);
    });
};

export const getUserByNickname = async (nickname: string): Promise<User | undefined> => {
    const db = await getDb();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const index = store.index('nickname');
        const request = index.get(nickname);
        request.onerror = () => reject('Error fetching user by nickname');
        request.onsuccess = () => resolve(request.result);
    });
};