import { pickRandom } from './utils.js';

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
