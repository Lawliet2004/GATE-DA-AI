/* ============================================================
   ANIMATIONS.JS — Scroll-triggered animations, accordion toggles, tabs
   ============================================================ */

const Animations = {
  init() {
    this.initScrollReveal();
    this.initAccordions();
    this.initTabs();
    this.initSpoilers();
    this.initCopyButtons();
    this.initSmoothScroll();
  },

  /* --- Scroll Reveal --- */
  initScrollReveal() {
    const elements = Utils.$$('.fade-in, .slide-in-left, .slide-in-right, .scale-up, .stagger-children');
    if (elements.length === 0) return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

    elements.forEach(el => observer.observe(el));
  },

  /* --- Accordion / Collapsible --- */
  initAccordions() {
    Utils.$$('.collapsible-header').forEach(header => {
      header.addEventListener('click', () => {
        const collapsible = header.closest('.collapsible');
        collapsible.classList.toggle('active');
      });

      // Keyboard accessibility
      header.setAttribute('tabindex', '0');
      header.setAttribute('role', 'button');
      header.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          header.click();
        }
      });
    });
  },

  /* --- Tabs --- */
  initTabs() {
    Utils.$$('.tabs').forEach(tabContainer => {
      const headers = Utils.$$('.tab-header', tabContainer);
      const contents = Utils.$$('.tab-content', tabContainer);

      headers.forEach((header, i) => {
        header.addEventListener('click', () => {
          headers.forEach(h => h.classList.remove('active'));
          contents.forEach(c => c.classList.remove('active'));
          header.classList.add('active');
          if (contents[i]) contents[i].classList.add('active');
        });

        // Keyboard
        header.setAttribute('tabindex', '0');
        header.setAttribute('role', 'tab');
        header.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            header.click();
          }
        });
      });
    });
  },

  /* --- Spoilers (Click to reveal) --- */
  initSpoilers() {
    Utils.$$('.spoiler').forEach(spoiler => {
      spoiler.addEventListener('click', () => {
        spoiler.classList.toggle('revealed');
      });
    });
  },

  /* --- Copy Buttons for Code Blocks --- */
  initCopyButtons() {
    Utils.$$('.copy-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const codeBlock = btn.closest('.algorithm-block');
        if (!codeBlock) return;
        const code = codeBlock.querySelector('.algo-body');
        if (!code) return;
        const text = code.innerText;
        const success = await Utils.copyToClipboard(text);
        if (success) {
          const original = btn.textContent;
          btn.textContent = 'Copied!';
          setTimeout(() => { btn.textContent = original; }, 1500);
        }
      });
    });
  },

  /* --- Smooth Scroll for Anchor Links --- */
  initSmoothScroll() {
    Utils.$$('a[href^="#"]').forEach(anchor => {
      anchor.addEventListener('click', (e) => {
        const targetId = anchor.getAttribute('href').slice(1);
        if (!targetId) return;
        const target = document.getElementById(targetId);
        if (target) {
          e.preventDefault();
          Utils.scrollTo(target);
          history.replaceState(null, '', `#${targetId}`);
          // Add highlight flash
          target.classList.add('highlight-flash');
          setTimeout(() => target.classList.remove('highlight-flash'), 1500);
        }
      });
    });
  }
};

document.addEventListener('DOMContentLoaded', () => Animations.init());
