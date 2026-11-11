import {
  Badge,
  Box,
  Button,
  Flex,
  HStack,
  Link,
  SimpleGrid,
  Skeleton,
  Text,
  VStack,
} from '@chakra-ui/react'
import { Flame, History, Music2, UserPlus } from 'lucide-react'
import { type ReactNode, memo, useState } from 'react'
import { useDescobertasMusica, useImagensItensMusica } from '../hooks'
import type { DescobertasMusica, ItemComImagemMusica } from '../types'
import {
  type OpcaoPeriodoAnalise,
  formatarDataExtensa,
  formatarNomeMes,
  gerarRotaArtista,
  gerarRotaMusica,
} from '../utils'
import { CabecalhoSecaoMusica } from './CabecalhoSecaoMusica'
import { CapaMusica } from './CapaMusica'
import { LinkMusica } from './LinkMusica'
import { SeletorPeriodoAnalise } from './SeletorPeriodoAnalise'

type AbaDescobertas = 'artistas' | 'musicas' | 'redescobertas' | 'obsessoes'

function criarOpcoesDescobertas(): OpcaoPeriodoAnalise[] {
  const hoje = new Date()
  const anterior = new Date(hoje.getFullYear(), hoje.getMonth() - 1, 1)
  return [
    {
      chave: 'mes',
      rotulo: formatarNomeMes(hoje.getMonth() + 1),
      filtro: { periodo: 'mes', ano: hoje.getFullYear(), mes: hoje.getMonth() + 1 },
    },
    {
      chave: 'anterior',
      rotulo: formatarNomeMes(anterior.getMonth() + 1),
      filtro: { periodo: 'mes', ano: anterior.getFullYear(), mes: anterior.getMonth() + 1 },
    },
    { chave: '90d', rotulo: '90 dias', filtro: { periodo: 'dias', dias: 90 } },
    {
      chave: 'ano',
      rotulo: String(hoje.getFullYear()),
      filtro: { periodo: 'ano', ano: hoje.getFullYear() },
    },
  ]
}

export interface SecaoDescobertasProps {
  habilitado: boolean
}

export const SecaoDescobertas = memo(function SecaoDescobertas({
  habilitado,
}: SecaoDescobertasProps) {
  const opcoes = criarOpcoesDescobertas()
  const [chavePeriodo, setChavePeriodo] = useState('mes')
  const [aba, setAba] = useState<AbaDescobertas>('artistas')
  const filtro = (opcoes.find((opcao) => opcao.chave === chavePeriodo) ?? opcoes[0])?.filtro ?? {
    periodo: 'dias',
    dias: 30,
  }
  const { data, isLoading } = useDescobertasMusica(filtro, habilitado)

  return (
    <VStack align="stretch" gap={4} w="full">
      <CabecalhoSecaoMusica
        titulo="Novas Descobertas"
        descricao="O que entrou na sua vida, o que voltou e o que virou obsessão"
        acoes={
          <SeletorPeriodoAnalise
            opcoes={opcoes}
            selecionada={chavePeriodo}
            onSelecionar={setChavePeriodo}
          />
        }
      />

      <Box
        p={{ base: 3, sm: 5 }}
        bg="cirqueira.musica.cartao"
        borderRadius="8px"
        border="1px solid"
        borderColor="cirqueira.musica.cartaoElevado"
      >
        {isLoading || !data ? (
          <Skeleton h="220px" borderRadius="8px" />
        ) : (
          <VStack align="stretch" gap={4}>
            <Flex gap={2} wrap="wrap">
              <BotaoAba
                ativa={aba === 'artistas'}
                onClick={() => setAba('artistas')}
                icone={<UserPlus size={13} />}
                rotulo="Artistas novos"
                total={data.totalArtistasNovos}
              />
              <BotaoAba
                ativa={aba === 'musicas'}
                onClick={() => setAba('musicas')}
                icone={<Music2 size={13} />}
                rotulo="Músicas novas"
                total={data.totalMusicasNovas}
              />
              <BotaoAba
                ativa={aba === 'redescobertas'}
                onClick={() => setAba('redescobertas')}
                icone={<History size={13} />}
                rotulo="Redescobertas"
                total={data.redescobertas.length}
              />
              <BotaoAba
                ativa={aba === 'obsessoes'}
                onClick={() => setAba('obsessoes')}
                icone={<Flame size={13} />}
                rotulo="Obsessões"
                total={data.obsessoes.length}
              />
            </Flex>
            <ConteudoAba dados={data} aba={aba} />
          </VStack>
        )}
      </Box>
    </VStack>
  )
})

