import { getMode } from "./modes.js";

export function addEntry(collection, entry) {
    const others = collection.filter((item) => item.number !== entry.number);
    return [...others, { ...entry, isFavorite: false }];
}

export function getFirstDate(collection) {
    return collection.map((entry) => entry.date).sort()[0] ?? null;
}

export function sortNewest(collection) {
    return [...collection].sort((a, b) => b.number - a.number);
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