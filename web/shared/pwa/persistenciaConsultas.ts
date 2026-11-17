import { type Query, type QueryClient, dehydrate, hydrate } from '@tanstack/react-query'
import { scriptCarregado } from './versaoApp'

const CHAVE_STORAGE = 'cirqueirax:consultas-persistidas'
const VALIDADE_MS = 1000 * 60 * 60 * 24 * 3
const ATRASO_GRAVACAO_MS = 2000
const TAMANHO_MAXIMO_CARACTERES = 3_500_000
const RAIZES_PERSISTIDAS = new Set(['musica'])
const DURACAO_EM_MEMORIA_MS = 1000 * 60 * 60 * 24

interface ConsultasPersistidas {
  versao: string
  salvoEm: number
  estado: ReturnType<typeof dehydrate>
}

function devePersistir(query: Query): boolean {
  return RAIZES_PERSISTIDAS.has(String(query.queryKey[0])) && query.state.status === 'success'
}

function versaoAtual(): string {
  return scriptCarregado() ?? 'desenvolvimento'
}

function gravar(cliente: QueryClient) {
  try {
    const conteudo: ConsultasPersistidas = {
      versao: versaoAtual(),
      salvoEm: Date.now(),
      estado: dehydrate(cliente, { shouldDehydrateQuery: devePersistir }),
    }
    const json = JSON.stringify(conteudo)
    if (json.length > TAMANHO_MAXIMO_CARACTERES) return
    localStorage.setItem(CHAVE_STORAGE, json)
  } catch {
    limparConsultasPersistidas()
  }
}

export function limparConsultasPersistidas() {
  try {
    localStorage.removeItem(CHAVE_STORAGE)
  } catch {
    return
  }
}

export function restaurarConsultasPersistidas(cliente: QueryClient) {
  for (const raiz of RAIZES_PERSISTIDAS) {
    cliente.setQueryDefaults([raiz], { gcTime: DURACAO_EM_MEMORIA_MS })
  }

  try {
    const bruto = localStorage.getItem(CHAVE_STORAGE)
    if (!bruto) return
    const salvo = JSON.parse(bruto) as ConsultasPersistidas
    const expirado = Date.now() - salvo.salvoEm > VALIDADE_MS
    if (salvo.versao !== versaoAtual() || expirado) {
      limparConsultasPersistidas()
      return
    }
    hydrate(cliente, salvo.estado)
  } catch {
    limparConsultasPersistidas()
  }
}

export function persistirConsultas(cliente: QueryClient) {
  let agendamento: ReturnType<typeof setTimeout> | undefined
  cliente.getQueryCache().subscribe((evento) => {
    if (evento.type !== 'updated' || !devePersistir(evento.query)) return
    clearTimeout(agendamento)
    agendamento = setTimeout(() => gravar(cliente), ATRASO_GRAVACAO_MS)
  })
}
