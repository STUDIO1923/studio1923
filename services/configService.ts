import { getDb } from './cardService';
import { DUNGEON_DATABASE } from './dungeonDatabase';

const STORE_NAME = 'site_config';

// Use valid, minimal placeholder images to prevent syntax errors from corrupted strings.
const defaultCardFrontPlaceholder = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';
const global_card_back_image = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';

export const DEFAULT_CONFIG: Record<string, string> = {
    global_card_front_image_placeholder: defaultCardFrontPlaceholder,
    global_card_back_image: global_card_back_image,
    auth_background: '',
    view_slot_background: '',
    view_shop_background: '',
    view_market_background: '',
    view_chat_background: '',
    view_packOpening_background: '',
    view_collection_background: '',
    view_pets_background: '',
    view_luckyDraw_background: '',
    view_dungeon_background: '',
    pet_home_background_options: '[]',
    pet_quest_background_Forest: '',
    pet_quest_background_Cave: '',
    pet_quest_background_Mountain: '',
    pet_quest_background_Plains: '',
    pet_quest_background_Ruins: '',
    pet_quest_background_Water: '',
    pet_quest_background_Default: '',
};

// Add default keys for season banners
for (let i = 1; i <= 23; i++) {
    DEFAULT_CONFIG[`season_${i}_banner`] = '';
}

// Add default keys for dungeon backgrounds
for (const dungeon of DUNGEON_DATABASE) {
    DEFAULT_CONFIG[`dungeon_bg_${dungeon.id}`] = '';
}


/**
 * Retrieves all site configurations from the database.
 * @returns A promise that resolves to a Record of key-value pairs.
 */
export const getConfig = async (): Promise<Record<string, string>> => {
    const db = await getDb();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.getAll();

        request.onerror = () => reject('Error fetching config');
        request.onsuccess = () => {
            const result: Record<string, string> = {};
            request.result.forEach(item => {
                result[item.key] = item.value;
            });
            resolve({ ...DEFAULT_CONFIG, ...result });
        };
    });
};

/**
 * Saves a specific configuration setting.
 * @param key The configuration key.
 * @param value The configuration value.
 * @returns A promise that resolves when the operation is complete.
 */
export const saveConfig = async (key: string, value: string): Promise<void> => {
    const db = await getDb();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.put({ key, value });

        request.onerror = () => reject('Error saving config');
        request.onsuccess = () => resolve();
    });
};

/**
 * Initializes the database with default configurations if they don't exist.
 */
export const initializeConfig = async (): Promise<void> => {
    const db = await getDb();
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);

    const checkPromises = Object.keys(DEFAULT_CONFIG).map(key => {
        return new Promise<void>(resolve => {
            const request = store.get(key);
            request.onsuccess = () => {
                if (!request.result) {
                    store.add({ key, value: DEFAULT_CONFIG[key] });
                }
                resolve();
            };
            request.onerror = () => resolve(); // Continue even if one fails
        });
    });

    await Promise.all(checkPromises);
};