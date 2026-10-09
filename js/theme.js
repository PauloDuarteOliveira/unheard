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
