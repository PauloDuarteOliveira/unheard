import { formatCountdown, getCoverUrl, getReleaseYear, getSpotifyUrl, formatCatalogNumber, formatTime, formatTimeLength } from './utils.js';

const DEFAULT_VOLUME = 0.25;
const PREVIEW_SECONDS = 30;
const SHARE_FEEDBACK_MS = 2000;

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

function createIcon(name) {
    const icon = document.createElement('span');
    icon.className = 'material-symbols-outlined';
    icon.setAttribute('aria-hidden', 'true');
    icon.textContent = name;
    return icon;
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
    dock.append(audio, playButton, track, time, rerollButton);

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
        track.hidden = true;
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

function createSongCard(song, mode, number) {
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
    header.append(modeTag, catalog);

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

    const actions = document.createElement('div');
    actions.className = 'song-actions';
    actions.append(spotifyLink, appleLink, shareButton);

    return [header, sleeve, title, meta, details, dock, actions];
}

export function renderPhase(phase, { modes, mode, song, number = 1, message = '' }) {
    const isRevealed = phase === 'revealed';
    const isSearching = phase === 'searching';

    greetingBlock.hidden = isRevealed;
    stage.hidden = isRevealed;
    modeCard.hidden = isRevealed;
    revealed.hidden = !isRevealed;

    setTabsLocked(modes, isRevealed || isSearching);
    renderUnveilButton(phase);
    errorCard.hidden = phase !== 'error';
    renderLockStatus(isRevealed);
    phaseDot.classList.toggle('is-busy', isSearching);

    switch (phase) {
        case 'searching':
            phaseStamp.textContent = 'Pressing in progress';
            renderStatus('Digging for a song and making sure the preview plays before we lock it in.', false);
            break;
        case 'error':
            phaseStamp.textContent = 'Transmission lost';
            errorTitle.textContent = message;
            renderStatus('', false);
            break;
        case 'revealed':
            revealed.replaceChildren(...createSongCard(song, mode, number));
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