import { useFiltrosUrl } from '@/shared/hooks'
import { useSearchParams } from 'react-router-dom'
import {
  ABA_MUSICA_PADRAO,
  type AbaMusica,
  abasVisiveis,
  lerAbaMusica,
} from '../utils/abasMusica'
import { useFonteMusica } from './useFonteMusica'

export function useAbaMusica() {
  const [params] = useSearchParams()
  const { atualizarFiltros } = useFiltrosUrl()
  const { fonte } = useFonteMusica()
  const abaLida = lerAbaMusica(params.get('aba'))
  const disponiveis = abasVisiveis(fonte)
  const aba = disponiveis.includes(abaLida) ? abaLida : ABA_MUSICA_PADRAO

  function selecionarAba(nova: AbaMusica) {
    atualizarFiltros({
      aba: nova === ABA_MUSICA_PADRAO ? undefined : nova,
      pagina: undefined,
    })
  }

  return { aba, selecionarAba, disponiveis }
}
