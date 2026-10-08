import { formatCountdown, getCoverUrl, getReleaseYear, getSpotifyUrl, formatCatalogNumber, formatTime, formatTimeLength } from './utils.js';

const DEFAULT_VOLUME = 0.25;
const PREVIEW_SECONDS = 30;
const SHARE_FEEDBACK_MS = 2000;
const NAME_HINT = 'Up to 20 characters. Shown in your greeting.';

const greetingBlock = document.querySelector('#greeting-block');
const greeting = document.querySelector('#greeting');
const phaseStamp = document.querySelector('#phase-stamp');
const phaseDot = document.querySelector('#phase-dot');
const tabList = document.querySelector('#mode-tabs');
const stage = document.querySelector('#stage');
const unveilButton = document.querySelector('#unveil-button');
const unveilTitle = document.querySelector('#unveil-title');
const unveilSubtitle = document.querySelector('#unveil-subtitle');
const statusText = document.querySelector('#status');
const revealed = document.querySelector('#revealed');
const modeCard = document.querySelector('#mode-card');
const modeStamp = document.querySelector('#mode-stamp');
const modeDescription = document.querySelector('#mode-description');
const lockDot = document.querySelector('#lock-dot');
const lockStatus = document.querySelector('#lock-status');
const countdown = document.querySelector('#countdown');
const errorCard = document.querySelector('#error-card');
const errorTitle = document.querySelector('#error-title');
const today = document.querySelector('#today');
const dial = document.querySelector('#setup');
const noSetupText = document.querySelector('#no-setup');
const dialLabel = document.querySelector('#setup-label');
const dialIcon = document.querySelector('#setup-icon');
const dialSelect = document.querySelector('#setup-select');
const dialChevron = document.querySelector('#setup-chevron');
const FALLBACK_AVATAR = { color: 'var(--muted)', ink: 'var(--bg)' };
const profileGrid = document.querySelector('#profile-grid');
const createPreview = document.querySelector('#create-preview');
const createPreviewName = document.querySelector('#create-preview-name');
const avatarOptions = document.querySelector('#avatar-options');
const nameHint = document.querySelector('#profile-name-hint');
const nameInput = document.querySelector('#profile-name');
const harmonyProfile = document.querySelector('#harmony-profile');
const genreChips = document.querySelector('#genre-chips');
const genreCount = document.querySelector('#genre-count');
const profileButton = document.querySelector('#profile-button');
const profileButtonName = document.querySelector('#profile-button-name');
const profileMenu = document.querySelector('#profile-menu');
const profileMenuHead = document.querySelector('#profile-menu-head');
const binderSummary = document.querySelector('#binder-summary');
const binderGrid = document.querySelector('#binder-grid');
const statPressings = document.querySelector('#stat-pressings');
const statCountries = document.querySelector('#stat-countries');
const statFavorites = document.querySelector('#stat-favorites');
const binderForm = document.querySelector('#binder-filters');
const binderMode = document.querySelector('#binder-mode');
const settingsName = document.querySelector('#settings-name');
const settingsNameHint = document.querySelector('#settings-name-hint');
const settingsAvatar = document.querySelector('#settings-avatar');
const settingsGenreChips = document.querySelector('#settings-genre-chips');
const settingsGenreCount = document.querySelector('#settings-genre-count');
const settingsPreferencesForm = document.querySelector('#settings-preferences-form');
const exportStatus = document.querySelector('#export-status');
const deleteDialog = document.querySelector('#delete-dialog');
const deleteHead = document.querySelector('#delete-head');
const deleteTitle = document.querySelector('#delete-title');
const deleteText = document.querySelector('#delete-text');
const deletePressings = document.querySelector('#delete-pressings');
const deleteCountries = document.querySelector('#delete-countries');
const deleteFavorites = document.querySelector('#delete-favorites');
const streak = document.querySelector('#streak');
const streakCount = document.querySelector('#streak-count');
const streakBest = document.querySelector('#streak-best');

