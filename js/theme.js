/* ============================================================
   THEME.JS — Dark mode / Light mode toggle with localStorage
   ============================================================ */

const ThemeManager = {
  STORAGE_KEY: 'ai-website-theme',

  init() {
    const savedTheme = Utils.getJSON(this.STORAGE_KEY, 'light');
    this.setTheme(savedTheme, false);
    this.bindToggle();
  },

  setTheme(theme, animate = true) {
    if (animate) {
      document.body.classList.add('theme-transitioning');
      setTimeout(() => document.body.classList.remove('theme-transitioning'), 400);
    }
    document.documentElement.setAttribute('data-theme', theme);
    Utils.setJSON(this.STORAGE_KEY, theme);
    this.updateToggleIcon(theme);
  },

  toggle() {
    const current = document.documentElement.getAttribute('data-theme') || 'light';
    const next = current === 'dark' ? 'light' : 'dark';
    this.setTheme(next, true);
  },

  updateToggleIcon(theme) {
    const btn = Utils.$('.theme-toggle');
    if (btn) {
      btn.innerHTML = theme === 'dark' ? '☀️' : '🌙';
      btn.setAttribute('aria-label', theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode');
      btn.title = theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode';
    }
  },

  bindToggle() {
    const btn = Utils.$('.theme-toggle');
    if (btn) {
      btn.addEventListener('click', () => this.toggle());
    }
  }
};

document.addEventListener('DOMContentLoaded', () => ThemeManager.init());
