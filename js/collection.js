export function addEntry(collection, entry) {
    const others = collection.filter((item) => item.number !== entry.number);
    return [...others, { ...entry, isFavorite: false }];
}

export function getFirstDate(collection) {
    return collection.map((entry) => entry.date).sort()[0] ?? null;
}