// store.js: saving and reading data in the browser. readJson and writeJson work with
// localStorage or sessionStorage, and createStore gives each profile its own keys.

// Never crashes on missing or broken data: it logs the problem and returns the fallback.
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

// A closure: the three keys are built once from the profile's id and kept private.
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

    // Saved settings are merged over the defaults, so profiles saved before a
    // setting existed still get a value for it.
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

    // Removes only this profile's keys, never localStorage.clear(), because every
    // GitHub Pages project of the same account shares one localStorage.
    function clearAll() {
        [todayKey, settingsKey, collectionKey].forEach((key) => localStorage.removeItem(key));
    }

    return { getToday, saveToday, clearToday, getSettings, saveSettings, getCollection, saveCollection, clearAll };
}