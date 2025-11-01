const THEME_KEY = 'quizAppTheme';

/**
 * Applies the theme by adding or removing the 'dark' class from the document element.
 * @param {string} theme - 'dark' or 'light'
 */
function applyTheme(theme) {
    if (theme === 'dark') {
        document.documentElement.classList.add('dark');
    } else {
        document.documentElement.classList.remove('dark');
    }
}

/**
 * Toggles the current theme and saves the preference to localStorage.
 * @returns {string} The new theme ('dark' or 'light')
 */
export function toggleTheme() {
    const currentIsDark = document.documentElement.classList.contains('dark');
    const newTheme = currentIsDark ? 'light' : 'dark';
    localStorage.setItem(THEME_KEY, newTheme);
    applyTheme(newTheme);
    return newTheme;
}

/**
 * Gets the current theme from the document element.
 * @returns {string} 'dark' or 'light'
 */
export function getCurrentTheme() {
    return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
}

/**
 * Updates the state of a toggle button to match the current theme.
 * @param {HTMLButtonElement} button - The toggle switch button.
 */
export function updateThemeToggle(button) {
    const isDark = getCurrentTheme() === 'dark';
    button.setAttribute('aria-checked', isDark);
    const span = button.querySelector('span');
    if (span) {
        span.classList.toggle('translate-x-5', isDark);
        span.classList.toggle('translate-x-0', !isDark);
    }
    button.classList.toggle('bg-primary', isDark);
    button.classList.toggle('bg-gray-200', !isDark);
    button.classList.toggle('dark:bg-gray-700', !isDark);
}