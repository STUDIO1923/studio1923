import { getDb } from './cardService';
import { CardPack } from '../types';

const STORE_NAME = 'card_packs';

/**
 * Retrieves all card packs from the database.
 * @returns A promise that resolves to an array of CardPack objects.
 */
export const getAllPacks = async (): Promise<CardPack[]> => {
    const db = await getDb();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.getAll();

        request.onerror = () => reject('Error fetching packs');
        request.onsuccess = () => resolve(request.result);
    });
};

/**
 * Adds a new pack or updates an existing one.
 * @param pack The CardPack object to save. The ID should be the season number.
 * @returns A promise that resolves when the operation is complete.
 */
export const savePack = async (pack: CardPack): Promise<void> => {
    const db = await getDb();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.put(pack);

        request.onerror = () => reject('Error saving pack');
        request.onsuccess = () => resolve();
    });
};