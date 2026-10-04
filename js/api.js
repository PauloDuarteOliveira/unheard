const API_URL = 'https://itunes.apple.com/search';
const POOL_URL = 'data/pool.json';
export const POOL_ERROR_MESSAGE = 'Search terms could not be loaded';
const RESULT_LIMIT = 50;
const PREVIEW_TIMEOUT_MS = 8000;
const PLAYABLE_EVENTS = ['canplaythrough', 'loadedmetadata'];

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

export async function searchSongs({term, country}) {
  const params = new URLSearchParams({ term, entity: 'song', limit: RESULT_LIMIT });
    if (country) params.set('country', country);

  const data = await fetchJson(`${API_URL}?${params}`);
  return data.results.filter((song) => song.previewUrl);
}

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
