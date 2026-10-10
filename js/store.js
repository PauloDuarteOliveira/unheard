export function readJson(key, fallback = null, storage = localStorage) {
    try {
        return JSON.parse(storage.getItem(key)) ?? fallback;
    } catch (error) {
        console.error(`Saved data is not valid JSON: ${key}`, error);
        return fallback;
    }
}

export function writeJson(key, value, storage = localStorage) {
    storage.setItem(key, JSON.stringify(value));
}

export default function createStore(profileId) {
    const todayKey = `unheard:${profileId}:today`;
    const settingsKey = `unheard:${profileId}:settings`;
    const collectionKey = `unheard:${profileId}:collection`;
    const DEFAULT_SETTINGS = { blockedGenres: [], defaultMode: 'random', autoplay: false, theme: 'dark', volume: 0.25 };

    function getToday() {
        return readJson(todayKey);
    }

    function saveToday(today) {
        writeJson(todayKey, today);
    }

    function clearToday() {
        localStorage.removeItem(todayKey);
    }

    function getSettings() {
        return { ...DEFAULT_SETTINGS, ...readJson(settingsKey, {}) };
    }

    function saveSettings(settings) {
        writeJson(settingsKey, settings);
    }

    function getCollection() {
        return readJson(collectionKey, []);
    }

    function saveCollection(collection) {
        writeJson(collectionKey, collection);
    }

    function clearAll() {
        [todayKey, settingsKey, collectionKey].forEach((key) => localStorage.removeItem(key));
    }

    return { getToday, saveToday, clearToday, getSettings, saveSettings, getCollection, saveCollection, clearAll };
}