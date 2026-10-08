import { getReleaseYear } from "./utils.js";

function getYearPoints(song, rules) {
    const year = Number(getReleaseYear(song.releaseDate));
    if (!year) return 0;

    const match = rules.yearPoints.find((rule) => year < rule.before);
    return match?.points ?? 0;
}

function rollLuck(rules) {
    return Math.floor(Math.random() * (rules.maxLuck + 1));
}

export function scoreSong(entry, collection, rules, luck = rollLuck(rules)) {
    const { song } = entry;
    let points = getYearPoints(song, rules);

    const isFirstCountry = entry.mode === 'world' && !collection.some((item) =>
        item.mode === 'world' && item.optionKey === entry.optionKey);
    if (isFirstCountry) points += rules.firstCountryPoints;

    const isFirstGenre = !collection.some((item) =>
        item.song.primaryGenreName === song.primaryGenreName);
    if (isFirstGenre) points += rules.firstGenrePoints;

    const length = song.trackTimeMillis;
    if (length < rules.shortMs || length > rules.longMs) points += rules.lengthPoints;

    return points + luck;
}

export function getTier(points, rules) {
    return rules.tiers.find((tier) => points >= tier.min);
}