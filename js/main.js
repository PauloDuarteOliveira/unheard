import { loadPool, POOL_ERROR_MESSAGE, loadConfig } from './api.js';
import { MODES, getMode, describeSearch } from './modes.js';
import createPicker, { discoverSong, NO_SONG_MESSAGE } from './picker.js';
import createStore, { readJson, writeJson } from './store.js';
import { applyMode } from './theme.js';
import { getDateKey, getGreeting, getMsUntilMidnight, getShareText, formatShortDate } from './utils.js';
import { scoreSong, getTier } from './rarity.js';

import {
    renderCountdown, renderGreeting, renderModeCard, renderPhase, renderTabs,
    renderShareFeedback, renderSetup, renderView, renderProfiles, renderNameError,
    renderAvatarOptions, renderCreatePreview, renderHarmony, renderGenreLimit,
    renderProfileButton, renderMenuOpen, renderBinderSummary, renderBinderGrid, renderFavorite,
    renderBinderStats, renderBinderFilters, renderModeFilters, renderSettingsProfile,
    renderSettingsNameError, renderSettingsInitial, renderSettingsHarmony, renderSettingsGenreLimit,
    renderSettingsPreferences, playPreview, downloadTextFile, renderExportStatus,
    renderDeleteDialog, renderStreak, renderRarityFilter, renderRarityLegend,
    renderSets, renderBinderTab
} from './render.js';

import {
    createProfile, getCurrentProfile, getProfiles, setCurrentProfile, validateName,
    MAX_BLOCKED_GENRES, logOut, getProfile, updateProfile, deleteProfile
} from './profiles.js';

import {
    addEntry, getFirstDate, getEntryTag, sortCollection, toggleFavorite, getStats,
    DEFAULT_FILTERS, filterCollection, getFavorites, formatFavorites, getStreak, getBestStreak,
    getSets
} from './collection.js';

