const URL_SISTEMA = 'https://x.cirqueira.com'
const URL_EVENTOS = `${URL_SISTEMA}/api/v1/youtube-music/extensao/eventos`
const CHAVE_FILA = 'fila'
const CHAVE_TOKEN = 'token'
const CHAVE_ESTADO = 'estado'
const ALARME_ENVIO = 'enviar-fila'
const MINUTOS_ENTRE_ENVIOS = 1
const MAXIMO_POR_ENVIO = 50
const STATUS_TOKEN_INVALIDO = 401
const STATUS_DADOS_INVALIDOS = 422
const PRIORIDADE_TIPO = { inicio: 0, progresso: 1, fim: 2 }
const MENSAGEM_SEM_TOKEN = 'Cole o token gerado na página Música do CirqueiraX.'
const MENSAGEM_SEM_CONEXAO =
  'Sem conexão com o CirqueiraX. Os eventos ficam guardados e serão enviados depois.'
const MENSAGEM_TOKEN_INVALIDO = 'Token inválido ou revogado. Gere um novo na página Música.'

let cadeia = Promise.resolve()

function emSerie(tarefa) {
  cadeia = cadeia.then(tarefa, tarefa)
  return cadeia
}

const ENDERECO_YOUTUBE_MUSIC = 'https://music.youtube.com/*'
const URL_VIDEO_YOUTUBE_MUSIC = 'https://music.youtube.com/watch?v='
const PADRAO_VIDEO_ID = /^[A-Za-z0-9_-]{11}$/
const MENSAGEM_ORIGEM_DESCONHECIDA = 'Pedido de uma página que não é o CirqueiraX.'
const MENSAGEM_VIDEO_INVALIDO = 'Vídeo inválido.'

function agendarEnvio() {
  chrome.alarms.create(ALARME_ENVIO, { periodInMinutes: MINUTOS_ENTRE_ENVIOS })
}

async function injetarNasAbasAbertas() {
  const abas = await chrome.tabs.query({ url: ENDERECO_YOUTUBE_MUSIC }).catch(() => [])
  for (const aba of abas) {
    const alvo = { tabId: aba.id }
    await chrome.scripting
      .executeScript({ target: alvo, files: ['pagina.js'], world: 'MAIN' })
      .catch(() => undefined)
    await chrome.scripting
      .executeScript({ target: alvo, files: ['conteudo.js'] })
      .catch(() => undefined)
  }
  const paginasSistema = await chrome.tabs.query({ url: `${URL_SISTEMA}/*` }).catch(() => [])
  for (const aba of paginasSistema) {
    await chrome.scripting
      .executeScript({ target: { tabId: aba.id }, files: ['ponte.js'] })
      .catch(() => undefined)
  }
}

function aoIniciar() {
  agendarEnvio()
  injetarNasAbasAbertas()
}

chrome.runtime.onInstalled.addListener(aoIniciar)
chrome.runtime.onStartup.addListener(aoIniciar)

chrome.alarms.onAlarm.addListener((alarme) => {
  if (alarme.name === ALARME_ENVIO) enviarFila(false)
})

chrome.runtime.onMessage.addListener((mensagem, remetente, responder) => {
  if (mensagem?.tipo === 'evento') {
    enfileirar(mensagem.evento).then(() => enviarFila(false))
    return false
  }
  if (mensagem?.tipo === 'tocar') {
    tocarVideo(mensagem.videoId, remetente).then(responder)
    return true
  }
  if (mensagem?.tipo === 'testar') {
    enviarFila(true).then(responder)
    return true
  }
  return false
})

function veioDoSistema(remetente) {
  return typeof remetente?.url === 'string' && remetente.url.startsWith(`${URL_SISTEMA}/`)
}

function escolherAba(abas) {
  return abas.find((aba) => aba.audible) ?? abas.find((aba) => aba.active) ?? abas[0] ?? null
}

