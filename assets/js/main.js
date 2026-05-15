/* Axell, étude pivot ICP, runtime UI commun (nav inject, accordion, tabs, reveal). */

(function () {
  'use strict';

  const $  = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  const NAV_ITEMS = [
    { label: 'Accueil',     href: 'index.html',           page: 'index' },
    { label: 'Synthèse',    href: 'pages/synthese.html',  page: 'synthese' },
    { label: 'Offre',       href: 'pages/offre.html',     page: 'offre' },
    { label: 'Personas',    href: 'pages/personas.html',  page: 'personas' },
    { label: 'Marché',      href: 'pages/marche.html',    page: 'marche' },
    { label: 'Concurrence', href: 'pages/concurrence.html', page: 'concurrence' },
    { label: 'Pricing',     href: 'pages/pricing.html',   page: 'pricing' },
    { label: 'Viabilité',   href: 'pages/viabilite.html', page: 'viabilite' },
    { label: 'Découverte',  href: 'pages/decouverte.html', page: 'decouverte' },
  ];

  function isInPages() { return /\/pages\//.test(window.location.pathname); }
  function pathTo(href) { return isInPages() ? '../' + href : href; }
  function brandHref() { return pathTo('index.html'); }

  function injectHeader() {
    const host = document.getElementById('site-header');
    if (!host) return;
    const currentPage = document.body.dataset.page || '';

    const linksHtml = NAV_ITEMS.map(item =>
      `<a class="nav__link${item.page === currentPage ? ' is-active' : ''}" href="${pathTo(item.href)}">${item.label}</a>`
    ).join('') + `<a class="nav__logout" href="#" data-action="logout" aria-label="Se déconnecter">Déconnexion</a>`;

    host.innerHTML = `
      <div class="container nav__inner">
        <a class="nav__brand" href="${brandHref()}" aria-label="Accueil"><span>Axell</span></a>
        <button class="nav__hamburger" type="button" aria-label="Menu" aria-expanded="false">
          <span></span><span></span><span></span>
        </button>
        <nav class="nav__links" aria-label="Navigation principale">${linksHtml}</nav>
      </div>
    `;
    host.classList.add('nav');
    host.hidden = false;
  }

  function injectFooter() {
    const host = document.getElementById('site-footer');
    if (!host) return;
    host.classList.add('footer');
    host.innerHTML = `
      <div class="container footer__inner">
        <div>
          <div class="footer__brand">Axell</div>
          <div>Axell, étude pivot setter/closer, document interne Uccello Labs</div>
        </div>
        <div class="footer__right">
          <div>Document interne, ne pas diffuser hors équipe Uccello Labs</div>
          <div>Généré le 15 mai 2026</div>
          <div>Variante produit : Axell V1 (en prod) puis V2 (refonte Hub post-août 2026)</div>
        </div>
      </div>
    `;
    host.hidden = false;
  }

  function setupHamburger() {
    const burger = $('.nav__hamburger');
    const links = $('.nav__links');
    if (!burger || !links) return;
    burger.addEventListener('click', () => {
      const expanded = burger.getAttribute('aria-expanded') === 'true';
      burger.setAttribute('aria-expanded', String(!expanded));
      links.classList.toggle('is-open', !expanded);
    });
    links.addEventListener('click', (e) => {
      const target = e.target;
      if (!(target instanceof HTMLElement)) return;
      if (target.classList.contains('nav__link') || target.classList.contains('nav__logout')) {
        burger.setAttribute('aria-expanded', 'false');
        links.classList.remove('is-open');
      }
      if (target.dataset.action === 'logout') {
        e.preventDefault();
        if (window.AxellAuth) window.AxellAuth.logout();
      }
    });
  }

  function setupScrollNav() {
    const nav = $('#site-header');
    if (!nav) return;
    let ticking = false;
    function update() {
      if (window.scrollY > 8) nav.classList.add('is-scrolled');
      else nav.classList.remove('is-scrolled');
      ticking = false;
    }
    window.addEventListener('scroll', () => {
      if (!ticking) { window.requestAnimationFrame(update); ticking = true; }
    }, { passive: true });
    update();
  }

  function setupAccordions() {
    $$('.accordion__trigger').forEach(btn => {
      btn.addEventListener('click', () => {
        const expanded = btn.getAttribute('aria-expanded') === 'true';
        btn.setAttribute('aria-expanded', String(!expanded));
        const body = btn.nextElementSibling;
        if (!body) return;
        if (!expanded) body.style.maxHeight = body.scrollHeight + 'px';
        else body.style.maxHeight = '0';
      });
    });
  }

  function setupTabs() {
    $$('.tabs').forEach(tabsRoot => {
      const triggers = $$('.tabs__trigger', tabsRoot);
      const panels   = $$('.tabs__panel', tabsRoot);
      if (!triggers.length) return;

      function activate(panelId, push = true) {
        triggers.forEach(t => {
          const isActive = t.dataset.target === panelId;
          t.setAttribute('aria-selected', String(isActive));
          t.tabIndex = isActive ? 0 : -1;
        });
        panels.forEach(p => p.classList.toggle('is-active', p.id === panelId));
        if (push && history.replaceState) {
          history.replaceState(null, '', '#' + panelId);
        }
      }

      triggers.forEach(t => {
        t.addEventListener('click', () => activate(t.dataset.target));
        t.addEventListener('keydown', (e) => {
          if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
          e.preventDefault();
          const idx = triggers.indexOf(t);
          const next = e.key === 'ArrowRight' ? (idx + 1) % triggers.length : (idx - 1 + triggers.length) % triggers.length;
          triggers[next].focus();
          activate(triggers[next].dataset.target);
        });
      });

      // Initial state : URL hash → first trigger
      const hash = window.location.hash.replace(/^#/, '');
      const initial = hash && triggers.find(t => t.dataset.target === hash);
      activate(initial ? hash : triggers[0].dataset.target, false);
    });
  }

  function setupReveal() {
    if (!('IntersectionObserver' in window)) {
      $$('.reveal, .reveal-stagger').forEach(el => el.classList.add('is-visible'));
      return;
    }
    const obs = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add('is-visible');
          obs.unobserve(e.target);
        }
      });
    }, { rootMargin: '0px 0px -10% 0px', threshold: 0.05 });
    $$('.reveal, .reveal-stagger').forEach(el => obs.observe(el));
  }

  function setStaggerIndices() {
    $$('.reveal-stagger').forEach(parent => {
      Array.from(parent.children).forEach((child, i) => {
        child.style.setProperty('--stagger-index', String(i));
      });
    });
  }

  function init() {
    if (window.AxellAuth && !window.AxellAuth.gate()) return;
    injectHeader();
    injectFooter();
    setupHamburger();
    setupScrollNav();
    setupAccordions();
    setupTabs();
    setStaggerIndices();
    setupReveal();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
