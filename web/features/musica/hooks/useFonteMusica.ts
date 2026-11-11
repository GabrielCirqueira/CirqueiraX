import { useFiltrosUrl } from '@/shared/hooks'
import { useSearchParams } from 'react-router-dom'
import type { FonteMusica } from '../types'
import { FONTE_MUSICA_PADRAO, lerFonteMusica } from '../utils'

export function useFonteMusica() {
  const [params] = useSearchParams()
  const { atualizarFiltros } = useFiltrosUrl()
  const fonte = lerFonteMusica(params.get('fonte'))

  function selecionarFonte(nova: FonteMusica) {
    atualizarFiltros({
      fonte: nova === FONTE_MUSICA_PADRAO ? undefined : nova,
      pagina: undefined,
    })
  }

  return { fonte, selecionarFonte }
}
