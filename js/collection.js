import { getMode } from "./modes.js";

export function addEntry(collection, entry) {
    const others = collection.filter((item) => item.number !== entry.number);
    return [...others, { ...entry, isFavorite: false }];
}

export function getFirstDate(collection) {
    return collection.map((entry) => entry.date).sort()[0] ?? null;
}

export const DEFAULT_FILTERS = { search: '', mode: '', sort: 'newest', favorites: false};

export function filterCollection(collection, { search, mode, favorites }) {
    const query = search.trim().toLowerCase();

    return collection.filter((entry) => {
        const text = `${entry.song.trackName} ${entry.song.artistName} ${entry.tag}`.toLowerCase();
        const matchesSearch = text.includes(query);
        const matchesMode = !mode || entry.mode === mode;
        const matchesFavorites = !favorites || entry.isFavorite;
        return matchesSearch && matchesMode && matchesFavorites;
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

    return { pressings: collection.length, countries: countries.size, favorites };
}