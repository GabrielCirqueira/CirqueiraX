(() => {
  'use strict';

  const KEY = 'ytms';
  const LIMITS = { left: [220, 520], right: [260, 560] };

  const PINNED = new Set(['LM']);

  const STR = {
    pt: {
      lib: 'Sua biblioteca', sortTitle: 'Ordenar playlists', sortRecent: 'Recentes (padrão)', sortName: 'Nome (A–Z)', sortPlayed: 'Última tocada', sortCustom: 'Personalizada',
      searchLib: 'Buscar na biblioteca', searchLibTitle: 'Buscar na biblioteca (Alt+F)',
      playerBtn: 'Vídeo, letra e comentários (Alt+P)', playerBtnAria: 'Abrir ou fechar o player com vídeo, letra e comentários',
      panelBtn: 'Mostrar/ocultar "Tocando agora" (Alt+R)', panelBtnAria: 'Mostrar ou ocultar o painel Tocando agora',
      nowPlaying: 'Tocando agora', like: 'Curtir', unlike: 'Remover das curtidas', about: 'Sobre esta faixa', openQueue: 'Abrir fila', upNext: 'A seguir', queueEmpty: 'Nada na fila por enquanto.',
      views: 'Visualizações', likes: 'Curtidas', duration: 'Duração', year: 'Ano', album: 'Álbum',
      panelHidden: 'Painel "Tocando agora" oculto', panelShown: 'Painel "Tocando agora" visível', liked: 'Adicionada às músicas que você gostou', unliked: 'Removida das curtidas',
      home: 'Início', volume: 'Volume', sortBy: 'Ordenar por: ', mixTitle: 'Músicas e vídeos', song: 'Música', video: 'Vídeo', playPause: 'Tocar / pausar', trackTitle: 'Título', trackDuration: 'Duração', loading: 'Carregando',
    },
    en: {
      lib: 'Your library', sortTitle: 'Sort playlists', sortRecent: 'Recents (default)', sortName: 'Name (A–Z)', sortPlayed: 'Last played', sortCustom: 'Custom',
      searchLib: 'Search your library', searchLibTitle: 'Search your library (Alt+F)',
      playerBtn: 'Video, lyrics and comments (Alt+P)', playerBtnAria: 'Open or close the player with video, lyrics and comments',
      panelBtn: 'Show/hide "Now playing" (Alt+R)', panelBtnAria: 'Show or hide the Now playing panel',
      nowPlaying: 'Now playing', like: 'Like', unlike: 'Remove like', about: 'About this track', openQueue: 'Open queue', upNext: 'Up next', queueEmpty: 'Nothing in the queue yet.',
      views: 'Views', likes: 'Likes', duration: 'Length', year: 'Year', album: 'Album',
      panelHidden: '"Now playing" panel hidden', panelShown: '"Now playing" panel shown', liked: 'Added to your liked songs', unliked: 'Removed from your liked songs',
      home: 'Home', volume: 'Volume', sortBy: 'Sort by: ', mixTitle: 'Songs and videos', song: 'Song', video: 'Video', playPause: 'Play / pause', trackTitle: 'Title', trackDuration: 'Duration', loading: 'Loading',
    },
    es: {
      lib: 'Tu biblioteca', sortTitle: 'Ordenar listas', sortRecent: 'Recientes (predeterminado)', sortName: 'Nombre (A–Z)', sortPlayed: 'Última reproducida', sortCustom: 'Personalizada',
      searchLib: 'Buscar en la biblioteca', searchLibTitle: 'Buscar en la biblioteca (Alt+F)',
      playerBtn: 'Vídeo, letra y comentarios (Alt+P)', playerBtnAria: 'Abrir o cerrar el reproductor con vídeo, letra y comentarios',
      panelBtn: 'Mostrar/ocultar "Reproduciendo" (Alt+R)', panelBtnAria: 'Mostrar u ocultar el panel Reproduciendo',
      nowPlaying: 'Reproduciendo', like: 'Me gusta', unlike: 'Quitar me gusta', about: 'Sobre esta canción', openQueue: 'Abrir cola', upNext: 'A continuación', queueEmpty: 'No hay nada en la cola.',
      views: 'Reproducciones', likes: 'Me gusta', duration: 'Duración', year: 'Año', album: 'Álbum',
      panelHidden: 'Panel "Reproduciendo" oculto', panelShown: 'Panel "Reproduciendo" visible', liked: 'Añadida a tus canciones que te gustan', unliked: 'Quitada de tus canciones que te gustan',
      home: 'Inicio', volume: 'Volumen', sortBy: 'Ordenar por: ', mixTitle: 'Canciones y vídeos', song: 'Canción', video: 'Vídeo', playPause: 'Reproducir / pausar', trackTitle: 'Título', trackDuration: 'Duración', loading: 'Cargando',
    },
  };
  const LANG = (() => {
    const l = String(document.documentElement.lang || (navigator.language || 'en')).toLowerCase();
    return l.startsWith('pt') ? 'pt' : l.startsWith('es') ? 'es' : 'en';
  })();
  const t = (k) => (STR[LANG] && STR[LANG][k]) || STR.en[k] || k;

  const DEFAULTS = { leftWidth: 256, rightWidth: 312, sortMode: 'recent', customOrder: [], playedAt: {}, rightHidden: false };
  let state = { ...DEFAULTS };

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const clamp = (v, [min, max]) => Math.max(min, Math.min(max, v));
  const debounce = (fn, ms) => { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; };

  const hasStorage = typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local;
  function loadLocal() {
    try {
      const raw = localStorage.getItem(KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  }
  function saveLocal() {
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
    } catch (e) {}
  }
  function load() {
    const localData = loadLocal();
    if (localData) state = { ...DEFAULTS, ...localData };
    return new Promise((resolve) => {
      if (!hasStorage) return resolve();
      try {
        chrome.storage.local.get(KEY, (res) => {
          const chromeData = res && res[KEY];
          state = { ...DEFAULTS, ...chromeData, ...(loadLocal() || {}) };
          saveLocal();
          resolve();
        });
      } catch (e) {
        resolve();
      }
    });
  }
  const saveChrome = debounce(() => {
    if (!hasStorage) return;
    try { chrome.storage.local.set({ [KEY]: state }); } catch (e) {}
  }, 150);
  function save() {
    saveLocal();
    saveChrome();
  }

  function guidePersistent() {
    const app = $('ytmusic-app');
    return !!(app && app.hasAttribute('is-guide-persistent'));
  }

  function guideCollapsed() {
    const app = $('ytmusic-app');
    return !!(app && app.hasAttribute('guide-collapsed'));
  }

  function applyWidths() {
    const root = document.documentElement;
    const lw = state.leftWidth + 'px';
    const rw = state.rightWidth + 'px';
    if (root.style.getPropertyValue('--ytms-left-width') !== lw) root.style.setProperty('--ytms-left-width', lw);
    if (root.style.getPropertyValue('--ytms-right-width') !== rw) root.style.setProperty('--ytms-right-width', rw);
    const layout = $('ytmusic-app-layout');
    if (layout) {

      const native = guideCollapsed() ? '72px' : lw;
      if (guidePersistent()) {
        if (layout.style.getPropertyValue('--ytmusic-guide-width') !== native) layout.style.setProperty('--ytmusic-guide-width', native);
      } else if (layout.style.getPropertyValue('--ytmusic-guide-width')) {
        layout.style.removeProperty('--ytmusic-guide-width');
      }
    }
  }

  function makeResizer(id, side) {
    let el = document.getElementById(id);
    if (el) return el;
    el = document.createElement('div');
    el.id = id;
    el.className = 'ytms-resizer';
    el.title = 'Arraste para ajustar a largura · clique duas vezes para restaurar';
    el.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      el.setPointerCapture(e.pointerId);
      el.classList.add('ytms-active');
      document.body.classList.add('ytms-resizing');
    });
    el.addEventListener('pointermove', (e) => {
      if (!el.hasPointerCapture(e.pointerId)) return;
      if (side === 'left') state.leftWidth = clamp(Math.round(e.clientX), LIMITS.left);
      else state.rightWidth = clamp(Math.round(window.innerWidth - e.clientX), LIMITS.right);
      applyWidths();
    });
    const end = (e) => {
      if (el.hasPointerCapture(e.pointerId)) el.releasePointerCapture(e.pointerId);
      el.classList.remove('ytms-active');
      document.body.classList.remove('ytms-resizing');
      save();
    };
    el.addEventListener('pointerup', end);
    el.addEventListener('pointercancel', end);
    el.addEventListener('dblclick', () => {
      if (side === 'left') state.leftWidth = DEFAULTS.leftWidth; else state.rightWidth = DEFAULTS.rightWidth;
      applyWidths();
      save();
    });
    document.body.appendChild(el);
    return el;
  }

  function ensureHomeButton() {
    const leftContent = $('ytmusic-nav-bar #left-content');
    if (leftContent && !document.getElementById('ytms-nav-history')) {
      const navWrap = el('div', 'ytms-nav-history');
      navWrap.id = 'ytms-nav-history';
      const backBtn = el('button', 'ytms-nav-arrow');
      backBtn.id = 'ytms-nav-back';
      backBtn.type = 'button';
      backBtn.title = 'Voltar';
      backBtn.setAttribute('aria-label', 'Voltar');
      backBtn.appendChild(svgIcon(['M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z']));
      backBtn.addEventListener('click', () => history.back());

      const fwdBtn = el('button', 'ytms-nav-arrow');
      fwdBtn.id = 'ytms-nav-fwd';
      fwdBtn.type = 'button';
      fwdBtn.title = 'Avançar';
      fwdBtn.setAttribute('aria-label', 'Avançar');
      fwdBtn.appendChild(svgIcon(['M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z']));
      fwdBtn.addEventListener('click', () => history.forward());

      navWrap.append(backBtn, fwdBtn);
      leftContent.appendChild(navWrap);
    }

    if (document.getElementById('ytms-home-btn')) return;
    const center = $('ytmusic-nav-bar .center-content');
    if (!center) return;
    const btn = document.createElement('button');
    btn.id = 'ytms-home-btn';
    btn.type = 'button';
    btn.title = t('home');
    btn.setAttribute('aria-label', t('home'));

    const NS = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('aria-hidden', 'true');
    const path = document.createElementNS(NS, 'path');
    path.setAttribute('d', 'M12.5 3.2a1 1 0 0 0-1 0L3 8.6V21h6.5v-6h5v6H21V8.6l-8.5-5.4z');
    svg.appendChild(path);
    btn.appendChild(svg);
    btn.addEventListener('click', () => {
      const logo = $('ytmusic-nav-bar ytmusic-logo a') || $('ytmusic-logo a');
      if (logo) logo.click(); else location.assign('/');
    });
    center.insertBefore(btn, center.firstChild);
  }

  const SORT_LABELS = [
    ['recent', t('sortRecent')],
    ['name', t('sortName')],
    ['played', t('sortPlayed')],
    ['custom', t('sortCustom')],
  ];

  function listSection() {
    return $('#guide ytmusic-guide-renderer ytmusic-guide-section-renderer:not([is-primary])');
  }
  function entries() {
    const sec = listSection();
    return sec ? $$('#items > ytmusic-guide-entry-renderer', sec) : [];
  }
  const titleOf = (el) => (($('.title', el) || {}).textContent || '').trim();

  let libChipFilter = 'playlists';

  function ensureLibHeader() {
    let head = document.getElementById('ytms-lib-header');
    if (head && $('.ytms-lib-top', head)) return;
    if (head) head.remove();
    const sections = $('#guide ytmusic-guide-renderer #sections');
    if (!sections) return;
    head = document.createElement('div');
    head.id = 'ytms-lib-header';

    const topRow = el('div', 'ytms-lib-top');
    const titleWrap = el('div', 'ytms-lib-title');
    titleWrap.appendChild(svgIcon(['M3 22a1 1 0 0 1-1-1V3a1 1 0 0 1 2 0v18a1 1 0 0 1-1 1zM15.5 2.134A1 1 0 0 0 14 3v18a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V6.464a1 1 0 0 0-.5-.866l-6-3.464zM9 2a1 1 0 0 0-1 1v18a1 1 0 1 0 2 0V3a1 1 0 0 0-1-1z']));
    const label = el('span', '', t('lib'));
    titleWrap.appendChild(label);

    const createBtn = el('button', 'ytms-lib-create-btn');
    createBtn.id = 'ytms-lib-create-btn';
    createBtn.type = 'button';
    createBtn.title = 'Criar playlist';
    createBtn.setAttribute('aria-label', 'Criar playlist');
    createBtn.appendChild(svgIcon(['M11 11V4h2v7h7v2h-7v7h-2v-7H4v-2h7z']));
    createBtn.addEventListener('click', () => {
      const nativeNewBtn = $('ytmusic-guide-renderer ytmusic-guide-section-renderer:not([is-primary]) yt-button-renderer button');
      if (nativeNewBtn) nativeNewBtn.click();
    });
    topRow.append(titleWrap, createBtn);

    const chipsRow = el('div', 'ytms-lib-chips');
    const chipDefs = [
      ['playlists', 'Playlists'],
      ['albums', 'Álbuns'],
      ['podcasts', 'Podcasts'],
    ];
    chipDefs.forEach(([key, txt]) => {
      const chip = el('button', 'ytms-lib-chip' + (libChipFilter === key ? ' ytms-active' : ''), txt);
      chip.type = 'button';
      chip.dataset.chip = key;
      chip.addEventListener('click', () => {
        libChipFilter = libChipFilter === key && key !== 'playlists' ? 'playlists' : key;
        $$('.ytms-lib-chip', chipsRow).forEach((c) => c.classList.toggle('ytms-active', c.dataset.chip === libChipFilter));
        applyFilter();
      });
      chipsRow.appendChild(chip);
    });

    const subRow = el('div', 'ytms-lib-subrow');
    const searchBtn = document.createElement('button');
    searchBtn.type = 'button';
    searchBtn.className = 'ytms-lib-searchbtn';
    searchBtn.title = t('searchLibTitle');
    searchBtn.setAttribute('aria-label', t('searchLib'));
    searchBtn.appendChild(svgIcon(['M10.5 3a7.5 7.5 0 0 1 5.95 12.06l4.24 4.23-1.41 1.42-4.24-4.24A7.5 7.5 0 1 1 10.5 3zm0 2a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11z']));
    searchBtn.addEventListener('click', () => (head.classList.contains('ytms-search-open') ? closeLibSearch() : openLibSearch()));

    const sel = document.createElement('select');
    sel.title = t('sortTitle');
    for (const [value, text] of SORT_LABELS) {
      const o = document.createElement('option');
      o.value = value;
      o.textContent = text;
      sel.appendChild(o);
    }
    sel.value = state.sortMode;
    sel.dataset.ytmsBound = '1';
    sel.addEventListener('change', () => {
      state.sortMode = sel.value;
      save();
      applySort({ animate: true });
    });
    subRow.append(searchBtn, sel);

    const row = document.createElement('div');
    row.className = 'ytms-lib-searchrow';
    const box = document.createElement('div');
    box.className = 'ytms-lib-searchbox';
    box.appendChild(svgIcon(['M10.5 3a7.5 7.5 0 0 1 5.95 12.06l4.24 4.23-1.41 1.42-4.24-4.24A7.5 7.5 0 1 1 10.5 3zm0 2a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11z']));
    const filter = document.createElement('input');
    filter.id = 'ytms-lib-filter';
    filter.type = 'text';
    filter.placeholder = t('searchLib');
    filter.autocomplete = 'off';
    filter.spellcheck = false;
    filter.addEventListener('input', () => { filterText = filter.value; applyFilter(); });
    filter.addEventListener('keydown', (e) => {
      e.stopPropagation();
      if (e.key === 'Escape') closeLibSearch();
    });
    filter.addEventListener('keyup', (e) => e.stopPropagation());
    filter.addEventListener('blur', () => { if (!filter.value) closeLibSearch(); });
    box.appendChild(filter);
    row.appendChild(box);

    head.append(topRow, chipsRow, subRow, row);
    sections.insertBefore(head, sections.firstChild);
  }

  function openLibSearch() {
    const h = document.getElementById('ytms-lib-header');
    const f = document.getElementById('ytms-lib-filter');
    if (!h || !f) return;
    h.classList.add('ytms-search-open');
    setTimeout(() => f.focus(), 30);
  }
  function closeLibSearch() {
    const h = document.getElementById('ytms-lib-header');
    const f = document.getElementById('ytms-lib-filter');
    if (!h || !f) return;
    f.value = '';
    filterText = '';
    applyFilter();
    h.classList.remove('ytms-search-open');
    f.blur();
  }

  let filterText = '';
  function applyFilter() {
    const q = filterText.trim().toLocaleLowerCase();
    entries().forEach((e) => {
      const id = e.getAttribute('data-ytms-id') || '';
      const title = titleOf(e).toLocaleLowerCase();
      const sub = ((($('.subtitle', e) || {}).textContent || '')).toLocaleLowerCase();
      let chipMatch = true;
      if (libChipFilter === 'podcasts') {
        chipMatch = /epis[oó]d|podcast/i.test(title + ' ' + sub);
      } else if (libChipFilter === 'albums') {
        chipMatch = /^MPRE|^OLAK/i.test(id) || /[áa]lbum/i.test(sub);
      }
      const textMatch = !q || title.includes(q);
      e.classList.toggle('ytms-filtered', !(chipMatch && textMatch));
    });
  }

  function isPinnedEntry(x) {
    return PINNED.has(x.id) || /^m[úu]sicas que gostei$|^liked music$/i.test(x.title);
  }
  function applySort(opts) {
    const list = entries().map((el, idx) => {
      const title = titleOf(el);
      const id = el.getAttribute('data-ytms-id') || title;
      return { el, idx, id, title };
    });
    if (!list.length) return;
    const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const before = opts && opts.animate && !reduce ? new Map(list.map((x) => [x.el, x.el.getBoundingClientRect().top])) : null;

    const pinned = list.filter((x) => isPinnedEntry(x));
    const rest = list.filter((x) => !isPinnedEntry(x));
    let sorted;

    if (state.sortMode === 'name') {
      sorted = [...rest].sort((a, b) => a.title.localeCompare(b.title, 'pt-BR', { numeric: true, sensitivity: 'base' }));
    } else if (state.sortMode === 'played') {
      sorted = [...rest].sort((a, b) => {
        const ta = state.playedAt[a.id] || 0;
        const tb = state.playedAt[b.id] || 0;
        return tb - ta || a.idx - b.idx;
      });
    } else if (state.sortMode === 'custom') {
      const pos = new Map(state.customOrder.map((id, i) => [id, i]));

      sorted = [...rest].sort((a, b) => {
        const pa = pos.has(a.id) ? pos.get(a.id) : (pos.has(a.title) ? pos.get(a.title) : -1000 + a.idx);
        const pb = pos.has(b.id) ? pos.get(b.id) : (pos.has(b.title) ? pos.get(b.title) : -1000 + b.idx);
        return pa - pb;
      });
    } else {
      sorted = rest;
    }

    pinned.forEach((x) => { if (x.el.style.order !== '-2') x.el.style.order = '-2'; });
    sorted.forEach((x, i) => {
      const want = String(i);
      if (x.el.style.order !== want) x.el.style.order = want;
    });
    if (before) {
      list.forEach((x) => {
        const dy = before.get(x.el) - x.el.getBoundingClientRect().top;
        if (Math.abs(dy) > 1 && x.el.animate) {
          x.el.animate([{ transform: `translateY(${dy
}px)` }, { transform: 'none' }], { duration: 280, easing: 'cubic-bezier(.2,.8,.2,1)' });
        }
      });
    }

    const custom = state.sortMode === 'custom';
    list.forEach((x) => {
      const wantDrag = !!(custom && x.id && !isPinnedEntry(x));
      if (wantDrag) {
        if (x.el.getAttribute('draggable') !== 'true') x.el.setAttribute('draggable', 'true');
      } else if (x.el.hasAttribute('draggable')) {
        x.el.removeAttribute('draggable');
      }
    });
    const sel = $('#ytms-lib-header select');
    if (sel) {
      if (sel.value !== state.sortMode) sel.value = state.sortMode;
      if (!sel.dataset.ytmsBound) {
        sel.dataset.ytmsBound = '1';
        sel.addEventListener('change', () => {
          state.sortMode = sel.value;
          save();
          applySort({ animate: true });
        });
      }
    }
  }

  let dragEl = null;
  function entryKey(e) {
    return (e && e.getAttribute('data-ytms-id')) || titleOf(e);
  }
  function visualOrderIds() {
    return entries()
      .filter((e) => {
        const title = titleOf(e);
        const id = e.getAttribute('data-ytms-id') || title;
        return id && !isPinnedEntry({ id, title });
      })
      .sort((a, b) => Number(a.style.order || 0) - Number(b.style.order || 0))
      .map((e) => entryKey(e));
  }
  function clearDropMarks() {
    $$('.ytms-drop-before, .ytms-drop-after').forEach((e) => e.classList.remove('ytms-drop-before', 'ytms-drop-after'));
  }
  function setupDnD() {
    const sec = listSection();
    const host = sec && $('#items', sec);
    if (!host || host.dataset.ytmsDnd) return;
    host.dataset.ytmsDnd = '1';

    host.addEventListener('dragstart', (e) => {
      const entry = e.target.closest && e.target.closest('ytmusic-guide-entry-renderer');
      if (!entry || state.sortMode !== 'custom') return;
      dragEl = entry;
      entry.classList.add('ytms-dragging');
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', entryKey(entry));
    });
    host.addEventListener('dragover', (e) => {
      if (!dragEl) return;
      const over = e.target.closest && e.target.closest('ytmusic-guide-entry-renderer');
      if (!over || over === dragEl || isPinnedEntry({ id: over.getAttribute('data-ytms-id') || '', title: titleOf(over) })) return;
      e.preventDefault();
      clearDropMarks();
      const r = over.getBoundingClientRect();
      over.classList.add(e.clientY < r.top + r.height / 2 ? 'ytms-drop-before' : 'ytms-drop-after');
    });
    host.addEventListener('drop', (e) => {
      if (!dragEl) return;
      const over = e.target.closest && e.target.closest('ytmusic-guide-entry-renderer');
      if (!over || over === dragEl) return;
      e.preventDefault();
      const before = over.classList.contains('ytms-drop-before');
      const dragId = entryKey(dragEl);
      const overId = entryKey(over);
      const ids = visualOrderIds().filter((id) => id !== dragId);
      const at = ids.indexOf(overId);
      ids.splice(before ? at : at + 1, 0, dragId);
      state.customOrder = ids;
      save();
      applySort({ animate: true });
    });
    host.addEventListener('dragend', () => {
      if (dragEl) dragEl.classList.remove('ytms-dragging');
      dragEl = null;
      clearDropMarks();
    });
  }

  let lastList = null;
  function currentList() {
    return document.documentElement.getAttribute('data-ytms-list') || '';
  }
  function trackPlayed() {
    const list = currentList();
    if (!list || list === lastList) return;
    lastList = list;
    state.playedAt[list] = Date.now();
    const keys = Object.keys(state.playedAt);
    if (keys.length > 300) {
      keys.sort((x, y) => state.playedAt[x] - state.playedAt[y]).slice(0, keys.length - 300).forEach((k) => delete state.playedAt[k]);
    }
    save();
    if (state.sortMode === 'played') applySort();
  }

  function bridgeJson(attr, fallback) {
    const b = document.getElementById('ytms-bridge');
    if (!b) return fallback;
    try { const v = b.getAttribute(attr); return v ? JSON.parse(v) : fallback; } catch (e) { return fallback; }
  }
  function sendCmd(cmd) {
    const b = document.getElementById('ytms-bridge');
    if (!b) return;
    b.setAttribute('data-cmd', JSON.stringify(Object.assign({ n: Date.now() }, cmd)));
    document.dispatchEvent(new Event('ytms-cmd'));
  }

  let allowUntil = 0;
  let pageAllowed = false;
  let lastClose = 0;
  const toggleBtn = () => $('ytmusic-player-bar .toggle-player-page-button button');

  function syncGuard() {
    const layout = $('ytmusic-app-layout');
    if (!layout || !document.body) return;
    const now = Date.now();
    const open = layout.getAttribute('player-ui-state') === 'PLAYER_PAGE_OPEN';
    if (open) {
      if (!pageAllowed) {
        if (now < allowUntil) pageAllowed = true;
        else if (now - lastClose > 800) {
          lastClose = now;
          const b = toggleBtn();
          if (b) b.click();
        }
      }
    } else {
      pageAllowed = false;
    }
    document.body.classList.toggle('ytms-allow-player', pageAllowed || now < allowUntil);
    document.body.classList.toggle('ytms-player-page-open', open && pageAllowed);
    const btn = document.getElementById('ytms-player-btn');
    if (btn) btn.classList.toggle('ytms-on', open && pageAllowed);
  }

  function userWantsPlayer() {
    allowUntil = Date.now() + 1500;
    syncGuard();
    setTimeout(syncGuard, 1600);
  }

  function togglePlayerPage() {
    const layout = $('ytmusic-app-layout');
    const open = layout && layout.getAttribute('player-ui-state') === 'PLAYER_PAGE_OPEN';
    if (!open) userWantsPlayer();
    setTimeout(() => {
      const host = $('ytmusic-player-bar .toggle-player-page-button');
      if (host) host.click();
    }, 0);
  }

  function setupGuardClicks() {
    document.addEventListener('click', (e) => {
      if (!e.isTrusted) return;
      const t = e.target;
      if (t && t.closest && t.closest('ytmusic-player-bar .toggle-player-page-button, ytmusic-player-bar .middle-controls, ytmusic-player-bar .thumbnail-image-wrapper')) {
        userWantsPlayer();
      }
    }, true);
  }

  const SVG_NS = 'http://www.w3.org/2000/svg';
  const HEART_PATH = 'M12 20.5l-1.2-1.1C6.1 15.2 3 12.4 3 8.9 3 6.2 5.1 4 7.8 4c1.5 0 3 .7 4.2 2 1.2-1.3 2.7-2 4.2-2C18.9 4 21 6.2 21 8.9c0 3.5-3.1 6.3-7.8 10.5L12 20.5z';
  const SCREEN_PATHS = ['M21 3H3a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h7l-1 2H7v2h10v-2h-2l-1-2h7a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2zm0 14H3V5h18v12z', 'M10 8v6l5-3z'];

  function el(tag, cls, text) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text !== undefined) e.textContent = text;
    return e;
  }
  function svgIcon(paths) {
    const svg = document.createElementNS(SVG_NS, 'svg');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('aria-hidden', 'true');
    paths.forEach((d) => {
      const p = document.createElementNS(SVG_NS, 'path');
      p.setAttribute('d', d);
      svg.appendChild(p);
    });
    return svg;
  }

  const SHUFFLE_PATHS = ['M10.59 9.17L5.41 4 4 5.41l5.17 5.17 1.42-1.41zM14.5 4l2.04 2.04L4 18.59 5.41 20 17.96 7.46 20 9.5V4h-5.5zm.33 9.41l-1.41 1.41 3.13 3.13L14.5 20H20v-5.5l-2.04 2.04-3.13-3.13z'];
  const REPEAT_PATHS = ['M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4z'];

  function ensurePlayerBarLayout() {
    const bar = $('ytmusic-player-bar');
    if (!bar) return;
    const leftBtns = $('.left-controls-buttons', bar);
    if (leftBtns) {
      let shuf = document.getElementById('ytms-shuffle-btn');
      if (!shuf) {
        shuf = el('button', 'ytms-ctrl-btn ytms-shuffle-btn');
        shuf.id = 'ytms-shuffle-btn';
        shuf.type = 'button';
        shuf.title = 'Aleatório';
        shuf.setAttribute('aria-label', 'Aleatório');
        shuf.appendChild(svgIcon(SHUFFLE_PATHS));
        shuf.addEventListener('click', () => {
          const nativeShuf = $('tp-yt-paper-icon-button.shuffle, .shuffle button, .shuffle', bar);
          if (nativeShuf) nativeShuf.click();
        });
        leftBtns.insertBefore(shuf, leftBtns.firstChild);
      }
      let rep = document.getElementById('ytms-repeat-btn');
      if (!rep) {
        rep = el('button', 'ytms-ctrl-btn ytms-repeat-btn');
        rep.id = 'ytms-repeat-btn';
        rep.type = 'button';
        rep.title = 'Repetir';
        rep.setAttribute('aria-label', 'Repetir');
        rep.appendChild(svgIcon(REPEAT_PATHS));
        rep.addEventListener('click', () => {
          const nativeRep = $('tp-yt-paper-icon-button.repeat, .repeat button, .repeat', bar);
          if (nativeRep) nativeRep.click();
        });
        leftBtns.appendChild(rep);
      }

      const repeatMode = (bar.getAttribute('repeat-mode') || bar.getAttribute('repeat-Mode') || '').toUpperCase();
      const nativeRepEl = $('tp-yt-paper-icon-button.repeat, .repeat', bar);
      const repTitle = (nativeRepEl && (nativeRepEl.getAttribute('title') || nativeRepEl.getAttribute('aria-label') || '')) || '';
      const isRepOff = repeatMode === 'NONE' || repeatMode === 'OFF' || /desativad|off/i.test(repTitle) || (!repeatMode && !repTitle);
      const isRepOne = repeatMode === 'ONE' || /uma|one|1/i.test(repTitle);
      rep.classList.toggle('ytms-on', !isRepOff);
      rep.classList.toggle('ytms-rep-one', isRepOne);
      if (repTitle) rep.title = repTitle;
    }

    let timeCur = document.getElementById('ytms-time-cur');
    let timeDur = document.getElementById('ytms-time-dur');
    if (!timeCur) {
      timeCur = el('span', 'ytms-time-label ytms-time-cur', '0:00');
      timeCur.id = 'ytms-time-cur';
      bar.appendChild(timeCur);
    }
    if (!timeDur) {
      timeDur = el('span', 'ytms-time-label ytms-time-dur', '0:00');
      timeDur.id = 'ytms-time-dur';
      bar.appendChild(timeDur);
    }
    const rawTime = clean((($('.time-info', bar) || {}).textContent));
    if (rawTime && rawTime.includes('/')) {
      const [c, d] = rawTime.split('/').map((s) => s.trim());
      if (timeCur.textContent !== c) timeCur.textContent = c;
      if (timeDur.textContent !== d) timeDur.textContent = d;
    }
  }

  function ensurePlayerButton() {
    if (document.getElementById('ytms-player-btn')) return;
    const host = $('ytmusic-player-bar #right-controls');
    if (!host) return;
    const b = el('button', 'ytms-player-btn');
    b.id = 'ytms-player-btn';
    b.type = 'button';
    b.title = t('playerBtn');
    b.setAttribute('aria-label', t('playerBtnAria'));
    b.appendChild(svgIcon(SCREEN_PATHS));
    b.addEventListener('click', togglePlayerPage);
    host.insertBefore(b, host.firstChild);
  }
  function ensurePanelButton() {
    if (document.getElementById('ytms-panel-btn')) return;
    const host = $('ytmusic-player-bar #right-controls');
    if (!host) return;
    const b = el('button', 'ytms-player-btn');
    b.id = 'ytms-panel-btn';
    b.type = 'button';
    b.title = t('panelBtn');
    b.setAttribute('aria-label', t('panelBtnAria'));
    b.appendChild(svgIcon(['M3 4h18a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1zm1 2v12h9.5V6H4zm11.5 0v12H20V6h-4.5z']));
    b.firstChild.firstChild.setAttribute('fill-rule', 'evenodd');
    b.addEventListener('click', toggleRightPanel);
    b.classList.toggle('ytms-on', !state.rightHidden);
    host.insertBefore(b, host.firstChild);
  }

  function ensurePanel() {
    let p = document.getElementById('ytms-right-panel');
    if (p && $('.ytms-np-main', p)) return;
    if (p) p.remove();
    p = el('aside');
    p.id = 'ytms-right-panel';

    const mainCard = el('section', 'ytms-card ytms-np-main');
    const head = el('div', 'ytms-np-head', t('nowPlaying'));
    const cover = el('img', 'ytms-np-cover');
    cover.alt = '';

    const row = el('div', 'ytms-np-row');
    const text = el('div', 'ytms-np-text');
    const title = el('div', 'ytms-np-title');
    title.appendChild(el('span'));
    text.append(title, el('div', 'ytms-np-artist'));

    const like = el('button', 'ytms-like');
    like.type = 'button';
    like.title = t('like');
    like.appendChild(svgIcon([HEART_PATH]));
    like.addEventListener('click', () => {
      const btn = $('ytmusic-player-bar ytmusic-like-button-renderer button');
      if (btn) btn.click();
    });
    row.append(text, like);
    mainCard.append(head, cover, row);

    const stats = el('section', 'ytms-card ytms-stats');
    const sh = el('div', 'ytms-card-h');
    sh.appendChild(el('span', '', t('about')));
    const artistCredit = el('div', 'ytms-stats-artist');
    stats.append(sh, artistCredit, el('div', 'ytms-stats-grid'));

    const related = el('div', 'ytms-related');

    const queue = el('section', 'ytms-card ytms-queue-card');
    const qh = el('div', 'ytms-card-h');
    const open = el('button', 'ytms-link', t('openQueue'));
    open.type = 'button';
    open.addEventListener('click', togglePlayerPage);
    qh.append(el('span', '', t('upNext')), open);
    queue.append(qh, el('div', 'ytms-np-queue'));

    p.append(mainCard, stats, related, queue);
    document.body.appendChild(p);

    if (typeof ResizeObserver !== 'undefined') new ResizeObserver(() => measureMarquee(title)).observe(p);
  }

  const bigger = (src) => (src && /=w\d+-h\d+/.test(src) ? src.replace(/=w\d+-h\d+[^?&]*/, '=w640-h640-l90-rj') : src);
  const clean = (t) => (t || '').replace(/\s+/g, ' ').trim();

  function measureMarquee(box) {
    const span = box && box.firstChild;
    if (!span) return;
    const shift = Math.ceil(span.scrollWidth - box.clientWidth);
    if (shift > 4) {
      box.style.setProperty('--ytms-shift', shift + 'px');
      box.style.setProperty('--ytms-dur', Math.max(9, shift / 18 + 5).toFixed(1) + 's');
      box.classList.add('ytms-marquee');
    } else {
      box.classList.remove('ytms-marquee');
    }
  }
  function setTitle(box, text) {
    const span = box.firstChild;
    if (span.textContent === text) return;
    span.textContent = text;
    box.title = text;
    box.classList.remove('ytms-marquee', 'ytms-swap');
    void box.offsetWidth;
    box.classList.add('ytms-swap');
    requestAnimationFrame(() => measureMarquee(box));
  }

  function setCover(img, src) {
    if (!src) { img.style.display = 'none'; return; }
    img.style.display = '';
    if (img.dataset.src === src) return;
    img.dataset.src = src;
    img.classList.add('ytms-fading');
    const probe = new Image();
    probe.onload = () => {
      if (img.dataset.src !== src) return;
      img.src = src;
      requestAnimationFrame(() => img.classList.remove('ytms-fading'));
    };
    probe.onerror = () => img.classList.remove('ytms-fading');
    probe.src = src;
  }

  function splitNum(p) {
    const m = p.match(/^([\d.,]+(?:\s?(?:mil|mi|bi|[KMB]))?)\s+(.*)$/i);
    return m ? m[1].trim() : p;
  }
  const VIEWS_RE = /visualiza|visualizz|\bviews?\b|\bvues?\b|aufrufe|reproducc|weergaven|visningar|wyświetl|görüntüleme|просмотр|再生|回視聴|조회/i;
  const LIKES_RE = /gostei|marca[cç]|curti|\blikes?\b|me gusta|j['’]aime|gefällt|mi piace|vind-ik|gilla|polubie|beğen|отметк|高評価|좋아요/i;

  function numPart(part, re) {
    const i = part.search(re);
    if (i > 0) return part.slice(0, i).replace(/\s+(de|of|von|di|d['’])\s*$/i, '').replace(/[^\p{L}\p{N}.,]+$/u, '').trim();
    return splitNum(part);
  }
  function parseMeta(sub, duration) {
    const parts = sub.split('•').map((x) => x.trim()).filter(Boolean);
    const out = { artist: parts[0] || '', views: '', likes: '', album: '', year: '', duration: duration || '' };
    const unknown = [];
    for (const part of parts.slice(1)) {
      if (VIEWS_RE.test(part)) out.views = numPart(part, VIEWS_RE);
      else if (LIKES_RE.test(part)) out.likes = numPart(part, LIKES_RE);
      else if (/^\d{4}$/.test(part)) out.year = part;
      else unknown.push(part);
    }

    const stats = unknown.filter((p) => /^\d/.test(p));
    const rest = unknown.filter((p) => !/^\d/.test(p));
    if (!out.views && stats.length) out.views = splitNum(stats.shift());
    if (!out.likes && stats.length) out.likes = splitNum(stats.shift());
    if (rest.length) out.album = rest[0];
    return out;
  }

  function renderStats(panel, meta, albumLink, artistLink) {
    const tiles = [
      ['views', meta.views], ['likes', meta.likes], ['duration', meta.duration],
      ['year', meta.year], ['album', meta.album],
    ].filter((x) => x[1]);
    const sig = JSON.stringify([meta.artist, !!artistLink, tiles]);
    const card = $('.ytms-stats', panel);
    const artistBox = $('.ytms-stats-artist', panel);
    const grid = $('.ytms-stats-grid', panel);
    card.style.display = (tiles.length || meta.artist) ? '' : 'none';
    if (grid.dataset.sig === sig) return;
    grid.dataset.sig = sig;
    if (artistBox) {
      if (meta.artist) {
        artistBox.style.display = '';
        artistBox.replaceChildren(
          el('div', 'ytms-stats-artist-name', meta.artist),
          el('span', 'ytms-stats-artist-badge', 'Canal / Artista')
        );
        artistBox.classList.toggle('ytms-clickable', !!artistLink);
        artistBox.onclick = artistLink ? () => artistLink.click() : null;
      } else {
        artistBox.style.display = 'none';
      }
    }
    grid.replaceChildren(...tiles.map(([label, value]) => {
      const tile = el('div', 'ytms-stat' + (label === 'album' ? ' ytms-wide' : ''));
      tile.append(el('div', 'ytms-stat-v', value), el('div', 'ytms-stat-l', t(label)));
      if (label === 'album' && albumLink) {
        tile.classList.add('ytms-clickable');
        tile.addEventListener('click', () => albumLink.click());
      }
      return tile;
    }));
  }

  function listRow(item, onClick) {
    const row = el('div', 'ytms-q-item');
    const img = el('img');
    img.alt = '';
    if (item.thumb && item.thumb.startsWith('https://')) img.src = item.thumb;
    const box = el('div');
    box.style.minWidth = '0';
    box.append(el('div', 'ytms-q-title', item.title), el('div', 'ytms-q-art', item.sub));
    row.append(img, box);
    row.addEventListener('click', onClick);
    return row;
  }

  function renderRelated(panel) {
    const data = bridgeJson('data-related', { sections: [] });
    const host = $('.ytms-related', panel);
    const sig = JSON.stringify(data.sections);
    if (host.dataset.sig === sig) return;
    host.dataset.sig = sig;
    host.replaceChildren(...data.sections.map((sec) => {
      const card = el('section', 'ytms-card ytms-enter');
      const h = el('div', 'ytms-card-h');
      h.appendChild(el('span', '', sec.title));
      card.appendChild(h);
      sec.items.forEach((it) => card.appendChild(listRow({ thumb: it.thumb, title: it.title, sub: it.sub }, () => sendCmd({ t: 'related', id: it.id }))));
      return card;
    }));
  }

  function renderQueue(panel) {
    const next = bridgeJson('data-queue', []);
    const q = $('.ytms-np-queue', panel);
    const sig = JSON.stringify(next);
    if (q.dataset.sig === sig) return;
    q.dataset.sig = sig;
    if (!next.length) {
      q.replaceChildren(el('div', 'ytms-q-empty', t('queueEmpty')));
      return;
    }
    q.replaceChildren(...next.map((it) => listRow(it, () => sendCmd({ t: 'queue', i: it.i }))));
  }

  function contextName() {
    const id = currentList();
    if (!id) return '';
    const entry = entries().find((e) => e.getAttribute('data-ytms-id') === id);
    return entry ? titleOf(entry) : '';
  }

  function updatePanel() {
    const layout = $('ytmusic-app-layout');
    const bar = $('ytmusic-player-bar');
    const panel = document.getElementById('ytms-right-panel');
    if (!layout || !bar || !panel) return;

    const uiState = layout.getAttribute('player-ui-state') || '';
    const hasPlayer = layout.hasAttribute('player-visible') && uiState !== 'INACTIVE';
    document.body.classList.toggle('ytms-has-player', hasPlayer);
    syncGuard();
    if (!hasPlayer) return;

    $('.ytms-np-head', panel).textContent = contextName() || t('nowPlaying');

    const img = $('img.image', bar);
    setCover($('.ytms-np-cover', panel), img && img.src && img.src.startsWith('https://') ? bigger(img.src) : '');

    setTitle($('.ytms-np-title', panel), clean(($('.title', bar) || {}).textContent));

    const sub = clean((($('.byline', bar) || $('.subtitle', bar) || {}).textContent));
    const time = clean((($('.time-info', bar) || {}).textContent));
    const duration = time.includes('/') ? time.split('/')[1].trim() : '';
    const meta = parseMeta(sub, duration);

    const artistLink = $('.subtitle a[href^="channel/"], .byline a[href^="channel/"]', bar);
    const artist = $('.ytms-np-artist', panel);
    artist.textContent = meta.artist;
    artist.classList.toggle('ytms-clickable', !!artistLink);
    artist.onclick = artistLink ? () => artistLink.click() : null;

    const liked = ($('ytmusic-like-button-renderer', bar) || { getAttribute: () => '' }).getAttribute('like-status') === 'LIKE';
    $('.ytms-like', panel).classList.toggle('ytms-on', liked);
    $('.ytms-like', panel).title = liked ? t('unlike') : t('like');

    renderStats(panel, meta, $('.subtitle a[href^="browse/"], .byline a[href^="browse/"]', bar), artistLink);
    renderRelated(panel);
    renderQueue(panel);
  }

  function ensureFrame() {
    if (document.getElementById('ytms-frame')) return;
    const f = document.createElement('div');
    f.id = 'ytms-frame';
    document.body.appendChild(f);
  }

  const heroCache = new Map();
  let heroUrl = '';
  function updateHero() {
    const root = document.documentElement;
    const header = $('ytmusic-browse-response ytmusic-responsive-header-renderer');
    if (!header) {
      root.style.removeProperty('--ytms-hero');
      heroUrl = '';
      return;
    }
    const img = $('ytmusic-thumbnail-renderer img', header) || $('img', header);
    const url = img && img.src && img.src.startsWith('https://') ? img.src : '';
    if (!url || url === heroUrl) return;
    heroUrl = url;
    if (heroCache.has(url)) {
      root.style.setProperty('--ytms-hero', heroCache.get(url));
      return;
    }
    root.style.setProperty('--ytms-hero', '#3a3a3a');
    if (!(typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage)) return;
    chrome.runtime.sendMessage({ type: 'ytms-color', url }, (res) => {
      if (chrome.runtime.lastError || !res || !res.color) return;
      heroCache.set(url, res.color);
      if (heroUrl === url) root.style.setProperty('--ytms-hero', res.color);
    });
  }

  let toastTimer = 0;
  function toast(text) {
    let t = document.getElementById('ytms-toast');
    if (!t) { t = el('div'); t.id = 'ytms-toast'; t.setAttribute('role', 'status'); document.body.appendChild(t); }
    t.textContent = text;
    void t.offsetWidth;
    t.classList.add('ytms-show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove('ytms-show'), 1600);
  }

  function applyRightHidden() {
    if (document.body) document.body.classList.toggle('ytms-right-hidden', !!state.rightHidden);
    const b = document.getElementById('ytms-panel-btn');
    if (b) b.classList.toggle('ytms-on', !state.rightHidden);
  }
  function toggleRightPanel() {
    state.rightHidden = !state.rightHidden;
    save();
    applyRightHidden();
    toast(state.rightHidden ? t('panelHidden') : t('panelShown'));
  }

  const SORT_ORDER = ['recent', 'name', 'played', 'custom'];
  function typing(e) {
    const t = e.target;
    return t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName) || (t.tagName || '').includes('-INPUT'));
  }
  function likeSong() {
    const btn = $('ytmusic-player-bar ytmusic-like-button-renderer button');
    if (!btn) return;
    btn.click();
    setTimeout(() => {
      const r = $('ytmusic-player-bar ytmusic-like-button-renderer');
      toast(r && r.getAttribute('like-status') === 'LIKE' ? t('liked') : t('unliked'));
    }, 350);
  }
  function setupShortcuts() {
    document.addEventListener('keydown', (e) => {
      if (!e.isTrusted || e.isComposing) return;
      const k = e.key;

      if (e.ctrlKey && !e.altKey && !e.shiftKey && (k === 'ArrowUp' || k === 'ArrowDown')) {
        e.preventDefault();
        sendCmd({ t: 'volume', d: k === 'ArrowUp' ? 5 : -5 });
        setTimeout(() => {
          const v = bridgeAttr('data-volume');
          toast(v ? t('volume') + ' ' + v + '%' : t('volume'));
        }, 140);
        return;
      }
      if (e.altKey && !e.ctrlKey && !e.metaKey) {
        const key = k.toLowerCase();
        if (key === 'p') { e.preventDefault(); togglePlayerPage(); return; }
        if (key === 'r') { e.preventDefault(); toggleRightPanel(); return; }
        if (key === 'l') { e.preventDefault(); likeSong(); return; }
        if (key === 'f') {
          e.preventDefault();
          openLibSearch();
          return;
        }
        if (key === 's') {
          e.preventDefault();
          const next = SORT_ORDER[(SORT_ORDER.indexOf(state.sortMode) + 1) % SORT_ORDER.length];
          state.sortMode = next;
          save();
          const sel = $('#ytms-lib-header select');
          if (sel) sel.value = next;
          applySort({ animate: true });
          const label = (SORT_LABELS.find((x) => x[0] === next) || [])[1];
          toast(t('sortBy') + (label || next));
          return;
        }
      }

      if (k === '/' && !e.ctrlKey && !e.altKey && !e.metaKey && !typing(e)) {
        const input = $('ytmusic-search-box input');
        if (input) { e.preventDefault(); input.focus(); input.select(); }
      }
    }, true);
  }
  function bridgeAttr(name) {
    const b = document.getElementById('ytms-bridge');
    return b ? b.getAttribute(name) : null;
  }

  function ensureSearchMix() {
    const page = $('ytmusic-search-page');
    let box = document.getElementById('ytms-mix');
    const onSearch = location.pathname === '/search' && !!page;
    const qs = new URLSearchParams(location.search);
    const q = qs.get('q');
    const data = onSearch ? bridgeJson('data-search', null) : null;

    const sp = qs.get('sp');
    const filterOk = !sp || /^EgWKAQI(I|Q)AWo/.test(sp);
    if (!data || data.q !== q || !data.items.length || !filterOk) {
      if (box) box.remove();
      return;
    }
    const list = $('ytmusic-section-list-renderer', page);
    if (!list) return;
    const contents = $('#contents', list) || list;
    if (!box) {
      box = el('section');
      box.id = 'ytms-mix';
    }
    const anchor = $('ytmusic-card-shelf-renderer', contents);
    const host = anchor ? anchor.parentNode : contents;
    const wantPrev = anchor || null;
    if (box.parentNode !== host || (wantPrev && box.previousElementSibling !== wantPrev)) {
      host.insertBefore(box, wantPrev ? wantPrev.nextSibling : host.firstChild);
    }
    const sig = JSON.stringify(data.items);
    if (box.dataset.sig !== sig) {
      box.dataset.sig = sig;
      const head = el('h2', 'ytms-mix-h', t('mixTitle'));
      box.replaceChildren(head, ...data.items.map((it) => {
        const row = el('div', 'ytms-mix-row ytms-enter');
        row.tabIndex = 0;
        const th = el('div', 'ytms-mix-th');
        const img = el('img');
        img.alt = '';
        if (it.thumb && it.thumb.startsWith('https://')) img.src = it.thumb;
        th.append(img, svgIcon(['M8 5v14l11-7z']));
        const tx = el('div', 'ytms-mix-tx');
        const sub = el('div', 'ytms-mix-sub');
        sub.append(el('span', 'ytms-badge' + (it.kind === 'video' ? ' ytms-badge-video' : ''), t(it.kind === 'video' ? 'video' : 'song')), document.createTextNode(it.sub));
        tx.append(el('div', 'ytms-mix-title', it.title), sub);
        row.append(th, tx);
        const play = () => sendCmd({ t: 'search', id: it.id });
        row.addEventListener('click', play);
        row.addEventListener('keydown', (e) => { if (e.key === 'Enter') play(); });
        return row;
      }));
    }
  }

  function ensureTrackHeader() {
    const page = $('ytmusic-two-column-browse-results-renderer[page-type="MUSIC_PAGE_TYPE_PLAYLIST"], ytmusic-two-column-browse-results-renderer[page-type="MUSIC_PAGE_TYPE_ALBUM"]');
    if (!page) {
      $$('.ytms-track-header').forEach((node) => node.remove());
      return;
    }

    const firstTrack = $('ytmusic-playlist-shelf-renderer ytmusic-responsive-list-item-renderer, ytmusic-section-list-renderer ytmusic-responsive-list-item-renderer', page);
    if (!firstTrack || !firstTrack.parentElement) {
      $$('.ytms-track-header').forEach((node) => node.remove());
      return;
    }

    const parent = firstTrack.parentElement;
    const trackRows = [...parent.children].filter((node) =>
      node.matches && node.matches('ytmusic-responsive-list-item-renderer')
    );
    const currentBarTitle = clean((($('ytmusic-player-bar .middle-controls .title') || {}).textContent));
    trackRows.forEach((row, index) => {
      row.setAttribute('data-ytms-track-number', String(index + 1));
      const rowTitle = clean((($('.title-column .title', row) || {}).textContent));
      const isPlaying = row.matches('[play-button-state="playing"], [play-button-state="paused"], [data-playing="true"]')
        || !!row.querySelector(
          'ytmusic-play-button-renderer[state="playing"], ytmusic-play-button-renderer[state="paused"], ytmusic-play-button-renderer[play-button-state="playing"], [data-playing="true"]'
        )
        || (!!currentBarTitle && rowTitle === currentBarTitle);
      row.classList.toggle('ytms-playing', isPlaying);
    });

    let header = $('.ytms-track-header', page);
    $$('.ytms-track-header', page).forEach((node) => {
      if (node !== header) node.remove();
    });

    if (!header || !$('.ytms-track-header-num', header)) {
      if (header) header.remove();
      header = el('div', 'ytms-track-header');
      header.setAttribute('role', 'row');
      const num = el('span', 'ytms-track-header-num', '#');
      num.setAttribute('role', 'columnheader');
      const title = el('span', 'ytms-track-header-title', t('trackTitle'));
      title.setAttribute('role', 'columnheader');
      const album = el('span', 'ytms-track-header-album', t('album'));
      album.setAttribute('role', 'columnheader');
      const duration = el('span', 'ytms-track-header-duration');
      duration.setAttribute('role', 'columnheader');
      duration.title = t('trackDuration');
      duration.setAttribute('aria-label', t('trackDuration'));
      duration.appendChild(svgIcon(['M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm0 18a8 8 0 1 1 8-8 8 8 0 0 1-8 8zm.75-13h-1.5v6l5.25 3.15.75-1.23-4.5-2.67z']));
      header.append(num, title, album, duration);
    }

    if (header.parentElement !== parent || header.nextElementSibling !== firstTrack) {
      parent.insertBefore(header, firstTrack);
    }
  }

  const PLAY_PATH = 'M8 5v14l11-7z';
  const PAUSE_PATH = 'M6 5h4v14H6zm8 0h4v14h-4z';
  function ensureStickyBar() {
    const header = $('ytmusic-responsive-header-renderer');
    let bar = document.getElementById('ytms-sticky');
    if (!header || !header.isConnected || !header.offsetParent) {
      if (bar) bar.classList.remove('ytms-show');
      return;
    }
    if (!bar) {
      bar = el('div');
      bar.id = 'ytms-sticky';
      const btn = el('button', 'ytms-sticky-play');
      btn.type = 'button';
      btn.title = t('playPause');
      btn.appendChild(svgIcon([PLAY_PATH]));
      btn.addEventListener('click', () => {
        const h = $('ytmusic-responsive-header-renderer');
        const pb = h && $('ytmusic-play-button-renderer', h);
        if (pb) pb.click();
      });
      bar.append(btn, el('div', 'ytms-sticky-title'));
      document.body.appendChild(bar);
    }
    const h1 = $('h1', header);
    const title = clean(h1 && h1.textContent);
    const tEl = $('.ytms-sticky-title', bar);
    if (tEl.textContent !== title) tEl.textContent = title;

    const pb = $('ytmusic-play-button-renderer', header);
    const playing = !!pb && /playing|pause/i.test((pb.getAttribute('state') || '') + ' ' + (pb.getAttribute('aria-label') || ''));
    const path = $('path', bar);
    const want = playing ? PAUSE_PATH : PLAY_PATH;
    if (path && path.getAttribute('d') !== want) path.setAttribute('d', want);

    const frame = document.getElementById('ytms-frame');
    if (frame) {
      const r = frame.getBoundingClientRect();
      bar.style.left = r.left + 'px';
      bar.style.top = r.top + 'px';
      bar.style.width = r.width + 'px';
    }

    const top = frame ? frame.getBoundingClientRect().top : 64;
    const gone = h1 ? h1.getBoundingClientRect().bottom < top + 8 : false;
    bar.classList.toggle('ytms-show', gone);
  }
  let stickyRaf = 0;
  function onScrollSticky(e) {
    if (e && e.target && e.target.closest && e.target.closest('#guide, #ytms-right-panel')) return;
    if (stickyRaf) return;
    stickyRaf = requestAnimationFrame(() => { stickyRaf = 0; ensureStickyBar(); });
  }

  if (hasStorage && chrome.runtime && chrome.runtime.onMessage) {
    chrome.runtime.onMessage.addListener((msg, _sender, send) => {
      if (!msg || msg.type !== 'ytms-diag') return;
      const all = entries();
      const withId = all.filter((e) => e.getAttribute('data-ytms-id')).length;
      const withCover = all.filter((e) => $('img.ytms-pl-cover', e)).length;
      const loaded = all.filter((e) => { const i = $('img.ytms-pl-cover', e); return i && i.complete && i.naturalWidth > 0; }).length;
      const covers = bridgeJson('data-covers', {});
      send({
        version: chrome.runtime.getManifest().version,
        entries: all.length, withId, withCover, loaded,
        coversKnown: Object.keys(covers).length,
        status: bridgeJson('data-covers-status', null),
        bridge: !!document.getElementById('ytms-bridge'),
        account: bridgeAttr('data-account'),
      });
      return false;
    });
  }

  function ensureCovers() {
    const covers = bridgeJson('data-covers', null);
    if (!covers) return;
    entries().forEach((entry) => {
      const id = entry.getAttribute('data-ytms-id');
      const item = $('tp-yt-paper-item', entry);
      if (!item) return;
      if (PINNED.has(id)) {
        const old = $('img.ytms-pl-cover', item);
        if (old) old.remove();
        item.classList.remove('ytms-has-cover');
        if (!$('.ytms-pin-icon', item)) {
          const icon = el('span', 'ytms-pin-icon');
          icon.appendChild(svgIcon([HEART_PATH]));
          item.insertBefore(icon, item.firstChild);
        }
        return;
      }
      let img = $('img.ytms-pl-cover', item);
      const url = id && covers[id];
      if (!url || !/^https:\/\//.test(url)) {
        if (img) { img.remove(); item.classList.remove('ytms-has-cover'); }
        return;
      }
      if (!img) {
        img = el('img', 'ytms-pl-cover');
        img.alt = '';
        img.addEventListener('load', () => img.classList.add('ytms-loaded'));
        item.insertBefore(img, item.firstChild);
      }
      if (!item.classList.contains('ytms-has-cover')) item.classList.add('ytms-has-cover');
      if (img.dataset.src !== url) {
        img.dataset.src = url;
        img.decoding = 'async';
        img.classList.remove('ytms-loaded');
        img.src = url;
      } else if (img.complete && img.naturalWidth && !img.classList.contains('ytms-loaded')) {
        img.classList.add('ytms-loaded');
      }
    });
  }

  function editButton(header) {

    const rend = Array.from(header.querySelectorAll('.action-buttons yt-button-renderer')).find((r) => {
      const ic = r.data && r.data.icon;
      return ic && (ic.iconType === 'EDIT' || ic === 'EDIT');
    });
    if (rend) return rend.querySelector('button');
    return Array.from(header.querySelectorAll('.action-buttons button')).find((b) => /edit|editar|éditer|modifier|bearbeiten|modifica|redigera|bewerk|düzenle|edytuj|правка|редакт|編集|编辑|수정/i.test(b.getAttribute('aria-label') || ''));
  }
  function ensureEditClicks() {
    const header = $('ytmusic-responsive-header-renderer');
    if (!header) return;
    header.classList.toggle('ytms-editable', !!editButton(header));
    if (header.dataset.ytmsEdit) return;
    header.dataset.ytmsEdit = '1';
    header.addEventListener('click', (e) => {
      if (!e.isTrusted) return;
      const t = e.target;
      if (!t.closest || t.closest('button, a, .action-buttons, .facepile-container, .thumbnail-edit-button-wrapper')) return;
      if (!t.closest('.thumbnail, h1, .header-description')) return;
      const b = editButton(header);
      if (!b) return;
      e.stopPropagation();
      e.preventDefault();
      b.click();
    }, true);
  }

  function ensureHomeQuickGrid() {
    const isHome = location.pathname === '/' || location.pathname === '';
    const existing = document.getElementById('ytms-home-quick-grid');
    if (!isHome) {
      if (existing) existing.style.display = 'none';
      return;
    }

    const sectionList = $('ytmusic-browse-response ytmusic-section-list-renderer > #contents');
    if (!sectionList) return;

    const topEntries = entries()
      .filter((entry) => {
        const title = titleOf(entry);
        const img = $('img.ytms-pl-cover, yt-img-shadow img, img', entry);
        return title && img && img.src;
      })
      .slice(0, 8);

    if (!topEntries.length) return;

    let grid = existing;
    if (!grid) {
      grid = el('div');
      grid.id = 'ytms-home-quick-grid';
      sectionList.insertBefore(grid, sectionList.firstChild);
    } else if (grid.parentElement !== sectionList) {
      sectionList.insertBefore(grid, sectionList.firstChild);
    }
    grid.style.display = 'grid';

    const sig = topEntries.map((e) => titleOf(e) + ':' + (($('img.ytms-pl-cover, yt-img-shadow img, img', e) || {}).src || '')).join('|');
    if (grid.dataset.sig === sig && grid.children.length === topEntries.length) return;
    grid.dataset.sig = sig;

    grid.replaceChildren(...topEntries.map((entry) => {
      const title = titleOf(entry);
      const imgSrc = (($('img.ytms-pl-cover, yt-img-shadow img, img', entry) || {}).src || '');
      const card = el('div', 'ytms-hq-card');

      const img = el('img');
      img.src = imgSrc;
      img.alt = title;

      const span = el('span', 'ytms-hq-title', title);

      const playBtn = el('button', 'ytms-hq-play');
      playBtn.type = 'button';
      playBtn.title = 'Reproduzir';
      playBtn.appendChild(svgIcon([PLAY_PATH]));
      playBtn.addEventListener('click', (ev) => {
        ev.stopPropagation();
        const nativePlay = $('ytmusic-play-button-renderer', entry);
        if (nativePlay) nativePlay.click();
        else {
          const item = $('tp-yt-paper-item, a', entry);
          if (item) item.click();
        }
      });

      card.addEventListener('click', () => {
        const item = $('tp-yt-paper-item, a', entry);
        if (item) item.click();
      });

      card.append(img, span, playBtn);
      return card;
    }));
  }

  let navToken = 0;
  function ensureNavLoading() {
    if (document.getElementById('ytms-nav-loading')) return;
    const box = el('div');
    box.id = 'ytms-nav-loading';
    box.setAttribute('aria-live', 'polite');
    const cover = el('img');
    cover.alt = '';
    cover.hidden = true;
    const spin = el('div', 'ytms-nav-spin');
    const name = el('div', 'ytms-nav-name');
    const label = el('div', 'ytms-nav-label', t('loading'));
    box.append(cover, name, spin, label);
    document.body.appendChild(box);

    let arm = 0;
    let kill = 0;
    const hide = (token) => {
      if (token && token !== navToken) return;
      clearTimeout(arm);
      clearTimeout(kill);
      document.body.classList.remove('ytms-nav-loading');
    };
    const show = (title, src) => {
      const token = ++navToken;
      name.textContent = title || t('loading');
      if (src) { cover.src = src; cover.hidden = false; } else cover.hidden = true;
      document.body.classList.add('ytms-nav-loading');
      clearTimeout(arm);
      clearTimeout(kill);

      arm = setTimeout(() => { if (!document.body.dataset.ytmsNavGo) hide(token); }, 900);
      kill = setTimeout(() => hide(token), 12000);
    };
    const markGo = () => { if (document.body.classList.contains('ytms-nav-loading')) document.body.dataset.ytmsNavGo = '1'; };
    const markDone = () => { delete document.body.dataset.ytmsNavGo; hide(navToken); };
    ['yt-navigate-start', 'yt-page-data-fetched'].forEach((type) => {
      document.addEventListener(type, markGo, true);
    });
    ['yt-navigate-finish', 'yt-navigate-error'].forEach((type) => {
      document.addEventListener(type, markDone, true);
    });

    document.addEventListener('pointerdown', (e) => {
      if (e.button !== 0) return;
      const t = e.target;
      if (!t || !t.closest) return;
      if (t.closest('#play-button, ytmusic-play-button-renderer, button')) return;
      const entry = t.closest('ytmusic-guide-entry-renderer');
      const card = entry || t.closest('ytmusic-two-row-item-renderer');
      if (!card) return;
      if (!entry && !t.closest('a, yt-formatted-string, .title')) return;
      const title = (entry ? titleOf(entry) : ((card.querySelector('.title') || {}).textContent || '')).replace(/\s+/g, ' ').trim();
      const img = card.querySelector('img.ytms-pl-cover, yt-img-shadow img, img');
      if (entry && entry.closest('#guide')) {
        $$('#guide ytmusic-guide-entry-renderer.ytms-nav-target').forEach((n) => n.classList.remove('ytms-nav-target'));
        entry.classList.add('ytms-nav-target');
      }
      delete document.body.dataset.ytmsNavGo;
      show(title, img && img.currentSrc || img && img.src);
    }, true);
  }

  function ensureSelectAll() {
    const bar = document.querySelector('ytmusic-multi-select-menu-bar');
    if (!bar || bar.querySelector('.ytms-select-all')) return;
    const btn = el('button', 'ytms-select-all', 'Selecionar todos');
    btn.type = 'button';
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      document.querySelectorAll('ytmusic-two-column-browse-results-renderer ytmusic-responsive-list-item-renderer yt-checkbox-renderer').forEach((cb) => {
        if (cb.getAttribute('aria-checked') !== 'true' && typeof cb.onClick === 'function') cb.onClick();
      });
    });
    const menu = bar.querySelector('#multiSelectMenu');
    if (menu) bar.insertBefore(btn, menu);
    else bar.appendChild(btn);
  }

  function ensureUi() {
    if (!document.body || document.body.classList.contains('ytms-scrubbing') || document.body.classList.contains('ytms-nav-loading')) return;
    makeResizer('ytms-resizer-left', 'left');
    makeResizer('ytms-resizer-right', 'right');
    ensureFrame();
    ensureNavLoading();
    ensurePanel();
    ensureHomeQuickGrid();
    ensurePlayerBarLayout();
    ensurePlayerButton();
    ensurePanelButton();
    ensureCovers();
    ensureEditClicks();
    ensureSearchMix();
    ensureStickyBar();
    ensureTrackHeader();
    ensureSelectAll();
    ensureHomeButton();
    ensureLibHeader();
    setupDnD();
    applyWidths();
    applySort();
    applyFilter();
    applyRightHidden();
    updatePanel();
    updateHero();
  }

  const refresh = debounce(ensureUi, 120);

  async function init() {
    await load();
    const boot = () => {
      ensureUi();
      document.addEventListener('ytms-ids-updated', refresh);
      document.addEventListener('yt-navigate-finish', refresh);
      document.addEventListener('ytms-list-updated', () => { trackPlayed(); refresh(); });
      document.addEventListener('ytms-data-updated', refresh);
      document.addEventListener('ytms-list-updated', ensureCovers);
      setupGuardClicks();
      setupShortcuts();
      document.addEventListener('scroll', onScrollSticky, true);
      window.addEventListener('resize', refresh);
      const markScrub = (on) => document.body && document.body.classList.toggle('ytms-scrubbing', on);
      document.addEventListener('pointerdown', (e) => {
        const t = e.target;
        if (t && t.closest && t.closest('ytmusic-player-bar #progress-bar, ytmusic-player-bar #volume-slider')) markScrub(true);
      }, true);
      document.addEventListener('pointerup', () => markScrub(false), true);
      document.addEventListener('pointercancel', () => markScrub(false), true);

      const watch = (sel, opts) => { const el = $(sel); if (el) new MutationObserver(refresh).observe(el, opts); };
      watch('ytmusic-app', { attributes: true, attributeFilter: ['is-guide-persistent', 'guide-collapsed'] });

      const layoutEl = $('ytmusic-app-layout');
      if (layoutEl) new MutationObserver(() => { syncGuard(); refresh(); }).observe(layoutEl, { attributes: true, attributeFilter: ['player-ui-state', 'player-visible'] });
      watch('ytmusic-player-bar', { attributes: true, attributeFilter: ['like-status'] });
      const guideItems = $('#guide ytmusic-guide-section-renderer:not([is-primary]) #items');
      if (guideItems) new MutationObserver(refresh).observe(guideItems, { childList: true });

      setInterval(() => {
        trackPlayed();
        ensurePlayerBarLayout();
        ensureSelectAll();
        updatePanel();
      }, 2000);

      if (hasStorage) {
        chrome.storage.onChanged.addListener((changes, area) => {
          if (area !== 'local' || !changes[KEY]) return;
          state = { ...DEFAULTS, ...changes[KEY].newValue };
          ensureUi();
        });
      }
    };

    const wait = () => ($('ytmusic-app-layout') && $('ytmusic-guide-renderer') ? boot() : setTimeout(wait, 400));
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', wait); else wait();
  }

  init();
})();
