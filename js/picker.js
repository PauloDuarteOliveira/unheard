import { searchSongs, verifyPreview } from './api.js';
import { buildQuery } from './modes.js';
import { pickRandom } from './utils.js';

const MAX_ATTEMPTS = 3;

export const NO_SONG_MESSAGE = 'No playable song found';

export default function createPicker() {
    const triedIds = new Set();

    function pick(songs) {
        const freshSongs = songs.filter((song) => !triedIds.has(song.trackId));
        if (freshSongs.length === 0) return null;

        const song = pickRandom(freshSongs);
        triedIds.add(song.trackId);
        return song;
    }

    return { pick };
}

function getBlockedNames(genres, blockedGenres) {
    return genres
        .filter((genre) => blockedGenres.includes(genre.key))
        .flatMap((genre) => genre.matches);
}

export async function discoverSong(modeKey, pool, picker, optionKey, blockedGenres = []) {
    const blockedNames = getBlockedNames(pool.genres, blockedGenres);
    const allowedPool = {
        ...pool, genres: pool.genres.filter((genre) =>
            !blockedGenres.includes(genre.key))
    };

    function isAllowed(song, query) {
        const passesMode = query.filter ? query.filter(song) : true;
        return passesMode && !blockedNames.includes(song.primaryGenreName);
    }

    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
        const query = buildQuery(modeKey, allowedPool, optionKey);
        const results = await searchSongs(query);
        const songs = results.filter((song) => isAllowed(song, query));

        const candidate = picker.pick(songs);
        if (!candidate) continue;

        try {
            await verifyPreview(candidate.previewUrl);
            return candidate;
        } catch (error) {
            console.warn(`Attempt ${attempt}: preview not playable, trying another song.`, error);
        }
    }

    throw new Error(NO_SONG_MESSAGE);
}
