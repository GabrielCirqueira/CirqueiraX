(() => {
  const $ = (id) => document.getElementById(id);
  const KEY = 'ytms';
  const URL_YTM = 'https://music.youtube.com/';

  const STR = {
    pt: {
      version: 'Versão ', on: 'Ativa no YT Music (aba aberta)', off: 'Abra o YT Music para ver o tema',
      tipsH: 'Dicas', tip1: 'Arraste a borda das sidebars para mudar a largura (duplo clique restaura).', tip2: 'Ordene as playlists por nome, última tocada ou ordem personalizada (arrastando).',
      tip3: 'O botão de telinha na barra de baixo abre vídeo, letra e comentários.', tip4: 'Clique na capa, título ou descrição de uma playlist sua para editar.',
      keysH: 'Atalhos', k1: 'Buscar', k2: 'Volume', k3: 'Vídeo, letra e comentários', k4: 'Mostrar/ocultar "Tocando agora"', k5: 'Curtir a música', k6: 'Buscar na biblioteca', k7: 'Trocar a ordenação',
      open: 'Abrir YT Music', reset: 'Restaurar larguras', diag: 'Diagnóstico', resetDone: 'Larguras restauradas.',
      d0: 'Consultando…', dNoTab: 'Nenhuma aba do YT Music aberta.', dNoAnswer: 'A aba não respondeu. Feche e abra o YT Music de novo (a extensão pode ter sido atualizada).',
      dVer: 'Versão da extensão: ', dEntries: 'Playlists na sidebar: ', dWithId: ' (com ID: ', dCovers: 'Capas inseridas: ', dLoaded: ' (carregadas: ', dKnown: 'Capas conhecidas: ', dBridge: 'Ponte com a página: ', dOk: 'ok', dFail: 'FALHOU',
      dFetch: 'Busca de capas: lista=', dExtra: ', extras=', dMissing: ', faltavam=', dErr: ', erro: ', dNever: 'Busca de capas: ainda não rodou', dAcct: 'Conta (índice): ',
    },
    en: {
      version: 'Version ', on: 'Active on YT Music (tab open)', off: 'Open YT Music to see the theme',
      tipsH: 'Tips', tip1: 'Drag the edge of the sidebars to resize them (double-click resets).', tip2: 'Sort playlists by name, last played or a custom order (drag and drop).',
      tip3: 'The screen button in the bottom bar opens video, lyrics and comments.', tip4: 'Click the cover, title or description of your own playlist to edit it.',
      keysH: 'Shortcuts', k1: 'Search', k2: 'Volume', k3: 'Video, lyrics and comments', k4: 'Show/hide "Now playing"', k5: 'Like the song', k6: 'Search your library', k7: 'Change sorting',
      open: 'Open YT Music', reset: 'Reset widths', diag: 'Diagnostics', resetDone: 'Widths reset.',
      d0: 'Checking…', dNoTab: 'No YT Music tab is open.', dNoAnswer: 'The tab did not answer. Close and reopen YT Music (the extension may have been updated).',
      dVer: 'Extension version: ', dEntries: 'Playlists in the sidebar: ', dWithId: ' (with ID: ', dCovers: 'Covers inserted: ', dLoaded: ' (loaded: ', dKnown: 'Known covers: ', dBridge: 'Page bridge: ', dOk: 'ok', dFail: 'FAILED',
      dFetch: 'Cover lookup: list=', dExtra: ', extra=', dMissing: ', missing=', dErr: ', error: ', dNever: 'Cover lookup: has not run yet', dAcct: 'Account (index): ',
    },
    es: {
      version: 'Versión ', on: 'Activa en YT Music (pestaña abierta)', off: 'Abre YT Music para ver el tema',
      tipsH: 'Consejos', tip1: 'Arrastra el borde de las barras laterales para cambiar el ancho (doble clic lo restablece).', tip2: 'Ordena las listas por nombre, última reproducida u orden personalizado (arrastrando).',
      tip3: 'El botón de pantalla en la barra inferior abre vídeo, letra y comentarios.', tip4: 'Haz clic en la portada, el título o la descripción de una lista tuya para editarla.',
      keysH: 'Atajos', k1: 'Buscar', k2: 'Volumen', k3: 'Vídeo, letra y comentarios', k4: 'Mostrar/ocultar "Reproduciendo"', k5: 'Dar me gusta', k6: 'Buscar en la biblioteca', k7: 'Cambiar el orden',
      open: 'Abrir YT Music', reset: 'Restablecer anchos', diag: 'Diagnóstico', resetDone: 'Anchos restablecidos.',
      d0: 'Consultando…', dNoTab: 'No hay ninguna pestaña de YT Music abierta.', dNoAnswer: 'La pestaña no respondió. Cierra y abre YT Music de nuevo (la extensión puede haberse actualizado).',
      dVer: 'Versión de la extensión: ', dEntries: 'Listas en la barra lateral: ', dWithId: ' (con ID: ', dCovers: 'Portadas insertadas: ', dLoaded: ' (cargadas: ', dKnown: 'Portadas conocidas: ', dBridge: 'Puente con la página: ', dOk: 'ok', dFail: 'FALLÓ',
      dFetch: 'Búsqueda de portadas: lista=', dExtra: ', extras=', dMissing: ', faltaban=', dErr: ', error: ', dNever: 'Búsqueda de portadas: aún no se ejecutó', dAcct: 'Cuenta (índice): ',
    },
  };
  const ui = String((chrome.i18n && chrome.i18n.getUILanguage && chrome.i18n.getUILanguage()) || navigator.language || 'en').toLowerCase();
  const lang = ui.startsWith('pt') ? 'pt' : ui.startsWith('es') ? 'es' : 'en';
  const t = (k) => STR[lang][k] || STR.en[k] || k;
  document.documentElement.lang = lang;
  document.querySelectorAll('[data-i18n]').forEach((n) => { n.textContent = t(n.getAttribute('data-i18n')); });

  $('ver').textContent = t('version') + chrome.runtime.getManifest().version;
  $('statusText').textContent = t('off');

  chrome.tabs.query({ url: URL_YTM + '*' }, (tabs) => {
    const on = !chrome.runtime.lastError && tabs && tabs.length > 0;
    $('status').classList.toggle('on', on);
    $('statusText').textContent = on ? t('on') : t('off');
  });

  $('open').addEventListener('click', () => {
    chrome.tabs.query({ url: URL_YTM + '*' }, (tabs) => {
      if (tabs && tabs.length) {
        chrome.tabs.update(tabs[0].id, { active: true });
        chrome.windows.update(tabs[0].windowId, { focused: true });
      } else {
        chrome.tabs.create({ url: URL_YTM });
      }
      window.close();
    });
  });

  $('reset').addEventListener('click', () => {
    chrome.storage.local.get(KEY, (res) => {
      const cur = (res && res[KEY]) || {};
      chrome.storage.local.set({ [KEY]: Object.assign({}, cur, { leftWidth: 300, rightWidth: 340 }) }, () => {
        $('msg').textContent = t('resetDone');
      });
    });
  });

  $('diag').addEventListener('click', () => {
    const out = $('diagOut');
    out.hidden = false;
    out.textContent = t('d0');
    chrome.tabs.query({ url: URL_YTM + '*' }, (tabs) => {
      if (!tabs || !tabs.length) { out.textContent = t('dNoTab'); return; }
      chrome.tabs.sendMessage(tabs[0].id, { type: 'ytms-diag' }, (res) => {
        if (chrome.runtime.lastError || !res) { out.textContent = t('dNoAnswer'); return; }
        const st = res.status;
        out.textContent = [
          t('dVer') + res.version,
          t('dAcct') + (res.account === undefined || res.account === null ? '?' : res.account),
          t('dEntries') + res.entries + t('dWithId') + res.withId + ')',
          t('dCovers') + res.withCover + t('dLoaded') + res.loaded + ')',
          t('dKnown') + res.coversKnown,
          t('dBridge') + (res.bridge ? t('dOk') : t('dFail')),
          st ? t('dFetch') + st.listed + t('dExtra') + st.extra + t('dMissing') + st.missing + (st.err ? t('dErr') + st.err : '') : t('dNever'),
        ].join('\n');
      });
    });
  });
})();
