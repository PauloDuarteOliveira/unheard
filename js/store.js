export function readJson(key, fallback = null) {
    try {
        return JSON.parse(localStorage.getItem(key)) ?? fallback;
    } catch (error) {
        console.error(`Saved data is not valid JSON: ${key}`, error);
        return fallback;
    }
}

export function writeJson(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
}

export default function createStore(profileId) {
    const todayKey = `unheard:${profileId}:today`;
    const settingsKey = `unheard:${profileId}:settings`;

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
        return readJson(settingsKey, { blockedGenres: [] });
    }

    function saveSettings(settings) {
        writeJson(settingsKey, settings);
    }

    return { getToday, saveToday, clearToday, getSettings, saveSettings };
}