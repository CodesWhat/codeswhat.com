export const THEME_INIT_SCRIPT = `try {
  // Dark by default (the 3D layer is tuned for black); light is an
  // explicit opt-in via the header toggle.
  if (localStorage.theme === 'light') {
    document.documentElement.classList.remove('dark')
  } else {
    document.documentElement.classList.add('dark')
  }
} catch (_) {}`;
