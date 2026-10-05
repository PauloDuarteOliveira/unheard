import { loadPool, POOL_ERROR_MESSAGE, loadConfig } from './api.js';
import { MODES, getMode, describeSearch } from './modes.js';
import createPicker, { discoverSong, NO_SONG_MESSAGE } from './picker.js';
import createStore from './store.js';
import { applyMode } from './theme.js';
import { renderCountdown, renderGreeting, renderModeCard, renderPhase, renderTabs, renderShareFeedback, renderSetup, renderView, renderProfiles } from './render.js';
import { getDateKey, getGreeting, getMsUntilMidnight, getShareText } from './utils.js';
import { getCurrentProfile, getProfiles, setCurrentProfile } from './profiles.js';

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
    const dialSelect = document.querySelector('#setup-select');
    const profileGrid = document.querySelector('#profile-grid');

    let pool = null;
    let currentModeKey = DEFAULT_MODE;
    let isSearching = false;
    let isShowingLocked = false;
    let currentOptionKey = '';
    let config = null;

    async function showProfiles() {
        try {
            config = config ?? await loadConfig();
        } catch (error) {
            console.error('Avatars could not be loaded:', error);
        }
        renderProfiles(getProfiles(), config?.avatars);
        renderView('profiles');
    }

    function handleProfileClick(event) {
        const tile = event.target.closest('.profile-tile');
        if (!tile) return;

        if (tile.dataset.action === 'new-profile') {
            renderView('create');
            return;
        }
    }

    function getLockedToday() {
        const today = store.getToday();
        return today && today.date === getDateKey() && today.song ? today : null;
    }

    function getOptions(mode) {
        return pool?.[mode.optionsKey] ?? [];
    }

    function getSearchingMessage() {
        const mode = getMode(currentModeKey);
        const option = getOptions(mode).find((item) => item.key === currentOptionKey);
        return `${describeSearch(mode, option)} and making sure the preview plays before we lock it in.`;
    }

    function getNextNumber() {
        const previous = store.getToday();
        const previousNumber = previous?.number ?? 0;
        const isSameDay = previous?.date === getDateKey();
        return isSameDay ? previousNumber : previousNumber + 1;
    }

    function showPhase(phase, details = {}) {
        renderPhase(phase, { modes: MODES, mode: getMode(currentModeKey), ...details });
    }

    function selectMode(modeKey, optionKey = '') {
        currentModeKey = modeKey;
        currentOptionKey = optionKey;
        const mode = getMode(modeKey);
        applyMode(modeKey);
        renderTabs(MODES, modeKey);
        renderModeCard(mode);
        renderSetup(mode, getOptions(mode), currentOptionKey);
    }

    async function preparePool() {
        try {
            pool = await loadPool();
            const mode = getMode(currentModeKey);
            renderSetup(mode, getOptions(mode), currentOptionKey);
        } catch (error) {
            console.error('Search terms could not be loaded yet:', error);
        }
    }

    function showCurrentState() {
        const today = getLockedToday();
        isShowingLocked = Boolean(today);

        if (today) {
            selectMode(today.mode, today.optionKey);
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
        showPhase('searching', { message: getSearchingMessage() });

        try {
            pool = pool ?? await loadPool();
            const song = await discoverSong(currentModeKey, pool, picker, currentOptionKey);

            store.saveToday({ date: getDateKey(), mode: currentModeKey, optionKey: currentOptionKey, song, number: getNextNumber() });
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

    function handleOptionChange(event) {
        currentOptionKey = event.target.value;
    }

    function handleDevReset() {
        store.clearToday();
        showCurrentState();
        tick();
    }

    function handleRevealedClick(event) {
        const actionButton = event.target.closest('[data-action]');
        if (!actionButton) return;

        switch (actionButton.dataset.action) {
            case 'share':
                shareToday(actionButton);
                break;
            case 'reroll':
                rerollToday();
                break;
        }
    }

    async function shareToday(button) {
        const today = getLockedToday();
        if (!today) return;

        try {
            await navigator.clipboard.writeText(getShareText(today.song));
            renderShareFeedback(button);
        } catch (error) {
            console.error('could not copy to the clipboard', error);
        }
    }

    function rerollToday() {
        const today = getLockedToday();
        if (!today) return;

        store.saveToday({ ...today, song: null });
        handleUnveil();
    }

    selectMode(currentModeKey);
    showCurrentState();
    tick();
    setInterval(tick, TICK_MS);

    profileGrid.addEventListener('click', handleProfileClick);
    unveilButton.addEventListener('click', handleUnveil);
    tabList.addEventListener('click', handleTabClick);
    revealed.addEventListener('click', handleRevealedClick);
    retryButton.addEventListener('click', handleUnveil)
    dialSelect.addEventListener('change', handleOptionChange);

    preparePool();

    if (getCurrentProfile()) {
        renderView('today');
    } else {
        showProfiles();
    }

    if (isDevMode()) {
        devButton.hidden = false;
        devButton.addEventListener('click', handleDevReset);
    }
}

init();