async function tocarVideo(videoId, remetente) {
  if (!veioDoSistema(remetente)) return { ok: false, mensagem: MENSAGEM_ORIGEM_DESCONHECIDA }
  if (typeof videoId !== 'string' || !PADRAO_VIDEO_ID.test(videoId))
    return { ok: false, mensagem: MENSAGEM_VIDEO_INVALIDO }
  const url = `${URL_VIDEO_YOUTUBE_MUSIC}${videoId}`
  const aba = escolherAba(await chrome.tabs.query({ url: ENDERECO_YOUTUBE_MUSIC }).catch(() => []))
  try {
    if (!aba) {
      await chrome.tabs.create({ url, active: true })
      return { ok: true, novaAba: true }
    }
    await chrome.tabs.update(aba.id, { url, active: true })
    return { ok: true, novaAba: false }
  } catch {
    return { ok: false, mensagem: 'Não foi possível abrir o YouTube Music.' }
  }
}

function enfileirar(evento) {
  return emSerie(async () => {
    const { [CHAVE_FILA]: fila = {} } = await chrome.storage.local.get(CHAVE_FILA)
    const anterior = fila[evento.idReproducao]
    const manterTipoAnterior =
      anterior && PRIORIDADE_TIPO[anterior.tipo] > PRIORIDADE_TIPO[evento.tipo]
    fila[evento.idReproducao] = {
      ...evento,
      tipo: manterTipoAnterior ? anterior.tipo : evento.tipo,
      pulada: evento.pulada ?? anterior?.pulada ?? null,
      versao: (anterior?.versao ?? 0) + 1,
    }
    await chrome.storage.local.set({ [CHAVE_FILA]: fila })
  })
}

async function salvarEstado(parcial) {
  const { [CHAVE_ESTADO]: estado = {} } = await chrome.storage.local.get(CHAVE_ESTADO)
  const novo = { ...estado, ...parcial }
  await chrome.storage.local.set({ [CHAVE_ESTADO]: novo })
  return novo
}

function paraEnvio(item, agora) {
  const { versao, iniciadoEmMs, ...evento } = item
  return { ...evento, segundosDesdeInicio: Math.max(0, Math.round((agora - iniciadoEmMs) / 1000)) }
}

async function removerEnviados(itens) {
  const { [CHAVE_FILA]: fila = {} } = await chrome.storage.local.get(CHAVE_FILA)
  for (const item of itens) {
    if (fila[item.idReproducao]?.versao === item.versao) delete fila[item.idReproducao]
  }
  await chrome.storage.local.set({ [CHAVE_FILA]: fila })
  return Object.keys(fila).length
}

function lerMensagemErro(corpo, status) {
  return corpo?.message || corpo?.error || `O CirqueiraX respondeu com erro ${status}.`
}

function enviarFila(forcar) {
  return emSerie(async () => {
    const dados = await chrome.storage.local.get([CHAVE_TOKEN, CHAVE_FILA])
    const token = dados[CHAVE_TOKEN]
    const itens = Object.values(dados[CHAVE_FILA] ?? {}).slice(0, MAXIMO_POR_ENVIO)
    if (!token) return salvarEstado({ erro: MENSAGEM_SEM_TOKEN, pendentes: itens.length })
    if (itens.length === 0 && !forcar) return salvarEstado({ pendentes: 0 })

    const agora = Date.now()
    let resposta
    try {
      resposta = await fetch(URL_EVENTOS, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Extensao-Token': token },
        body: JSON.stringify({ eventos: itens.map((item) => paraEnvio(item, agora)) }),
      })
    } catch {
      return salvarEstado({ erro: MENSAGEM_SEM_CONEXAO, pendentes: itens.length })
    }

    const corpo = await resposta.json().catch(() => null)
    if (resposta.status === STATUS_TOKEN_INVALIDO)
      return salvarEstado({ erro: MENSAGEM_TOKEN_INVALIDO, pendentes: itens.length })
    if (resposta.status === STATUS_DADOS_INVALIDOS) {
      const pendentes = await removerEnviados(itens)
      return salvarEstado({ erro: lerMensagemErro(corpo, resposta.status), pendentes })
    }
    if (!resposta.ok)
      return salvarEstado({
        erro: lerMensagemErro(corpo, resposta.status),
        pendentes: itens.length,
      })

    const pendentes = await removerEnviados(itens)
    return salvarEstado({
      erro: null,
      desativada: corpo?.data?.ativa === false,
      pendentes,
      aparelho: corpo?.data?.aparelho ?? null,
      ultimoEnvioEm: agora,
      ...(itens.length > 0 ? { ultimaMusica: itens[itens.length - 1].titulo } : {}),
    })
  })
}
