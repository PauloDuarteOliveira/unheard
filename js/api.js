// api.js: talks to the iTunes Search API.

const API_URL = 'https://itunes.apple.com/search';
const RESULT_LIMIT = 25;

// Searches songs for a term and returns only the ones that have a preview.
export async function searchSongs(term) {
  const url = `${API_URL}?term=${encodeURIComponent(term)}&entity=song&limit=${RESULT_LIMIT}`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const data = await response.json();
  return data.results.filter((song) => song.previewUrl);
}
