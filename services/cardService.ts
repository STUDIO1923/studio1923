import { Card } from '../types';
import { DEFAULT_CONFIG } from './configService';

const DB_NAME = 'studio1923DB';
const DB_VERSION = 11; // Incremented for achievements store
const CARDS_STORE_NAME = 'all_cards';
const USER_COLLECTIONS_STORE_NAME = 'user_collections';
const MARKET_LISTINGS_STORE_NAME = 'market_listings';
const CHAT_MESSAGES_STORE_NAME = 'chat_messages';
const CARD_PACKS_STORE_NAME = 'card_packs';
const SITE_CONFIG_STORE_NAME = 'site_config';
const PET_STORE_NAME = 'user_pets';
const UPDATES_STORE_NAME = 'updates_store';
const USER_DATA_STORE_NAME = 'user_data';
const AUDIT_LOGS_STORE_NAME = 'audit_logs';
const USER_ACHIEVEMENTS_STORE_NAME = 'user_achievements';

let dbPromise: Promise<IDBDatabase> | null = null;

export const getDb = (): Promise<IDBDatabase> => {
    if (dbPromise) {
        return dbPromise;
    }
    dbPromise = new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onerror = () => {
            console.error('IndexedDB error:', request.error);
            reject('Error opening IndexedDB');
        };

        request.onsuccess = () => {
            resolve(request.result);
        };

        request.onupgradeneeded = (event) => {
            const db = (event.target as IDBOpenDBRequest).result;
            const transaction = (event.target as IDBOpenDBRequest).transaction;

            if (event.oldVersion < 8) {
                 if (!db.objectStoreNames.contains(CARDS_STORE_NAME)) db.createObjectStore(CARDS_STORE_NAME, { keyPath: 'id' });
                if (!db.objectStoreNames.contains(USER_COLLECTIONS_STORE_NAME)) db.createObjectStore(USER_COLLECTIONS_STORE_NAME, { keyPath: 'nickname' });
                if (!db.objectStoreNames.contains(MARKET_LISTINGS_STORE_NAME)) db.createObjectStore(MARKET_LISTINGS_STORE_NAME, { keyPath: 'listingId' });
                if (!db.objectStoreNames.contains(CHAT_MESSAGES_STORE_NAME)) db.createObjectStore(CHAT_MESSAGES_STORE_NAME, { keyPath: 'id' });
                if (!db.objectStoreNames.contains(CARD_PACKS_STORE_NAME)) db.createObjectStore(CARD_PACKS_STORE_NAME, { keyPath: 'id' });
                if (!db.objectStoreNames.contains(SITE_CONFIG_STORE_NAME)) db.createObjectStore(SITE_CONFIG_STORE_NAME, { keyPath: 'key' });
                if (!db.objectStoreNames.contains(PET_STORE_NAME)) db.createObjectStore(PET_STORE_NAME, { keyPath: 'nickname' });
                if (!db.objectStoreNames.contains(UPDATES_STORE_NAME)) db.createObjectStore(UPDATES_STORE_NAME, { keyPath: 'id' });
                
                if (!db.objectStoreNames.contains(USER_DATA_STORE_NAME)) {
                    const userStore = db.createObjectStore(USER_DATA_STORE_NAME, { keyPath: 'id' });
                    userStore.createIndex('nickname', 'nickname', { unique: true });
                }
                if (!db.objectStoreNames.contains(AUDIT_LOGS_STORE_NAME)) {
                    const auditStore = db.createObjectStore(AUDIT_LOGS_STORE_NAME, { keyPath: 'id', autoIncrement: true });
                    auditStore.createIndex('nickname', 'nickname', { unique: false });
                    auditStore.createIndex('timestamp', 'timestamp', { unique: false });
                }
            }
            
            if (event.oldVersion < 10 && transaction) {
                console.log('Migrating database to v10: Updating card back images and default placeholders...');
                
                // Force update default images in config
                const configStore = transaction.objectStore(SITE_CONFIG_STORE_NAME);
                configStore.put({ key: 'global_card_back_image', value: DEFAULT_CONFIG.global_card_back_image });
                configStore.put({ key: 'global_card_front_image_placeholder', value: DEFAULT_CONFIG.global_card_front_image_placeholder });

                // Update back image for all existing cards
                const cardStore = transaction.objectStore(CARDS_STORE_NAME);
                cardStore.openCursor().onsuccess = (e) => {
                    const cursor = (e.target as IDBRequest<IDBCursorWithValue>).result;
                    if (cursor) {
                        const card: Card = cursor.value;
                        card.backImage = DEFAULT_CONFIG.global_card_back_image;
                        cursor.update(card);
                        cursor.continue();
                    }
                };
            }
            
            if (event.oldVersion < 11) {
                 if (!db.objectStoreNames.contains(USER_ACHIEVEMENTS_STORE_NAME)) {
                    db.createObjectStore(USER_ACHIEVEMENTS_STORE_NAME, { keyPath: 'nickname' });
                }
            }
        };
    });
    return dbPromise;
};

export const countCards = async (): Promise<number> => {
    const db = await getDb();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(CARDS_STORE_NAME, 'readonly');
        const store = transaction.objectStore(CARDS_STORE_NAME);
        const request = store.count();
        request.onerror = () => reject('Error counting cards');
        request.onsuccess = () => resolve(request.result);
    });
};


export const getAllCards = async (): Promise<Card[]> => {
    const db = await getDb();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(CARDS_STORE_NAME, 'readonly');
        const store = transaction.objectStore(CARDS_STORE_NAME);
        const request = store.getAll();

        request.onerror = () => reject('Error fetching cards');
        request.onsuccess = () => resolve(request.result);
    });
};

export const saveCards = async (cards: Card[]): Promise<void> => {
    if (cards.length === 0) return;
    const db = await getDb();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(CARDS_STORE_NAME, 'readwrite');
        const store = transaction.objectStore(CARDS_STORE_NAME);
        
        cards.forEach(card => store.put(card));

        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject('Transaction failed while saving cards');
    });
};

export const saveCard = async (card: Card): Promise<void> => {
    const db = await getDb();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(CARDS_STORE_NAME, 'readwrite');
        const store = transaction.objectStore(CARDS_STORE_NAME);
        const request = store.put(card);

        request.onerror = () => reject('Error saving card');
        request.onsuccess = () => resolve();
    });
};

export const deleteCard = async (cardId: string): Promise<void> => {
    const db = await getDb();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(CARDS_STORE_NAME, 'readwrite');
        const store = transaction.objectStore(CARDS_STORE_NAME);
        const request = store.delete(cardId);

        request.onerror = () => reject('Error deleting card');
        request.onsuccess = () => resolve();
    });
};

export const getUserCollection = async (nickname: string): Promise<Card[]> => {
    const db = await getDb();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(USER_COLLECTIONS_STORE_NAME, 'readonly');
        const store = transaction.objectStore(USER_COLLECTIONS_STORE_NAME);
        const request = store.get(nickname);

        request.onerror = () => reject('Error fetching user collection');
        request.onsuccess = () => {
            resolve(request.result ? request.result.cards : []);
        };
    });
};

export const saveUserCollection = async (nickname: string, cards: Card[]): Promise<void> => {
    const db = await getDb();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(USER_COLLECTIONS_STORE_NAME, 'readwrite');
        const store = transaction.objectStore(USER_COLLECTIONS_STORE_NAME);
        const request = store.put({ nickname, cards });

        request.onerror = () => reject('Error saving user collection');
        request.onsuccess = () => resolve();
    });
};