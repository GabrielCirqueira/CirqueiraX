const CHAVE_TOKEN = 'token'
const CHAVE_ESTADO = 'estado'
const CHAVE_ABA = 'aba'
const PADRAO_TOKEN = /^cxyt_[a-f0-9]{64}$/
const VALIDADE_PRESENCA_MS = 15000
const TEXTO_SEM_ABA = 'Nenhuma aba sendo lida. Abra o YouTube Music ou recarregue a aba (F5).'
const TEXTO_SITUACAO_ABA = {
  tocando: (titulo) => `Lendo: ${titulo}`,
  pausada: (titulo) => `Pausada: ${titulo}`,
  anuncio: () => 'Anúncio (não conta)',
  parada: () => 'Aberta, nada tocando',
}

const elementos = {
  situacao: document.getElementById('situacao'),
  aparelho: document.getElementById('aparelho'),
  ultimoEnvio: document.getElementById('ultimo-envio'),
  ultimaMusica: document.getElementById('ultima-musica'),
  pendentes: document.getElementById('pendentes'),
  aba: document.getElementById('aba'),
  formulario: document.getElementById('formulario'),
  token: document.getElementById('token'),
  remover: document.getElementById('remover'),
}

function formatarMomento(milissegundos) {
  if (!milissegundos) return '—'
  return new Date(milissegundos).toLocaleString('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'medium',
  })
}

function mostrarSituacao(texto, tipo) {
  elementos.situacao.textContent = texto
  elementos.situacao.className = `situacao situacao--${tipo}`
}

function abaAtiva(aba) {
  return Boolean(aba?.em) && Date.now() - aba.em < VALIDADE_PRESENCA_MS
}

function descreverAba(aba) {
  if (!abaAtiva(aba)) return TEXTO_SEM_ABA
  return (TEXTO_SITUACAO_ABA[aba.situacao] ?? TEXTO_SITUACAO_ABA.parada)(aba.titulo)
}

function descreverEstado(temToken, estado, aba) {
  if (!temToken) return { texto: 'Sem token. Cole o token gerado no CirqueiraX.', tipo: 'neutra' }
  if (estado.erro) return { texto: estado.erro, tipo: 'erro' }
  if (estado.desativada)
    return {
      texto:
        'A extensão está desligada no CirqueiraX (a fonte ativa é a conexão por cookies). Para usar a extensão, ative em Música → Gerenciar.',
      tipo: 'erro',
    }
  if (!abaAtiva(aba))
    return { texto: 'Token ok, mas nenhuma aba do YouTube Music está sendo lida.', tipo: 'erro' }
  return { texto: 'Conectada. As músicas desta aba estão sendo registradas.', tipo: 'ok' }
}

async function renderizar() {
  const dados = await chrome.storage.local.get([CHAVE_TOKEN, CHAVE_ESTADO, CHAVE_ABA])
  const estado = dados[CHAVE_ESTADO] ?? {}
  const aba = dados[CHAVE_ABA]
  const situacao = descreverEstado(Boolean(dados[CHAVE_TOKEN]), estado, aba)
  elementos.aba.textContent = descreverAba(aba)
  mostrarSituacao(situacao.texto, situacao.tipo)
  elementos.aparelho.textContent = estado.aparelho ?? '—'
  elementos.ultimoEnvio.textContent = formatarMomento(estado.ultimoEnvioEm)
  elementos.ultimaMusica.textContent = estado.ultimaMusica ?? '—'
  elementos.pendentes.textContent = String(estado.pendentes ?? 0)
  elementos.token.placeholder = dados[CHAVE_TOKEN]
    ? 'Token salvo (cole outro para trocar)'
    : 'cxyt_…'
}

elementos.formulario.addEventListener('submit', async (evento) => {
  evento.preventDefault()
  const token = elementos.token.value.trim()
  if (token && !PADRAO_TOKEN.test(token)) {
    mostrarSituacao(
      'Esse texto não parece um token da extensão. Copie de novo no CirqueiraX.',
      'erro'
    )
    return
  }
  if (token) await chrome.storage.local.set({ [CHAVE_TOKEN]: token })
  elementos.token.value = ''
  mostrarSituacao('Testando…', 'neutra')
  await chrome.runtime.sendMessage({ tipo: 'testar' })
  await renderizar()
})

elementos.remover.addEventListener('click', async () => {
  await chrome.storage.local.remove([CHAVE_TOKEN, CHAVE_ESTADO])
  await renderizar()
})

chrome.storage.onChanged.addListener(renderizar)
setInterval(renderizar, VALIDADE_PRESENCA_MS)
renderizar()
