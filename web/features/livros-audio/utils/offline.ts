import type { TrechoNarracao } from '../types'

const NOME_CACHE = 'livros-audio-offline-v1'
const PREFIXO = '/__offline__/livros-audio'

export interface ParteOffline {
  numeroBloco: number
  voz: string | null
  versao: string
  chave: string
}

export function offlineDisponivel(): boolean {
  return typeof window !== 'undefined' && 'caches' in window
}

export function chaveParteOffline(numeroBloco: number, voz: string | null, versao: string): string {
  return `${numeroBloco}|${voz ?? 'principal'}|${versao}`
}

function urlBase(livroUuid: string, numeroBloco: number, voz: string | null): string {
  return `${location.origin}${PREFIXO}/${livroUuid}/${numeroBloco}/${encodeURIComponent(voz ?? 'principal')}/`
}

function urlArquivo(
  livroUuid: string,
  numeroBloco: number,
  voz: string | null,
  versao: string,
  tipo: 'audio' | 'trechos'
): string {
  return `${urlBase(livroUuid, numeroBloco, voz)}${encodeURIComponent(versao)}/${tipo}`
}

async function abrirCache(): Promise<Cache | null> {
  if (!offlineDisponivel()) return null
  try {
    return await caches.open(NOME_CACHE)
  } catch {
    return null
  }
}

export async function listarPartesOffline(livroUuid: string): Promise<ParteOffline[]> {
  const cache = await abrirCache()
  if (!cache) return []

  const prefixo = `${location.origin}${PREFIXO}/${livroUuid}/`
  const partes: ParteOffline[] = []
  for (const requisicao of await cache.keys()) {
    if (!requisicao.url.startsWith(prefixo) || !requisicao.url.endsWith('/audio')) continue
    const [numero, voz, versao] = requisicao.url.slice(prefixo.length).split('/')
    if (!numero || !voz || !versao) continue
    const vozDecodificada = decodeURIComponent(voz)
    const parte = {
      numeroBloco: Number(numero),
      voz: vozDecodificada === 'principal' ? null : vozDecodificada,
      versao: decodeURIComponent(versao),
    }
    partes.push({ ...parte, chave: chaveParteOffline(parte.numeroBloco, parte.voz, parte.versao) })
  }
  return partes
}

export async function salvarParteOffline(
  livroUuid: string,
  numeroBloco: number,
  voz: string | null,
  versao: string,
  audio: Blob,
  trechos: TrechoNarracao[]
): Promise<void> {
  const cache = await abrirCache()
  if (!cache) throw new Error('Este navegador não permite guardar áudio para ouvir offline.')

  const base = urlBase(livroUuid, numeroBloco, voz)
  for (const requisicao of await cache.keys()) {
    if (requisicao.url.startsWith(base)) await cache.delete(requisicao)
  }

  await cache.put(
    urlArquivo(livroUuid, numeroBloco, voz, versao, 'audio'),
    new Response(audio, { headers: { 'Content-Type': 'audio/mpeg' } })
  )
  await cache.put(
    urlArquivo(livroUuid, numeroBloco, voz, versao, 'trechos'),
    new Response(JSON.stringify(trechos), { headers: { 'Content-Type': 'application/json' } })
  )
}

export async function obterUrlAudioOffline(
  livroUuid: string,
  numeroBloco: number,
  voz: string | null,
  versao: string
): Promise<string | null> {
  const cache = await abrirCache()
  const resposta = await cache?.match(urlArquivo(livroUuid, numeroBloco, voz, versao, 'audio'))
  if (!resposta) return null
  return URL.createObjectURL(await resposta.blob())
}

export async function obterTrechosOffline(
  livroUuid: string,
  numeroBloco: number,
  voz: string | null
): Promise<unknown[] | null> {
  const cache = await abrirCache()
  if (!cache) return null

  const base = urlBase(livroUuid, numeroBloco, voz)
  for (const requisicao of await cache.keys()) {
    if (!requisicao.url.startsWith(base) || !requisicao.url.endsWith('/trechos')) continue
    const resposta = await cache.match(requisicao)
    if (resposta) return (await resposta.json()) as unknown[]
  }
  return null
}

export async function removerOfflineDoLivro(livroUuid: string): Promise<void> {
  const cache = await abrirCache()
  if (!cache) return

  const prefixo = `${location.origin}${PREFIXO}/${livroUuid}/`
  for (const requisicao of await cache.keys()) {
    if (requisicao.url.startsWith(prefixo)) await cache.delete(requisicao)
  }
}

export async function medirTamanhoOffline(livroUuid: string): Promise<number> {
  const cache = await abrirCache()
  if (!cache) return 0

  const prefixo = `${location.origin}${PREFIXO}/${livroUuid}/`
  let total = 0
  for (const requisicao of await cache.keys()) {
    if (!requisicao.url.startsWith(prefixo)) continue
    const resposta = await cache.match(requisicao)
    if (resposta) total += (await resposta.clone().blob()).size
  }
  return total
}

export async function pedirArmazenamentoPersistente(): Promise<void> {
  try {
    await navigator.storage?.persist?.()
  } catch {}
}
