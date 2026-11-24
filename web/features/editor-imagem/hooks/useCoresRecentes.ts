import { useLocalStorageState } from '@/shared/hooks'
import { CHAVES_STORAGE } from '@/shared/utils/localStorageService'
import { LIMITE_CORES_RECENTES } from '../utils/constantesEditor'

const FORMATO_COR = /^#[0-9a-f]{6}$/i
const CORES_INICIAIS: string[] = []

function isListaDeCores(valor: unknown): valor is string[] {
  return (
    Array.isArray(valor) &&
    valor.every((item) => typeof item === 'string' && FORMATO_COR.test(item))
  )
}

const OPCOES = { validar: isListaDeCores }

export function useCoresRecentes() {
  const [coresRecentes, setCoresRecentes] = useLocalStorageState<string[]>(
    CHAVES_STORAGE.EDITOR_IMAGEM_CORES_RECENTES,
    CORES_INICIAIS,
    OPCOES
  )

  function registrarCor(cor: string) {
    if (!FORMATO_COR.test(cor)) return
    const normalizada = cor.toUpperCase()
    setCoresRecentes((atuais) =>
      [normalizada, ...atuais.filter((item) => item !== normalizada)].slice(
        0,
        LIMITE_CORES_RECENTES
      )
    )
  }

  return { coresRecentes, registrarCor }
}
