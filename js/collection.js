import { MODES, getMode } from "./modes.js";
import { addDays } from "./utils.js";

export function addEntry(collection, entry) {
    const others = collection.filter((item) => item.number !== entry.number);
    return [...others, { ...entry, isFavorite: false }];
}

export function getFirstDate(collection) {
    return collection.map((entry) => entry.date).sort()[0] ?? null;
}

export const DEFAULT_FILTERS = { search: '', mode: '', rarity: '', sort: 'newest', favorites: false };

export function filterCollection(collection, { search, mode, rarity, favorites }) {
    const query = search.trim().toLowerCase();

    return collection.filter((entry) => {
        const text = `${entry.song.trackName} ${entry.song.artistName} ${entry.tag}`.toLowerCase();
        const matchesSearch = text.includes(query);
        const matchesMode = !mode || entry.mode === mode;
        const matchesFavorites = !favorites || entry.isFavorite;
        const matchesRarity = !rarity || entry.rarity?.tier === rarity;
        return matchesSearch && matchesMode && matchesRarity && matchesFavorites;
    });
}

export function sortCollection(collection, sort) {
    const sorted = [...collection];

    switch (sort) {
        case 'oldest':
            return sorted.sort((a, b) => a.number - b.number);
        case 'title':
            return sorted.sort((a, b) => a.song.trackName.localeCompare(b.song.trackName));
        default:
            return sorted.sort((a, b) => b.number - a.number);
    }
}


export function getEntryTag(entry, pool) {
    const mode = getMode(entry.mode);
    const options = pool?.[mode.optionsKey] ?? [];
    const option = options.find((item) => item.key === entry.optionKey);
    return option?.label ?? mode.shortName;
}

export function toggleFavorite(collection, number) {
    return collection.map((entry) =>
        entry.number === number ? { ...entry, isFavorite: !entry.isFavorite } : entry);
}

export function getStats(collection) {
    const countries = new Set(
        collection
            .filter((entry) => entry.mode === 'world' && entry.optionKey)
            .map((entry) => entry.optionKey)
    );

    const favorites = collection.reduce((count, entry) => (entry.isFavorite ? count + 1 :
        count), 0);

    const legendary = collection.filter((entry) => entry.rarity?.tier === 'legendary').length;

    return { pressings: collection.length, countries: countries.size, favorites, legendary };
}

export function getFavorites(collection) {
    return sortCollection(collection, 'oldest').filter((entry) => entry.isFavorite);
}

export function formatFavorites(favorites) {
    return favorites.map((entry) => `${entry.song.artistName} - ${entry.song.trackName}`).join('\n');
}

function getDays(collection) {
    return [...new Set(collection.map((entry) => entry.date))].sort();
}

export function getStreak(collection, todayKey) {
    const days = new Set(getDays(collection));
    let day = days.has(todayKey) ? todayKey : addDays(todayKey, -1);
    let count = 0;

    while (days.has(day)) {
        count++;
        day = addDays(day, -1);
    }

    return count;
}

export function getBestStreak(collection) {
    const days = getDays(collection);
    let best = 0;
    let run = 0;

    days.forEach((day, index) => {
        const followsPrevious = index > 0 && addDays(days[index - 1], 1) === day;
        run = followsPrevious ? run + 1 : 1;
        best = Math.max(best, run);
    });

    return best;
}

export function getSets(collection, pool, blockedGenres = []) {
    return MODES
        .filter((mode) => mode.setTitle)
        .map((mode) => {
            const found = new Set(
                collection.filter((entry) => entry.mode === mode.key).map((entry) => entry.optionKey));
            const options = (pool?.[mode.optionsKey] ?? [])
                .filter((option) => mode.key !== 'genre' || !blockedGenres.includes(option.key));
            const slots = options.map((option) => ({ label: option.label, isFound: found.has(option.key) }));

            return {
                key: mode.key,
                title: mode.setTitle,
                slots,
                count: slots.filter((slot) => slot.isFound).length,
            };
        });
}