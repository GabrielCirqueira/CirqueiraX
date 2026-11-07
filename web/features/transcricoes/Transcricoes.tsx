import { useDebounce, useLocalStorageState, useSEO } from '@/shared/hooks'
import { Box, Grid, VStack } from '@chakra-ui/react'
import { useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { AreaEnvioAudios } from './components/AreaEnvioAudios'
import { BarraFiltrosTranscricoes } from './components/BarraFiltrosTranscricoes'
import { CabecalhoTranscricoes } from './components/CabecalhoTranscricoes'
import { EstadoSemSelecao } from './components/EstadoSemSelecao'
import { EstatisticasTranscricoes } from './components/EstatisticasTranscricoes'
import { ListaTranscricoes } from './components/ListaTranscricoes'
import { PainelTranscricao } from './components/PainelTranscricao'
import { useEnvioAudios, useListaTranscricoes, useResumoTranscricoes } from './hooks'
import type { FiltroListagemTranscricao, IdiomaTranscricao, TranscricaoResumo } from './types'
import { OPCOES_IDIOMA } from './utils'

const PARAMETRO_SELECIONADA = 'transcricao'
const CHAVE_IDIOMA_PREFERIDO = 'transcricoes:idioma'
const ESPERA_BUSCA_MS = 350
const LARGURA_LAYOUT_EMPILHADO = 992

export function Component() {
  useSEO({
    title: 'Transcrições',
    description: 'Transcreva vários áudios de uma vez e acompanhe o texto em tempo real.',
    keywords: 'transcrição, áudio, texto, whisper, cirqueirax',
  })

  const [parametros, setParametros] = useSearchParams()
  const selecionadaUuid = parametros.get(PARAMETRO_SELECIONADA)
  const painelRef = useRef<HTMLDivElement | null>(null)
  const [busca, setBusca] = useState('')
  const [filtro, setFiltro] = useState<FiltroListagemTranscricao>('todas')
  const [idioma, setIdioma] = useLocalStorageState<IdiomaTranscricao>(
    CHAVE_IDIOMA_PREFERIDO,
    'auto',
    {
      valoresPermitidos: OPCOES_IDIOMA.map((opcao) => opcao.valor),
    }
  )
  const buscaAdiada = useDebounce(busca, ESPERA_BUSCA_MS)

  const lista = useListaTranscricoes({ busca: buscaAdiada, filtro })
  const resumo = useResumoTranscricoes()

  function selecionar(uuid: string | null) {
    setParametros(
      (atuais) => {
        const novos = new URLSearchParams(atuais)
        if (uuid) novos.set(PARAMETRO_SELECIONADA, uuid)
        else novos.delete(PARAMETRO_SELECIONADA)
        return novos
      },
      { replace: true }
    )
  }

  function selecionarERolar(uuid: string) {
    selecionar(uuid)
    if (window.innerWidth < LARGURA_LAYOUT_EMPILHADO) {
      painelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  function aoEnviarAudio(transcricao: TranscricaoResumo) {
    if (!parametros.get(PARAMETRO_SELECIONADA)) selecionar(transcricao.uuid)
  }

  const envio = useEnvioAudios(aoEnviarAudio)

  function atualizarTudo() {
    lista.refetch()
    resumo.refetch()
  }

  return (
    <Box w="full" maxW="1680px" mx="auto" py={{ base: 4, md: 6 }} px={{ base: 3, md: 6 }}>
      <VStack align="stretch" gap={5} w="full">
        <CabecalhoTranscricoes
          resumo={resumo.data}
          atualizando={lista.isFetching && !lista.isLoading}
          onAtualizar={atualizarTudo}
        />

        <EstatisticasTranscricoes resumo={resumo.data} />

        <Grid
          templateColumns={{ base: '1fr', lg: '400px 1fr', xl: '440px 1fr' }}
          gap={5}
          alignItems="start"
        >
          <VStack align="stretch" gap={4} minW={0}>
            <AreaEnvioAudios
              idioma={idioma}
              envios={envio.envios}
              onMudarIdioma={setIdioma}
              onEnviar={(arquivos) => envio.enviar(arquivos, idioma)}
              onLimparEnvios={envio.limparFinalizados}
            />
            <BarraFiltrosTranscricoes
              busca={busca}
              filtro={filtro}
              onMudarBusca={setBusca}
              onMudarFiltro={setFiltro}
            />
            <ListaTranscricoes
              pagina={lista.data}
              carregando={lista.isLoading}
              filtrando={buscaAdiada.length > 0 || filtro !== 'todas'}
              selecionadaUuid={selecionadaUuid}
              onSelecionar={selecionarERolar}
            />
          </VStack>

          <Box
            ref={painelRef}
            position={{ base: 'static', lg: 'sticky' }}
            top={{ lg: 20 }}
            bg="bg.panel"
            borderWidth="1px"
            borderColor="border.subtle"
            borderRadius="2xl"
            shadow="xs"
            minW={0}
            scrollMarginTop={20}
          >
            {selecionadaUuid ? (
              <PainelTranscricao
                key={selecionadaUuid}
                uuid={selecionadaUuid}
                onFechar={() => selecionar(null)}
              />
            ) : (
              <EstadoSemSelecao />
            )}
          </Box>
        </Grid>
      </VStack>
    </Box>
  )
}

export default Component
