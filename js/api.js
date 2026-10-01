// api.js: talks to the iTunes Search API.

const API_URL = 'https://itunes.apple.com/search';
const POOL_URL = 'data/pool.json';
const RESULT_LIMIT = 25;

async function fetchJson(url) {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return response.json();
}

// Loads the fixed search terms for every mode.
export function loadPool() {
  return fetchJson(POOL_URL);
}

// Searches songs for a term and returns only the ones that have a preview.
export async function searchSongs(term) {
  const url = `${API_URL}?term=${encodeURIComponent(term)}&entity=song&limit=${RESULT_LIMIT}`;
  const data = await fetchJson(url);
  return data.results.filter((song) => song.previewUrl);
}