function createAvatarOption(avatar, isChecked, initial = '?') {
    const input = document.createElement('input');
    input.type = 'radio';
    input.name = 'avatar';
    input.value = avatar.key;
    input.checked = isChecked;
    input.className = 'avatar-radio';
    input.setAttribute('aria-label', `${avatar.label} record`);

    const option = document.createElement('label');
    option.className = 'avatar-option';
    option.append(input, createRecordAvatar({ name: initial }, avatar));
    return option;
}

export function renderAvatarOptions(avatars, selectedKey) {
    const options = avatars.map((avatar) => createAvatarOption(avatar, avatar.key === selectedKey));
    avatarOptions.replaceChildren(...options);
}

export function renderCreatePreview(name, avatar) {
    const initial = name.trim().charAt(0).toUpperCase() || '?';
    const record = createRecordAvatar({ name: initial }, avatar);
    createPreview.querySelector('.record-avatar')?.remove();
    createPreview.prepend(record);
    createPreviewName.textContent = name.trim() || 'Your name';
    avatarOptions.querySelectorAll('.record-label').forEach((label) => {
        label.textContent = initial;
        createPreview.closest('.create-view').style.setProperty('--pick-color', avatar?.color ?? '');
    });
}

function setFieldError(input, hint, message) {
    hint.textContent = message || NAME_HINT;
    hint.classList.toggle('is-error', Boolean(message));
    input.setAttribute('aria-invalid', String(Boolean(message)));
}

export function renderNameError(message) {
    setFieldError(nameInput, nameHint, message);
}

export function renderSettingsNameError(message) {
    setFieldError(settingsName, settingsNameHint, message);
}

export function renderSettingsHarmony(genres, blocked, max) {
    const chips = genres.map((genre) => createGenreChip(genre, blocked.includes(genre.key)));
    settingsGenreChips.replaceChildren(...chips);
    renderSettingsGenreLimit(max);
}

export function renderSettingsGenreLimit(max) {
    renderGenreLimit(max, settingsGenreChips, settingsGenreCount);
}

export function createRecordAvatar(profile, avatar = FALLBACK_AVATAR) {
    const label = document.createElement('span');
    label.className = 'record-label';
    label.textContent = profile.name.charAt(0).toUpperCase();
    label.style.setProperty('--avatar-color', avatar.color);
    label.style.setProperty('--avatar-ink', avatar.ink);

    const record = document.createElement('span');
    record.className = 'record-avatar';
    record.setAttribute('aria-hidden', 'true');
    record.append(label);
    return record;
}

function createProfileTile(profile, avatar) {
    const name = document.createElement('span');
    name.className = 'profile-name';
    name.textContent = profile.name;

    const tile = document.createElement('button');
    tile.type = 'button';
    tile.className = 'profile-tile';
    tile.dataset.profileId = profile.id;
    tile.append(createRecordAvatar(profile, avatar), name);
    return tile;
}

function createNewProfileTile() {
    const circle = document.createElement('span');
    circle.className = 'record-avatar record-avatar-new';
    circle.setAttribute('aria-hidden', 'true');
    circle.append(createIcon('add'));

    const name = document.createElement('span');
    name.className = 'profile-name';
    name.textContent = 'New profile';

    const tile = document.createElement('button');
    tile.type = 'button';
    tile.className = 'profile-tile profile-tile-new';
    tile.dataset.action = 'new-profile';
    tile.append(circle, name);
    return tile;
}

export function renderProfiles(profiles, avatars = []) {
    const tiles = profiles.map((profile) => {
        const avatar = avatars.find((item) => item.key === profile.avatar);
        return createProfileTile(profile, avatar);
    });
    profileGrid.replaceChildren(...tiles, createNewProfileTile());
}

function createIcon(name) {
    const icon = document.createElement('span');
    icon.className = 'material-symbols-outlined';
    icon.setAttribute('aria-hidden', 'true');
    icon.textContent = name;
    return icon;
}

