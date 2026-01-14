/**
 * Theme Manager - Single source of truth for app theming
 */

export type Theme = 'light' | 'dark' | 'black-and-white';

const THEME_STORAGE_KEY = 'user_preferences_theme';

/**
 * Get initial theme from localStorage or default
 */
export const getInitialTheme = (): Theme => {
    if (typeof window === 'undefined') return 'dark';
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    if (stored === 'light' || stored === 'dark' || stored === 'black-and-white') {
        return stored as Theme;
    }
    return 'dark';
};

/**
 * Apply theme to document root
 */
export const applyTheme = (theme: Theme): void => {
    if (typeof window === 'undefined') return;
    document.documentElement.classList.remove('light', 'dark', 'black-and-white');
    document.documentElement.classList.add(theme);
};

/**
 * Set and persist theme
 */
export const setTheme = (theme: Theme): void => {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
    applyTheme(theme);
};

/**
 * Initialize theme on app load
 */
export const initializeTheme = (): Theme => {
    const theme = getInitialTheme();
    applyTheme(theme);
    return theme;
};
