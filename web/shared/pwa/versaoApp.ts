const INTERVALO_VERIFICACAO_MS = 60_000
const PADRAO_SCRIPT_PRINCIPAL = /\/build\/assets\/app-[\w-]+\.js/
const SELETOR_SCRIPT_PRINCIPAL = 'script[type="module"][src*="/build/assets/app-"]'

let atualizacaoPendente = false

function scriptCarregado(): string | null {
  const script = document.querySelector<HTMLScriptElement>(SELETOR_SCRIPT_PRINCIPAL)
  return script ? new URL(script.src).pathname : null
}

async function scriptPublicado(): Promise<string | null> {
  const resposta = await fetch('/', { cache: 'no-store', headers: { Accept: 'text/html' } })
  if (!resposta.ok) return null
  return (await resposta.text()).match(PADRAO_SCRIPT_PRINCIPAL)?.[0] ?? null
}

function midiaTocando(): boolean {
  return Array.from(document.querySelectorAll<HTMLMediaElement>('audio, video')).some(
    (midia) => !midia.paused && !midia.ended
  )
}

function usuarioDigitando(): boolean {
  const ativo = document.activeElement
  return (
    ativo instanceof HTMLInputElement ||
    ativo instanceof HTMLTextAreaElement ||
    ativo instanceof HTMLSelectElement ||
    (ativo instanceof HTMLElement && ativo.isContentEditable)
  )
}

function recarregarSePossivel() {
  if (!atualizacaoPendente || !navigator.onLine || midiaTocando()) return
  if (document.visibilityState === 'visible' && usuarioDigitando()) return
  window.location.reload()
}

async function verificarVersao() {
  if (atualizacaoPendente) {
    recarregarSePossivel()
    return
  }

  const carregado = scriptCarregado()
  if (!carregado || !navigator.onLine) return

  try {
    const publicado = await scriptPublicado()
    atualizacaoPendente = publicado !== null && publicado !== carregado
  } catch {
    return
  }

  recarregarSePossivel()
}

export function iniciarVerificacaoVersao() {
  if (!import.meta.env.PROD) return

  window.setInterval(verificarVersao, INTERVALO_VERIFICACAO_MS)
  document.addEventListener('visibilitychange', () => {
    verificarVersao()
  })
}