function createGenreChip(genre, isChecked) {
    const input = document.createElement('input');
    input.type = 'checkbox';
    input.name = 'genre';
    input.value = genre.key;
    input.checked = isChecked;
    input.className = 'genre-checkbox';

    const icon = createIcon('block');
    icon.classList.add('genre-block-icon');

    const name = document.createElement('span');
    name.className = 'genre-name';
    name.textContent = genre.label;

    const chip = document.createElement('label');
    chip.className = 'genre-chip';
    chip.append(input, icon, name);
    return chip;
}

export function renderGenreLimit(max, chips = genreChips, counter = genreCount) {
    const boxes = [...chips.querySelectorAll('.genre-checkbox')];
    const count = boxes.filter((box) => box.checked).length;

    counter.textContent = `${count} of ${max} used`;
    counter.classList.toggle('is-used', count > 0);
    boxes.forEach((box) => {
        box.disabled = !box.checked && count >= max;
    });
}

export function renderHarmony(name, avatar, genres, blocked, max) {
    const profileName = document.createElement('span');
    profileName.textContent = name;
    harmonyProfile.replaceChildren(createRecordAvatar({ name }, avatar), profileName);

    const chips = genres.map((genre) => createGenreChip(genre, blocked.includes(genre.key)));
    genreChips.replaceChildren(...chips);
    renderGenreLimit(max);
}

export function renderProfileButton(profile, avatar) {
    profileButton.querySelector('.record-avatar')?.remove();
    profileButton.prepend(createRecordAvatar(profile, avatar));
    profileButtonName.textContent = profile.name;
    profileButton.setAttribute('aria-label', `Profile menu for ${profile.name}`);

    const menuName = document.createElement('span');
    menuName.className = 'profile-menu-name';
    menuName.textContent = profile.name;
    profileMenuHead.replaceChildren(createRecordAvatar(profile, avatar), menuName);
}

export function renderMenuOpen(isOpen) {
    profileMenu.hidden = !isOpen;
    profileButton.setAttribute('aria-expanded', String(isOpen));

}

export function renderSettingsProfile(profile, avatars) {
    const initial = profile.name.charAt(0).toUpperCase();
    const options = avatars.map((avatar) => createAvatarOption(avatar, avatar.key ===
        profile.avatar, initial));

    settingsName.value = profile.name;
    settingsAvatar.replaceChildren(...options);
    renderSettingsNameError('');
}

export function renderSettingsInitial(name) {
    const initial = name.trim().charAt(0).toUpperCase() || '?';
    settingsAvatar.querySelectorAll('.record-label').forEach((label) => {
        label.textContent = initial;
    });
}

export function renderSettingsPreferences(modes, { defaultMode, autoplay }) {
    const { elements } = settingsPreferencesForm;
    const options = modes.map((mode) => createOption(mode.key, mode.name));

    elements.defaultMode.replaceChildren(...options);
    elements.defaultMode.value = defaultMode;
    elements.autoplay.checked = autoplay;
}

export function playPreview() {
    revealed.querySelector('audio')?.play()
        .catch((error) => console.warn('Autoplay was blocked by the browser:', error));
}

function createTab(mode, isSelected) {
    const tab = document.createElement('button');
    tab.type = 'button';
    tab.className = 'tab';
    tab.dataset.mode = mode.key;
    tab.setAttribute('role', 'tab');
    tab.setAttribute('aria-selected', String(isSelected));
    if (!mode.isReady) tab.title = 'Coming soon';

    const shortName = document.createElement('span');
    shortName.className = 'tab-short';
    shortName.textContent = mode.shortName;

    const name = document.createElement('span');
    name.className = 'tab-name';
    name.textContent = mode.name;

    tab.append(createIcon(mode.icon), shortName, name);
    return tab;
}

export function renderView(viewName) {
    document.body.dataset.screen = viewName;
    document.querySelectorAll('[data-view]').forEach((element) => {
        const views = element.dataset.view.split(' ');
        element.hidden = !views.includes(viewName);
    })
}

export function renderTabs(modes, selectedKey) {
    const tabs = modes.map((mode) => createTab(mode, mode.key === selectedKey));
    tabList.replaceChildren(...tabs);
}

