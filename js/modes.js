import { getReleaseYear, pickRandom } from './utils.js';

const YEARS_PER_DECADE = 10;

export const MODES = [
    {
        key: 'random',
        number: '01',
        name: 'Random',
        shortName: 'Random',
        stamp: 'True shuffle',
        description: 'A completely random song from anywhere, any era, any genre.',
        icon: 'shuffle',
        isReady: true,
    },
    {
        key: 'time',
        number: '02',
        name: 'Time Machine',
        shortName: 'Time',
        stamp: 'Pick an era',
        description: 'Travel to a decade and hear something that was out back then.',
        icon: 'hourglass_empty',
        setupLabel: 'Decade',
        optionsKey: 'decades',
        isReady: true,
    },
    {
        key: 'world',
        number: '03',
        name: 'World Explorer',
        shortName: 'World',
        stamp: 'Pick a country',
        description: 'Hear what people are listening to in a country you rarely hear from.',
        icon: 'public',
        setupLabel: 'Country',
        optionsKey: 'countries',
        isReady: true,
    },
    {
        key: 'mood',
        number: '04',
        name: 'Mood',
        shortName: 'Mood',
        stamp: 'Pick a feeling',
        description: 'Tell us how you feel and get a song that matches it.',
        icon: 'mood',
        setupLabel: 'Mood',
        optionsKey: 'moods',
        isReady: true,
    },
    {
        key: 'genre',
        number: '05',
        name: 'Genre',
        shortName: 'Genre',
        stamp: 'Pick a genre',
        description: 'Dig into one genre and find something in it you have never heard.',
        icon: 'music_note',
        setupLabel: 'Genre',
        optionsKey: 'genres',
        isReady: true,
    },
];

export function getMode(modeKey) {
    return MODES.find((mode) => mode.key === modeKey);
}

function pickOption(options, optionKey) {
    return options.find((option) => option.key === optionKey) ?? pickRandom(options);
}

function buildRandomQuery(pool) {
    return { term: pickRandom(pool.random) };
}

export function buildQuery(modeKey, pool, optionKey) {
    switch (modeKey) {
        case 'random':
            return buildRandomQuery(pool);
        case 'time':
            return buildTimeQuery(pool, optionKey);
        case 'world':
            return buildWorldQuery(pool, optionKey);
        case 'mood':
            return buildMoodQuery(pool, optionKey);
        case 'genre':
            return buildGenreQuery(pool, optionKey);
        default:
            throw new Error(`Unknown mode: ${modeKey}`);
    }
}

function buildTimeQuery(pool, optionKey) {
    const decade = pickOption(pool.decades, optionKey);
    const lastYear = decade.start + YEARS_PER_DECADE - 1;

    return {
        term: pickRandom(decade.terms),
        filter: (song) => {
            const year = Number(getReleaseYear(song.releaseDate));
            return year >= decade.start && year <= lastYear;
        },
    };
}

function buildWorldQuery(pool, optionKey) {
    const country = pickOption(pool.countries, optionKey);
    return { term: pickRandom(country.terms), country: country.key };
}

function buildMoodQuery(pool, optionKey) {
    const mood = pickOption(pool.moods, optionKey);
    return { term: pickRandom(mood.terms) };
}

function buildGenreQuery(pool, optionKey) {
    const genre = pickOption(pool.genres, optionKey);

    return {
        term: pickRandom(genre.terms),
        filter: (song) => genre.matches.includes(song.primaryGenreName),
    };
}
