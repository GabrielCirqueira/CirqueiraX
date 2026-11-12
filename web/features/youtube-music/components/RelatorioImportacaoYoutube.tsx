import { CapaMusica } from '@/features/musica/components/CapaMusica'
import { LinkMusica } from '@/features/musica/components/LinkMusica'
import { HStack, Heading, SimpleGrid, Text, VStack } from '@chakra-ui/react'
import { ClipboardCheck } from 'lucide-react'
import { memo } from 'react'
import type {
  ArtistaRelatorioImportacao,
  ImportacaoYoutube,
  MusicaRelatorioImportacao,
} from '../types'
import { RelatorioImportacaoYoutubeSchema } from '../types'
import {
  type ItemRelatorioImportacao,
  formatarNumero,
  montarSecoesRelatorio,
  totalParaRevisao,
} from '../utils'

export interface RelatorioImportacaoYoutubeProps {
  importacao: ImportacaoYoutube
  onAbrirRevisao?: () => void
}

const PROPS_TITULO_SECAO = {
  as: 'h3',
  fontSize: '2xs',
  fontWeight: 'bold',
  textTransform: 'uppercase',
  letterSpacing: 'wide',
  color: 'cirqueira.musica.textoSecundario',
} as const

function CartaoNumero({ item }: { item: ItemRelatorioImportacao }) {
  return (
    <VStack align="start" gap={0.5} p={3} borderRadius="8px" bg="cirqueira.musica.cartaoElevado">
      <Text fontSize="lg" fontWeight="black" color="cirqueira.musica.textoPrincipal" lineClamp={1}>
        {item.valor}
      </Text>
      <Text fontSize="xs" fontWeight="semibold" color="cirqueira.musica.textoSecundario">
        {item.rotulo}
      </Text>
      {item.detalhe && (
        <Text fontSize="2xs" color="cirqueira.musica.textoDesabilitado">
          {item.detalhe}
        </Text>
      )}
    </VStack>
  )
}

function LinhaTop({
  imagem,
  titulo,
  subtitulo,
  streams,
  minutos,
  redondo,
}: {
  imagem: string | null
  titulo: string
  subtitulo?: string
  streams: number
  minutos: number
  redondo?: boolean
}) {
  return (
    <HStack gap={2.5} minW={0}>
      <CapaMusica
        url={imagem}
        alt={titulo}
        tipo={redondo ? 'artista' : 'faixa'}
        w="36px"
        h="36px"
      />
      <VStack align="start" gap={0} flex={1} minW={0}>
        <Text fontSize="xs" fontWeight="semibold" truncate maxW="full">
          {titulo}
        </Text>
        {subtitulo && (
          <Text fontSize="2xs" color="cirqueira.musica.textoSecundario" truncate maxW="full">
            {subtitulo}
          </Text>
        )}
      </VStack>
      <VStack align="end" gap={0} flexShrink={0}>
        <Text fontSize="2xs" fontWeight="bold" color="cirqueira.musica.verde">
          {formatarNumero(streams)}x
        </Text>
        <Text fontSize="2xs" color="cirqueira.musica.textoSecundario">
          {formatarNumero(minutos)} min
        </Text>
      </VStack>
    </HStack>
  )
}

function TopMusicas({ musicas }: { musicas: MusicaRelatorioImportacao[] }) {
  return (
    <VStack align="stretch" gap={2}>
      <Heading {...PROPS_TITULO_SECAO}>Mais ouvidas no arquivo</Heading>
      {musicas.map((musica) => (
        <LinhaTop
          key={musica.uuid}
          imagem={musica.urlCapa}
          titulo={musica.titulo}
          subtitulo={musica.artistas}
          streams={musica.streams}
          minutos={musica.minutos}
        />
      ))}
    </VStack>
  )
}

function TopArtistas({ artistas }: { artistas: ArtistaRelatorioImportacao[] }) {
  return (
    <VStack align="stretch" gap={2}>
      <Heading {...PROPS_TITULO_SECAO}>Artistas mais ouvidos no arquivo</Heading>
      {artistas.map((artista) => (
        <LinhaTop
          key={artista.uuid}
          imagem={artista.urlFoto}
          titulo={artista.nome}
          streams={artista.streams}
          minutos={artista.minutos}
          redondo
        />
      ))}
    </VStack>
  )
}

export const RelatorioImportacaoYoutube = memo(function RelatorioImportacaoYoutube({
  importacao,
  onAbrirRevisao,
}: RelatorioImportacaoYoutubeProps) {
  const relatorio = RelatorioImportacaoYoutubeSchema.parse(importacao.relatorio ?? {})
  const secoes = montarSecoesRelatorio(relatorio, importacao)
  const paraRevisao = totalParaRevisao(relatorio)

  return (
    <VStack align="stretch" gap={5}>
      {secoes.map((secao) => (
        <VStack key={secao.titulo} align="stretch" gap={2}>
          <Heading {...PROPS_TITULO_SECAO}>{secao.titulo}</Heading>
          <SimpleGrid columns={{ base: 2, md: secao.itens.length > 4 ? 3 : 4 }} gap={2}>
            {secao.itens.map((item) => (
              <CartaoNumero key={item.rotulo} item={item} />
            ))}
          </SimpleGrid>
        </VStack>
      ))}

      {(relatorio.topMusicas.length > 0 || relatorio.topArtistas.length > 0) && (
        <SimpleGrid columns={{ base: 1, md: 2 }} gap={5}>
          {relatorio.topMusicas.length > 0 && <TopMusicas musicas={relatorio.topMusicas} />}
          {relatorio.topArtistas.length > 0 && <TopArtistas artistas={relatorio.topArtistas} />}
        </SimpleGrid>
      )}

      {paraRevisao > 0 && (
        <HStack
          gap={3}
          p={3}
          borderRadius="8px"
          bg="cirqueira.musica.cartaoElevado"
          borderLeft="3px solid"
          borderLeftColor="cirqueira.musica.amarelo"
          align="center"
          wrap="wrap"
        >
          <ClipboardCheck size={18} />
          <Text fontSize="sm" flex={1} minW="200px">
            {formatarNumero(paraRevisao)} {paraRevisao === 1 ? 'vídeo ficou' : 'vídeos ficaram'}{' '}
            para você confirmar na revisão. Eles já contam nos relatórios assim que você decidir o
            que são.
          </Text>
          <LinkMusica to="/musica/revisao">
            <Text
              fontSize="sm"
              fontWeight="bold"
              color="cirqueira.musica.verde"
              _hover={{ textDecoration: 'underline' }}
              onClick={onAbrirRevisao}
            >
              Abrir a revisão
            </Text>
          </LinkMusica>
        </HStack>
      )}
    </VStack>
  )
})