function setTabsLocked(modes, isLocked) {
    tabList.querySelectorAll('.tab').forEach((tab) => {
        const mode = modes.find((item) => item.key === tab.dataset.mode);
        tab.disabled = isLocked || !mode.isReady;
    });
}

export function renderModeCard(mode) {
    modeStamp.textContent = `Mode ${mode.number} · ${mode.stamp}`;
    modeDescription.textContent = mode.description;
}

function createOption(value, label) {
    const option = document.createElement('option');
    option.value = value;
    option.textContent = label;
    return option;
}

export function renderSetup(mode, options = [], selectedKey = '') {
    const hasSetup = Boolean(mode.optionsKey);
    dial.hidden = !hasSetup;
    noSetupText.hidden = hasSetup;
    if (!hasSetup) return;

    dialLabel.textContent = mode.setupLabel;
    dialIcon.textContent = mode.icon;

    const choices = options.map((option) => createOption(option.key, option.label));
    dialSelect.replaceChildren(createOption('', 'Surprise me'), ...choices);
    dialSelect.value = selectedKey;
}

function renderDialLock(mode, isLocked) {
    dialSelect.disabled = isLocked;
    dialLabel.textContent = isLocked ? 'Locked in' : mode.setupLabel ?? '';
    dialChevron.textContent = isLocked ? 'lock' : 'expand_more';
}

export function renderCountdown(msLeft, isLocked) {
    const label = isLocked ? 'Next in' : 'Resets in';
    countdown.textContent = `${label} ${formatCountdown(msLeft)}`;
}

export function renderGreeting(text) {
    greeting.textContent = text;
}

function renderLockStatus(isLocked) {
    lockStatus.textContent = isLocked ? 'Daily discovery: collected' : 'Daily discovery: unlocked';
    lockDot.classList.toggle('is-collected', isLocked);
}

function renderUnveilButton(phase) {
    const isSearching = phase === 'searching';
    const isError = phase === 'error';

    unveilButton.disabled = isSearching;
    unveilButton.classList.toggle('is-searching', isSearching);
    unveilButton.classList.toggle('is-error', isError);

    switch (phase) {
        case 'searching':
            unveilButton.setAttribute('aria-label', 'Searching for your song');
            unveilTitle.textContent = 'Searching';
            unveilSubtitle.textContent = 'Checking the preview';
            break;
        case 'error':
            unveilButton.setAttribute('aria-label', 'Try unveiling again');
            unveilTitle.textContent = 'No signal';
            unveilSubtitle.textContent = 'Nothing was used';
            break;
        default:
            unveilButton.setAttribute('aria-label', "Unveil today's song");
            unveilTitle.textContent = 'Unveil';
            unveilSubtitle.textContent = "Today's pressing";
            break;
    }
}

function renderStatus(message, isError) {
    statusText.textContent = message;
    statusText.classList.toggle('is-error', isError);
}

