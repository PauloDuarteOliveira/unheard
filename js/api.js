
const API_URL = 'https://itunes.apple.com/search';
const POOL_URL = 'data/pool.json';
const RESULT_LIMIT = 25;
const PREVIEW_TIMEOUT_MS = 8000;
const PLAYABLE_EVENTS = ['canplaythrough', 'loadedmetadata'];

async function fetchJson(url) {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return response.json();
}

export function loadPool() {
  return fetchJson(POOL_URL);
}

export async function searchSongs(term) {
  const url = `${API_URL}?term=${encodeURIComponent(term)}&entity=song&limit=${RESULT_LIMIT}`;
  const data = await fetchJson(url);
  return data.results.filter((song) => song.previewUrl);
}

// Resolves when the preview can play, rejects on an audio error or after the timeout.
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
