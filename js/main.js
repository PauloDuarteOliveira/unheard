// main.js: entry point. For now it only runs the API test.
import { searchSongs } from './api.js';

const form = document.querySelector('#search-form');
const input = document.querySelector('#search-term');
const button = document.querySelector('#search-button');
const statusText = document.querySelector('#status');
const result = document.querySelector('#result');

function pickRandom(list) {
  const index = Math.floor(Math.random() * list.length);
  return list[index];
}

function renderSong(song) {
  const card = document.createElement('article');
  card.className = 'song-card';

  const cover = document.createElement('img');
  cover.src = song.artworkUrl100.replace('100x100', '600x600');
  cover.alt = `Cover of ${song.collectionName}`;

  const title = document.createElement('h2');
  title.textContent = song.trackName;

  const artist = document.createElement('p');
  artist.textContent = `${song.artistName} · ${song.releaseDate.slice(0, 4)}`;

  const audio = document.createElement('audio');
  audio.controls = true;
  audio.src = song.previewUrl;

  card.append(cover, title, artist, audio);
  result.replaceChildren(card);
}

form.addEventListener('submit', async (event) => {
  event.preventDefault();

  const term = input.value.trim();
  if (!term) return;

  button.disabled = true;
  statusText.textContent = 'Searching...';
  statusText.classList.remove('error');

  try {
    const songs = await searchSongs(term);

    if (songs.length === 0) {
      statusText.textContent = 'No songs with a preview found. Try another word.';
      result.replaceChildren();
      return;
    }

    const song = pickRandom(songs);
    console.log('Full song object from the API:', song);
    statusText.textContent = `Found ${songs.length} songs with a preview. Showing one at random.`;
    renderSong(song);
  } catch (error) {
    console.error('Request failed:', error);
    statusText.textContent = 'Could not reach the music service. Check your connection and try again.';
    statusText.classList.add('error');
  } finally {
    button.disabled = false;
  }
});
