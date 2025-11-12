import { getDb } from './cardService';
import { AuditLog } from '../types';

const STORE_NAME = 'audit_logs';

/**
 * Logs a currency transaction to the database.
 * @param nickname The user's nickname.
 * @param type 'coin' or 'point'.
 * @param amount The amount transacted.
 * @param source A string describing the source of the transaction.
 */
export const logTransaction = async (nickname: string, type: 'coin' | 'point', amount: number, source: string): Promise<void> => {
    if (amount === 0) return; // Don't log zero-value transactions
    const db = await getDb();
    const newLog: Omit<AuditLog, 'id'> = {
        nickname,
        type,
        amount,
        source,
        timestamp: Date.now(),
    };

    return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.add(newLog);

        request.onerror = () => reject('Error logging transaction');
        request.onsuccess = () => resolve();
    });
};

/**
 * Retrieves all audit logs from the database.
 * @returns A promise that resolves to an array of AuditLog objects.
 */
export const getAllLogs = async (): Promise<AuditLog[]> => {
    const db = await getDb();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.getAll();

        request.onerror = () => reject('Error fetching audit logs');
        request.onsuccess = () => resolve(request.result);
    });
};

/**
 * Analyzes audit logs to find users with suspicious activity.
 * @returns A promise that resolves to a Set of nicknames of suspicious users.
 */
export const getSuspiciousUsers = async (): Promise<Set<string>> => {
    const logs = await getAllLogs();
    const userLogs = new Map<string, AuditLog[]>();

    // Group logs by nickname
    for (const log of logs) {
        if (!userLogs.has(log.nickname)) {
            userLogs.set(log.nickname, []);
        }
        userLogs.get(log.nickname)!.push(log);
    }

    const suspiciousNicknames = new Set<string>();
    const now = Date.now();

    for (const [nickname, userLogList] of userLogs.entries()) {
        let isSuspicious = false;

        // Check 1: Single large transaction (not from a known high-reward source)
        const hasLargeTx = userLogList.some(log => 
            log.amount > 5000 && 
            !log.source.includes('JACKPOT') && 
            !log.source.includes('Market Sale')
        );
        if (hasLargeTx) {
            isSuspicious = true;
        }

        // Check 2: High frequency of transactions
        if (!isSuspicious) {
            const oneMinuteAgo = now - 60000;
            const recentLogs = userLogList.filter(log => log.timestamp > oneMinuteAgo);
            if (recentLogs.length > 30) { // More than 30 gains in 1 minute
                isSuspicious = true;
            }
        }
        
        if (isSuspicious) {
            suspiciousNicknames.add(nickname);
        }
    }

    return suspiciousNicknames;
};