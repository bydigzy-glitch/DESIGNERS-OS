/**
 * Theme Manager - Single source of truth for app theming
 * Supports: default | stripe
 */

export type Theme = 'default' | 'stripe';

const THEME_STORAGE_KEY = 'app_theme';

/**
 * Get initial theme from localStorage or default
 */
export const getInitialTheme = (): Theme => {
    if (typeof window === 'undefined') return 'default';
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    if (stored === 'stripe' || stored === 'default') {
        return stored;
    }
    return 'default';
};

/**
 * Apply theme to document root
 */
export const applyTheme = (theme: Theme): void => {
    if (typeof window === 'undefined') return;
    document.documentElement.dataset.theme = theme;
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
