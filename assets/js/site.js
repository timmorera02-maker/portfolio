/* Tim Morera — portfolio. Plain JS, no dependencies. */
(function () {
  'use strict';

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---- Language ---------------------------------------------------------
     The HTML is English. Dutch comes from window.I18N_NL (i18n-nl.js), keyed
     by the English text of each block, so the pages need no extra markup.
     A block is the outermost element that has text of its own. */
  var NL = window.I18N_NL || { text: {}, attr: {}, title: {} };
  var I18N_ATTRS = ['placeholder', 'aria-label', 'alt'];
  var enTitle = document.title;

  function norm(s) { return s.replace(/\s+/g, ' ').trim(); }

  function hasOwnText(el) {
    for (var n = el.firstChild; n; n = n.nextSibling) {
      if (n.nodeType === 3 && n.nodeValue.trim()) return true;
    }
    return false;
  }

  var i18nBlocks = [];
  Array.prototype.forEach.call(document.body.querySelectorAll('*'), function (el) {
    if (el.tagName === 'SCRIPT' || el.tagName === 'STYLE' || !hasOwnText(el)) return;
    var last = i18nBlocks[i18nBlocks.length - 1];
    if (last && last.el.contains(el)) return;
    i18nBlocks.push({ el: el, en: el.innerHTML, nl: NL.text[norm(el.innerHTML)] });
  });

  var i18nAttrs = [];
  Array.prototype.forEach.call(document.querySelectorAll('[placeholder],[aria-label],[alt]'), function (el) {
    I18N_ATTRS.forEach(function (a) {
      var v = el.getAttribute(a);
      if (v && NL.attr[v]) i18nAttrs.push({ el: el, name: a, en: v, nl: NL.attr[v] });
    });
  });
  Array.prototype.forEach.call(document.querySelectorAll('[data-nl-href]'), function (el) {
    i18nAttrs.push({ el: el, name: 'href', en: el.getAttribute('href'), nl: el.getAttribute('data-nl-href') });
  });

  function setLang(lang) {
    var nl = lang === 'nl';
    i18nBlocks.forEach(function (b) {
      var want = nl && b.nl ? b.nl : b.en;
      if (b.el.innerHTML !== want) b.el.innerHTML = want;
    });
    i18nAttrs.forEach(function (a) { a.el.setAttribute(a.name, nl ? a.nl : a.en); });
    document.title = nl && NL.title[enTitle] ? NL.title[enTitle] : enTitle;
    document.documentElement.lang = nl ? 'nl' : 'en';
    Array.prototype.forEach.call(document.querySelectorAll('.lang [data-lang]'), function (btn) {
      btn.setAttribute('aria-pressed', String(btn.getAttribute('data-lang') === lang));
    });
  }

  var lang = null;
  try { lang = localStorage.getItem('lang'); } catch (e) {}
  if (lang !== 'nl' && lang !== 'en') lang = /^nl/i.test(navigator.language || '') ? 'nl' : 'en';
  setLang(lang);
  document.documentElement.classList.remove('i18n-wait');

  Array.prototype.forEach.call(document.querySelectorAll('.lang [data-lang]'), function (btn) {
    btn.addEventListener('click', function () {
      var l = btn.getAttribute('data-lang');
      try { localStorage.setItem('lang', l); } catch (e) {}
      setLang(l);
    });
  });

  /* ---- Year ------------------------------------------------------------ */
  var year = document.getElementById('year');
  if (year) year.textContent = new Date().getFullYear();

  /* ---- Mobile nav ------------------------------------------------------ */
  var toggle = document.querySelector('.nav-toggle');
  var links = document.getElementById('nav-links');

  function closeNav() {
    if (!toggle || !links) return;
    toggle.setAttribute('aria-expanded', 'false');
    links.classList.remove('is-open');
  }

  if (toggle && links) {
    toggle.addEventListener('click', function () {
      var open = toggle.getAttribute('aria-expanded') === 'true';
      toggle.setAttribute('aria-expanded', String(!open));
      links.classList.toggle('is-open', !open);
    });
    links.addEventListener('click', function (e) {
      if (e.target.closest('a')) closeNav();
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeNav();
    });
  }

  /* ---- Header border once scrolled ------------------------------------- */
  var header = document.querySelector('.site-header');
  if (header) {
    var onScroll = function () {
      header.classList.toggle('is-stuck', window.scrollY > 8);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  /* ---- Reveal on scroll ------------------------------------------------ */
  var revealables = document.querySelectorAll('.reveal');

  if (reduced || !('IntersectionObserver' in window)) {
    Array.prototype.forEach.call(revealables, function (el) { el.classList.add('is-in'); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-in');
          io.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });

    Array.prototype.forEach.call(revealables, function (el) { io.observe(el); });
  }

  /* ---- Active section in the nav --------------------------------------- */
  var navAnchors = document.querySelectorAll('.nav-links a[href^="#"]');
  var sections = [];
  Array.prototype.forEach.call(navAnchors, function (a) {
    var el = document.querySelector(a.getAttribute('href'));
    if (el) sections.push({ a: a, el: el });
  });

  if (sections.length && 'IntersectionObserver' in window) {
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        var match = sections.filter(function (s) { return s.el === entry.target; })[0];
        if (match && entry.isIntersecting) {
          sections.forEach(function (s) { s.a.classList.remove('is-active'); });
          match.a.classList.add('is-active');
        }
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    sections.forEach(function (s) { spy.observe(s.el); });
  }

  /* ---- Explorations lightbox ------------------------------------------- */
  var box = document.getElementById('lightbox');
  var boxImg = document.getElementById('lightbox-img');
  var boxCap = document.getElementById('lightbox-cap');
  var lastFocus = null;

  function openBox(img, caption) {
    if (!box || !boxImg) return;
    boxImg.src = img.currentSrc || img.src;
    boxImg.alt = img.alt || '';
    if (boxCap) boxCap.textContent = caption || '';
    lastFocus = document.activeElement;
    box.hidden = false;
    // next frame, so the transition runs
    requestAnimationFrame(function () { box.classList.add('is-open'); });
    var closeBtn = box.querySelector('.lightbox-close');
    if (closeBtn) closeBtn.focus();
    document.body.style.overflow = 'hidden';
  }

  function closeBox() {
    if (!box) return;
    box.classList.remove('is-open');
    document.body.style.overflow = '';
    window.setTimeout(function () {
      box.hidden = true;
      if (boxImg) boxImg.src = '';
    }, reduced ? 0 : 260);
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  /* ---- Exploration sheets: a tile with data-sheet opens its write-up ---- */
  var openSheetEl = null;

  function openSheet(sheet) {
    lastFocus = document.activeElement;
    openSheetEl = sheet;
    sheet.hidden = false;
    sheet.querySelector('.sheet-panel').scrollTop = 0;
    requestAnimationFrame(function () { sheet.classList.add('is-open'); });
    sheet.querySelector('.sheet-close').focus();
    document.body.style.overflow = 'hidden';
  }

  function closeSheet() {
    var sheet = openSheetEl;
    if (!sheet) return;
    openSheetEl = null;
    sheet.classList.remove('is-open');
    document.body.style.overflow = '';
    window.setTimeout(function () { sheet.hidden = true; }, reduced ? 0 : 260);
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  Array.prototype.forEach.call(document.querySelectorAll('.sheet'), function (sheet) {
    sheet.addEventListener('click', function (e) {
      if (e.target === sheet || e.target.closest('.sheet-close')) closeSheet();
    });
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && openSheetEl) closeSheet();
  });

  Array.prototype.forEach.call(document.querySelectorAll('.expl'), function (fig) {
    var img = fig.querySelector('img');
    if (!img) return;
    var cap = fig.querySelector('figcaption');
    var sheet = fig.dataset.sheet && document.getElementById(fig.dataset.sheet);
    var open = sheet
      ? function () { openSheet(sheet); }
      : function () { openBox(img, cap ? cap.textContent : ''); };
    fig.setAttribute('tabindex', '0');
    fig.setAttribute('role', 'button');
    fig.setAttribute('aria-label', (sheet ? 'Open: ' : 'Enlarge: ') + (cap ? cap.textContent : img.alt));
    fig.style.cursor = sheet ? 'pointer' : 'zoom-in';
    fig.addEventListener('click', open);
    fig.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        open();
      }
    });
  });

  if (box) {
    box.addEventListener('click', function (e) {
      if (e.target === box || e.target.closest('.lightbox-close')) closeBox();
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && !box.hidden) closeBox();
    });
  }
})();
