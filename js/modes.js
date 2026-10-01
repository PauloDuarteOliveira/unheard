import { pickRandom } from './utils.js';

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
        isReady: false,
    },
    {
        key: 'world',
        number: '03',
        name: 'World Explorer',
        shortName: 'World',
        stamp: 'Pick a country',
        description: 'Hear what people are listening to in a country you rarely hear from.',
        icon: 'public',
        isReady: false,
    },
    {
        key: 'mood',
        number: '04',
        name: 'Mood',
        shortName: 'Mood',
        stamp: 'Pick a feeling',
        description: 'Tell us how you feel and get a song that matches it.',
        icon: 'mood',
        isReady: false,
    },
    {
        key: 'genre',
        number: '05',
        name: 'Genre',
        shortName: 'Genre',
        stamp: 'Pick a genre',
        description: 'Dig into one genre and find something in it you have never heard.',
        icon: 'music_note',
        isReady: false,
    },
];

export function getMode(modeKey) {
    return MODES.find((mode) => mode.key === modeKey);
}

function buildRandomQuery(pool) {
    return { term: pickRandom(pool.random) };
}

export function buildQuery(modeKey, pool) {
    switch (modeKey) {
        case 'random':
            return buildRandomQuery(pool);
        default:
            throw new Error(`Mode not available yet: ${modeKey}`);
    }
}
