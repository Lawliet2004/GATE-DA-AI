/* ============================================================
   UTILS.JS — Helper functions, localStorage wrappers, DOM utilities
   ============================================================ */

const Utils = {
  /* --- LocalStorage Wrappers --- */
  getJSON(key, defaultValue = null) {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : defaultValue;
    } catch (e) {
      console.warn('Error reading localStorage:', key, e);
      return defaultValue;
    }
  },

  setJSON(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.warn('Error writing localStorage:', key, e);
    }
  },

  removeItem(key) {
    try {
      localStorage.removeItem(key);
    } catch (e) {
      console.warn('Error removing localStorage:', key, e);
    }
  },

  /* --- DOM Helpers --- */
  $(selector, parent = document) {
    return parent.querySelector(selector);
  },

  $$(selector, parent = document) {
    return Array.from(parent.querySelectorAll(selector));
  },

  createElement(tag, attrs = {}, children = []) {
    const el = document.createElement(tag);
    Object.entries(attrs).forEach(([key, value]) => {
      if (key === 'className') el.className = value;
      else if (key === 'innerHTML') el.innerHTML = value;
      else if (key === 'textContent') el.textContent = value;
      else if (key.startsWith('on')) el.addEventListener(key.slice(2).toLowerCase(), value);
      else el.setAttribute(key, value);
    });
    children.forEach(child => {
      if (typeof child === 'string') el.appendChild(document.createTextNode(child));
      else if (child) el.appendChild(child);
    });
    return el;
  },

  /* --- Path Helpers --- */
  getBasePath() {
    const path = window.location.pathname;
    const parts = path.split('/');
    const idx = parts.findIndex(p => p === 'ai-learning-website');
    if (idx >= 0) {
      return parts.slice(0, idx + 1).join('/') + '/';
    }
    // Fallback: determine depth from current file
    return this.getRelativeRoot();
  },

  getRelativeRoot() {
    const path = window.location.pathname;
    if (path.includes('/chapters/')) {
      return '../../';
    }
    return './';
  },

  getCurrentPage() {
    const path = window.location.pathname;
    const match = path.match(/ai-learning-website\/(.+)$/);
    return match ? match[1] : path.split('/').pop();
  },

  /* --- Debounce --- */
  debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  },

  /* --- Throttle --- */
  throttle(func, limit) {
    let inThrottle;
    return function(...args) {
      if (!inThrottle) {
        func.apply(this, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  },

  /* --- Format Time --- */
  formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  },

  /* --- Generate ID from text --- */
  slugify(text) {
    return text.toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  },

  /* --- Smooth scroll to element --- */
  scrollTo(element, offset = 80) {
    const top = element.getBoundingClientRect().top + window.pageYOffset - offset;
    window.scrollTo({ top, behavior: 'smooth' });
  },

  /* --- Copy text to clipboard --- */
  async copyToClipboard(text) {
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(text);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      return true;
    } catch (e) {
      console.warn('Copy failed:', e);
      return false;
    }
  },

  /* --- Show toast notification --- */
  showToast(message, duration = 2000) {
    let container = document.getElementById('toast-container');
    if (!container) {
      container = this.createElement('div', { id: 'toast-container' });
      container.style.cssText = 'position:fixed;bottom:20px;right:20px;z-index:9999;display:flex;flex-direction:column;gap:8px;';
      document.body.appendChild(container);
    }
    const toast = this.createElement('div', {
      textContent: message,
      className: 'toast-message'
    });
    toast.style.cssText = `
      padding:10px 20px;background:var(--text-primary);color:var(--bg-primary);
      border-radius:8px;font-size:14px;font-weight:500;opacity:0;
      transform:translateY(10px);transition:all 0.3s ease;
      box-shadow:0 4px 12px rgba(0,0,0,0.3);
    `;
    container.appendChild(toast);
    requestAnimationFrame(() => {
      toast.style.opacity = '1';
      toast.style.transform = 'translateY(0)';
    });
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      setTimeout(() => toast.remove(), 300);
    }, duration);
  }
};
