# Unheard

Discover a new sound every day. Unheard gives you one song a day, chosen through the discovery mode you pick, and saves every discovery to your personal collection.

**Live site:** https://PauloDuarteOliveira.github.io/unheard/

## How it works

1. Press **Unveil** on the Today screen.
2. The app picks a random search term, asks the iTunes Search API for songs, and chooses one.
3. It checks that the 30-second preview really plays before accepting the song.
4. The song appears in a record sleeve, with its own player, a catalog number, and links to Spotify and Apple Music. The day is locked until local midnight, and a refresh shows the same song.

A failed attempt never uses up the daily discovery: the lock is saved only after a playable song is found.

- **If something fails**, an error card explains what happened (no connection, no playable song, or the search terms could not load) and offers **Try again**.
- **If a preview stops working after the day is locked**, the player shows **Re-roll**, which finds a new song in the same mode and keeps the same catalog number.
- **Share** copies "Today I discovered … by … 🎧" to the clipboard.

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
| `js/main.js` | Entry point: connects all the modules and handles clicks |
| `js/api.js` | iTunes Search API requests and the preview check |
| `js/modes.js` | The list of discovery modes and one query-building function per mode |
| `js/picker.js` | Picks a candidate without repeats and runs the discovery loop |
| `js/store.js` | Reads and saves one profile's data in `localStorage` |
| `js/render.js` | Everything that changes the page, including the audio player |
| `js/theme.js` | Applies the selected mode's color |
| `js/utils.js` | Dates, countdown, greeting, links and other small helpers |

## Testing the daily lock

After one discovery the app is locked until midnight. To test again, open the site with `?dev=1` at the end of the address:

```
http://127.0.0.1:5500/index.html?dev=1
```

A small developer button appears in the footer. It removes today's lock and shows the Unveil button again. Dev mode is remembered in `sessionStorage`, so it stays on while the tab is open and disappears when the tab is closed.

## Status

**Done**

- Today screen with greeting, mode tabs, Unveil button, mode card and status bar
- Random mode, with 351 search terms
- Preview verification, with up to 3 attempts
- Daily lock per local date, with a countdown to midnight
- Revealed screen: record sleeve with a sliding vinyl, catalog number, custom audio player, Spotify, Apple Music and share
- Error card with Try again, and re-roll for previews that break after the lock
- Dev reset with `?dev=1`

**Next**

- Desktop and mobile landscape layouts
- Time Machine, World Explorer, Mood and Genre modes
- Profiles, collection, settings

## Credits

Song data and previews provided by Apple through the iTunes Search API. Icons are Google Material Symbols.