function createAudioDock(song) {
    const audio = document.createElement('audio');
    audio.src = song.previewUrl;
    audio.volume = DEFAULT_VOLUME

    const playButton = document.createElement('button');
    playButton.type = 'button';
    playButton.className = 'audio-play';
    playButton.setAttribute('aria-label', 'Play preview');
    playButton.append(createIcon('play_arrow'));

    const fill = document.createElement('div');
    fill.className = 'audio-fill';

    const track = document.createElement('div');
    track.className = 'audio-track';
    track.append(fill);

    const infoTitle = document.createElement('span');
    infoTitle.className = 'audio-info-title';
    infoTitle.textContent = song.trackName;

    const infoArtist = document.createElement('span');
    infoArtist.className = 'audio-info-artist';
    infoArtist.textContent = song.artistName;

    const info = document.createElement('div');
    info.className = 'audio-info';
    info.append(infoTitle, infoArtist);

    const caption = document.createElement('span');
    caption.className = 'audio-caption';
    caption.textContent = '30-second preview';

    const progress = document.createElement('div');
    progress.className = 'audio-progress';
    progress.append(track, caption);

    const time = document.createElement('span');
    time.className = 'audio-time';
    time.textContent = `${formatTime(0)} / ${formatTime(PREVIEW_SECONDS)}`;

    const rerollButton = document.createElement('button');
    rerollButton.type = 'button';
    rerollButton.className = 'audio-reroll';
    rerollButton.dataset.action = 'reroll';
    rerollButton.hidden = true;
    rerollButton.append(createIcon('refresh'), 'Re-roll');

    const dock = document.createElement('div');
    dock.className = 'audio-dock';
    dock.append(audio, playButton, info, progress, time, rerollButton);

    function getDuration() {
        return Number.isFinite(audio.duration) ? audio.duration : PREVIEW_SECONDS;
    }

    function showPlaying(isPlaying) {
        playButton.querySelector('.material-symbols-outlined').textContent = isPlaying ? 'pause' : 'play_arrow';
        playButton.setAttribute('aria-label', isPlaying ? 'Pause preview' : 'Play preview');
    }

    function showProgress() {
        const duration = getDuration();
        fill.style.width = `${(audio.currentTime / duration) * 100}%`;
        time.textContent = `${formatTime(audio.currentTime)} / ${formatTime(duration)}`;
    }

    function togglePlay() {
        if (audio.paused) {
            audio.play().catch((error) => console.error('Preview could not play:', error));
        } else {
            audio.pause();
        }
    }

    function showBroken() {
        playButton.disabled = true;
        progress.hidden = true;
        time.textContent = 'Preview unavailable';
        rerollButton.hidden = false;
    }

    playButton.addEventListener('click', togglePlay);
    audio.addEventListener('play', () => showPlaying(true));
    audio.addEventListener('pause', () => showPlaying(false));
    audio.addEventListener('timeupdate', showProgress);
    audio.addEventListener('ended', () => {
        audio.currentTime = 0;
        showProgress();
    });
    audio.addEventListener('error', showBroken);

    return dock;
}

function createDetails(song) {
    const details = [
        { label: 'Year', value: getReleaseYear(song.releaseDate) },
        { label: 'Genre', value: song.primaryGenreName },
        { label: 'Length', value: song.trackTimeMillis ? formatTimeLength(song.trackTimeMillis) : '' },
    ];

    const list = document.createElement('dl');
    list.className = 'song-details';

    details
        .filter((detail) => detail.value)
        .forEach(({ label, value }) => {
            const term = document.createElement('dt');
            term.textContent = label;

            const description = document.createElement('dd');
            description.textContent = value;

            const item = document.createElement('div');
            item.className = 'song-detail';
            item.append(term, description);
            list.append(item);
        });

    return list;
}

