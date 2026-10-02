import { formatCountdown, getCoverUrl, getReleaseYear, getSpotifyUrl } from './utils.js';

const DEFAULT_VOLUME = 0.25;
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

function renderUnveilButton(isSearching) {
    unveilButton.disabled = isSearching;
    unveilButton.classList.toggle('is-searching', isSearching);
    unveilButton.setAttribute('aria-label', isSearching ? 'Searching for your song' : "Unveil today's song");
    unveilTitle.textContent = isSearching ? 'Searching' : 'Unveil';
    unveilSubtitle.textContent = isSearching ? 'Checking the preview' : "Today's pressing";
}

function renderStatus(message, isError) {
    statusText.textContent = message;
    statusText.classList.toggle('is-error', isError);
}

function createSongCard(song, mode) {
    const stamp = document.createElement('p');
    stamp.className = 'stamp stamp-mode';
    stamp.textContent = `${mode.name} · Today's pressing`;

    const cover = document.createElement('img');
    cover.className = 'song-cover';
    cover.src = getCoverUrl(song.artworkUrl100);
    cover.alt = `Cover of ${song.collectionName}`;

    const title = document.createElement('h2');
    title.className = 'song-title';
    title.textContent = song.trackName;

    const meta = document.createElement('p');
    meta.className = 'song-meta';
    meta.textContent = `${song.artistName} · ${getReleaseYear(song.releaseDate)}`;

    const audio = document.createElement('audio');
    audio.className = 'song-audio';
    audio.controls = true;
    audio.volume = DEFAULT_VOLUME;
    audio.src = song.previewUrl;

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

    return [stamp, cover, title, meta, audio, actions];
}

export function renderPhase(phase, { modes, mode, song, message = '' }) {
    const isRevealed = phase === 'revealed';
    const isSearching = phase === 'searching';

    greetingBlock.hidden = isRevealed;
    stage.hidden = isRevealed;
    modeCard.hidden = isRevealed;
    revealed.hidden = !isRevealed;

    setTabsLocked(modes, isRevealed || isSearching);
    renderUnveilButton(isSearching);
    renderLockStatus(isRevealed);
    phaseDot.classList.toggle('is-busy', isSearching);

    switch (phase) {
        case 'searching':
            phaseStamp.textContent = 'Pressing in progress';
            renderStatus('Digging for a song and making sure the preview plays before we lock it in.', false);
            break;
        case 'error':
            phaseStamp.textContent = 'No signal';
            renderStatus(message, true);
            break;
        case 'revealed':
            revealed.replaceChildren(...createSongCard(song, mode));
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