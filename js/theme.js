// theme.js: switches the page's colors. CSS does the rest: [data-mode] on <body> sets
// the mode's color, and [data-theme="light"] on <html> swaps in the light palette.

export function applyMode(modeKey) {
    document.body.dataset.mode = modeKey;
}

export function applyTheme(theme) {
    if (theme === 'light') {
        document.documentElement.dataset.theme = 'light';
    } else {
        delete document.documentElement.dataset.theme;
    }
}
