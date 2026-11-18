import { Box, type BoxProps, Button, Flex, Grid, HStack, Text } from '@chakra-ui/react'
import { ChevronRight } from 'lucide-react'
import { type ReactNode, memo } from 'react'
import { useAbaMusica } from '../hooks/useAbaMusica'
import type { MusicaAnalise } from '../types'
import type { AbaMusica } from '../utils/abasMusica'
import { CapaMusica } from './CapaMusica'
import { TooltipMusica } from './MinutosMusica'

const ATRASO_TOOLTIP_CARTAO_MS = 4000

export interface CartaoBlocoMusicaProps extends Omit<BoxProps, 'title'> {
  titulo: string
  descricao?: string
  icone?: ReactNode
  cor?: string
  acao?: ReactNode
  children: ReactNode
}

export const CartaoBlocoMusica = memo(function CartaoBlocoMusica({
  titulo,
  descricao,
  icone,
  cor = 'cirqueira.musica.amarelo',
  acao,
  children,
  ...props
}: CartaoBlocoMusicaProps) {
  const cartao = (
    <Box
      p={{ base: 4, md: 5 }}
      bg="cirqueira.musica.cartao"
      borderRadius="12px"
      border="1px solid"
      borderColor="cirqueira.musica.cartaoElevado"
      minW={0}
      {...props}
    >
      <Flex justify="space-between" align="center" gap={2} mb={4}>
        <HStack gap={2} color={cor} minW={0}>
          {icone}
          <Text
            fontSize="xs"
            fontWeight="bold"
            textTransform="uppercase"
            letterSpacing="wide"
            truncate
          >
            {titulo}
          </Text>
        </HStack>
        {acao}
      </Flex>
      {children}
    </Box>
  )

  if (!descricao) return cartao

  return (
    <TooltipMusica
      openDelay={ATRASO_TOOLTIP_CARTAO_MS}
      closeDelay={100}
      conteudo={
        <Text fontSize="xs" fontWeight="medium" lineHeight="1.4" whiteSpace="normal">
          {descricao}
        </Text>
      }
    >
      {cartao}
    </TooltipMusica>
  )
})

export const AtalhoAbaMusica = memo(function AtalhoAbaMusica({
  aba,
  rotulo = 'Ver mais',
}: {
  aba: AbaMusica
  rotulo?: string
}) {
  const { selecionarAba } = useAbaMusica()
  return (
    <Button
      variant="ghost"
      size="xs"
      h="24px"
      px={2}
      fontSize="2xs"
      color="cirqueira.musica.textoSecundario"
      _hover={{ color: 'cirqueira.musica.textoPrincipal', bg: 'cirqueira.musica.cartaoElevado' }}
      onClick={() => selecionarAba(aba)}
    >
      {rotulo}
      <ChevronRight size={12} />
    </Button>
  )
})

export const MosaicoCapasMusica = memo(function MosaicoCapasMusica({
  musicas,
  imagemDe,
  tamanho = '96px',
}: {
  musicas: MusicaAnalise[]
  imagemDe: (item: MusicaAnalise) => string | null
  tamanho?: BoxProps['boxSize']
}) {
  const quatro = musicas.slice(0, 4)
  if (quatro.length <= 1) {
    const unica = quatro[0]
    return (
      <CapaMusica
        url={unica ? imagemDe(unica) : null}
        alt={unica?.nomeFaixa ?? ''}
        boxSize={tamanho}
        borderRadius="8px"
        tamanhoIcone={28}
      />
    )
  }
  return (
    <Grid
      templateColumns="1fr 1fr"
      boxSize={tamanho}
      flexShrink={0}
      borderRadius="8px"
      overflow="hidden"
      gap="1px"
      bg="cirqueira.musica.fundo"
    >
      {quatro.map((musica) => (
        <CapaMusica
          key={musica.musicaUuid ?? musica.nomeFaixa}
          url={imagemDe(musica)}
          alt={musica.nomeFaixa}
          w="full"
          h="full"
          borderRadius="0"
          tamanhoIcone={12}
        />
      ))}
    </Grid>
  )
})

export const BarraProporcaoMusica = memo(function BarraProporcaoMusica({
  percentual,
  cor = 'cirqueira.musica.verde',
  altura = '6px',
}: {
  percentual: number
  cor?: string
  altura?: string
}) {
  return (
    <Box h={altura} bg="cirqueira.musica.cartaoElevado" borderRadius="full" overflow="hidden">
      <Box h="full" w={`${Math.max(2, percentual)}%`} bg={cor} borderRadius="full" />
    </Box>
  )
})

export const NumeroDestaqueMusica = memo(function NumeroDestaqueMusica({
  valor,
  rotulo,
}: {
  valor: ReactNode
  rotulo: string
}) {
  return (
    <Box>
      <Text fontSize={{ base: 'xl', md: '2xl' }} fontWeight="black" lineHeight="1.1">
        {valor}
      </Text>
      <Text fontSize="2xs" fontWeight="bold" textTransform="uppercase" opacity={0.8}>
        {rotulo}
      </Text>
    </Box>
  )
})

export const VazioBlocoMusica = memo(function VazioBlocoMusica({ texto }: { texto: string }) {
  return (
    <Text fontSize="sm" color="cirqueira.musica.textoSecundario" py={4} textAlign="center">
      {texto}
    </Text>
  )
})
