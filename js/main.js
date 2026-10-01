import { loadPool } from './api.js';
import { MODES, getMode } from './modes.js';
import createPicker, { discoverSong, NO_SONG_MESSAGE } from './picker.js';
import createStore from './store.js';
import { applyMode } from './theme.js';
import { renderGreeting, renderModeCard, renderPhase, renderTabs } from './render.js';
import { getDateKey, getGreeting } from './utils.js';

const DEFAULT_MODE = 'random';
const DEFAULT_PROFILE_ID = 'guest';

function getErrorMessage(error) {
    if (error.message === NO_SONG_MESSAGE) {
        return 'Could not find a song that plays. Try again, your discovery was not used.';
    }
    return 'Could not reach the music service. Check your connection and try again.';
}

function init() {
    const store = createStore(DEFAULT_PROFILE_ID);
    const picker = createPicker();
    const tabList = document.querySelector('#mode-tabs');
    const unveilButton = document.querySelector('#unveil-button');

    let pool = null;
    let currentModeKey = DEFAULT_MODE;
    let isSearching = false;

    function getLockedToday() {
        const today = store.getToday();
        return today && today.date === getDateKey() ? today : null;
    }

    function showPhase(phase, details = {}) {
        renderPhase(phase, { modes: MODES, mode: getMode(currentModeKey), ...details });
    }

    function selectMode(modeKey) {
        currentModeKey = modeKey;
        applyMode(modeKey);
        renderTabs(MODES, modeKey);
        renderModeCard(getMode(modeKey));
    }

    function showCurrentState() {
        const today = getLockedToday();

        if (today) {
            selectMode(today.mode);
            showPhase('revealed', { song: today.song });
        } else {
            showPhase('idle');
        }
    }

    async function handleUnveil() {
        if (isSearching || getLockedToday()) return;

        isSearching = true;
        showPhase('searching');

        try {
            pool = pool ?? await loadPool();
            const song = await discoverSong(currentModeKey, pool, picker);

            store.saveToday({ date: getDateKey(), mode: currentModeKey, song });
            showCurrentState();
        } catch (error) {
            console.error('Discovery failed:', error);
            showPhase('error', { message: getErrorMessage(error) });
        } finally {
            isSearching = false;
        }
    }

    function handleTabClick(event) {
        const tab = event.target.closest('.tab');
        if (!tab || tab.disabled) return;

        selectMode(tab.dataset.mode);
        showPhase('idle');
    }

    renderGreeting(getGreeting());
    selectMode(currentModeKey);
    showCurrentState();

    unveilButton.addEventListener('click', handleUnveil);
    tabList.addEventListener('click', handleTabClick);
}

init();
