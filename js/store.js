export default function createStore(profileId) {
    const todayKey = `unheard:${profileId}:today`;

    function read(key) {    
        try {
            return JSON.parse(localStorage.getItem(key));
        } catch (error) {
            console.error(`Saved data is not valid JSON: ${key}`, error);
            return null;
        }
    }

    function write(key, value) {
        localStorage.setItem(key, JSON.stringify(value));
    }

    function getToday() {
        return read(todayKey);
    }

    function saveToday(today) {
        write(todayKey, today);
    }

    function clearToday() {
        localStorage.removeItem(todayKey);
    }

    return { getToday, saveToday, clearToday };
}
