import { loadPool, POOL_ERROR_MESSAGE, loadConfig } from './api.js';
import { MODES, getMode, describeSearch } from './modes.js';
import createPicker, { discoverSong, NO_SONG_MESSAGE } from './picker.js';
import createStore from './store.js';
import { applyMode } from './theme.js';
import {
    renderCountdown, renderGreeting, renderModeCard, renderPhase, renderTabs,
    renderShareFeedback, renderSetup, renderView, renderProfiles, renderNameError,
    renderAvatarOptions, renderCreatePreview, renderHarmony, renderGenreLimit, renderProfileButton, renderMenuOpen
} from './render.js';
import { getDateKey, getGreeting, getMsUntilMidnight, getShareText } from './utils.js';
import { createProfile, getCurrentProfile, getProfiles, setCurrentProfile, validateName, MAX_BLOCKED_GENRES, logOut, getProfile } from './profiles.js';

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
    const picker = createPicker();
    const tabList = document.querySelector('#mode-tabs');
    const unveilButton = document.querySelector('#unveil-button');
    const devButton = document.querySelector('#dev-button');
    const revealed = document.querySelector('#revealed');
    const retryButton = document.querySelector('#retry-button');
    const dialSelect = document.querySelector('#setup-select');
    const profileGrid = document.querySelector('#profile-grid');
    const createForm = document.querySelector('#create-form');
    const createBackButton = document.querySelector('#create-back');
    const harmonyForm = document.querySelector('#harmony-form');
    const harmonyBackButton = document.querySelector('#harmony-back');
    const harmonySkipButton = document.querySelector('#harmony-skip');
    const profileButton = document.querySelector('#profile-button');
    const profileMenu = document.querySelector('#profile-menu');
    const logoutButton = document.querySelector('#logout-button');

    let store = null;
    let pool = null;
    let currentModeKey = DEFAULT_MODE;
    let isSearching = false;
    let isShowingLocked = false;
    let currentOptionKey = '';
    let config = null;
    let pendingProfile = null;
    let currentProfile = null;

    function enterToday(profile) {
        currentProfile = profile;
        store = createStore(profile.id);
        selectMode(DEFAULT_MODE);
        showCurrentState();
        setCurrentProfile(profile.id);
        renderProfileButton(profile, getAvatar(profile.avatar));
        renderMenuOpen(false);
        renderView('today');
        tick();
    }

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
            showCreate();
            return;
        }

        enterToday(getProfile(tile.dataset.profileId));
    }

    function getAvatar(key) {
        return config?.avatars.find((avatar) => avatar.key === key);
    }

    function showCreate() {
        const avatars = config?.avatars ?? [];
        const usedKeys = getProfiles().map((profile) => profile.avatar);
        const firstFree = avatars.find((avatar) => !usedKeys.includes(avatar.key)) ?? avatars[0];

        createForm.reset();
        renderNameError('');
        renderAvatarOptions(avatars, firstFree?.key);
        renderCreatePreview('', firstFree);
        renderView('create');
        createForm.elements.name.focus();
    }

    function handleCreateInput() {
        const { name, avatar } = createForm.elements;
        renderCreatePreview(name.value, getAvatar(avatar.value));
        renderNameError('');
    }

    function handleCreateSubmit(event) {
        event.preventDefault();
        const { name, avatar } = createForm.elements;

        const message = validateName(name.value);
        if (message) {
            renderNameError(message);
            name.focus();
            return;
        }

        pendingProfile = { name: name.value.trim(), avatar: avatar.value };
        showHarmony();
    }

    function showHarmony() {
        const avatar = getAvatar(pendingProfile.avatar);
        renderHarmony(pendingProfile.name, avatar, pool?.genres ?? [], [], MAX_BLOCKED_GENRES);
        renderView('harmony');
    }

    function finishCreate(blockedGenres) {
        const profile = createProfile(pendingProfile.name, pendingProfile.avatar);
        createStore(profile.id).saveSettings({ blockedGenres });
        enterToday(profile);
        pendingProfile = null;
    }

    function handleHarmonySubmit(event) {
        event.preventDefault();
        const blockedGenres = new FormData(harmonyForm).getAll('genre');
        finishCreate(blockedGenres);
    }

    function toggleMenu() {
        renderMenuOpen(profileMenu.hidden);
    }

    function closeMenuOnOutsideClick(event) {
        if (profileMenu.hidden) return;
        if (event.target.closest('.header-actions')) return;
        renderMenuOpen(false);
    }

    function closeMenuOnEscape(event) {
        if (event.key !== 'Escape' || profileMenu.hidden) return;
        renderMenuOpen(false);
        profileButton.focus();
    }

    function handleLogOut() {
        logOut();
        currentProfile = null;
        store = null;
        renderMenuOpen(false);
        showProfiles();
    }

    function getLockedToday() {
        const today = store?.getToday();
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
        renderGreeting(currentProfile ? `${getGreeting()}, ${currentProfile.name}` : getGreeting());
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
    createForm.addEventListener('input', handleCreateInput);
    createForm.addEventListener('submit', handleCreateSubmit);
    createBackButton.addEventListener('click', showProfiles);
    harmonyForm.addEventListener('change', () => renderGenreLimit(MAX_BLOCKED_GENRES));
    harmonyForm.addEventListener('submit', handleHarmonySubmit);
    harmonyBackButton.addEventListener('click', () => renderView('create'));
    harmonySkipButton.addEventListener('click', () => finishCreate([]));
    profileButton.addEventListener('click', toggleMenu);
    document.addEventListener('click', closeMenuOnOutsideClick);
    document.addEventListener('keydown', closeMenuOnEscape);
    logoutButton.addEventListener('click', handleLogOut);

    preparePool();

    const savedProfile = getCurrentProfile();
    if (savedProfile) {
        loadConfig().then((data) => {
            config = data;
            enterToday(savedProfile);
        }).catch(() => enterToday(savedProfile));
    } else {
        showProfiles();
    }

    if (isDevMode()) {
        devButton.hidden = false;
        devButton.addEventListener('click', handleDevReset);
    }
}

init();
