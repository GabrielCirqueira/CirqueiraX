import { AppContainer } from '@/layouts'
import { useSEO } from '@/shared/hooks'
import { Box, Container, VStack } from '@chakra-ui/react'
import { memo, useMemo, useState } from 'react'
import {
  EsqueletoPaginaSpotify,
  EstadoVazioSpotify,
  ModalUploadHistoricoSpotify,
  PainelConexaoSpotify,
  RodapeSpotify,
  SecaoCapsulaSonora,
  SecaoCuriosidades,
  SecaoHojeSemana,
  TemaSpotify,
} from './components'
import { useImagensSpotify, useResumoSpotify, useStatusSpotify } from './hooks'

export function Spotify() {
  useSEO({
    titulo: 'Spotify & Cápsula Sonora',
    descricao:
      'Acompanhe seu tempo ouvido no Spotify, estatísticas diárias e sua Cápsula Sonora mensal.',
  })

  const [modalImportacaoAberto, setModalImportacaoAberto] = useState(false)

  const { data: status, isLoading: carregandoStatus } = useStatusSpotify()
  const conectada = Boolean(status?.conectada && status.status === 'conectada')

  const { data: resumo, isLoading: carregandoResumo } = useResumoSpotify(conectada)

  const chavesFaltantesResumo = useMemo(() => {
    if (!resumo) return []
    const chaves: string[] = []
    const itensHoje = [...resumo.hoje.topMusicas, ...resumo.hoje.topArtistas]
    const itensSemana = [...resumo.semana.topMusicas, ...resumo.semana.topArtistas]
    const todos = [...itensHoje, ...itensSemana]

    todos.forEach((item) => {
      if ('nomeFaixa' in item) {
        if (!item.imagemUrl) {
          if (item.codigoFaixa) chaves.push(`faixa:${item.codigoFaixa}`)
          else chaves.push(`faixa_busca:${item.artistaPrincipal}:${item.nomeFaixa}`)
        }
      } else if ('nomeArtista' in item) {
        if (!item.imagemUrl) {
          if (item.codigoArtista) chaves.push(`artista:${item.codigoArtista}`)
          else chaves.push(`artista_busca:${item.nomeArtista}`)
        }
      }
    })

    return chaves
  }, [resumo])

  useImagensSpotify(chavesFaltantesResumo)

  const temDados =
    Boolean(resumo) &&
    ((resumo?.hoje.totalStreams ?? 0) > 0 ||
      (resumo?.semana.totalStreams ?? 0) > 0 ||
      Boolean(resumo?.curiosidades.faixaMaisRepetidaNome))

  return (
    <TemaSpotify>
      <AppContainer>
        <Container maxW="6xl" py={{ base: 4, md: 8 }} px={{ base: 3, md: 6 }}>
          <VStack gap={{ base: 6, md: 10 }} align="stretch" w="full">
            <PainelConexaoSpotify onAbrirModalImportacao={() => setModalImportacaoAberto(true)} />

            {carregandoStatus ? (
              <EsqueletoPaginaSpotify />
            ) : !conectada && !temDados ? (
              <EstadoVazioSpotify
                conectada={conectada}
                onAbrirModalImportacao={() => setModalImportacaoAberto(true)}
              />
            ) : (
              <>
                <SecaoHojeSemana resumo={resumo} carregando={carregandoResumo} />

                <SecaoCuriosidades curiosidades={resumo?.curiosidades} />

                <SecaoCapsulaSonora conectada={conectada || temDados} />
              </>
            )}

            <RodapeSpotify />
          </VStack>
        </Container>
      </AppContainer>

      <ModalUploadHistoricoSpotify
        aberto={modalImportacaoAberto}
        onFechar={() => setModalImportacaoAberto(false)}
      />
    </TemaSpotify>
  )
}

export default Spotify
