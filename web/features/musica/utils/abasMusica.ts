export const ABAS_MUSICA = [
  'visao',
  'rankings',
  'habitos',
  'descobertas',
  'versoes',
  'historico',
  'recordes',
  'retrospectiva',
  'servicos',
] as const

export type AbaMusica = (typeof ABAS_MUSICA)[number]

export const ABA_MUSICA_PADRAO: AbaMusica = 'visao'

export const ROTULOS_ABA_MUSICA: Record<AbaMusica, string> = {
  visao: 'Visão geral',
  rankings: 'Rankings',
  habitos: 'Hábitos',
  descobertas: 'Descobertas',
  versoes: 'Versões',
  historico: 'Histórico',
  recordes: 'Recordes',
  retrospectiva: 'Retrospectiva',
  servicos: 'Serviços',
}

/** Abas em que o seletor de período (hoje/7 dias/…) faz sentido. */
export const ABAS_COM_PERIODO: ReadonlySet<AbaMusica> = new Set([
  'visao',
  'rankings',
  'habitos',
  'descobertas',
  'versoes',
])

export function lerAbaMusica(valor: string | null): AbaMusica {
  if (valor && (ABAS_MUSICA as readonly string[]).includes(valor)) {
    return valor as AbaMusica
  }
  return ABA_MUSICA_PADRAO
}

export function abasVisiveis(fonte: string): AbaMusica[] {
  if (fonte === 'todas') {
    return [...ABAS_MUSICA]
  }
  return ABAS_MUSICA.filter((aba) => aba !== 'servicos')
}