const TICK_MS = 1000;
const DEFAULT_MODE = 'random';
const DEV_MODE_KEY = 'unheard:devMode';
const BINDER_FILTER_KEY = 'unheard:binderFilters';
const EMPTY_BINDER = 'Unveil your first song and it will appear here.';
const NO_MATCHES = 'No pressings match these filters.';

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
    const collectionButton = document.querySelector('#collection-button');
    const collectionBackButton = document.querySelector('#collection-back');
    const binderGrid = document.querySelector('#binder-grid');
    const binderForm = document.querySelector('#binder-filters');
    const settingsButton = document.querySelector('#settings-button');
    const settingsBackButton = document.querySelector('#settings-back');
    const settingsLogoutButton = document.querySelector('#settings-logout');
    const settingsProfileForm = document.querySelector('#settings-profile-form');
    const settingsHarmonyForm = document.querySelector('#settings-harmony-form');
    const settingsPreferencesForm = document.querySelector('#settings-preferences-form');
    const exportButton = document.querySelector('#export-button');
    const deleteButton = document.querySelector('#delete-button');
    const deleteDialog = document.querySelector('#delete-dialog');
    const binderTabList = document.querySelector('#binder-tabs');

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
        selectMode(store.getSettings().defaultMode);
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
        sessionStorage.removeItem(BINDER_FILTER_KEY);
    }

    function showSettings() {
        const settings = store.getSettings();

        renderSettingsProfile(currentProfile, config?.avatars ?? []);
        renderSettingsHarmony(pool?.genres ?? [], settings.blockedGenres, MAX_BLOCKED_GENRES);
        renderSettingsPreferences(MODES, settings);
        renderMenuOpen(false);
        renderView('settings');
        renderExportStatus('');
    }

    function saveProfileChanges(changes) {
        currentProfile = updateProfile(currentProfile.id, changes);
        renderProfileButton(currentProfile, getAvatar(currentProfile.avatar));
        renderSettingsInitial(currentProfile.name);
        tick();
    }

    function handleSettingsProfileChange(event) {
        const { name, avatar } = settingsProfileForm.elements;

        if (event.target === name) {
            const message = validateName(name.value, currentProfile.id);
            renderSettingsNameError(message);
            if (!message) saveProfileChanges({ name: name.value.trim() });
            return;
        }

        saveProfileChanges({ avatar: avatar.value });
    }

    function handleSettingsProfileInput() {
        renderSettingsNameError('');
        renderSettingsInitial(settingsProfileForm.elements.name.value);
    }

    function handleSettingsHarmonyChange() {
        const blockedGenres = new FormData(settingsHarmonyForm).getAll('genre');
        store.saveSettings({ ...store.getSettings(), blockedGenres });
        renderSettingsGenreLimit(MAX_BLOCKED_GENRES);

        if (blockedGenres.includes(currentOptionKey)) currentOptionKey = '';
        if (!getLockedToday()) selectMode(currentModeKey, currentOptionKey);
    }

    function handleSettingsPreferencesChange() {
        const { defaultMode, autoplay } = settingsPreferencesForm.elements;
        store.saveSettings({ ...store.getSettings(), defaultMode: defaultMode.value, autoplay: autoplay.checked });
    }

    function updateStreak() {
        const collection = store?.getCollection() ?? [];
        renderStreak(getStreak(collection, getDateKey()), getBestStreak(collection));
    }

    function getLockedToday() {
        const today = store?.getToday();
        return today && today.date === getDateKey() && today.song ? today : null;
    }

    function getOptions(mode) {
        const options = pool?.[mode.optionsKey] ?? [];
        if (mode.optionsKey !== 'genres') return options;

        const blockedGenres = getBlockedGenres();
        return options.filter((option) => !blockedGenres.includes(option.key));
    }

    function getBlockedGenres() {
        return store?.getSettings().blockedGenres ?? [];
    }

    function getSearchingMessage() {
        const mode = getMode(currentModeKey);
        const option = getOptions(mode).find((item) => item.key === currentOptionKey);
        return `${describeSearch(mode, option)} and making sure the preview plays before we lock it in.`;
    }

    function getNextNumber() {
        const today = store.getToday();
        if (today?.date === getDateKey()) return today.number;

        const numbers = store.getCollection().map((entry) => entry.number);
        return Math.max(0, ...numbers) + 1;
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

    function showCollection() {
        const collection = store.getCollection();
        const firstDate = getFirstDate(collection);
        const tiers = config?.rarity?.tiers ?? [];

        renderBinderSummary(collection.length, firstDate && formatShortDate(firstDate));
        renderBinderStats(getStats(collection));
        renderMenuOpen(false);
        renderRarityFilter(tiers);
        renderRarityLegend(tiers);
        renderBinderFilters(getBinderFilters());
        showBinderCards();
        renderSets(getSets(collection,pool,getBlockedGenres()));
        renderBinderTab('pressings');
        renderView('collection');
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
        updateStreak();
        const today = getLockedToday();
        isShowingLocked = Boolean(today);

        if (today) {
            const entry = store.getCollection().find((item) => item.number === today.number);
            selectMode(today.mode, today.optionKey);
            showPhase('revealed', {
                song: today.song,
                number: today.number,
                isFavorite: entry?.isFavorite ?? false,
                rarity: entry?.rarity ?? null,
                rarityLabel: getTierLabel(entry?.rarity),
            });
        } else {
            showPhase('idle');
        }
    }

    function tick() {
        const isLocked = Boolean(getLockedToday());
        renderGreeting(currentProfile ? `${getGreeting()}, ${currentProfile.name}` : getGreeting());
        renderCountdown(getMsUntilMidnight(), isLocked);

        if (isShowingLocked && !isLocked && !isSearching) {
            showCurrentState();
        }
    }

    function getRarity(entry, collection) {
        const points = scoreSong(entry, collection, config.rarity);
        return { points, tier: getTier(points, config.rarity).key };
    }

    function getTierLabel(rarity) {
        return config?.rarity?.tiers.find((tier) => tier.key === rarity?.tier)?.label ?? '';
    }

    async function handleUnveil() {
        if (isSearching || getLockedToday()) return;

        isSearching = true;
        showPhase('searching', { message: getSearchingMessage() });

        try {
            pool = pool ?? await loadPool();
            const { song, optionKey } = await discoverSong(currentModeKey, pool, picker, currentOptionKey, getBlockedGenres());

            const today = { date: getDateKey(), mode: currentModeKey, optionKey, song, number: getNextNumber() };
            store.saveToday(today);
            const previous = store.getCollection().filter((entry) => entry.number !== today.number);
            const rarity = config?.rarity ? getRarity(today, previous) : null;
            store.saveCollection(addEntry(store.getCollection(), { ...today, rarity }));
            showCurrentState();
            if (store.getSettings().autoplay) playPreview();
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

    function handleFavoriteClick(button) {
        const number = Number(button.dataset.number);
        const collection = toggleFavorite(store.getCollection(), number);
        store.saveCollection(collection);

        const entry = collection.find((item) => item.number === number);
        renderFavorite(number, entry.song.trackName, entry.isFavorite);
        renderBinderStats(getStats(collection));
    }

    function getBinderFilters() {
        return { ...DEFAULT_FILTERS, ...readJson(BINDER_FILTER_KEY, {}, sessionStorage) };
    }

    function readBinderForm() {
        const { search, mode, rarity, sort, favorites } = binderForm.elements;
        return { search: search.value, mode: mode.value, rarity: rarity.value, sort: sort.value, favorites: favorites.checked };
    }

    function showBinderCards() {
        const filters = getBinderFilters();
        const tagged = store.getCollection().map((entry) => ({
            ...entry,
            tag: getEntryTag(entry, pool),
            rarityLabel: getTierLabel(entry.rarity),
        }));
        const cards = sortCollection(filterCollection(tagged, filters), filters.sort);
        renderBinderGrid(cards, tagged.length === 0 ? EMPTY_BINDER : NO_MATCHES);
    }

    function handleBinderFilterInput() {
        writeJson(BINDER_FILTER_KEY, readBinderForm(), sessionStorage);
        showBinderCards();
    }

    function handleBinderClick(event) {
        const button = event.target.closest('[data-action="favorite"]');
        if (button) handleFavoriteClick(button);
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
            case 'favorite':
                handleFavoriteClick(actionButton);
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

    function exportFavorites() {
        const favorites = getFavorites(store.getCollection());

        if (favorites.length === 0) {
            renderExportStatus('No favorites yet. Tap the heart on a song to add it.');
            return;
        }

        downloadTextFile(`unheard-favorites-${getDateKey()}.txt`, formatFavorites(favorites));
        renderExportStatus(`Exported ${favorites.length} ${favorites.length === 1 ? 'favorite' : 'favorites'}.`);
    }

    function confirmDelete() {
        renderDeleteDialog(currentProfile, getAvatar(currentProfile.avatar),
            getStats(store.getCollection()));
    }

    function handleDeleteClose() {
        if (deleteDialog.returnValue !== 'delete') return;

        store.clearAll();
        deleteProfile(currentProfile.id);
        handleLogOut();
    }

    function handleBinderTabClick(event) {
        const tab = event.target.closest('[data-tab]');
        if (tab) renderBinderTab(tab.dataset.tab);
    }

    selectMode(currentModeKey);
    showCurrentState();
    tick();
    setInterval(tick, TICK_MS);
    renderModeFilters(MODES);

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
    collectionButton.addEventListener('click', showCollection);
    collectionBackButton.addEventListener('click', () => renderView('today'));
    binderGrid.addEventListener('click', handleBinderClick);
    binderForm.addEventListener('input', handleBinderFilterInput);
    binderForm.addEventListener('submit', (event) => event.preventDefault());
    settingsButton.addEventListener('click', showSettings);
    settingsBackButton.addEventListener('click', () => renderView('today'));
    settingsLogoutButton.addEventListener('click', handleLogOut);
    settingsProfileForm.addEventListener('change', handleSettingsProfileChange);
    settingsProfileForm.addEventListener('input', handleSettingsProfileInput);
    settingsProfileForm.addEventListener('submit', (event) => event.preventDefault());
    settingsHarmonyForm.addEventListener('change', handleSettingsHarmonyChange);
    settingsPreferencesForm.addEventListener('change', handleSettingsPreferencesChange);
    exportButton.addEventListener('click', exportFavorites);
    deleteButton.addEventListener('click', confirmDelete);
    deleteDialog.addEventListener('close', handleDeleteClose);
    binderTabList.addEventListener('click', handleBinderTabClick);

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
