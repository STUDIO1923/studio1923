import { getDb } from './cardService';
import { MarketListing } from '../types';

const STORE_NAME = 'market_listings';

/**
 * Retrieves all card listings from the marketplace.
 * @returns A promise that resolves to an array of MarketListing objects.
 */
export const getAllListings = async (): Promise<MarketListing[]> => {
    const db = await getDb();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.getAll();

        request.onerror = () => reject('Error fetching listings');
        request.onsuccess = () => resolve(request.result);
    });
};

/**
 * Creates a new card listing in the marketplace.
 * @param listing The MarketListing object to save.
 * @returns A promise that resolves when the operation is complete.
 */
export const createListing = async (listing: MarketListing): Promise<void> => {
    const db = await getDb();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.put(listing);

        request.onerror = () => reject('Error creating listing');
        request.onsuccess = () => resolve();
    });
};

/**
 * Deletes a card listing from the marketplace by its ID.
 * @param listingId The ID of the listing to delete.
 * @returns A promise that resolves when the operation is complete.
 */
export const deleteListing = async (listingId: string): Promise<void> => {
    const db = await getDb();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.delete(listingId);

        request.onerror = () => reject('Error deleting listing');
        request.onsuccess = () => resolve();
    });
};
