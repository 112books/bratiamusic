/* ============================================================
   main.js – Bratia Music v2
   Header scroll · Hamburger · Compact nav · Promo ·
   Active nav · Lightbox · Gallery navegació
   ============================================================ */
(function () {
  'use strict';

  /* ── UTILITATS ── */
  const $ = id => document.getElementById(id);
  const $$ = sel => document.querySelectorAll(sel);

  /* ══════════════════════════════════════════════════════════
     HEADER: transparent → sòlid + compact nav en scroll
     ══════════════════════════════════════════════════════════ */
  const header      = $('siteHeader');
  const navCompact  = $('navCompact');
  const isHome      = document.body.classList.contains('is-home');

  // Llegir l'alçada real DESPRÉS que el layout estigui pintat
  let HEADER_H = 132;
  window.addEventListener('load', () => {
    if (header) HEADER_H = header.getBoundingClientRect().height || 132;
  });

  function onScroll() {
    const y = window.scrollY;

    // Header principal: transparent → fosc (home only)
    if (header && isHome) {
      header.classList.toggle('is-scrolled', y > 60);
    }

    // Llindar: quan l'usuari ha passat l'alçada del header
    const showCompact = y > HEADER_H;

    if (navCompact) {
      navCompact.classList.toggle('is-visible', showCompact);
      navCompact.setAttribute('aria-hidden', String(!showCompact));
    }

    // Amagar header original quan el compact és visible (evita superposició)
    if (header) {
      header.classList.toggle('is-hidden', showCompact);
    }
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll(); // estat inicial

  /* ══════════════════════════════════════════════════════════
     HAMBURGER MENU
     ══════════════════════════════════════════════════════════ */
  const toggle  = $('navToggle');
  const nav     = $('mainNav');
  const overlay = $('navOverlay');

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

  toggle  && toggle.addEventListener('click', () =>
    nav.classList.contains('is-open') ? closeNav() : openNav()
  );
  overlay && overlay.addEventListener('click', closeNav);
  nav     && nav.querySelectorAll('a').forEach(a =>
    a.addEventListener('click', () => { if (window.innerWidth < 900) closeNav(); })
  );
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') { closeNav(); closeLightbox(); }
  });

  /* Active nav: marcat via server-side al template Hugo — no cal JS */

  /* ══════════════════════════════════════════════════════════
     PROMO BANNER
     ══════════════════════════════════════════════════════════ */
  const banner   = $('promoBanner');
  const promoBtn = $('promoClose');
  const PKEY     = 'promo-v1';

  if (banner) {
    if (sessionStorage.getItem(PKEY)) {
      banner.remove();
    } else {
      requestAnimationFrame(() => banner.classList.add('is-visible'));
    }
  }
  if (promoBtn && banner) {
    promoBtn.addEventListener('click', () => {
      banner.classList.add('is-hiding');
      banner.addEventListener('transitionend', () => banner.remove(), { once: true });
      sessionStorage.setItem(PKEY, '1');
    });
  }

  /* ══════════════════════════════════════════════════════════
     LIGHTBOX
     ══════════════════════════════════════════════════════════ */
  const lightbox = $('lightbox');
  const lbImg    = $('lbImg');
  const lbCap    = $('lbCap');
  const lbClose  = $('lbClose');
  const lbPrev   = $('lbPrev');
  const lbNext   = $('lbNext');

  let lbItems   = [];   // array de { src, cap } de la galeria activa
  let lbCurrent = 0;

  function openLightbox(items, index) {
    lbItems   = items;
    lbCurrent = index;
    renderLightbox();
    lightbox.hidden = false;
    document.body.style.overflow = 'hidden';
    lbClose.focus();
  }

  function closeLightbox() {
    if (!lightbox) return;
    lightbox.hidden = true;
    document.body.style.overflow = '';
  }

  function renderLightbox() {
    const item = lbItems[lbCurrent];
    lbImg.src = item.src;
    lbImg.alt = item.cap || '';
    lbCap.textContent = item.cap || '';
    lbPrev.style.visibility = lbCurrent > 0 ? 'visible' : 'hidden';
    lbNext.style.visibility = lbCurrent < lbItems.length - 1 ? 'visible' : 'hidden';
  }

  function lbGo(dir) {
    const next = lbCurrent + dir;
    if (next >= 0 && next < lbItems.length) {
      lbCurrent = next;
      renderLightbox();
    }
  }

  lbClose && lbClose.addEventListener('click', closeLightbox);
  lbPrev  && lbPrev.addEventListener('click', () => lbGo(-1));
  lbNext  && lbNext.addEventListener('click', () => lbGo(1));

  // Clic fora de la imatge per tancar
  lightbox && lightbox.addEventListener('click', e => {
    if (e.target === lightbox) closeLightbox();
  });

  // Tecles fletxa
  document.addEventListener('keydown', e => {
    if (lightbox && !lightbox.hidden) {
      if (e.key === 'ArrowLeft')  lbGo(-1);
      if (e.key === 'ArrowRight') lbGo(1);
    }
  });

  // Touch swipe per mòbil
  if (lightbox) {
    let touchStartX = 0;
    lightbox.addEventListener('touchstart', e => { touchStartX = e.touches[0].clientX; }, { passive: true });
    lightbox.addEventListener('touchend',   e => {
      const dx = e.changedTouches[0].clientX - touchStartX;
      if (Math.abs(dx) > 50) lbGo(dx < 0 ? 1 : -1);
    });
  }

  /* ── Inicialitzar botons de galeria ── */
  function initGalleries() {
    $$('.gallery').forEach(gallery => {
      const buttons = Array.from(gallery.querySelectorAll('.gallery__item'));
      const items   = buttons.map(btn => ({
        src: btn.dataset.src,
        cap: btn.dataset.cap || ''
      }));
      buttons.forEach((btn, i) => {
        btn.addEventListener('click', () => openLightbox(items, i));
      });
    });
  }

  initGalleries();

  /* ══════════════════════════════════════════════════════════
     GALLERIES GRID: obrir/tancar galeria individual
     ══════════════════════════════════════════════════════════ */
  $$('[data-open-gallery]').forEach(card => {
    card.addEventListener('click', e => {
      e.preventDefault();
      const id      = card.dataset.openGallery;
      const section = document.getElementById('gallery-' + id);
      if (!section) return;

      // Amagar totes les galeries obertes
      $$('.gallery-section').forEach(s => s.hidden = true);
      // Mostrar la seleccionada
      section.hidden = false;
      section.scrollIntoView({ behavior: 'smooth', block: 'start' });

      // Re-inicialitzar lightbox per a aquesta galeria
      initGalleries();
    });
  });

  $$('.gallery-section__close').forEach(btn => {
    btn.addEventListener('click', () => {
      const section = btn.closest('.gallery-section');
      if (section) section.hidden = true;
    });
  });

})();
