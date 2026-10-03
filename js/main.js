import { loadPool, POOL_ERROR_MESSAGE } from './api.js';
import { MODES, getMode } from './modes.js';
import createPicker, { discoverSong, NO_SONG_MESSAGE } from './picker.js';
import createStore from './store.js';
import { applyMode } from './theme.js';
import { renderCountdown, renderGreeting, renderModeCard, renderPhase, renderTabs, renderShareFeedback } from './render.js';
import { getDateKey, getGreeting, getMsUntilMidnight, getShareText } from './utils.js';

const TICK_MS = 1000;
const DEFAULT_MODE = 'random';
const DEFAULT_PROFILE_ID = 'guest';
const DEV_MODE_KEY = 'unheard:devMode';

function isDevMode() {
    const params = new URLSearchParams(window.location.search);

    if (params.get('dev') === '1') {
        sessionStorage.setItem(DEV_MODE_KEY, '1');
    }

    return sessionStorage.getItem(DEV_MODE_KEY) === '1';
}

function getErrorTitle(error) {
    switch (error.message) {
        case NO_SONG_MESSAGE:
            return "This song couldn't be loaded";
        case POOL_ERROR_MESSAGE:
            return "Something went wrong on our side";
        default:
            return "Can't reach the music service";
    }    
}

function init() {
    const store = createStore(DEFAULT_PROFILE_ID);
    const picker = createPicker();
    const tabList = document.querySelector('#mode-tabs');
    const unveilButton = document.querySelector('#unveil-button');
    const devButton = document.querySelector('#dev-button');
    const revealed = document.querySelector('#revealed');
    const retryButton = document.querySelector('#retry-button');

    let pool = null;
    let currentModeKey = DEFAULT_MODE;
    let isSearching = false;
    let isShowingLocked = false;

    function getLockedToday() {
        const today = store.getToday();
        return today && today.date === getDateKey() ? today : null;
    }

    function getNextNumber() {
        const previous = store.getToday();
        const previousNumber = previous?.number ?? 0;
        return previousNumber + 1;
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
        isShowingLocked = Boolean(today);

        if (today) {
            selectMode(today.mode);
            showPhase('revealed', { song: today.song, number: today.number });
        } else {
            showPhase('idle');
        }
    }

    function tick() {
        const isLocked = Boolean(getLockedToday());
        renderGreeting(getGreeting());
        renderCountdown(getMsUntilMidnight(), isLocked);

        if (isShowingLocked && !isLocked) {
            showCurrentState();
        }
    }

    async function handleUnveil() {
        if (isSearching || getLockedToday()) return;

        isSearching = true;
        showPhase('searching');

        try {
            pool = pool ?? await loadPool();
            const song = await discoverSong(currentModeKey, pool, picker);

            store.saveToday({ date: getDateKey(), mode: currentModeKey, song, number: getNextNumber() });
            showCurrentState();
        } catch (error) {
            console.error('Discovery failed:', error);
            showPhase('error', { message: getErrorTitle(error) });
        } finally {
            isSearching = false;
            tick();
        }
    }

    function handleTabClick(event) {
        const tab = event.target.closest('.tab');
        if (!tab || tab.disabled) return;

        selectMode(tab.dataset.mode);
        showPhase('idle');
    }

    function handleDevReset() {
        store.clearToday();
        showCurrentState();
        tick();
    }

    async function handleRevealedClick(event) {
        const shareButton = event.target.closest('[data-action="share"]');
        if (!shareButton) return;

        const today = getLockedToday();
        if (!today) return;

        try {
            await navigator.clipboard.writeText(getShareText(today.song));
            renderShareFeedback(shareButton);
        } catch (error) {
            console.error('could not copy to the clipboard', error);
        }
    }

    selectMode(currentModeKey);
    showCurrentState();
    tick();
    setInterval(tick, TICK_MS);

    unveilButton.addEventListener('click', handleUnveil);
    tabList.addEventListener('click', handleTabClick);
    revealed.addEventListener('click', handleRevealedClick);
    retryButton.addEventListener('click', handleUnveil)

    if (isDevMode()) {
        devButton.hidden = false;
        devButton.addEventListener('click', handleDevReset);
    }
}

init();
