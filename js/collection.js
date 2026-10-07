export function addEntry(collection, entry) {
    const others = collection.filter((item) => item.number !== entry.number);
    return [...others, { ...entry, isFavorite: false }];
}