interface BotaoAbaProps {
  ativa: boolean
  onClick: () => void
  icone: ReactNode
  rotulo: string
  total: number
}

function BotaoAba({ ativa, onClick, icone, rotulo, total }: BotaoAbaProps) {
  return (
    <Button
      size="xs"
      borderRadius="full"
      px={3}
      fontSize="xs"
      fontWeight="semibold"
      bg={ativa ? 'cirqueira.musica.verde' : 'cirqueira.musica.cartaoElevado'}
      color={ativa ? 'cirqueira.musica.fundo' : 'cirqueira.musica.textoSecundario'}
      _hover={{ color: ativa ? 'cirqueira.musica.fundo' : 'cirqueira.musica.textoPrincipal' }}
      onClick={onClick}
    >
      {icone}
      {rotulo}
      <Badge
        size="xs"
        borderRadius="full"
        bg={ativa ? 'cirqueira.musica.fundo' : 'cirqueira.musica.cartao'}
        color={ativa ? 'cirqueira.musica.verde' : 'cirqueira.musica.textoSecundario'}
      >
        {total}
      </Badge>
    </Button>
  )
}

function ConteudoAba({ dados, aba }: { dados: DescobertasMusica; aba: AbaDescobertas }) {
  const itens: ItemComImagemMusica[] = [
    ...dados.artistasNovos.map((item) => item.artista),
    ...dados.musicasNovas.map((item) => item.musica),
    ...dados.redescobertas.map((item) => item.artista),
    ...dados.obsessoes.map((item) => item.musica),
  ]
  const imagemDe = useImagensItensMusica(itens)

  if (aba === 'artistas') {
    return dados.artistasNovos.length === 0 ? (
      <Vazio texto={`Nenhum artista novo em ${dados.periodo.rotulo.toLowerCase()}.`} />
    ) : (
      <SimpleGrid columns={{ base: 3, sm: 4, md: 6 }} gap={{ base: 3, md: 4 }}>
        {dados.artistasNovos.map(({ artista, primeiraVezEm }) => (
          <Link key={artista.nome} asChild _hover={{ textDecoration: 'none' }} display="block">
            <LinkMusica to={gerarRotaArtista(artista.nome)}>
              <VStack
                gap={1.5}
                p={2}
                borderRadius="8px"
                _hover={{ bg: 'cirqueira.musica.cartaoElevado' }}
                transition="background-color 0.15s ease"
              >
                <CapaMusica
                  url={imagemDe(artista)}
                  alt={artista.nome}
                  tipo="artista"
                  w="full"
                  aspectRatio="1"
                  tamanhoIcone={24}
                />
                <Text
                  fontSize="xs"
                  fontWeight="semibold"
                  color="cirqueira.musica.textoPrincipal"
                  textAlign="center"
                  lineClamp={1}
                >
                  {artista.nome}
                </Text>
                <Text fontSize="2xs" color="cirqueira.musica.textoSecundario" textAlign="center">
                  {artista.streams} streams · desde {formatarDataExtensa(primeiraVezEm)}
                </Text>
              </VStack>
            </LinkMusica>
          </Link>
        ))}
      </SimpleGrid>
    )
  }

  if (aba === 'musicas') {
    return dados.musicasNovas.length === 0 ? (
      <Vazio texto={`Nenhuma música nova em ${dados.periodo.rotulo.toLowerCase()}.`} />
    ) : (
      <SimpleGrid columns={{ base: 1, md: 2 }} gap={2}>
        {dados.musicasNovas.map(({ musica, primeiraVezEm }) => (
          <LinhaMusica
            key={`${musica.nomeFaixa}-${musica.artista}`}
            rota={gerarRotaMusica(musica.nomeFaixa, musica.artista)}
            capa={<CapaMusica url={imagemDe(musica)} alt={musica.album} boxSize="44px" />}
            titulo={musica.nomeFaixa}
            subtitulo={`${musica.artista} · primeira vez ${formatarDataExtensa(primeiraVezEm)}`}
            valor={`${musica.streams}x`}
          />
        ))}
      </SimpleGrid>
    )
  }

  if (aba === 'redescobertas') {
    return dados.redescobertas.length === 0 ? (
      <Vazio texto="Nenhum artista voltou depois de mais de 3 meses sem ouvir." />
    ) : (
      <SimpleGrid columns={{ base: 1, md: 2 }} gap={2}>
        {dados.redescobertas.map(({ artista, diasAusente, ultimaVezAntes }) => (
          <LinhaMusica
            key={artista.nome}
            rota={gerarRotaArtista(artista.nome)}
            capa={
              <CapaMusica
                url={imagemDe(artista)}
                alt={artista.nome}
                tipo="artista"
                boxSize="44px"
              />
            }
            titulo={artista.nome}
            subtitulo={`Voltou depois de ${Math.round(diasAusente / 30)} meses · antes: ${formatarDataExtensa(ultimaVezAntes)}`}
            valor={`${artista.streams} streams`}
          />
        ))}
      </SimpleGrid>
    )
  }

  return dados.obsessoes.length === 0 ? (
    <Vazio texto={`Nenhuma música passou de 8 repetições em ${dados.diasJanelaObsessao} dias.`} />
  ) : (
    <SimpleGrid columns={{ base: 1, md: 2 }} gap={2}>
      {dados.obsessoes.map(({ musica, vezesNaJanela, inicioJanela, fimJanela }) => (
        <LinhaMusica
          key={`${musica.nomeFaixa}-${musica.artista}`}
          rota={gerarRotaMusica(musica.nomeFaixa, musica.artista)}
          capa={<CapaMusica url={imagemDe(musica)} alt={musica.album} boxSize="44px" />}
          titulo={musica.nomeFaixa}
          subtitulo={`${musica.artista} · ${formatarDataExtensa(inicioJanela)} a ${formatarDataExtensa(fimJanela)}`}
          valor={`${vezesNaJanela}x em ${dados.diasJanelaObsessao} dias`}
          destaque
        />
      ))}
    </SimpleGrid>
  )
}

