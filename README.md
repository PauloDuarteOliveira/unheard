# Unheard

Discover a new sound every day. Unheard gives you one song a day, chosen through the discovery mode you pick, and saves every discovery to your personal collection.

**Live site:** https://PauloDuarteOliveira.github.io/unheard/

## How it works

1. Press **Unveil** on the Today screen.
2. The app picks a random search term, asks the iTunes Search API for songs, and chooses one.
3. It checks that the 30-second preview really plays before accepting the song.
4. The song is shown and the day is locked until local midnight. A refresh shows the same song.

A failed attempt never uses up the daily discovery: the lock is saved only after a playable song is found.

## Run it locally

This project uses JavaScript modules (`<script type="module">`), so it will not work by double-clicking `index.html`.

1. Clone the repository.
2. Open the folder in VS Code.
3. Right-click `index.html` and choose **Open with Live Server**.

## Project structure

| File | What it does |
|---|---|
| `index.html` | The single page of the app |
| `css/style.css` | Styles. Every color is a CSS variable, and each mode swaps its own color |
| `data/pool.json` | Search terms for Random mode |
| `js/main.js` | Entry point: connects all the modules |
| `js/api.js` | iTunes Search API requests and the preview check |
| `js/modes.js` | The list of discovery modes and one query-building function per mode |
| `js/picker.js` | Picks a candidate without repeats and runs the discovery loop |
| `js/store.js` | Reads and saves one profile's data in `localStorage` |
| `js/render.js` | Everything that changes the page |
| `js/theme.js` | Applies the selected mode's color |
| `js/utils.js` | Dates, countdown, greeting and other small helpers |

## Testing the daily lock

After one discovery the app is locked until midnight. To unlock it while testing, run this in the browser console and refresh:

```js
localStorage.removeItem('unheard:guest:today');
```

## Status

**Done**

- Today screen with greeting, mode tabs, Unveil button, mode card and status bar
- Random mode
- Preview verification, with up to 3 attempts
- Daily lock per local date, with a countdown to midnight

**Next**

- Full Revealed screen, error card and re-roll
- Time Machine, World Explorer, Mood and Genre modes
- Profiles, collection, settings

## Credits

Song data and previews provided by Apple through the iTunes Search API. Icons are Google Material Symbols.
