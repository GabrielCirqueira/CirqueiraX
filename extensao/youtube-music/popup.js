const CHAVE_TOKEN = 'token'
const CHAVE_ESTADO = 'estado'
const PADRAO_TOKEN = /^cxyt_[a-f0-9]{64}$/

const elementos = {
  situacao: document.getElementById('situacao'),
  aparelho: document.getElementById('aparelho'),
  ultimoEnvio: document.getElementById('ultimo-envio'),
  ultimaMusica: document.getElementById('ultima-musica'),
  pendentes: document.getElementById('pendentes'),
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

function descreverEstado(temToken, estado) {
  if (!temToken) return { texto: 'Sem token. Cole o token gerado no CirqueiraX.', tipo: 'neutra' }
  if (estado.erro) return { texto: estado.erro, tipo: 'erro' }
  if (estado.ultimoEnvioEm)
    return { texto: 'Conectada. As músicas deste navegador estão sendo registradas.', tipo: 'ok' }
  return { texto: 'Token salvo. Toque uma música no YouTube Music.', tipo: 'neutra' }
}

async function renderizar() {
  const dados = await chrome.storage.local.get([CHAVE_TOKEN, CHAVE_ESTADO])
  const estado = dados[CHAVE_ESTADO] ?? {}
  const situacao = descreverEstado(Boolean(dados[CHAVE_TOKEN]), estado)
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
renderizar()
