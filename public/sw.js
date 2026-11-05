const CACHE_APP = 'cirqueirax-app-v1'
const CACHE_API = 'cirqueirax-api-v1'
const CACHES_ATUAIS = [CACHE_APP, CACHE_API]
const CHAVE_SHELL = '/__app-shell__'
const TEMPO_LIMITE_PAGINA_MS = 5000
const TEMPO_LIMITE_API_MS = 7000

const API_OFFLINE = [
  /^\/api\/v1\/livros-audio$/,
  /^\/api\/v1\/livros-audio\/estatisticas$/,
  /^\/api\/v1\/livros-audio\/[0-9a-f-]{36}$/,
  /^\/api\/v1\/livros-audio\/[0-9a-f-]{36}\/(blocos|vozes|marcacoes)$/,
  /^\/api\/v1\/livros-audio\/[0-9a-f-]{36}\/blocos\/\d+\/trechos$/,
]

const ARQUIVOS_RAIZ = /^\/(favicon[^/]*|apple-touch-icon\.png|android-chrome-[^/]+|site\.webmanifest)$/

self.addEventListener('install', () => {
  self.skipWaiting()
})

self.addEventListener('activate', (evento) => {
  evento.waitUntil(
    (async () => {
      for (const nome of await caches.keys()) {
        if (nome.startsWith('cirqueirax-') && !CACHES_ATUAIS.includes(nome)) {
          await caches.delete(nome)
        }
      }
      await self.clients.claim()
    })()
  )
})

self.addEventListener('message', (evento) => {
  const tipo = evento.data?.tipo
  if (tipo === 'preparar-offline') {
    evento.waitUntil(prepararOffline())
  } else if (tipo === 'limpar-dados') {
    evento.waitUntil(caches.delete(CACHE_API))
  }
})

self.addEventListener('fetch', (evento) => {
  const requisicao = evento.request
  if (requisicao.method !== 'GET') return

  const url = new URL(requisicao.url)
  if (url.origin !== self.location.origin) return

  if (requisicao.mode === 'navigate') {
    if (url.pathname.startsWith('/api/') || url.pathname.includes('.')) return
    evento.respondWith(navegar(requisicao))
    return
  }

  if (url.pathname.startsWith('/build/')) {
    evento.respondWith(arquivoFixo(requisicao))
    return
  }

  if (API_OFFLINE.some((padrao) => padrao.test(url.pathname))) {
    evento.respondWith(apiComReserva(requisicao))
    return
  }

  if (ARQUIVOS_RAIZ.test(url.pathname)) {
    evento.respondWith(arquivoFixo(requisicao))
  }
})

function esperar(promessa, milissegundos) {
  return new Promise((resolver, rejeitar) => {
    const temporizador = setTimeout(() => rejeitar(new Error('tempo-limite')), milissegundos)
    promessa.then(
      (valor) => {
        clearTimeout(temporizador)
        resolver(valor)
      },
      (erro) => {
        clearTimeout(temporizador)
        rejeitar(erro)
      }
    )
  })
}

async function navegar(requisicao) {
  const cache = await caches.open(CACHE_APP)
  const daRede = fetch(requisicao).then(async (resposta) => {
    const tipo = resposta.headers.get('content-type') ?? ''
    if (resposta.ok && tipo.includes('text/html')) {
      await cache.put(CHAVE_SHELL, resposta.clone())
    }
    return resposta
  })

  try {
    return await esperar(daRede, TEMPO_LIMITE_PAGINA_MS)
  } catch {
    const shell = await cache.match(CHAVE_SHELL)
    if (shell) return shell
    try {
      return await daRede
    } catch {
      return new Response(
        '<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width"><body style="background:#0c1110;color:#fff;font-family:sans-serif;padding:24px"><h2>Sem conexão</h2><p>Abra o CirqueiraX uma vez com internet para ele funcionar offline neste aparelho.</p></body>',
        { status: 503, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
      )
    }
  }
}

async function arquivoFixo(requisicao) {
  const cache = await caches.open(CACHE_APP)
  const guardado = await cache.match(requisicao, { ignoreVary: true })
  if (guardado) return guardado

  const resposta = await fetch(requisicao)
  if (resposta.ok && resposta.status === 200) {
    await cache.put(requisicao, resposta.clone())
  }
  return resposta
}

async function apiComReserva(requisicao) {
  const cache = await caches.open(CACHE_API)
  const chave = requisicao.url
  const daRede = fetch(requisicao).then(async (resposta) => {
    if (resposta.status === 200) {
      await cache.put(chave, resposta.clone())
    }
    return resposta
  })

  try {
    return await esperar(daRede, TEMPO_LIMITE_API_MS)
  } catch {
    const guardado = await cache.match(chave, { ignoreVary: true })
    if (guardado) {
      const corpo = await guardado.blob()
      const cabecalhos = new Headers(guardado.headers)
      cabecalhos.set('X-Cirqueirax-Offline', '1')
      return new Response(corpo, { status: 200, headers: cabecalhos })
    }
    try {
      return await daRede
    } catch {
      return new Response(
        JSON.stringify({ success: false, message: 'Sem conexão e sem cópia guardada.' }),
        { status: 503, headers: { 'Content-Type': 'application/json' } }
      )
    }
  }
}

async function prepararOffline() {
  let lista
  try {
    const resposta = await fetch('/build/sw-assets.json', { cache: 'no-store' })
    if (!resposta.ok) return
    lista = await resposta.json()
  } catch {
    return
  }

  const cache = await caches.open(CACHE_APP)
  const urls = (lista.arquivos ?? []).map((arquivo) => `/build/${arquivo}`)
  for (const url of urls) {
    if (await cache.match(url)) continue
    try {
      const resposta = await fetch(url, { cache: 'no-cache' })
      if (resposta.ok) await cache.put(url, resposta)
    } catch {
      return
    }
  }

  const validos = new Set(urls.map((url) => new URL(url, self.location.origin).href))
  for (const requisicao of await cache.keys()) {
    const caminho = new URL(requisicao.url).pathname
    if (
      caminho.startsWith('/build/') &&
      !caminho.startsWith('/build/pdfjs/') &&
      !validos.has(requisicao.url)
    ) {
      await cache.delete(requisicao)
    }
  }
}
