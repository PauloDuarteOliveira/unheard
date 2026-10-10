# Unheard

Discover a new sound every day. Unheard gives you one song a day, chosen through the discovery mode you pick, and saves every discovery to your personal collection.

**Live site:** https://PauloDuarteOliveira.github.io/unheard/

## How it works

1. Choose your profile on the **Who's listening?** screen, or create a new one.
2. Pick a discovery mode and, if you like, an option in its dial (a decade, a country, a mood or a genre). Then press **Unveil**.
3. The app builds a search for that mode, asks the iTunes Search API for songs, keeps the ones that fit (and removes any genre your profile blocked), and chooses one.
4. It checks that the 30-second preview really plays before accepting the song.
5. The song appears in a record sleeve, with its own player, a catalog number, and links to Spotify and Apple Music. The day is locked until local midnight, and a refresh shows the same song. The song is also added to your **collector binder**.

A failed attempt never uses up the daily discovery: the lock is saved only after a playable song is found.

- **If something fails**, an error card explains what happened (no connection, no playable song, or the search terms could not load) and offers **Try again**.
- **If a preview stops working after the day is locked**, the player shows **Re-roll**, which finds a new song in the same mode and keeps the same catalog number.
- **Share** copies "Today I discovered … by … 🎧" to the clipboard.
- **Rate it:** five stars under the song, next to the favorite heart. Tapping the same star again clears the rating. The rating is saved with the song in the collection, and can also be changed later from the binder.
- **Volume (desktop):** the player ends with a mute button and a volume slider. On phones, the device's own volume buttons are used instead.

## Profiles

Several people can share one browser, each with their own profile:

- **Who's listening?** shows every profile as a record, plus a tile to add a new one.
- **Create your profile** asks for a name (up to 20 characters, no duplicates) and a record color, with a live preview of the record.
- **Negative harmony** is an optional second step: block up to 3 genres you never want to hear. Blocked genres are removed from every mode's results, and they disappear from the Genre dial.
- **The profile menu** in the header shows who is logged in, opens the **Collection** and **Settings**, and has **Log out**.
- **The streak** (🔥) in the header counts the days in a row with a discovery. It is calculated from the collection dates, so it never goes out of sync, and a day without a discovery yet does not break it until midnight. On desktop it also shows the best streak.

Each profile has its own daily lock and catalog numbers, so two people can each discover a song on the same day. The app remembers the last profile and opens straight on its Today screen.

| `localStorage` key | What it holds |
|---|---|
| `unheard:profiles` | The list of profiles: id, name and avatar color |
| `unheard:currentProfile` | The id of the logged-in profile |
| `unheard:<id>:today` | That profile's discovery of the day: date, mode, option, song and catalog number |
| `unheard:<id>:collection` | Every discovery of that profile, with its favorite flag, rarity and whether it filled a new set slot |
| `unheard:<id>:settings` | That profile's settings: blocked genres, default mode, preview autoplay, theme and preview volume |

To block a genre, the app looks up its `matches` in `data/pool.json` (the genre names iTunes uses, for example Hip-Hop is `"Hip-Hop/Rap"`) and drops every song whose `primaryGenreName` is on that list. "Hard Rock" is listed under both Rock and Metal, so blocking Metal also removes Hard Rock songs.

## Collector binder

Every discovery becomes a card in the profile's binder, opened from the profile menu:

