// collection.js: the collector binder's logic, as pure functions. Each one takes the
// collection (an array of entries) and returns a value or a new array, without
// changing the original and without touching the page or the storage.

import { MODES, getMode } from "./modes.js";
import { addDays } from "./utils.js";

// ===== Changing entries =====

// A re-roll saves a new song with the same catalog number, so it replaces the old entry.
export function addEntry(collection, entry) {
    const others = collection.filter((item) => item.number !== entry.number);
    return [...others, { ...entry, isFavorite: false }];
}

export function toggleFavorite(collection, number) {
    return collection.map((entry) =>
        entry.number === number ? { ...entry, isFavorite: !entry.isFavorite } : entry);
}

// Tapping the same number of stars again clears the rating.
export function setRating(collection, number, stars) {
    return collection.map((entry) => {
        if (entry.number !== number) return entry;
        return { ...entry, rating: entry.rating === stars ? 0 : stars };
    });
}

// ===== Search, filters and sort =====

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

// Copies the array first, because sort() would change the original.
// Top rated: most stars first, then newest; unrated songs count as 0 and go last.
export function sortCollection(collection, sort) {
    const sorted = [...collection];

    switch (sort) {
        case 'oldest':
            return sorted.sort((a, b) => a.number - b.number);
        case 'title':
            return sorted.sort((a, b) => a.song.trackName.localeCompare(b.song.trackName));
        case 'rating':
            return sorted.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0) || b.number - a.number);
        default:
            return sorted.sort((a, b) => b.number - a.number);
    }
}

// The label shown on a card: the option that was chosen (a decade, a country...),
// or the mode's name for Random.
export function getEntryTag(entry, pool) {
    const mode = getMode(entry.mode);
    const options = pool?.[mode.optionsKey] ?? [];
    const option = options.find((item) => item.key === entry.optionKey);
    return option?.label ?? mode.shortName;
}

// ===== Stats and favorites =====

export function getStats(collection) {
    const countries = new Set(
        collection
            .filter((entry) => entry.mode === 'world' && entry.optionKey)
            .map((entry) => entry.optionKey)
    );

    const favorites = collection.reduce((count, entry) => (entry.isFavorite ? count + 1 :
        count), 0);

    const legendary = collection.filter((entry) => entry.rarity?.tier === 'legendary').length;

    const ratings = collection.map((entry) => entry.rating ?? 0).filter((rating) => rating > 0);
    const averageRating = ratings.length ? ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length : 0;

    return { pressings: collection.length, countries: countries.size, favorites, legendary, averageRating };
}

export function getFirstDate(collection) {
    return collection.map((entry) => entry.date).sort()[0] ?? null;
}

export function getFavorites(collection) {
    return sortCollection(collection, 'oldest').filter((entry) => entry.isFavorite);
}

// One "Artist - Title" per line, ready to paste into a playlist import tool.
export function formatFavorites(favorites) {
    return favorites.map((entry) => `${entry.song.artistName} - ${entry.song.trackName}`).join('\n');
}

// ===== Streaks =====
// Calculated from the collection's dates every time, so they can never go out of sync.

function getDays(collection) {
    return [...new Set(collection.map((entry) => entry.date))].sort();
}

// Counts back from today, or from yesterday if today has no discovery yet,
// so the streak is not broken until midnight.
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

// ===== Binder sets =====

// One set per mode with a dial. A slot is found when the collection has a song
// from that mode with that option. Blocked genres are left out of the Genres set.
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
