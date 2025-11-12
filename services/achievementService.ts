import { getDb } from './cardService';
import { UserAchievementProgress } from '../types';

const STORE_NAME = 'user_achievements';

/**
 * Retrieves a user's achievement progress from the database.
 * @param nickname The user's nickname.
 * @returns A promise that resolves to the UserAchievementProgress object.
 */
export const getAchievementProgress = async (nickname: string): Promise<UserAchievementProgress> => {
    const db = await getDb();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.get(nickname);

        request.onerror = () => reject('Error fetching achievement progress');
        request.onsuccess = () => {
            resolve(request.result ? request.result.progress : {});
        };
    });
};

/**
 * Saves a user's achievement progress to the database.
 * @param nickname The user's nickname.
 * @param progress The UserAchievementProgress object to save.
 * @returns A promise that resolves when the operation is complete.
 */
export const saveAchievementProgress = async (nickname: string, progress: UserAchievementProgress): Promise<void> => {
    const db = await getDb();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.put({ nickname, progress });

        request.onerror = () => reject('Error saving achievement progress');
        request.onsuccess = () => resolve();
    });
};