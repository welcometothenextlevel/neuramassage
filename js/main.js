/* NEURA Method — site behaviour */
(function () {
  'use strict';

  var WA_NUMBER = '41798382978';
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var esc = function (s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };

  /* ---------- Header + dock ---------- */
  var header = $('.site-header');
  var dock = $('.dock');
  function onScroll() {
    var y = window.scrollY;
    header.classList.toggle('scrolled', y > 8);
    if (dock) dock.classList.toggle('show', y > window.innerHeight * 0.55);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- Mobile menu ---------- */
  var menuBtn = $('.menu-btn');
  var menu = $('#mobile-menu');
  function setMenu(open) {
    menu.hidden = !open;
    document.body.classList.toggle('menu-open', open);
    menuBtn.setAttribute('aria-expanded', String(open));
    menuBtn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    menuBtn.innerHTML = '<svg class="ic"><use href="#' + (open ? 'i-close' : 'i-menu') + '"/></svg>';
  }
  menuBtn.addEventListener('click', function () { setMenu(menu.hidden); });
  $$('a', menu).forEach(function (a) { a.addEventListener('click', function () { setMenu(false); }); });

  /* ---------- Live status (Swiss time) ---------- */
  (function () {
    var el = $('[data-status]');
    if (!el) return;
    try {
      var parts = new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Zurich', hour: '2-digit', hour12: false }).formatToParts(new Date());
      var h = parseInt(parts.filter(function (p) { return p.type === 'hour'; })[0].value, 10);
      var text;
      if (h >= 10 && h < 20) { text = 'Open today until 20:00 · Geneva & Bern'; }
      else if (h < 10) { text = 'Home visits today from 10:00 · Geneva & Bern'; el.classList.add('closed'); }
      else { text = 'Home visits tomorrow from 10:00 · message any time'; el.classList.add('closed'); }
      $('.status-text', el).textContent = text;
    } catch (e) { /* keep default text */ }
  })();

  /* ---------- Reviews marquee ---------- */
  var REVIEWS = window.NEURA_REVIEWS || [];
  var LANG = { EN: 'English', FR: 'Français', RU: 'Русский', UA: 'Українська', IT: 'Italiano', ES: 'Español' };
  var STARS = '<span class="stars" aria-label="5 out of 5 stars">' + new Array(6).join('<svg aria-hidden="true"><use href="#i-star"/></svg>') + '</span>';
  function initials(n) {
    var p = n.trim().split(/\s+/);
    return (p[0][0] + (p[1] ? p[1][0] : '')).toUpperCase();
  }
  function cardHTML(r, i, dup) {
    var tab = dup ? ' tabindex="-1"' : '';
    return '<article class="rcard"' + (dup ? ' aria-hidden="true"' : '') + '>' +
      '<div class="rc-top">' + STARS + '<span class="rc-lang" title="' + LANG[r.l] + '">' + r.l + '</span></div>' +
      '<p class="rc-text" lang="' + ({ UA: 'uk' }[r.l] || r.l.toLowerCase()) + '">' + esc(r.x) + '</p>' +
      '<button class="rc-more" type="button" data-review="' + i + '"' + tab + ' hidden>Read the full review</button>' +
      '<div class="rc-foot"><span class="rc-av" aria-hidden="true">' + esc(initials(r.n)) + '</span>' +
      '<span class="rc-name">' + esc(r.n) + '<span class="rc-sub">' + esc(r.s) + '</span></span>' +
      '<span class="rc-verified"><svg class="ic" aria-hidden="true"><use href="#i-check"/></svg>Fresha</span></div>' +
      '</article>';
  }
  (function () {
    var rows = $$('.marquee-row');
    if (!rows.length || !REVIEWS.length) return;
    var sets = [[], []];
    REVIEWS.forEach(function (r, i) { sets[i % 2].push(i); });
    rows.forEach(function (row, k) {
      var track = $('.marquee-track', row);
      var html = sets[k].map(function (i) { return cardHTML(REVIEWS[i], i, false); }).join('');
      var dupe = reduced ? '' : sets[k].map(function (i) { return cardHTML(REVIEWS[i], i, true); }).join('');
      track.innerHTML = html + dupe;
    });
    function sizeUp() {
      $$('.rcard').forEach(function (c) {
        var t = $('.rc-text', c), b = $('.rc-more', c);
        b.hidden = !(t.scrollHeight > t.clientHeight + 2);
      });
      rows.forEach(function (row) {
        var track = $('.marquee-track', row);
        var half = track.scrollWidth / 2;
        track.style.setProperty('--dur', Math.max(60, Math.round(half / 34)) + 's');
      });
    }
    sizeUp();
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(sizeUp);
    var rt; window.addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(sizeUp, 200); });
  })();

  /* ---------- Modal helpers ---------- */
  var lastFocus = null;
  function openModal(m) {
    lastFocus = document.activeElement;
    m.hidden = false;
    m.classList.add('is-open');
    document.body.classList.add('modal-open');
    var c = $('.modal-close', m); if (c) c.focus({ preventScroll: true });
  }
  function closeModal(m) {
    m.classList.remove('is-open');
    m.hidden = true;
    document.body.classList.remove('modal-open');
    if (lastFocus && lastFocus.focus) lastFocus.focus({ preventScroll: true });
  }
  function trapTab(e, m) {
    var f = $$('button:not([hidden]), a[href], [tabindex]:not([tabindex="-1"])', m).filter(function (el) { return el.offsetParent !== null; });
    if (!f.length) return;
    var first = f[0], last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }

  /* ---------- Review modal ---------- */
  var rModal = $('#review-modal');
  var rIndex = 0;
  function showReview(i) {
    rIndex = (i + REVIEWS.length) % REVIEWS.length;
    var r = REVIEWS[rIndex];
    $('.rm-body', rModal).innerHTML = STARS +
      '<p class="rm-text" lang="' + ({ UA: 'uk' }[r.l] || r.l.toLowerCase()) + '">' + esc(r.x) + '</p>' +
      '<div class="rm-who"><span class="rc-av" aria-hidden="true">' + esc(initials(r.n)) + '</span>' +
      '<span class="rc-name">' + esc(r.n) + '<span class="rc-sub">' + esc(r.s) + ' · verified on Fresha · ' + LANG[r.l] + '</span></span></div>';
    $('.rm-count', rModal).textContent = (rIndex + 1) + ' / ' + REVIEWS.length;
  }
  document.addEventListener('click', function (e) {
    var b = e.target.closest('[data-review]');
    if (b) { showReview(parseInt(b.getAttribute('data-review'), 10)); openModal(rModal); }
  });
  $$('[data-rstep]', rModal).forEach(function (b) {
    b.addEventListener('click', function () { showReview(rIndex + parseInt(b.getAttribute('data-rstep'), 10)); });
  });
  $$('[data-close]', rModal).forEach(function (b) { b.addEventListener('click', function () { closeModal(rModal); }); });

  /* ---------- Reels ---------- */
  var REELS = [
    { id: 'meet-vlad', title: 'Meet Vlad', kind: 'Introduction, in his words', dur: '0:52' },
    { id: 'client-review', title: 'A client, in her own words', kind: 'Video review', dur: '1:41' },
    { id: 'setup', title: 'What arrives at your door', kind: 'The set-up in a client’s home', dur: '0:47', ratio: '45' },
    { id: 'home-session', title: 'From folded table to fireplace', kind: 'A home visit, start to finish', dur: '0:32' },
    { id: 'rest', title: 'Rest', kind: 'The NEURA Method', dur: '0:21' },
    { id: 'method-motion', title: 'The method in motion', kind: 'Session footage', dur: '0:26' },
    { id: 'neck-shoulders', title: 'Neck and shoulders', kind: 'Session footage', dur: '0:45' },
    { id: 'step-by-step', title: 'Step by step', kind: 'Session footage', dur: '0:13' }
  ];
  var reelsEl = $('[data-reels]');
  if (reelsEl) {
    reelsEl.innerHTML = REELS.map(function (r, i) {
      return '<button class="reel" type="button" data-reel="' + i + '" aria-label="Play video: ' + esc(r.title) + ' (' + r.dur + ')">' +
        '<span class="reel-media"><img src="img/poster-' + r.id + '.webp" alt="" loading="lazy" width="540" height="' + (r.ratio === '45' ? 675 : 960) + '">' +
        '<span class="reel-play" aria-hidden="true"><svg class="ic"><use href="#i-play"/></svg></span>' +
        '<span class="reel-dur" aria-hidden="true">' + r.dur + '</span></span>' +
        '<span class="reel-title">' + esc(r.title) + '</span><span class="reel-kind">' + esc(r.kind) + '</span></button>';
    }).join('');

    if (finePointer && !reduced) {
      $$('.reel', reelsEl).forEach(function (card) {
        var v = null;
        card.addEventListener('pointerenter', function () {
          if (!v) {
            v = document.createElement('video');
            v.muted = true; v.loop = true; v.playsInline = true; v.preload = 'auto';
            v.setAttribute('aria-hidden', 'true');
            v.src = 'video/' + REELS[+card.getAttribute('data-reel')].id + '.mp4';
            v.addEventListener('playing', function () { card.classList.add('previewing'); });
            $('.reel-media', card).insertBefore(v, $('.reel-play', card));
          }
          var p = v.play(); if (p && p.catch) p.catch(function () {});
        });
        card.addEventListener('pointerleave', function () {
          if (v) { v.pause(); card.classList.remove('previewing'); }
        });
      });
    }

    $$('[data-scroll]').forEach(function (b) {
      b.addEventListener('click', function () {
        reelsEl.scrollBy({ left: parseInt(b.getAttribute('data-scroll'), 10) * reelsEl.clientWidth * 0.75, behavior: reduced ? 'auto' : 'smooth' });
      });
    });
    var navBtns = $$('[data-scroll]');
    function navState() {
      if (navBtns.length < 2) return;
      navBtns[0].disabled = reelsEl.scrollLeft < 8;
      navBtns[1].disabled = reelsEl.scrollLeft + reelsEl.clientWidth > reelsEl.scrollWidth - 8;
    }
    reelsEl.addEventListener('scroll', navState, { passive: true });
    navState();
  }

  /* ---------- Video player modal ---------- */
  var player = $('#player');
  var pv = $('video', player);
  var pIndex = 0, raf = 0;
  var bar = $('.pl-progress span', player);
  function tick() {
    if (pv.duration) bar.style.transform = 'scaleX(' + (pv.currentTime / pv.duration) + ')';
    raf = requestAnimationFrame(tick);
  }
  function loadReel(i) {
    pIndex = (i + REELS.length) % REELS.length;
    var r = REELS[pIndex];
    player.classList.toggle('landscape-45', r.ratio === '45');
    pv.poster = 'img/poster-' + r.id + '.webp';
    pv.src = 'video/' + r.id + '.mp4';
    $('.pl-title', player).innerHTML = esc(r.title) + '<small>' + esc(r.kind) + ' · ' + r.dur + '</small>';
    bar.style.transform = 'scaleX(0)';
    var p = pv.play();
    if (p && p.catch) p.catch(function () {
      pv.muted = true; player.classList.add('muted');
      var q = pv.play(); if (q && q.catch) q.catch(function () {});
    });
  }
  function openReel(i) {
    pv.muted = false; player.classList.remove('muted');
    openModal(player);
    loadReel(i);
    cancelAnimationFrame(raf); raf = requestAnimationFrame(tick);
  }
  function closePlayer() {
    pv.pause(); pv.removeAttribute('src'); pv.load();
    cancelAnimationFrame(raf);
    closeModal(player);
  }
  pv.addEventListener('play', function () { player.classList.add('playing'); });
  pv.addEventListener('pause', function () { player.classList.remove('playing'); });
  pv.addEventListener('ended', function () { loadReel(pIndex + 1); });
  $('.pl-toggle', player).addEventListener('click', function () { if (pv.paused) pv.play(); else pv.pause(); });
  $('.pl-sound', player).addEventListener('click', function () {
    pv.muted = !pv.muted; player.classList.toggle('muted', pv.muted);
  });
  $('.pl-bar', player).addEventListener('click', function (e) {
    var rect = this.getBoundingClientRect();
    if (pv.duration) pv.currentTime = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width)) * pv.duration;
  });
  $$('[data-step]', player).forEach(function (b) {
    b.addEventListener('click', function () { loadReel(pIndex + parseInt(b.getAttribute('data-step'), 10)); });
  });
  $$('[data-close]', player).forEach(function (b) { b.addEventListener('click', closePlayer); });
  document.addEventListener('click', function (e) {
    var r = e.target.closest('[data-reel]');
    if (r) { openReel(parseInt(r.getAttribute('data-reel'), 10)); return; }
    var o = e.target.closest('[data-open-reel]');
    if (o) {
      var id = o.getAttribute('data-open-reel');
      for (var k = 0; k < REELS.length; k++) if (REELS[k].id === id) openReel(k);
    }
  });

  /* ---------- Keyboard for modals + menu ---------- */
  document.addEventListener('keydown', function (e) {
    var open = !player.hidden ? player : (!rModal.hidden ? rModal : null);
    if (e.key === 'Escape') {
      if (open === player) closePlayer();
      else if (open) closeModal(open);
      else if (!menu.hidden) setMenu(false);
      return;
    }
    if (!open) return;
    if (e.key === 'Tab') trapTab(e, open);
    if (e.key === 'ArrowRight') { if (open === player) loadReel(pIndex + 1); else showReview(rIndex + 1); }
    if (e.key === 'ArrowLeft') { if (open === player) loadReel(pIndex - 1); else showReview(rIndex - 1); }
    if (open === player && e.key === ' ' && !e.target.closest('button')) { e.preventDefault(); if (pv.paused) pv.play(); else pv.pause(); }
  });

  /* ---------- In-page videos play only while visible ---------- */
  if ('IntersectionObserver' in window) {
    var vio = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        var v = en.target;
        if (en.isIntersecting) {
          if (v.preload === 'none') v.preload = 'auto';
          var p = v.play(); if (p && p.catch) p.catch(function () {});
        } else { v.pause(); }
      });
    }, { rootMargin: '120px 0px' });
    $$('.hero-video video, video[data-autoplay]').forEach(function (v) { v.muted = true; vio.observe(v); });
  }

  /* ---------- Booking form → WhatsApp ---------- */
  var form = $('#book-form');
  if (form) {
    var dateInput = form.elements.date;
    try {
      var today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Zurich' }).format(new Date());
      dateInput.min = today;
    } catch (e) {}
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var name = form.elements.name.value.trim();
      var area = form.elements.area.value;
      var err = $('.bf-error', form);
      form.elements.name.closest('.field').classList.toggle('invalid', !name);
      form.elements.area.closest('.field').classList.toggle('invalid', !area);
      if (!name || !area) { err.hidden = false; (name ? form.elements.area : form.elements.name).focus(); return; }
      err.hidden = true;
      var service = (form.querySelector('input[name=service]:checked') || {}).value || 'NEURA Method';
      var date = dateInput.value;
      var nice = '';
      if (date) {
        try { nice = new Date(date + 'T12:00:00').toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' }); }
        catch (x) { nice = date; }
      }
      var time = form.elements.time.value;
      var notes = form.elements.notes.value.trim();
      var lines = [
        'Hello Vlad, I’d like to book a session.',
        '',
        'Session: ' + service,
        'Name: ' + name,
        'Area: ' + area
      ];
      if (nice) lines.push('Preferred date: ' + nice);
      lines.push('Time of day: ' + (time || 'flexible'));
      if (notes) lines.push('Notes: ' + notes);
      var url = 'https://wa.me/' + WA_NUMBER + '?text=' + encodeURIComponent(lines.join('\n'));
      var w = window.open(url, '_blank', 'noopener');
      if (!w) window.location.href = url;
    });
  }

  /* ---------- Year ---------- */
  var y = $('[data-year]'); if (y) y.textContent = new Date().getFullYear();

  /* ---------- Scroll reveals (GSAP ScrollTrigger) ---------- */
  if (!reduced && window.gsap && window.ScrollTrigger) {
    gsap.registerPlugin(ScrollTrigger);
    var vh = window.innerHeight;
    var inView = function (el) { return el.getBoundingClientRect().top < vh * 0.92; };

    $$('[data-reveal]').forEach(function (el) {
      if (inView(el)) return;
      gsap.from(el, { y: 36, autoAlpha: 0, duration: 1.1, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 90%', once: true } });
    });
    $$('[data-reveal-group]').forEach(function (g) {
      var kids = Array.prototype.slice.call(g.children).filter(function (k) { return !inView(k); });
      if (!kids.length) return;
      gsap.from(kids, { y: 32, autoAlpha: 0, duration: 1, ease: 'power3.out', stagger: 0.09, scrollTrigger: { trigger: g, start: 'top 88%', once: true } });
    });
    $$('[data-parallax-wrap]').forEach(function (w) {
      var img = $('[data-parallax]', w);
      if (!img) return;
      gsap.fromTo(img, { yPercent: 0 }, { yPercent: -10, ease: 'none', scrollTrigger: { trigger: w, start: 'top bottom', end: 'bottom top', scrub: true } });
    });
    var tl = $('[data-timeline]');
    if (tl && !inView(tl)) {
      gsap.from($$('.seg', tl), { scaleX: 0, duration: 1.1, ease: 'power3.inOut', stagger: 0.12, scrollTrigger: { trigger: tl, start: 'top 80%', once: true } });
    }

    /* Failsafe: anything on screen that is still hidden and not animating gets shown. */
    var fsTimer;
    var failsafe = function () {
      $$('[data-reveal], [data-reveal-group] > *, .seg').forEach(function (el) {
        var r = el.getBoundingClientRect();
        if (r.top < window.innerHeight && r.bottom > 0 && !gsap.isTweening(el)) {
          var cs = getComputedStyle(el);
          if (parseFloat(cs.opacity) < 0.05 || cs.visibility === 'hidden' || /matrix\(0,/.test(cs.transform)) {
            gsap.set(el, { autoAlpha: 1, y: 0, scaleX: 1 });
          }
        }
      });
    };
    window.addEventListener('scroll', function () { clearTimeout(fsTimer); fsTimer = setTimeout(failsafe, 900); }, { passive: true });
    window.addEventListener('load', function () { ScrollTrigger.refresh(); setTimeout(failsafe, 1500); });
  }
})();
