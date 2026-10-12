// api.js: everything that goes over the network: the app's own JSON files, the
// iTunes Search API, and the check that a song's preview really plays.

const API_URL = 'https://itunes.apple.com/search';
const POOL_URL = 'data/pool.json';
export const POOL_ERROR_MESSAGE = 'Search terms could not be loaded';
const RESULT_LIMIT = 50;
const PREVIEW_TIMEOUT_MS = 8000;
const PLAYABLE_EVENTS = ['canplaythrough', 'loadedmetadata'];
const CONFIG_URL = 'data/config.json';

// ===== Loading JSON =====

// fetch only rejects when there is no connection, so an HTTP error (like 404)
// is turned into an error here too.
async function fetchJson(url) {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return response.json();
}

export async function loadPool() {
  try {
    return await fetchJson(POOL_URL);
  } catch (error) {
    console.error('pool.json failed to load', error);
    throw new Error(POOL_ERROR_MESSAGE);
  }
}

export function loadConfig() {
  return fetchJson(CONFIG_URL);
}

// ===== The iTunes Search API =====

// Songs without a preview are dropped right away, because the app needs one to play.
export async function searchSongs({ term, country }) {
  const params = new URLSearchParams({ term, entity: 'song', limit: RESULT_LIMIT });
  if (country) params.set('country', country);

  const data = await fetchJson(`${API_URL}?${params}`);
  return data.results.filter((song) => song.previewUrl);
}

// Some iTunes previews no longer load. This wraps the audio events in a Promise:
// it resolves once the browser can play the preview, and rejects on an error
// or after 8 seconds, so a broken song is never locked in as the day's song.
export function verifyPreview(url, timeoutMs = PREVIEW_TIMEOUT_MS) {
  return new Promise((resolve, reject) => {
    const audio = new Audio();

    function stopListening() {
      clearTimeout(timer);
      PLAYABLE_EVENTS.forEach((eventName) => audio.removeEventListener(eventName, handlePlayable));
      audio.removeEventListener('error', handleError);
    }

    function handlePlayable() {
      stopListening();
      resolve();
    }

    function handleError() {
      stopListening();
      reject(new Error('Preview failed to load'));
    }

    const timer = setTimeout(() => {
      stopListening();
      reject(new Error('Preview timed out'));
    }, timeoutMs);

    PLAYABLE_EVENTS.forEach((eventName) => audio.addEventListener(eventName, handlePlayable));
    audio.addEventListener('error', handleError);
    audio.preload = 'auto';
    audio.src = url;
  });
}
