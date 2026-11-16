(() => {
  'use strict';

  let bridge = document.getElementById('ytms-bridge');
  if (!bridge) {
    bridge = document.createElement('div');
    bridge.id = 'ytms-bridge';
    bridge.hidden = true;
    document.documentElement.appendChild(bridge);
  }
  function publish(attr, value) {
    if (bridge.getAttribute(attr) !== value) {
      bridge.setAttribute(attr, value);
      document.dispatchEvent(new CustomEvent('ytms-data-updated'));
    }
  }

  const runsText = (x) => ((x && x.runs) || []).map((r) => r.text).join('');
  const pickThumb = (thumbs) => {
    if (!thumbs || !thumbs.length) return '';
    return (thumbs.find((t) => t.width >= 120) || thumbs[thumbs.length - 1]).url || '';
  };

  const GUIDE = 'ytmusic-guide-renderer';
  let idTimer = null;

  function idOf(entry) {
    const d = entry && entry.data;
    const nav = d && d.navigationEndpoint;
    if (!nav) return '';
    const browse = nav.browseEndpoint && nav.browseEndpoint.browseId;
    const watch = (nav.watchEndpoint && nav.watchEndpoint.playlistId) || (nav.watchPlaylistEndpoint && nav.watchPlaylistEndpoint.playlistId);
    const gid = d.entryData && d.entryData.guideEntryData && d.entryData.guideEntryData.guideEntryId;
    return (browse || watch || gid || '').replace(/^VL/, '');
  }

  function annotate() {
    const guide = document.querySelector(GUIDE);
    if (!guide) return;
    let changed = false;
    guide.querySelectorAll('ytmusic-guide-entry-renderer').forEach((entry) => {
      const id = idOf(entry);
      if (id && entry.getAttribute('data-ytms-id') !== id) {
        entry.setAttribute('data-ytms-id', id);
        changed = true;
      } else if (!id && entry.hasAttribute('data-ytms-id')) {
        entry.removeAttribute('data-ytms-id');
        changed = true;
      }
    });
    if (changed) document.dispatchEvent(new CustomEvent('ytms-ids-updated'));
  }

  function startIds() {
    const guide = document.querySelector(GUIDE);
    if (!guide) { setTimeout(startIds, 500); return; }

    new MutationObserver(() => { clearTimeout(idTimer); idTimer = setTimeout(annotate, 150); })
      .observe(guide, { subtree: true, childList: true, characterData: true });
    annotate();
  }

  function currentPlayer() { return document.getElementById('movie_player'); }

  function publishList() {
    const player = currentPlayer();
    let list = '';
    try {
      if (player) {
        const vd = typeof player.getVideoData === 'function' ? player.getVideoData() : null;
        list = (vd && vd.list) || (typeof player.getPlaylistId === 'function' ? player.getPlaylistId() : '') || '';
      }
    } catch (e) {  }
    list = String(list).replace(/^VL/, '');
    if (document.documentElement.getAttribute('data-ytms-list') !== list) {
      document.documentElement.setAttribute('data-ytms-list', list);
      document.dispatchEvent(new CustomEvent('ytms-list-updated'));
    }
  }

  let queueEndpoints = [];

  function publishQueue() {
    const all = [...document.querySelectorAll('ytmusic-player-queue-item')]
      .filter((i) => !(i.parentElement && i.parentElement.id === 'counterpart-renderer') && i.data);
    let cur = all.findIndex((i) => i.data.selected === true);
    if (cur < 0) cur = all.findIndex((i) => i.hasAttribute('selected'));
    const next = all.slice(cur + 1, cur + 7);
    queueEndpoints = next.map((i) => i.data.navigationEndpoint || i.data.queueNavigationEndpoint || null);
    publish('data-queue', JSON.stringify(next.map((i, n) => ({
      i: n,
      title: runsText(i.data.title),
      sub: runsText(i.data.longBylineText || i.data.shortBylineText),
      thumb: pickThumb(i.data.thumbnail && i.data.thumbnail.thumbnails),
      len: runsText(i.data.lengthText),
    }))));
  }

  const relCache = new Map();
  let relEndpoints = new Map();
  let lastVid = '';

  async function authHeaders() {
    const m = document.cookie.match(/(?:^|; )(?:__Secure-3PAPISID|SAPISID)=([^;]+)/);
    if (!m) return {};
    const ts = Math.floor(Date.now() / 1000);
    const buf = await crypto.subtle.digest('SHA-1', new TextEncoder().encode(ts + ' ' + m[1] + ' ' + location.origin));
    const hash = Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, '0')).join('');

    const cfg = window.ytcfg;
    const headers = { authorization: 'SAPISIDHASH ' + ts + '_' + hash, 'x-origin': location.origin, 'x-goog-authuser': String((cfg && cfg.get && cfg.get('SESSION_INDEX')) || '0') };
    const pageId = cfg && cfg.get && cfg.get('DELEGATED_SESSION_ID');
    if (pageId) headers['x-goog-pageid'] = pageId;
    return headers;
  }

  async function post(endpoint, body, auth) {
    const cfg = window.ytcfg;
    const context = cfg && cfg.get && cfg.get('INNERTUBE_CONTEXT');
    const key = cfg && cfg.get && cfg.get('INNERTUBE_API_KEY');
    if (!context) throw new Error('ytcfg indisponível');
    const res = await fetch('/youtubei/v1/' + endpoint + '?prettyPrint=false' + (key ? '&key=' + encodeURIComponent(key) : ''), {
      method: 'POST',
      credentials: 'include',
      headers: Object.assign({ 'content-type': 'application/json' }, auth ? await authHeaders() : {}),
      body: JSON.stringify(Object.assign({ context }, body)),
    });
    if (!res.ok) throw new Error('http ' + res.status);
    return res.json();
  }

  function parseRelated(json) {
    const sections = [];
    const eps = new Map();
    let n = 0;
    const blocks = (json && json.contents && json.contents.sectionListRenderer && json.contents.sectionListRenderer.contents) || [];
    for (const block of blocks) {
      const car = block.musicCarouselShelfRenderer;
      if (!car) continue;
      const items = [];
      for (const it of car.contents || []) {
        const r = it.musicResponsiveListItemRenderer;
        if (!r) continue;
        const cols = (r.flexColumns || []).map((f) => (f.musicResponsiveListItemFlexColumnRenderer && f.musicResponsiveListItemFlexColumnRenderer.text) || {});
        const title = runsText(cols[0]);
        const first = (cols[0].runs || [])[0];
        const overlay = r.overlay && r.overlay.musicItemThumbnailOverlayRenderer && r.overlay.musicItemThumbnailOverlayRenderer.content
          && r.overlay.musicItemThumbnailOverlayRenderer.content.musicPlayButtonRenderer;
        const ep = (first && first.navigationEndpoint) || (overlay && overlay.playNavigationEndpoint);
        if (!title || !ep || !ep.watchEndpoint) continue;
        const sub = [runsText(cols[1]), runsText(cols[2])].filter(Boolean).join(' • ');
        const thumbs = r.thumbnail && r.thumbnail.musicThumbnailRenderer && r.thumbnail.musicThumbnailRenderer.thumbnail
          && r.thumbnail.musicThumbnailRenderer.thumbnail.thumbnails;
        const id = 'r' + n++;
        eps.set(id, ep);
        items.push({ id, title, sub, thumb: pickThumb(thumbs) });
        if (items.length >= 4) break;
      }
      if (items.length) {
        const head = car.header && car.header.musicCarouselShelfBasicHeaderRenderer;
        sections.push({ title: (head && runsText(head.title)) || 'Relacionados', items });
        if (sections.length >= 2) break;
      }
    }
    return { sections, eps };
  }

  async function loadRelated(vid) {
    if (relCache.has(vid)) {
      const c = relCache.get(vid);
      relEndpoints = c.eps;
      publish('data-related', JSON.stringify({ vid, sections: c.sections }));
      return;
    }
    try {
      const nx = await post('next', { videoId: vid, isAudioOnly: true });
      const tabs = (((nx.contents || {}).singleColumnMusicWatchNextResultsRenderer || {}).tabbedRenderer || {})
        .watchNextTabbedResultsRenderer;
      const tab = ((tabs && tabs.tabs) || []).map((t) => t.tabRenderer).find((t) => {
        const cfg = t && t.endpoint && t.endpoint.browseEndpoint && t.endpoint.browseEndpoint.browseEndpointContextSupportedConfigs;
        return cfg && cfg.browseEndpointContextMusicConfig && cfg.browseEndpointContextMusicConfig.pageType === 'MUSIC_PAGE_TYPE_TRACK_RELATED';
      });
      if (!tab) throw new Error('sem aba de relacionados');
      const browse = await post('browse', { browseId: tab.endpoint.browseEndpoint.browseId });
      const parsed = parseRelated(browse);
      relCache.set(vid, parsed);
      if (relCache.size > 40) relCache.delete(relCache.keys().next().value);
      if (vid !== lastVid) return;
      relEndpoints = parsed.eps;
      publish('data-related', JSON.stringify({ vid, sections: parsed.sections }));
    } catch (e) {
      if (vid === lastVid) publish('data-related', JSON.stringify({ vid, sections: [] }));
    }
  }

  let relTimer = null;

  let covers = {};
  let coversAt = 0;
  const coverMiss = new Set();
  function coverStatus(o) { publish('data-covers-status', JSON.stringify(o)); }

  function firstThumb(json) {
    let url = '';
    (function walk(o) {
      if (url || !o || typeof o !== 'object') return;
      const t = o.musicThumbnailRenderer || o.croppedSquareThumbnailRenderer;
      if (t && t.thumbnail && t.thumbnail.thumbnails && t.thumbnail.thumbnails.length) { url = t.thumbnail.thumbnails[0].url; return; }
      for (const k in o) walk(o[k]);
    })(json && (json.header || json));
    return url;
  }

  async function loadCovers() {
    if (Date.now() - coversAt < 60000) return;
    coversAt = Date.now();
    const status = { listed: 0, extra: 0, missing: 0, err: '', at: Date.now() };
    publish('data-account', String((window.ytcfg && window.ytcfg.get && window.ytcfg.get('SESSION_INDEX')) || '0'));
    try {
      if (!/(?:^|; )(?:__Secure-3PAPISID|SAPISID)=/.test(document.cookie)) status.err = 'cookie de login não encontrado';
      const found = {};
      let json = await post('browse', { browseId: 'FEmusic_liked_playlists' }, true);
      for (let page = 0; page < 12; page++) {
        let token = null;
        (function walk(o) {
          if (!o || typeof o !== 'object') return;
          const t = o.musicTwoRowItemRenderer;
          if (t) {
            const id = t.navigationEndpoint && t.navigationEndpoint.browseEndpoint && t.navigationEndpoint.browseEndpoint.browseId;
            const th = t.thumbnailRenderer && t.thumbnailRenderer.musicThumbnailRenderer && t.thumbnailRenderer.musicThumbnailRenderer.thumbnail;
            const list = th && th.thumbnails;
            if (id && list && list.length) found[id.replace(/^VL/, '')] = list[0].url;
            return;
          }
          if (o.nextContinuationData && o.nextContinuationData.continuation) token = o.nextContinuationData.continuation;
          if (o.continuationCommand && o.continuationCommand.token) token = o.continuationCommand.token;
          for (const k in o) walk(o[k]);
        })(json);
        if (!token) break;
        json = await post('browse', { continuation: token }, true);
      }
      status.listed = Object.keys(found).length;
      covers = Object.assign({}, covers, found);
      if (status.listed) publish('data-covers', JSON.stringify(covers));

      const ids = Array.from(document.querySelectorAll('ytmusic-guide-renderer ytmusic-guide-entry-renderer[data-ytms-id]'))
        .map((e) => e.getAttribute('data-ytms-id')).filter((id) => id && !/^FE/.test(id));
      const missing = ids.filter((id) => !covers[id] && !coverMiss.has(id)).slice(0, 60);
      status.missing = missing.length;
      for (let i = 0; i < missing.length; i += 4) {
        await Promise.all(missing.slice(i, i + 4).map(async (id) => {
          try {
            const url = firstThumb(await post('browse', { browseId: 'VL' + id, browseEndpointContextSupportedConfigs: { browseEndpointContextMusicConfig: { pageType: 'MUSIC_PAGE_TYPE_PLAYLIST' } } }, true));
            if (url) { covers[id] = url; status.extra++; } else coverMiss.add(id);
          } catch (e) { coverMiss.add(id); }
        }));
        publish('data-covers', JSON.stringify(covers));
      }
    } catch (e) {
      status.err = String((e && e.message) || e);
      coversAt = Date.now() - 50000;
    }
    coverStatus(status);
  }

  function checkVideo() {
    const player = currentPlayer();
    let vid = '';
    try { vid = (player && player.getVideoData && player.getVideoData().video_id) || ''; } catch (e) {  }
    if (!vid || vid === lastVid) return;
    lastVid = vid;
    clearTimeout(relTimer);
    relTimer = setTimeout(() => loadRelated(vid), 500);
  }

  function navigate(endpoint) {
    const app = document.querySelector('ytmusic-app');
    if (app) app.dispatchEvent(new CustomEvent('yt-navigate', { bubbles: true, composed: true, detail: { endpoint } }));
  }
  document.addEventListener('ytms-cmd', () => {
    let cmd = null;
    try { cmd = JSON.parse(bridge.getAttribute('data-cmd') || 'null'); } catch (e) { return; }
    if (!cmd) return;
    if (cmd.t === 'volume') {

      const sl = document.querySelector('ytmusic-player-bar #volume-slider');
      const pl = currentPlayer();
      if (sl) {
        const v = Math.max(0, Math.min(100, Math.round(Number(sl.value) + (Number(cmd.d) || 0))));
        sl.value = v;
        sl.dispatchEvent(new CustomEvent('immediate-value-change', { bubbles: true, composed: true }));
        publish('data-volume', String(v));
      } else if (pl && pl.getVolume && pl.setVolume) {
        const v = Math.max(0, Math.min(100, Math.round(pl.getVolume() + (Number(cmd.d) || 0))));
        pl.setVolume(v);
        publish('data-volume', String(v));
      }
      return;
    }
    const ep = cmd.t === 'queue' ? queueEndpoints[cmd.i] : cmd.t === 'related' ? relEndpoints.get(cmd.id) : cmd.t === 'search' ? searchEndpoints.get(cmd.id) : null;
    if (ep) navigate(ep);
  });

  function smoothSliders() {
    document.querySelectorAll('ytmusic-player-bar #progress-bar, ytmusic-player-bar #volume-slider').forEach((sl) => {
      if (!sl || sl.__ytmsSlide || typeof sl._trackX !== 'function' || typeof sl.fire !== 'function') return;
      sl.__ytmsSlide = true;
      const origTrack = sl._trackX;
      const origStart = sl._trackStart;
      const origEnd = sl._trackEnd;
      const origFire = sl.fire.bind(sl);
      const ratioOf = (el) => {
        const max = Number(el.max) || 100;
        const min = Number(el.min) || 0;
        return max === min ? 0 : (el.immediateValue - min) / (max - min);
      };
      sl.fire = function (type, detail) {
        if (type === 'immediate-value-change' && this.dragging) return;
        return origFire(type, detail);
      };
      sl._trackStart = function (ev) {
        document.body.classList.add('ytms-scrubbing');
        const fill = (this.$ && this.$.primaryProgress) || this.querySelector('#primaryProgress');
        const p = ratioOf(this);
        this.style.setProperty('--ytms-p', String(p));
        if (fill) fill.style.setProperty('--ytms-p', String(p));
        this.classList.add('ytms-drag');
        return origStart.call(this, ev);
      };
      sl._trackX = function (ev) {
        origTrack.call(this, ev);
        const p = ratioOf(this);
        const fill = this.querySelector('#primaryProgress');
        if (fill) fill.style.transform = 'scaleX(' + p + ')';
        if (this.id !== 'volume-slider') return;
        const player = document.getElementById('movie_player');
        if (!player || !player.setVolume) return;
        const ui = Math.max(0, Math.min(100, this.immediateValue));
        player.setVolume(Math.round(ui * ui / 100));
        if (ui > 0 && player.isMuted && player.isMuted()) player.unMute();
      };
      sl._trackEnd = function () {
        try { origFire('immediate-value-change', { composed: true }); } catch (e) {  }
        const result = origEnd.call(this);
        this.classList.remove('ytms-drag');
        document.body.classList.remove('ytms-scrubbing');
        return result;
      };
    });
  }

  setInterval(() => {
    publishList();
    publishQueue();
    checkVideo();
    loadCovers();
    loadSearchMix();
    smoothSliders();
  }, 1000);

  smoothSliders();
  window.addEventListener('pointerup', () => {
    const down = document.querySelector('ytmusic-player-bar #sliderKnob.dragging');
    if (!down) {
      document.body.classList.remove('ytms-scrubbing');
      document.querySelectorAll('.ytms-drag').forEach((el) => el.classList.remove('ytms-drag'));
    }
  }, true);
  window.addEventListener('pointercancel', () => document.body.classList.remove('ytms-scrubbing'), true);

  startIds();
})();
