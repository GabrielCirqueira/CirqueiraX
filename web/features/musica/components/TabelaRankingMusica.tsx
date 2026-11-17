import { Box, Button, Flex, Grid, HStack, Input, Text, VStack } from '@chakra-ui/react'
import { Search } from 'lucide-react'
import { memo, useState } from 'react'
import { useFonteMusica } from '../hooks/useFonteMusica'
import {
  type FiltroServicoTabela,
  type LinhaTabelaRanking,
  type OrdemTabelaRanking,
  filtrarOrdenarRanking,
  formatarNumeroPtBr,
} from '../utils'
import { CapaMusica } from './CapaMusica'
import { DivisaoFontesMusica } from './DivisaoFontesMusica'
import { IconeFonteMusica } from './IconeFonteMusica'
import { LinkMusica } from './LinkMusica'
import { MinutosMusica } from './MinutosMusica'
import { VazioBlocoMusica } from './PecasBlocoMusica'

const COLUNAS = { base: '28px 1fr 64px', md: '36px 1fr 90px 90px 150px' }

const OPCOES_ORDEM: { valor: OrdemTabelaRanking; rotulo: string }[] = [
  { valor: 'streams', rotulo: 'Streams' },
  { valor: 'minutos', rotulo: 'Minutos' },
]

const OPCOES_SERVICO: { valor: FiltroServicoTabela; rotulo: string }[] = [
  { valor: 'todos', rotulo: 'Todos' },
  { valor: 'spotify', rotulo: 'Spotify' },
  { valor: 'youtube_music', rotulo: 'YouTube Music' },
]

export const TabelaRankingMusica = memo(function TabelaRankingMusica({
  linhas,
}: {
  linhas: LinhaTabelaRanking[]
}) {
  const { fonte } = useFonteMusica()
  const [busca, setBusca] = useState('')
  const [ordem, setOrdem] = useState<OrdemTabelaRanking>('streams')
  const [servico, setServico] = useState<FiltroServicoTabela>('todos')
  const visiveis = filtrarOrdenarRanking(linhas, busca, ordem, servico)

  return (
    <VStack align="stretch" gap={3}>
      <Flex gap={2} wrap="wrap" align="center">
        <HStack
          flex={{ base: '1 1 100%', md: '1 1 220px' }}
          gap={2}
          px={3}
          h="34px"
          borderRadius="full"
          bg="cirqueira.musica.cartaoElevado"
          color="cirqueira.musica.textoSecundario"
        >
          <Search size={14} />
          <Input
            variant="flushed"
            border="none"
            size="sm"
            placeholder="Buscar no ranking"
            value={busca}
            onChange={(evento) => setBusca(evento.target.value)}
            color="cirqueira.musica.textoPrincipal"
          />
        </HStack>
        <GrupoBotoes opcoes={OPCOES_ORDEM} selecionado={ordem} onSelecionar={setOrdem} />
        {fonte === 'todas' ? (
          <GrupoBotoes opcoes={OPCOES_SERVICO} selecionado={servico} onSelecionar={setServico} />
        ) : null}
      </Flex>

      <Grid
        templateColumns={COLUNAS}
        gap={3}
        px={2}
        pb={2}
        borderBottom="1px solid"
        borderColor="cirqueira.musica.cartaoElevado"
        fontSize="2xs"
        fontWeight="bold"
        textTransform="uppercase"
        color="cirqueira.musica.textoSecundario"
      >
        <Text>#</Text>
        <Text>Título</Text>
        <Text textAlign="right">Streams</Text>
        <Text textAlign="right" display={{ base: 'none', md: 'block' }}>
          Minutos
        </Text>
        <Text display={{ base: 'none', md: 'block' }}>Serviços</Text>
      </Grid>

      {visiveis.length === 0 ? (
        <VazioBlocoMusica texto="Nada encontrado com esses filtros." />
      ) : (
        <VStack align="stretch" gap={0}>
          {visiveis.map((linha) => (
            <LinhaRanking key={linha.chave} linha={linha} />
          ))}
        </VStack>
      )}
    </VStack>
  )
})

function LinhaRanking({ linha }: { linha: LinhaTabelaRanking }) {
  const conteudo = (
    <Grid
      templateColumns={COLUNAS}
      gap={3}
      px={2}
      py={2}
      alignItems="center"
      borderRadius="6px"
      _hover={{ bg: 'cirqueira.musica.cartaoElevado' }}
    >
      <Text
        fontSize="sm"
        fontWeight="bold"
        color={linha.posicao <= 3 ? 'cirqueira.musica.verde' : 'cirqueira.musica.textoSecundario'}
        fontVariantNumeric="tabular-nums"
      >
        {linha.posicao}
      </Text>
      <HStack gap={3} minW={0}>
        <CapaMusica url={linha.imagemUrl} alt={linha.nome} tipo={linha.tipoCapa} boxSize="40px" />
        <VStack align="flex-start" gap={0} minW={0}>
          <Text
            fontSize="sm"
            fontWeight="semibold"
            color="cirqueira.musica.textoPrincipal"
            lineClamp={1}
          >
            {linha.nome}
          </Text>
          {linha.subtitulo ? (
            <Text fontSize="2xs" color="cirqueira.musica.textoSecundario" lineClamp={1}>
              {linha.subtitulo}
            </Text>
          ) : null}
        </VStack>
      </HStack>
      <Text
        fontSize="sm"
        fontWeight="bold"
        color="cirqueira.musica.textoPrincipal"
        textAlign="right"
        fontVariantNumeric="tabular-nums"
      >
        {formatarNumeroPtBr(linha.streams)}
      </Text>
      <Box
        textAlign="right"
        fontSize="sm"
        color="cirqueira.musica.textoSecundario"
        display={{ base: 'none', md: 'block' }}
      >
        <MinutosMusica minutos={linha.minutos} porFonte={linha.porFonte} />
      </Box>
      <Box display={{ base: 'none', md: 'block' }}>
        <ServicosLinha linha={linha} />
      </Box>
    </Grid>
  )

  if (!linha.rota) return conteudo
  return <LinkMusica to={linha.rota}>{conteudo}</LinkMusica>
}

function ServicosLinha({ linha }: { linha: LinhaTabelaRanking }) {
  const { fonte } = useFonteMusica()
  if (fonte === 'todas') return <DivisaoFontesMusica porFonte={linha.porFonte} />
  return <IconeFonteMusica fonte={fonte} tamanho={12} />
}

function GrupoBotoes<T extends string>({
  opcoes,
  selecionado,
  onSelecionar,
}: {
  opcoes: { valor: T; rotulo: string }[]
  selecionado: T
  onSelecionar: (valor: T) => void
}) {
  return (
    <HStack gap={1} p={1} borderRadius="full" bg="cirqueira.musica.cartaoElevado">
      {opcoes.map((opcao) => (
        <Button
          key={opcao.valor}
          size="xs"
          h="26px"
          px={3}
          borderRadius="full"
          fontSize="2xs"
          fontWeight="bold"
          bg={opcao.valor === selecionado ? 'cirqueira.musica.cartao' : 'transparent'}
          color={
            opcao.valor === selecionado
              ? 'cirqueira.musica.verde'
              : 'cirqueira.musica.textoSecundario'
          }
          onClick={() => onSelecionar(opcao.valor)}
        >
          {opcao.rotulo}
        </Button>
      ))}
    </HStack>
  )
}
