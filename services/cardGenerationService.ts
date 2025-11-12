import * as cardService from './cardService';
import { Card } from '../types';
import { fullCardDatabase } from './fullCardDatabase'; // Import the pre-generated database

/**
 * Initializes the card database from a pre-generated offline file.
 * This is a fast, one-time operation on first app load.
 */
export const initializeCardDatabase = async (
    onProgress: (status: { message: string; progress: number | null }) => void
) => {
    try {
        onProgress({ message: 'ตรวจสอบฐานข้อมูลการ์ด...', progress: 10 });
        const cardCount = await cardService.countCards();

        if (cardCount >= fullCardDatabase.length) {
            console.log("Card database is already fully populated.");
            onProgress({ message: 'โหลดฐานข้อมูลการ์ดสำเร็จ', progress: 100 });
            return;
        }

        onProgress({ message: 'กำลังตั้งค่าฐานข้อมูลครั้งแรก...', progress: 25 });
        
        // Use the imported full database
        const cardsToSave: Card[] = fullCardDatabase;

        await cardService.saveCards(cardsToSave);

        onProgress({ message: 'ตั้งค่าฐานข้อมูลสำเร็จ!', progress: 100 });
        console.log("Card database initialization complete from offline source!");

    } catch (error) {
        console.error("Failed to initialize card database from offline source:", error);
        onProgress({ message: 'เกิดข้อผิดพลาดในการตั้งค่าฐานข้อมูล', progress: null });
        throw error;
    }
};
