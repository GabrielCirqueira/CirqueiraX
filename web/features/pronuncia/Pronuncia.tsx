import { useDebounce, useLocalStorageState, useSEO } from '@/shared/hooks'
import { usuarioEhAdministrador } from '@/shared/utils/funcionalidadesSistema'
import { useAuthStore } from '@/stores'
import { Box, Grid, Skeleton, VStack } from '@chakra-ui/react'
import { useState } from 'react'
import {
  ABAS_ADMINISTRADOR,
  ABAS_PRONUNCIA,
  type AbaPronuncia,
  CabecalhoPronuncia,
  DialogoReportarErro,
  EditorTraducao,
  EstadoInicialPronuncia,
  HistoricoPronuncia,
  PainelCorrecoes,
  PainelDicionario,
  PainelMusicaTocando,
  ResultadoTraducao,
} from './components'
import {
  useApagarConsulta,
  useConsultaPronuncia,
  useCopiarTexto,
  useFalaIngles,
  useFavoritarConsulta,
  useHistoricoPronuncia,
  usePainelPronuncia,
  useReportarErroPronuncia,
  useTraduzirTexto,
} from './hooks'
import { DIRECOES_TRADUCAO, type DirecaoTraducao, type ModoPronuncia } from './types'
import { chavesUnicasDaAnalise } from './utils'

const ATRASO_BUSCA_MS = 300
const MODOS_PRONUNCIA: ModoPronuncia[] = ['clara', 'natural']

interface EstadoRelato {
  aberto: boolean
  palavra: string | null
}

export function Component() {
  useSEO({
    title: 'Inglês & Pronúncia',
    description:
      'Traduza entre português e inglês e veja como se fala cada frase, escrito em português.',
    keywords: 'inglês, pronúncia, tradução, cirqueirax',
  })

  const usuario = useAuthStore((estado) => estado.usuario)
  const administrador = usuarioEhAdministrador(usuario)
  const [abaSalva, setAba] = useLocalStorageState<AbaPronuncia>('pronuncia:aba', 'tradutor', {
    valoresPermitidos: [...ABAS_PRONUNCIA],
  })
  const aba = ABAS_ADMINISTRADOR.includes(abaSalva) && !administrador ? 'tradutor' : abaSalva
  const [texto, setTexto] = useState('')
  const [direcao, setDirecao] = useLocalStorageState<DirecaoTraducao>('pronuncia:direcao', 'auto', {
    valoresPermitidos: [...DIRECOES_TRADUCAO],
  })
  const [modo, setModo] = useLocalStorageState<ModoPronuncia>('pronuncia:modo', 'clara', {
    valoresPermitidos: MODOS_PRONUNCIA,
  })
  const [consultaUuid, setConsultaUuid] = useState<string | null>(null)
  const [busca, setBusca] = useState('')
  const [somenteFavoritas, setSomenteFavoritas] = useState(false)
  const [relato, setRelato] = useState<EstadoRelato>({ aberto: false, palavra: null })
  const buscaAtrasada = useDebounce(busca, ATRASO_BUSCA_MS)

  const painel = usePainelPronuncia()
  const historico = useHistoricoPronuncia({ busca: buscaAtrasada, favoritas: somenteFavoritas })
  const consulta = useConsultaPronuncia(consultaUuid)
  const traduzir = useTraduzirTexto()
  const favoritar = useFavoritarConsulta()
  const apagar = useApagarConsulta()
  const reportar = useReportarErroPronuncia()
  const fala = useFalaIngles()
  const copiar = useCopiarTexto()

  function executarTraducao(valor: string) {
    if (valor.trim() === '') return
    fala.parar()
    traduzir.mutate(
      { texto: valor, direcao },
      { onSuccess: (resultado) => setConsultaUuid(resultado.uuid) }
    )
  }

  function abrirDoHistorico(uuid: string) {
    fala.parar()
    setConsultaUuid(uuid)
  }

  function apagarAtual() {
    if (!consultaUuid) return
    fala.parar()
    apagar.mutate(consultaUuid, { onSuccess: () => setConsultaUuid(null) })
  }

  function enviarRelato(payload: Parameters<typeof reportar.mutate>[0]['payload']) {
    if (!consultaUuid) return
    reportar.mutate(
      { uuid: consultaUuid, payload },
      { onSuccess: () => setRelato({ aberto: false, palavra: null }) }
    )
  }

  const atual = consulta.data

  return (
    <Box w="full" maxW="7xl" mx="auto" py={{ base: 4, md: 6 }} px={{ base: 3, md: 6 }}>
      <VStack align="stretch" gap={5}>
        <CabecalhoPronuncia
          painel={painel.data}
          administrador={administrador}
          aba={aba}
          onMudarAba={setAba}
        />

        {aba === 'musica' && <PainelMusicaTocando fala={fala} modo={modo} onMudarModo={setModo} />}
        {aba === 'correcoes' && <PainelCorrecoes />}
        {aba === 'dicionario' && <PainelDicionario />}

        {aba === 'tradutor' && (
          <Grid
            templateColumns={{ base: '1fr', xl: 'minmax(0, 1fr) 340px' }}
            gap={5}
            alignItems="start"
          >
            <VStack align="stretch" gap={4} minW={0}>
              <EditorTraducao
                texto={texto}
                direcao={direcao}
                traduzindo={traduzir.isPending}
                onMudarTexto={setTexto}
                onMudarDirecao={setDirecao}
                onTraduzir={executarTraducao}
              />

              {consultaUuid && consulta.isLoading && <Skeleton h="360px" borderRadius="12px" />}
              {!consultaUuid && <EstadoInicialPronuncia />}
              {atual && (
                <ResultadoTraducao
                  consulta={atual}
                  modo={modo}
                  fala={fala}
                  favoritando={favoritar.isPending}
                  onMudarModo={setModo}
                  onCopiar={copiar}
                  onFavoritar={() =>
                    favoritar.mutate({ uuid: atual.uuid, favorita: !atual.favorita })
                  }
                  onReportar={(palavra) => setRelato({ aberto: true, palavra })}
                  onApagar={apagarAtual}
                />
              )}
            </VStack>

            <HistoricoPronuncia
              pagina={historico.data}
              carregando={historico.isLoading}
              busca={busca}
              somenteFavoritas={somenteFavoritas}
              selecionadaUuid={consultaUuid}
              onMudarBusca={setBusca}
              onAlternarFavoritas={() => setSomenteFavoritas((valor) => !valor)}
              onSelecionar={(item) => {
                setTexto(
                  item.frase.idiomaOrigem === 'en'
                    ? item.frase.textoIngles
                    : item.frase.textoPortugues
                )
                abrirDoHistorico(item.uuid)
              }}
            />
          </Grid>
        )}
      </VStack>

      {atual && relato.aberto && (
        <DialogoReportarErro
          key={`${atual.uuid}-${relato.palavra ?? ''}`}
          aberto={relato.aberto}
          palavras={chavesUnicasDaAnalise(atual)}
          palavraInicial={relato.palavra}
          enviando={reportar.isPending}
          onFechar={() => setRelato({ aberto: false, palavra: null })}
          onEnviar={enviarRelato}
        />
      )}
    </Box>
  )
}
