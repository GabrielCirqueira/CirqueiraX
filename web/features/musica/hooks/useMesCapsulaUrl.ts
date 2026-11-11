import { useSearchParams } from 'react-router-dom'

export function useMesCapsulaUrl() {
  const [params, setParams] = useSearchParams()

  const mesParam = params.get('mes')

  let anoSelecionado: number | null = null
  let mesSelecionado: number | null = null

  if (mesParam && /^\d{4}-\d{2}$/.test(mesParam)) {
    const [anoStr, mesStr] = mesParam.split('-')
    const anoNum = Number.parseInt(anoStr, 10)
    const mesNum = Number.parseInt(mesStr, 10)
    if (anoNum > 2000 && mesNum >= 1 && mesNum <= 12) {
      anoSelecionado = anoNum
      mesSelecionado = mesNum
    }
  }

  function selecionarMes(ano: number, mes: number) {
    const mesFormatado = String(mes).padStart(2, '0')
    const valorParam = `${ano}-${mesFormatado}`
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        next.set('mes', valorParam)
        return next
      },
      { replace: true }
    )
  }

  function limparMes() {
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        next.delete('mes')
        return next
      },
      { replace: true }
    )
  }

  return {
    mesParam,
    anoSelecionado,
    mesSelecionado,
    selecionarMes,
    limparMes,
  }
}
