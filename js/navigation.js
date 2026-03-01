/* ============================================================
   NAVIGATION.JS — Sidebar toggle, active link, breadcrumbs, On-This-Page
   ============================================================ */

const Navigation = {
  init() {
    this.initSidebar();
    this.highlightActiveLink();
    this.initBreadcrumb();
    this.initOnThisPage();
    this.initScrollSpy();
    this.trackPageVisit();
  },

  /* --- Sidebar Toggle (Mobile) --- */
  initSidebar() {
    const hamburger = Utils.$('.hamburger-btn');
    const sidebar = Utils.$('.sidebar');
    const overlay = Utils.$('.sidebar-overlay');

    if (hamburger && sidebar) {
      hamburger.addEventListener('click', () => {
        sidebar.classList.toggle('open');
        if (overlay) overlay.classList.toggle('active');
      });
    }

    if (overlay) {
      overlay.addEventListener('click', () => {
        if (sidebar) sidebar.classList.remove('open');
        overlay.classList.remove('active');
      });
    }

    // Collapsible chapter groups
    Utils.$$('.chapter-group-header').forEach(header => {
      header.addEventListener('click', () => {
        const group = header.closest('.chapter-group');
        group.classList.toggle('expanded');
      });
    });

    // Auto-expand the current chapter group
    const activeLink = Utils.$('.sidebar-link.active');
    if (activeLink) {
      const group = activeLink.closest('.chapter-group');
      if (group) group.classList.add('expanded');
    }
  },

  /* --- Highlight Active Sidebar Link --- */
  highlightActiveLink() {
    const currentPage = Utils.getCurrentPage();
    Utils.$$('.sidebar-link').forEach(link => {
      const href = link.getAttribute('href');
      if (href && currentPage && (currentPage.endsWith(href.split('/').pop()) || href.includes(currentPage))) {
        link.classList.add('active');
      }
    });
  },

  /* --- On This Page (Right TOC) --- */
  initOnThisPage() {
    const tocContainer = Utils.$('.page-toc-list');
    if (!tocContainer) return;

    const headings = Utils.$$('.main-content h2, .main-content h3');
    if (headings.length === 0) return;

    headings.forEach((heading, i) => {
      if (!heading.id) {
        heading.id = Utils.slugify(heading.textContent) || `section-${i}`;
      }
      const li = document.createElement('li');
      const a = document.createElement('a');
      a.href = `#${heading.id}`;
      a.textContent = heading.textContent;
      a.className = heading.tagName === 'H3' ? 'toc-h3' : '';
      a.addEventListener('click', (e) => {
        e.preventDefault();
        Utils.scrollTo(heading);
        history.replaceState(null, '', `#${heading.id}`);
      });
      li.appendChild(a);
      tocContainer.appendChild(li);
    });
  },

  /* --- Scroll Spy --- */
  initScrollSpy() {
    const tocLinks = Utils.$$('.page-toc-list a');
    if (tocLinks.length === 0) return;

    const headings = tocLinks.map(link => {
      const id = link.getAttribute('href').slice(1);
      return document.getElementById(id);
    }).filter(Boolean);

    const update = Utils.throttle(() => {
      const scrollPos = window.scrollY + 100;
      let current = null;

      headings.forEach((heading, i) => {
        if (heading.offsetTop <= scrollPos) {
          current = i;
        }
      });

      tocLinks.forEach(l => l.classList.remove('active'));
      if (current !== null && tocLinks[current]) {
        tocLinks[current].classList.add('active');
      }
    }, 100);

    window.addEventListener('scroll', update);
    update();
  },

  /* --- Breadcrumb --- */
  initBreadcrumb() {
    // Breadcrumbs are rendered in HTML, this just ensures proper structure
    const breadcrumb = Utils.$('.breadcrumb');
    if (!breadcrumb) return;
    // Already rendered in HTML
  },

  /* --- Track Page Visit --- */
  trackPageVisit() {
    const page = Utils.getCurrentPage();
    if (!page) return;

    const visited = Utils.getJSON('ai-visited-pages', []);
    if (!visited.includes(page)) {
      visited.push(page);
      Utils.setJSON('ai-visited-pages', visited);
    }
    Utils.setJSON('ai-last-visited', page);
  }
};

document.addEventListener('DOMContentLoaded', () => Navigation.init());
