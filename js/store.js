export function readJson(key, fallback = null) {
    try {
        return JSON.parse(localStorage.getItem(key)) ?? fallback;
    } catch (error) {
        console.error(`Saved data is not valio JSON: ${key}`, error);
        return fallback;
    }
}

export function writeJson(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
}

export default function createStore(profileId) {
    const todayKey = `unheard:${profileId}:today`;

    function getToday() {
        return readJson(todayKey);
    }

    function saveToday(today) {
        writeJson(todayKey, today);
    }

    function clearToday() {
        localStorage.removeItem(todayKey);
    }

    return { getToday, saveToday, clearToday };
}