interface LinhaMusicaProps {
  rota: string
  capa: ReactNode
  titulo: string
  subtitulo: string
  valor: string
  destaque?: boolean
}

function LinhaMusica({ rota, capa, titulo, subtitulo, valor, destaque }: LinhaMusicaProps) {
  return (
    <Link asChild _hover={{ textDecoration: 'none' }} display="block">
      <LinkMusica to={rota}>
        <HStack
          gap={3}
          p={2}
          borderRadius="8px"
          bg="cirqueira.musica.cartaoElevado"
          _hover={{ bg: 'cirqueira.musica.fundo' }}
          transition="background-color 0.15s ease"
        >
          {capa}
          <VStack align="flex-start" gap={0} flex={1} minW={0}>
            <Text
              fontSize="sm"
              fontWeight="semibold"
              color="cirqueira.musica.textoPrincipal"
              truncate
              maxW="full"
            >
              {titulo}
            </Text>
            <Text fontSize="2xs" color="cirqueira.musica.textoSecundario" truncate maxW="full">
              {subtitulo}
            </Text>
          </VStack>
          <Text
            fontSize="xs"
            fontWeight="bold"
            color={destaque ? 'cirqueira.musica.amarelo' : 'cirqueira.musica.verde'}
            flexShrink={0}
          >
            {valor}
          </Text>
        </HStack>
      </LinkMusica>
    </Link>
  )
}

function Vazio({ texto }: { texto: string }) {
  return (
    <Text py={8} textAlign="center" fontSize="xs" color="cirqueira.musica.textoSecundario">
      {texto}
    </Text>
  )
}
