/* ============================================================
   main.js – Bratia Music
   Nav hamburger · Header scroll · Promo banner · Active nav
   ============================================================ */

(function () {
  'use strict';

  /* ── HAMBURGER NAV ── */
  const toggle   = document.getElementById('navToggle');
  const nav      = document.getElementById('mainNav');
  const overlay  = document.getElementById('navOverlay');

  function openNav() {
    nav.classList.add('is-open');
    overlay.classList.add('is-visible');
    toggle.setAttribute('aria-expanded', 'true');
    toggle.setAttribute('aria-label', 'Tancar menú');
    document.body.style.overflow = 'hidden';
  }

  function closeNav() {
    nav.classList.remove('is-open');
    overlay.classList.remove('is-visible');
    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-label', 'Obrir menú');
    document.body.style.overflow = '';
  }

  if (toggle && nav) {
    toggle.addEventListener('click', () => {
      nav.classList.contains('is-open') ? closeNav() : openNav();
    });
  }

  if (overlay) {
    overlay.addEventListener('click', closeNav);
  }

  // Tanca el menú en fer clic a un link de nav (one-page)
  if (nav) {
    nav.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        if (window.innerWidth < 900) closeNav();
      });
    });
  }

  // Tanca menú amb Escape
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && nav && nav.classList.contains('is-open')) closeNav();
  });

  /* ── HEADER: transparent → sòlid en scroll (només home) ── */
  const header  = document.getElementById('siteHeader');
  const isHome  = document.body.classList.contains('is-home');

  function updateHeader() {
    if (!header) return;
    if (isHome) {
      header.classList.toggle('is-scrolled', window.scrollY > 60);
    }
  }

  if (isHome) {
    updateHeader();
    window.addEventListener('scroll', updateHeader, { passive: true });
  }

  /* ── PROMO BANNER ── */
  const banner     = document.getElementById('promoBanner');
  const closeBtn   = document.getElementById('promoClose');
  const PROMO_KEY  = 'promo-dismissed-v1';

  if (banner) {
    // Si ja s'havia tancat, amagar directament
    if (sessionStorage.getItem(PROMO_KEY)) {
      banner.remove();
    } else {
      // Petita animació d'entrada
      requestAnimationFrame(() => banner.classList.add('is-visible'));
    }
  }

  if (closeBtn && banner) {
    closeBtn.addEventListener('click', () => {
      banner.classList.add('is-hiding');
      banner.addEventListener('transitionend', () => banner.remove(), { once: true });
      sessionStorage.setItem(PROMO_KEY, '1');
    });
  }

  /* ── ACTIVE NAV LINK en scroll (one-page) ── */
  const sections  = document.querySelectorAll('section[id]');
  const navLinks  = document.querySelectorAll('.nav-list a');

  if (sections.length && navLinks.length) {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const id = entry.target.id;
          navLinks.forEach(link => {
            link.classList.toggle(
              'is-active',
              link.getAttribute('href').endsWith('#' + id)
            );
          });
        }
      });
    }, { rootMargin: '-40% 0px -55% 0px' });

    sections.forEach(s => observer.observe(s));
  }

})();
