import { readJson, writeJson } from './store.js';

const PROFILES_KEY = 'unheard:profiles';
const CURRENT_PROFILE_KEY = 'unheard:currentProfile';

export const MAX_NAME_LENGTH = 20;
export const MAX_BLOCKED_GENRES = 3;

export function getProfiles() {
    return readJson(PROFILES_KEY, []);
}

export function getProfile(id) {
    return getProfiles().find((profile) => profile.id === id) ?? null;
}

export function getCurrentProfile() {
    return getProfile(localStorage.getItem(CURRENT_PROFILE_KEY));
}

export function setCurrentProfile(id) {
    localStorage.setItem(CURRENT_PROFILE_KEY, id);
}

export function logOut() {
    localStorage.removeItem(CURRENT_PROFILE_KEY);
}

export function validateName(name, ownId = null) {
    const trimmed = name.trim();
    if (!trimmed) return 'Type a name.';
    if (trimmed.length > MAX_NAME_LENGTH) return `Use ${MAX_NAME_LENGTH} characters or fewer.`;

    const isTaken = getProfiles().some((profile) =>
        profile.id !== ownId && profile.name.toLowerCase() === trimmed.toLowerCase());

    if (isTaken) return 'That name is already taken.';

    return '';
}

export function createProfile(name, avatar) {
    const profile = { id: crypto.randomUUID(), name: name.trim(), avatar };
    writeJson(PROFILES_KEY, [...getProfiles(), profile]);
    return profile;
}

export function updateProfile(id, changes) {
    const profiles = getProfiles().map((profile) =>
        profile.id === id ? { ...profile, ...changes } : profile);

    writeJson(PROFILES_KEY, profiles);
    return getProfile(id);
}

export function deleteProfile(id) {
    writeJson(PROFILES_KEY, getProfiles().filter((profile) => profile.id !== id));
}