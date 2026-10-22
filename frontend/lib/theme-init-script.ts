// Runs before first paint (nonce'd in the root layout) so the page never flashes the wrong
// paper. An explicit choice saved by the header toggle wins; otherwise follow the OS, and
// fall back to light. data-theme on <html> is what the Catalogue tokens key off.
export const THEME_INIT_SCRIPT = `try {
  var saved = localStorage.getItem('theme')
  var theme = saved === 'light' || saved === 'dark'
    ? saved
    : (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
  document.documentElement.dataset.theme = theme
  document.documentElement.style.colorScheme = theme
} catch (_) {
  document.documentElement.dataset.theme = 'light'
}`;
