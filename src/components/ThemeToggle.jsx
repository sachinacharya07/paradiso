/**
 * Theme toggle button (moon/sun icon) for the taskbar.
 * Receives theme and toggleTheme from parent (App) to avoid
 * multiple useTheme instances.
 */
export default function ThemeToggle({ theme, toggleTheme }) {
  return (
    <button
      className="theme-toggle"
      onClick={toggleTheme}
      title={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
      aria-label={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
    >
      {theme === 'light' ? '☾' : '☀'}
    </button>
  );
}
