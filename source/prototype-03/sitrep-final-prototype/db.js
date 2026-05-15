/**
 * db.js - IndexedDB Wrapper for local persistence
 */
const DB_NAME = 'SitRepDB';
const DB_VERSION = 1;

export const db = {
    async open() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, DB_VERSION);
            request.onupgradeneeded = (e) => {
                const db = e.target.result;
                if (!db.objectStoreNames.contains('checkins')) {
                    db.createObjectStore('checkins', { keyPath: 'id', autoIncrement: true });
                }
            };
            request.onsuccess = (e) => resolve(e.target.result);
            request.onerror = (e) => reject(e.target.error);
        });
    },

    async saveCheckin(checkin) {
        const database = await this.open();
        return new Promise((resolve, reject) => {
            const tx = database.transaction('checkins', 'readwrite');
            const store = tx.objectStore('checkins');
            const request = store.add(checkin);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    },

    async getAllCheckins() {
        const database = await this.open();
        return new Promise((resolve, reject) => {
            const tx = database.transaction('checkins', 'readonly');
            const store = tx.objectStore('checkins');
            const request = store.getAll();
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }
};