function createSongCard(song, mode, number, { isFavorite = false, rarity = null, rarityLabel = '' } = {}) {
    const dot = document.createElement('span');
    dot.className = 'dot dot-mode'

    const modeLabel = document.createElement('span');
    modeLabel.className = 'stamp stamp-mode';
    modeLabel.textContent = mode.name;

    const modeTag = document.createElement('span');
    modeTag.className = 'stamp-row';
    modeTag.append(dot, modeLabel);

    const catalog = document.createElement('span');
    catalog.className = 'stamp catalog-number';
    catalog.textContent = formatCatalogNumber(number);

    const header = document.createElement('div');
    header.className = 'song-header';
    const headerTags = document.createElement('span');
    headerTags.className = 'song-header-tags';
    headerTags.append(catalog);
    if (rarity) headerTags.append(createRarityBadge(rarity, rarityLabel));

    header.append(modeTag, headerTags);

    const cover = document.createElement('img');
    cover.className = 'song-cover';
    cover.src = getCoverUrl(song.artworkUrl100);
    cover.alt = `Cover of ${song.collectionName}`;

    const label = document.createElement('div');
    label.className = 'vinyl-label';

    const vinyl = document.createElement('div');
    vinyl.className = 'vinyl';
    vinyl.append(label);

    const sleeve = document.createElement('div');
    sleeve.className = 'sleeve';
    sleeve.setAttribute('aria-hidden', 'true');
    sleeve.append(vinyl, cover);

    const title = document.createElement('h2');
    title.className = 'song-title';
    title.textContent = song.trackName;

    const meta = document.createElement('p');
    meta.className = 'song-meta';
    const metaYear = document.createElement('span');
    metaYear.className = 'song-meta-year';
    metaYear.textContent = ` · ${getReleaseYear(song.releaseDate)}`;
    meta.append(song.artistName, metaYear);

    const details = createDetails(song);

    const dock = createAudioDock(song);

    const spotifyLink = document.createElement('a');
    spotifyLink.className = 'song-link song-link-primary';
    spotifyLink.href = getSpotifyUrl(song);
    spotifyLink.target = '_blank';
    spotifyLink.rel = 'noopener';
    spotifyLink.textContent = 'Open in Spotify'

    const appleLink = document.createElement('a');
    appleLink.className = 'song-link';
    appleLink.href = song.trackViewUrl;
    appleLink.target = '_blank';
    appleLink.rel = 'noopener';
    appleLink.textContent = 'Apple Music';

    const shareButton = document.createElement('button');
    shareButton.type = 'button';
    shareButton.className = 'song-link song-share'
    shareButton.dataset.action = 'share';
    shareButton.setAttribute('aria-label', "Share today's discovery");
    shareButton.append(createIcon('share'));

    const favoriteButton = createFavoriteButton(number, song.trackName, isFavorite);
    favoriteButton.classList.add('song-link', 'song-share');

    const actions = document.createElement('div');
    actions.className = 'song-actions';
    actions.append(spotifyLink, appleLink, favoriteButton, shareButton);

    return [header, sleeve, title, meta, details, dock, actions];
}

export function renderPhase(phase, { modes, mode, song, number = 1, message = '', isFavorite = false, rarity = null, rarityLabel = '' }) {
    today.dataset.phase = phase;
    const isRevealed = phase === 'revealed';
    const isSearching = phase === 'searching';

    greetingBlock.classList.toggle('is-collected', isRevealed);
    stage.hidden = isRevealed;
    modeCard.hidden = isRevealed;
    revealed.hidden = !isRevealed;

    setTabsLocked(modes, isRevealed || isSearching);
    renderUnveilButton(phase);
    renderDialLock(mode, isSearching);
    errorCard.hidden = phase !== 'error';
    renderLockStatus(isRevealed);
    phaseDot.classList.toggle('is-busy', isSearching || isRevealed);

    switch (phase) {
        case 'searching':
            phaseStamp.textContent = 'Pressing in progress';
            renderStatus(message, false);
            break;
        case 'error':
            phaseStamp.textContent = 'Transmission lost';
            errorTitle.textContent = message;
            renderStatus('', false);
            break;
        case 'revealed':
            phaseStamp.textContent = "Today's pressing · collected";
            revealed.dataset.rarity = rarity?.tier ?? '';
            revealed.replaceChildren(...createSongCard(song, mode, number, { isFavorite, rarity, rarityLabel }));
            break;
        default:
            phaseStamp.textContent = "Choose today's frequency";
            renderStatus('', false);
            revealed.replaceChildren();
    }
}

export function renderShareFeedback(button) {
    const icon = button.querySelector('.material-symbols-outlined');
    icon.textContent = 'check';

    setTimeout(() => {
        icon.textContent = 'share';
    }, SHARE_FEEDBACK_MS);
}

export function renderBinderSummary(count, since) {
    const word = count === 1 ? 'pressing' : 'pressings';
    binderSummary.textContent = since ? `${count} ${word} · since ${since}` : 'No pressings yet';
}

