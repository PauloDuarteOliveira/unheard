import { getCoverUrl, getReleaseYear } from './utils.js';

const SVG_NAMESPACE = 'http://www.w3.org/2000/svg';
const ICON_SIZE = 18;

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

function createIcon(pathData) {
    const svg = document.createElementNS(SVG_NAMESPACE, 'svg');
    svg.setAttribute('width', ICON_SIZE);
    svg.setAttribute('height', ICON_SIZE);
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('fill', 'none');
    svg.setAttribute('stroke', 'currentColor');
    svg.setAttribute('stroke-width', '1.8');
    svg.setAttribute('stroke-linecap', 'round');
    svg.setAttribute('stroke-linejoin', 'round');
    svg.setAttribute('aria-hidden', 'true');

    const path = document.createElementNS(SVG_NAMESPACE, 'path');
    path.setAttribute('d', pathData);
    svg.append(path);
    return svg;
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
    audio.src = song.previewUrl;

    const appleLink = document.createElement('a');
    appleLink.className = 'song-link';
    appleLink.href = song.trackViewUrl;
    appleLink.target = '_blank';
    appleLink.rel = 'noopener';
    appleLink.textContent = 'Open in Apple Music';

    return [stamp, cover, title, meta, audio, appleLink];
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
