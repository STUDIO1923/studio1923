import { getDb } from './cardService';
import { UpdatePost } from '../types';

const STORE_NAME = 'updates_store';

/**
 * Retrieves all update posts from the database, sorted by most recent.
 * @returns A promise that resolves to an array of UpdatePost objects.
 */
export const getPosts = async (): Promise<UpdatePost[]> => {
    const db = await getDb();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.getAll();

        request.onerror = () => reject('Error fetching posts');
        request.onsuccess = () => {
            // Sort by timestamp descending (newest first)
            const sorted = request.result.sort((a, b) => b.timestamp - a.timestamp);
            resolve(sorted);
        };
    });
};

/**
 * Saves a new post or updates an existing one.
 * @param post The UpdatePost object to save.
 * @returns A promise that resolves when the operation is complete.
 */
export const savePost = async (post: UpdatePost): Promise<void> => {
    const db = await getDb();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.put(post);

        request.onerror = () => reject('Error saving post');
        request.onsuccess = () => resolve();
    });
};

/**
 * Deletes a post by its ID.
 * @param postId The ID of the post to delete.
 * @returns A promise that resolves when the operation is complete.
 */
export const deletePost = async (postId: string): Promise<void> => {
    const db = await getDb();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.delete(postId);

        request.onerror = () => reject('Error deleting post');
        request.onsuccess = () => resolve();
    });
};