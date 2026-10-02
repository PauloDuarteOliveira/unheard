const MS_PER_SECOND = 1000;
const SECONDS_PER_MINUTE = 60;
const SECONDS_PER_HOUR = 3600;

const MORNING_START_HOUR = 5;
const AFTERNOON_START_HOUR = 12;
const EVENING_START_HOUR = 18;
const LATE_NIGHT_START_HOUR = 22;

const SMALL_COVER_SIZE = '100x100';
const LARGE_COVER_SIZE = '600x600';

const SPOTIFY_SEARCH_URL = 'https://open.spotify.com/search/';

function twoDigits(number) {
    return String(number).padStart(2, '0');
}

export function getDateKey(date = new Date()) {
    const year = date.getFullYear();
    const month = twoDigits(date.getMonth() + 1);
    const day = twoDigits(date.getDate());
    return `${year}-${month}-${day}`;
}

export function getMsUntilMidnight(now = new Date()) {
    const midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    return midnight - now;
}

export function formatCountdown(ms) {
    const totalSeconds = Math.max(0, Math.floor(ms / MS_PER_SECOND));
    const hours = Math.floor(totalSeconds / SECONDS_PER_HOUR);
    const minutes = Math.floor((totalSeconds % SECONDS_PER_HOUR) / SECONDS_PER_MINUTE);
    const seconds = totalSeconds % SECONDS_PER_MINUTE;
    return `${twoDigits(hours)}:${twoDigits(minutes)}:${twoDigits(seconds)}`;
}

export function getGreeting(hour = new Date().getHours()) {
    if (hour >= MORNING_START_HOUR && hour < AFTERNOON_START_HOUR) return 'Good morning';
    if (hour >= AFTERNOON_START_HOUR && hour < EVENING_START_HOUR) return 'Good afternoon';
    if (hour >= EVENING_START_HOUR && hour < LATE_NIGHT_START_HOUR) return 'Good evening';
    return 'Late night listening';
}

export function getReleaseYear(releaseDate) {
    return releaseDate ? releaseDate.slice(0, 4) : '';
}

export function getCoverUrl(artworkUrl) {
    return artworkUrl.replace(SMALL_COVER_SIZE, LARGE_COVER_SIZE);
}

export function getSpotifyUrl(song){
    const searchText = `${song.trackName} ${song.artistName}`;
    return SPOTIFY_SEARCH_URL + encodeURIComponent(searchText);
}

export function getShareText(song){
    return `Today I discovered ${song.trackName} by ${song.artistName} 🎧`;
}

export function pickRandom(list) {
    const index = Math.floor(Math.random() * list.length);
    return list[index];
}