- **Cards** show the cover, catalog number, rarity badge, title, artist and a tag in the mode's color with what was chosen (a decade, a country, a mood or a genre). When the dial was on "Surprise me", the tag shows the option the app actually picked.
- **Play the previews:** every cover has a play button. While a card plays, its button turns into a pause button in the mode's color, a glowing line along the bottom of the cover shows the progress, and the card's info is tinted. Only one preview plays at a time: the binder has a single audio player (`js/player.js`), so starting another card stops the previous one immediately. It also pauses today's song on the Revealed screen, and stops when you leave the binder.
- **Rate and favorite:** each card ends with five small stars (in the card's mode color) and the heart. Ratings and favorites made in the binder and on the Revealed screen always stay in sync, because both screens update every control for that catalog number.
- **Volume (desktop):** one mute button and slider at the end of the filter row. It shares the same saved volume as the Today player, so changing it in one place changes it in the other.
- **Stats:** pressings, countries visited with World Explorer, Legendary cards, and on desktop the average star rating.
- **Search** by title, artist or tag, **filter** by mode, rarity or favorites, and **sort** by newest, oldest or A–Z. The filters are kept in `sessionStorage` (`unheard:binderFilters`), so they survive going back to Today or a refresh, and reset on log out or when the tab closes.
- **Sets** (a second tab on phones, a side panel on desktop): World tour (24 countries), Decades (7), Moods (8) and Genres (18, minus the profile's blocked genres), each with a progress bar and a "?" for every slot still missing. A slot is filled by a discovery in that mode with that option.

The grid has 2 columns on phones, as many 200 px columns as fit on desktop, and 4 columns in landscape, where the title and the tabs share the first row and the search and filters the second. On desktop there are no tabs: the cards fill the left column, and a 320 px panel on the right holds the four stats and the sets.

## Light theme

The app is dark by default. Each profile can switch to a light theme in Settings, or with the sun/moon button in the desktop header. Both controls always show the same choice.

Every color in `css/style.css` is a CSS variable in `:root`, so the light theme is a second set of values in `:root[data-theme="light"]`, switched on by one attribute on `<html>`. The mode colors get deeper versions for the light page, chosen to keep a contrast of at least 4.5:1 for text. `color-scheme` makes the browser's own parts (dropdown lists, scrollbars) follow the theme. Logging out goes back to dark.

## Rarity

Every discovery gets a rarity tier the moment it is found. It is saved with the card and never recalculated, because some factors (like "first song from this country") are only true on that day.

| Factor | Points |
|---|---|
| Released before 1970 / 1970–1989 / 1990–2009 | +3 / +2 / +1 |
| First World Explorer song from this country in the collection | +2 |
| First song from this genre in the collection | +2 |
| Shorter than 2:00 or longer than 7:00 | +1 |
| Luck | +0 to +3 |

| Points | Tier | Look |
|---|---|---|
| 0–2 | Common | plain frame |
| 3–4 | Uncommon | silver frame |
| 5 | Rare | gold frame and glow |
| 6 | Epic | thin holographic rim |
| 7+ | Legendary | thick holographic rim, gold glow, a shine across the cover and a star |

All the rules and thresholds are in `data/config.json`. They were tuned by scoring 89 real iTunes songs: because iTunes mostly returns recent music, the highest score was 7, so Legendary starts at 7 and Epic at 6. That gives roughly 42% Common, 30% Uncommon, 18% Rare, 9% Epic and 1% Legendary. The scoring function takes the luck as an optional parameter, so it can be tested with fixed numbers.

When a discovery fills a new set slot, the Revealed screen says so, for example "New country unlocked: Japan · World tour 3/24".

## Settings

Opened from the profile menu. There is no Save button: every change is saved as soon as it is made.

- **Profile:** change the name (validated like on creation, but a profile may keep its own name) and the record color. The records preview the new initial while typing.
- **Negative harmony:** the same genre chips and 3-genre limit as when creating a profile. Blocking the genre picked in the Genre dial resets the dial to "Surprise me".
- **Preferences:** the **theme** (dark by default, or light), the default mode selected after logging in, and **Play preview on unveil**. It is off by default, because browsers may block sound that starts by itself; if they do, the preview simply waits for the play button.
- **Your data:** **Export favorites** downloads a text file (`unheard-favorites-<date>.txt`) with one `Artist - Title` per line, oldest first, ready to paste into a playlist import tool. It is built in the browser with a `Blob`.
- **Delete profile** opens a confirmation dialog (`<dialog>`) showing what will be lost. It removes only that profile's keys, never `localStorage.clear()`, because every GitHub Pages project of the same account shares one `localStorage`.

New settings fields are read with defaults (`{ ...DEFAULT_SETTINGS, ...saved }`), so profiles saved before a field existed keep working.

Settings uses three columns on desktop, placed with CSS grid areas, and two columns in landscape.

## Discovery modes

| Mode | Dial | How the song is found |
|---|---|---|
| Random | none | a random word from 351 search terms |
| Time Machine | 7 decades, 1950s to 2010s | search terms typical of the decade, then only songs released in it |
| World Explorer | 24 countries | that country's iTunes store, with local search terms |
| Mood | 8 moods | search terms for each mood |
| Genre | 18 genres | genre search terms, then only songs of that genre |

Every dial starts on **Surprise me**, which picks a random option. While searching, the dial shows "Locked in" and the status line names the choice, for example "Going back to the 1980s" or "Traveling to Japan".

All the options and their search terms are in `data/pool.json`. Every decade and genre term was tested against the API, and terms that found too few matching songs were replaced.

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
| `data/pool.json` | Search terms for every mode: random words, decades, countries, moods and genres (with the iTunes genre names each genre matches) |
| `data/config.json` | The six avatar record colors, and the rarity rules and tiers |
| `js/main.js` | Entry point: connects all the modules and handles clicks |
| `js/collection.js` | Pure functions for the binder: add, favorite, tag, stats, filter, sort, sets, favorites export and streaks |
| `js/rarity.js` | Scores a discovery and finds its rarity tier |
| `js/profiles.js` | Profile list, logged-in profile, name validation, and creating, editing and deleting profiles |
| `js/api.js` | iTunes Search API requests and the preview check |
| `js/modes.js` | The list of discovery modes and one query-building function per mode |
| `js/picker.js` | Picks a candidate without repeats, removes blocked genres and runs the discovery loop |
| `js/store.js` | Safe JSON reading and writing (in `localStorage` or `sessionStorage`), and one store per profile |
| `js/render.js` | Everything that changes the page, including the audio player |
| `js/theme.js` | Applies the selected mode's color and the dark or light theme |
| `js/player.js` | The binder's single preview player, as a closure: play, pause, stop, progress and volume |
| `js/utils.js` | Dates (including moving a date by days), countdown, greeting, links and other small helpers |

## Screen sizes

The CSS is written mobile first, with three layouts:

| Layout | When | Media query |
|---|---|---|
| Phone portrait | the base rules | none |
| Desktop | wide and tall screens | `(min-width: 768px) and (min-height: 501px)` |
| Phone landscape | wide and short screens | `(orientation: landscape) and (max-height: 500px)` |

Desktop and landscape both build on the phone rules, so they never undo each other. On desktop and in landscape the screens use two columns, arranged with CSS grid. `renderPhase` writes the current phase on `<main>` as `data-phase`, so the CSS can change the layout per phase.

## Testing the daily lock

After one discovery the app is locked until midnight. To test again, open the site with `?dev=1` at the end of the address:

```
http://127.0.0.1:5500/index.html?dev=1
```

A small developer button appears in the footer. It removes today's lock of the logged-in profile only and shows the Unveil button again. The binder keeps every song, so unveiling several times in a row fills it for a demo, each with a new catalog number. Dev mode is remembered in `sessionStorage`, so it stays on while the tab is open and disappears when the tab is closed.

## Status

**Done**

- Today screen with greeting, mode tabs, Unveil button, mode card and status bar
- Random mode, with 351 search terms
- Preview verification, with up to 3 attempts
- Daily lock per local date, with a countdown to midnight
- Revealed screen: record sleeve with a sliding vinyl, catalog number, custom audio player, Spotify, Apple Music and share
- Error card with Try again, and re-roll for previews that break after the lock
- Dev reset with `?dev=1`
- Layouts for phone portrait, phone landscape and desktop
- Time Machine, World Explorer, Mood and Genre modes, each with its setup dial
- Profiles: Who's listening, create profile with live preview, Negative harmony, profile menu with log out, a daily lock per profile, and blocked genres kept out of every mode
- Collector binder: cards, favorites, stats, search, filters and sort, in the three layouts
- Settings: edit name and record, Negative harmony, default mode, preview autoplay, export favorites, delete profile with confirmation, and the daily streak in the header
- Rarity: five tiers with badges and frames, a rarity filter, a legend and a Legendary stat, binder sets with progress, and "new slot unlocked" messages
- Polish: star ratings (on Revealed and the binder cards), a light theme (Settings and the desktop header), the binder preview player, a saved preview volume with desktop controls, the desktop binder side panel, and a clearer error state

**Next**

- Final checks on a real phone, and the presentation

## How Unheard differs from similar apps

Two other apps share the name, and both help you find music, but in different ways:

| | unheardmusic.app | unheard.fm | This project |
|---|---|---|---|
| Starting point | A song you already like | Your own rules and filters | A discovery mode |
| How much | Up to 5 suggestions | Whole playlists | One song per day |
| Core idea | Similarity | Control, no repeats | A daily habit, and collecting |

The others start from what you already know. Unheard starts from somewhere you would not have looked (a random word, a decade, a country, a mood or a genre), gives you only one song, and turns each day's discovery into a card in your collection.

## Credits

Song data and previews provided by Apple through the iTunes Search API. Icons are Google Material Symbols.
