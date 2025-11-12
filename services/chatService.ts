import { getDb } from './cardService';
import { ChatMessage } from '../types';

const STORE_NAME = 'chat_messages';
const MAX_MESSAGES = 100; // Keep only the last 100 messages

/**
 * Retrieves the latest chat messages.
 * @returns A promise that resolves to an array of ChatMessage objects.
 */
export const getMessages = async (): Promise<ChatMessage[]> => {
    const db = await getDb();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.getAll();

        request.onerror = () => reject('Error fetching messages');
        request.onsuccess = () => {
            // Sort messages by timestamp before resolving
            const sortedMessages = request.result.sort((a, b) => a.timestamp - b.timestamp);
            resolve(sortedMessages);
        };
    });
};

/**
 * Adds a new message to the chat and trims old messages if the limit is exceeded.
 * @param nickname The sender's nickname.
 * @param message The message content.
 * @returns A promise that resolves to the new ChatMessage object.
 */
export const sendMessage = async (nickname: string, message: string): Promise<ChatMessage> => {
    const db = await getDb();
    const newMessage: ChatMessage = {
        id: `${Date.now()}-${nickname}-${Math.random()}`,
        nickname,
        message,
        timestamp: Date.now(),
    };

    return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        
        const addRequest = store.put(newMessage);
        addRequest.onerror = () => reject('Error sending message');

        addRequest.onsuccess = () => {
            // After adding, check if we need to trim old messages
            const countRequest = store.count();
            countRequest.onsuccess = () => {
                if (countRequest.result > MAX_MESSAGES) {
                    // Open a cursor to delete the oldest message
                    const openCursorRequest = store.openCursor();
                    openCursorRequest.onsuccess = (event) => {
                        const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;
                        if (cursor) {
                            cursor.delete(); // This deletes the first (oldest) item
                        }
                    };
                }
            };
            resolve(newMessage);
        };

        transaction.onerror = () => {
             reject('Transaction error while sending message and trimming');
        }
    });
};
