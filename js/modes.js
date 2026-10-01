import { pickRandom } from './utils.js';

export const MODES = [
    {
        key: 'random',
        number: '01',
        name: 'Random',
        shortName: 'Random',
        stamp: 'True shuffle',
        description: 'A completely random song from anywhere, any era, any genre.',
        icon: 'M2 18h1.4c1.3 0 2.5-.6 3.3-1.7l6.1-8.6c.7-1.1 2-1.7 3.3-1.7H22 M18 2l4 4-4 4 M2 6h1.9c1.5 0 2.9.9 3.6 2.2 M22 18h-5.9c-1.3 0-2.6-.7-3.3-1.8l-.5-.8 M18 14l4 4-4 4',
        isReady: true,
    },
    {
        key: 'time',
        number: '02',
        name: 'Time Machine',
        shortName: 'Time',
        stamp: 'Pick an era',
        description: 'Travel to a decade and hear something that was out back then.',
        icon: 'M5 22h14 M5 2h14 M17 22v-4.172a2 2 0 0 0-.586-1.414L12 12l-4.414 4.414A2 2 0 0 0 7 17.828V22 M7 2v4.172a2 2 0 0 0 .586 1.414L12 12l4.414-4.414A2 2 0 0 0 17 6.172V2',
        isReady: false,
    },
    {
        key: 'world',
        number: '03',
        name: 'World Explorer',
        shortName: 'World',
        stamp: 'Pick a country',
        description: 'Hear what people are listening to in a country you rarely hear from.',
        icon: 'M22 12a10 10 0 1 1-20 0a10 10 0 1 1 20 0 M2 12h20 M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z',
        isReady: false,
    },
    {
        key: 'mood',
        number: '04',
        name: 'Mood',
        shortName: 'Mood',
        stamp: 'Pick a feeling',
        description: 'Tell us how you feel and get a song that matches it.',
        icon: 'M22 12a10 10 0 1 1-20 0a10 10 0 1 1 20 0 M8 14s1.5 2 4 2 4-2 4-2 M9 9h.01 M15 9h.01',
        isReady: false,
    },
    {
        key: 'genre',
        number: '05',
        name: 'Genre',
        shortName: 'Genre',
        stamp: 'Pick a genre',
        description: 'Dig into one genre and find something in it you have never heard.',
        icon: 'M9 18V5l12-2v13 M9 18a3 3 0 1 1-6 0a3 3 0 1 1 6 0 M21 16a3 3 0 1 1-6 0a3 3 0 1 1 6 0',
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