function createBinderCard(entry) {
    const { song } = entry;

    const cover = document.createElement('img');
    cover.className = 'binder-cover';
    cover.src = getCoverUrl(song.artworkUrl100);
    cover.alt = '';
    cover.loading = 'lazy';

    const number = document.createElement('span');
    number.className = 'binder-number';
    number.textContent = formatCatalogNumber(entry.number);

    const art = document.createElement('div');
    art.className = 'binder-art';
    art.append(cover, number);

    const title = document.createElement('h3');
    title.className = 'binder-song';
    title.textContent = song.trackName;

    const artist = document.createElement('p');
    artist.className = 'binder-artist';
    artist.textContent = song.artistName;

    const tag = document.createElement('span');
    tag.className = 'binder-tag';
    tag.textContent = entry.tag;

    const text = document.createElement('div');
    text.className = 'binder-text';
    text.append(title, artist, tag);

    const info = document.createElement('div');
    info.className = 'binder-info';
    info.append(text, createFavoriteButton(entry.number, song.trackName, entry.isFavorite));

    const card = document.createElement('article');
    card.className = 'binder-card';
    card.dataset.mode = entry.mode;
    card.dataset.number = entry.number;
    card.append(art, info);

    if (entry.rarity) {
        card.dataset.rarity = entry.rarity.tier;
        art.append(createRarityBadge(entry.rarity, entry.rarityLabel));
    }
    return card;
}

function setFavoriteState(button, trackName, isFavorite) {
    button.setAttribute('aria-pressed', String(isFavorite));
    button.setAttribute('aria-label', isFavorite ? `Remove ${trackName} from favorites` :
        `Add ${trackName} to favorites`);
}

function createFavoriteButton(number, trackName, isFavorite) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'favorite-button';
    button.dataset.action = 'favorite';
    button.dataset.number = number;
    button.append(createIcon('favorite'));
    setFavoriteState(button, trackName, isFavorite);
    return button;
}

export function renderFavorite(number, trackName, isFavorite) {
    document.querySelectorAll(`[data-action="favorite"][data-number="${number}"]`)
        .forEach((button) => setFavoriteState(button, trackName, isFavorite));
}

export function renderBinderGrid(entries, emptyMessage) {
    if (entries.length === 0) {
        const empty = document.createElement('p');
        empty.className = 'binder-empty';
        empty.textContent = emptyMessage;
        binderGrid.replaceChildren(empty);
        return
    }

    binderGrid.replaceChildren(...entries.map(createBinderCard));
}

export function renderBinderStats({ pressings, countries, favorites }) {
    statPressings.textContent = pressings;
    statCountries.textContent = countries;
    statFavorites.textContent = favorites;
}

export function renderModeFilters(modes) {
    const options = modes.map((mode) => createOption(mode.key, mode.name));
    binderMode.replaceChildren(createOption('', 'All modes'), ...options);
}

export function renderBinderFilters({ search, mode, sort, favorites }) {
    const { elements } = binderForm;
    elements.search.value = search;
    elements.mode.value = mode;
    elements.sort.value = sort;
    elements.favorites.checked = favorites;
}

export function downloadTextFile(fileName, text) {
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.click();

    setTimeout(() => URL.revokeObjectURL(url), 0);
}

export function renderExportStatus(message) {
    exportStatus.textContent = message;
}

export function renderDeleteDialog(profile, avatar, { pressings, countries, favorites }) {
    deleteHead.querySelector('.record-avatar')?.remove();
    deleteHead.prepend(createRecordAvatar(profile, avatar));
    deleteTitle.textContent = `Delete ${profile.name}'s profile? This can't be undone.`;
    deleteText.textContent = `This permanently removes everything saved for ${profile.name}:`;

    deletePressings.textContent = pressings;
    deleteCountries.textContent = countries;
    deleteFavorites.textContent = favorites;

    deleteDialog.returnValue = '';
    deleteDialog.showModal();
}

export function renderStreak(current, best) {
    streak.hidden = current === 0;
    streakCount.textContent = current;
    streakBest.textContent = `· best ${best}`;
}

function createRarityBadge(rarity, label) {
    const badge = document.createElement('span');
    badge.className = 'rarity-badge';
    badge.dataset.rarity = rarity.tier;
    if (rarity.tier === 'legendary') badge.append(createIcon('star'));
    badge.append(label);
    return badge;
}