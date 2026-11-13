import {
  Box,
  Button,
  Flex,
  HStack,
  Heading,
  IconButton,
  Skeleton,
  Text,
  VStack,
} from '@chakra-ui/react'
import { ArrowDown, ArrowUp, Crown, Info, Minus, X } from 'lucide-react'
import { memo, useMemo, useState } from 'react'
import { useLinhaDoTempoMusica } from '../hooks'
import type { MesLinhaDoTempo } from '../types'
import {
  type ItemLinhaDoTempo,
  type MovimentoLinhaDoTempo,
  OPCOES_TIPO_LINHA_DO_TEMPO,
  type TipoLinhaDoTempo,
  type TrilhaLinhaDoTempo,
  anosDaLinhaDoTempo,
  descreverPassagensTrilha,
  formatarMinutos,
  formatarNomeMes,
  formatarNumeroPtBr,
  idAnoLinhaDoTempo,
  isPrimeiroMesDoAno,
  itensDoMesLinhaDoTempo,
  mesesParaFaixaLinhaDoTempo,
  pontosDaTrilha,
  resumirTrilhaLinhaDoTempo,
  rolarParaAnoLinhaDoTempo,
  tipoLinhaDoTempo,
} from '../utils'
import { CabecalhoSecaoMusica } from './CabecalhoSecaoMusica'
import { CapaMusica } from './CapaMusica'
import { LinkMusica } from './LinkMusica'
import { SeletorPeriodoAnalise } from './SeletorPeriodoAnalise'

const OPCOES_SELETOR = OPCOES_TIPO_LINHA_DO_TEMPO.map((opcao) => ({
  ...opcao,
  filtro: { periodo: 'todos' as const },
}))

const ESTILO_ROLAGEM = {
  scrollSnapType: 'x proximity',
} as const

export interface SecaoLinhaDoTempoProps {
  habilitado: boolean
}

export const SecaoLinhaDoTempo = memo(function SecaoLinhaDoTempo({
  habilitado,
}: SecaoLinhaDoTempoProps) {
  const [tipo, setTipo] = useState<TipoLinhaDoTempo>('musicas')
  const [seguido, setSeguido] = useState<string | null>(null)
  const { data, isLoading } = useLinhaDoTempoMusica(habilitado)
  const meses = data?.meses ?? []
  const mesesNaFaixa = useMemo(() => mesesParaFaixaLinhaDoTempo(meses), [meses])
  const anos = useMemo(() => anosDaLinhaDoTempo(meses), [meses])
  const trilha = useMemo(
    () => (seguido ? resumirTrilhaLinhaDoTempo(meses, tipo, seguido) : null),
    [meses, tipo, seguido]
  )

  function trocarTipo(chave: string) {
    setTipo(tipoLinhaDoTempo(chave))
    setSeguido(null)
  }

  function alternarSeguido(chave: string) {
    setSeguido((atual) => (atual === chave ? null : chave))
  }

  return (
    <VStack align="stretch" gap={4} w="full">
      <CabecalhoSecaoMusica
        titulo="Linha do Tempo"
        descricao={`Todos os meses lado a lado, do primeiro ao último. ${tipo === 'artistas' ? 'Toque num artista' : 'Toque numa música'} para seguir no tempo.`}
        cor="cirqueira.musica.azul"
        acoes={
          <SeletorPeriodoAnalise
            opcoes={OPCOES_SELETOR}
            selecionada={tipo}
            onSelecionar={trocarTipo}
          />
        }
      />

      {isLoading ? (
        <Skeleton h="520px" borderRadius="8px" />
      ) : meses.length === 0 ? (
        <Text fontSize="sm" color="cirqueira.musica.textoSecundario">
          Ainda não há meses com reproduções.
        </Text>
      ) : (
        <VStack align="stretch" gap={3}>
          <HStack gap={1.5} overflowX="auto" css={{ scrollbarWidth: 'none' }}>
            {anos.map((ano) => (
              <Button
                key={ano}
                size="xs"
                h="26px"
                px={3}
                flexShrink={0}
                borderRadius="full"
                fontWeight="bold"
                bg="cirqueira.musica.cartao"
                color="cirqueira.musica.textoSecundario"
                border="1px solid"
                borderColor="cirqueira.musica.cartaoElevado"
                _hover={{ color: 'cirqueira.musica.textoPrincipal' }}
                onClick={() => rolarParaAnoLinhaDoTempo(ano)}
              >
                {ano}
              </Button>
            ))}
          </HStack>

          {trilha && (
            <PainelTrilha
              trilha={trilha}
              meses={meses}
              tipo={tipo}
              onFechar={() => setSeguido(null)}
            />
          )}

          <Flex
            direction="row-reverse"
            gap={3}
            overflowX="auto"
            pb={2}
            css={ESTILO_ROLAGEM}
            aria-label="Meses, do mais recente ao mais antigo"
          >
            {mesesNaFaixa.map((mes) => (
              <ColunaMes
                key={`${mes.ano}-${mes.mes}`}
                mes={mes}
                tipo={tipo}
                seguido={seguido}
                idAno={isPrimeiroMesDoAno(meses, mes) ? idAnoLinhaDoTempo(mes.ano) : undefined}
                onSeguir={alternarSeguido}
              />
            ))}
          </Flex>
        </VStack>
      )}
    </VStack>
  )
})

interface ColunaMesProps {
  mes: MesLinhaDoTempo
  tipo: TipoLinhaDoTempo
  seguido: string | null
  idAno?: string
  onSeguir: (chave: string) => void
}

const ColunaMes = memo(function ColunaMes({ mes, tipo, seguido, idAno, onSeguir }: ColunaMesProps) {
  const itens = useMemo(() => itensDoMesLinhaDoTempo(mes, tipo), [mes, tipo])

  return (
    <VStack
      as="section"
      id={idAno}
      aria-label={`${formatarNomeMes(mes.mes)} de ${mes.ano}`}
      flex="0 0 auto"
      w={{ base: '236px', md: '256px' }}
      align="stretch"
      gap={2}
      p={3}
      bg="cirqueira.musica.cartao"
      borderRadius="12px"
      border="1px solid"
      borderColor={mes.emAndamento ? 'cirqueira.musica.verde' : 'cirqueira.musica.cartaoElevado'}
      scrollSnapAlign="start"
    >
      <HStack justify="space-between" align="start" gap={2}>
        <VStack align="start" gap={0} minW={0}>
          <Text
            fontSize="2xs"
            fontWeight="bold"
            color={mes.emAndamento ? 'cirqueira.musica.verde' : 'cirqueira.musica.textoSecundario'}
            textTransform="uppercase"
            letterSpacing="wider"
          >
            {mes.emAndamento ? `${mes.ano} · atual` : mes.ano}
          </Text>
          <Heading
            as="h3"
            fontSize="lg"
            fontWeight="black"
            color="cirqueira.musica.textoPrincipal"
            lineHeight="short"
          >
            {formatarNomeMes(mes.mes)}
          </Heading>
        </VStack>
        <VStack align="end" gap={0} flexShrink={0}>
          <Text fontSize="xs" fontWeight="bold" color="cirqueira.musica.verde">
            {formatarMinutos(mes.totalMinutos)}
          </Text>
          <Text fontSize="2xs" color="cirqueira.musica.textoSecundario">
            {formatarNumeroPtBr(mes.totalReproducoes)} plays
          </Text>
        </VStack>
      </HStack>

      <VStack as="ol" align="stretch" gap={0.5} listStyleType="none" m={0} p={0}>
        {itens.map((item) => (
          <LinhaItem
            key={item.chave}
            item={item}
            tipo={tipo}
            seguido={seguido === item.chave}
            esmaecido={seguido !== null && seguido !== item.chave}
            onSeguir={onSeguir}
          />
        ))}
      </VStack>
    </VStack>
  )
})

interface LinhaItemProps {
  item: ItemLinhaDoTempo
  tipo: TipoLinhaDoTempo
  seguido: boolean
  esmaecido: boolean
  onSeguir: (chave: string) => void
}

const LinhaItem = memo(function LinhaItem({
  item,
  tipo,
  seguido,
  esmaecido,
  onSeguir,
}: LinhaItemProps) {
  return (
    <Box as="li">
      <Flex
        as="button"
        w="full"
        textAlign="left"
        align="center"
        gap={2}
        px={1.5}
        py={1}
        borderRadius="8px"
        border="1px solid"
        borderColor={seguido ? 'cirqueira.musica.verde' : 'transparent'}
        bg={seguido ? 'cirqueira.musica.cartaoElevado' : 'transparent'}
        opacity={esmaecido ? 0.35 : 1}
        transition="opacity 0.2s, background 0.2s"
        cursor="pointer"
        _hover={{ bg: 'cirqueira.musica.cartaoElevado', opacity: 1 }}
        aria-pressed={seguido}
        aria-label={`${item.posicao}º ${item.titulo}, ${formatarNumeroPtBr(item.streams)} plays. Seguir no tempo`}
        onClick={() => onSeguir(item.chave)}
      >
        <Text
          w="18px"
          flexShrink={0}
          textAlign="right"
          fontSize="xs"
          fontWeight="black"
          color={item.posicao === 1 ? 'cirqueira.musica.verde' : 'cirqueira.musica.textoSecundario'}
        >
          {item.posicao}
        </Text>
        <CapaMusica
          url={item.imagemUrl}
          alt={item.titulo}
          tipo={tipo === 'artistas' ? 'artista' : 'faixa'}
          tamanhoIcone={14}
          w="34px"
          h="34px"
          borderRadius={tipo === 'artistas' ? 'full' : '4px'}
        />
        <VStack align="start" gap={0} flex="1" minW={0}>
          <Text
            fontSize="xs"
            fontWeight="semibold"
            color="cirqueira.musica.textoPrincipal"
            lineClamp={1}
            wordBreak="break-all"
          >
            {item.titulo}
          </Text>
          <Text fontSize="2xs" color="cirqueira.musica.textoSecundario" lineClamp={1}>
            {item.subtitulo} · {formatarNumeroPtBr(item.streams)}
          </Text>
        </VStack>
        <IndicadorMovimento movimento={item.movimento} />
      </Flex>
    </Box>
  )
})

const IndicadorMovimento = memo(function IndicadorMovimento({
  movimento,
}: {
  movimento: MovimentoLinhaDoTempo
}) {
  if (movimento.tipo === 'novo') {
    return (
      <Text
        flexShrink={0}
        fontSize="2xs"
        fontWeight="black"
        color="cirqueira.musica.amarelo"
        textTransform="uppercase"
        title="Não estava no top 50 do mês anterior"
      >
        novo
      </Text>
    )
  }
  if (movimento.tipo === 'igual') {
    return (
      <Box flexShrink={0} color="cirqueira.musica.textoDesabilitado" title="Mesma posição">
        <Minus size={11} />
      </Box>
    )
  }
  const subiu = movimento.tipo === 'subiu'
  return (
    <HStack
      flexShrink={0}
      gap={0}
      fontSize="2xs"
      fontWeight="bold"
      color={subiu ? 'cirqueira.musica.verde' : 'cirqueira.musica.textoDesabilitado'}
      title={subiu ? `Subiu ${movimento.valor}` : `Caiu ${movimento.valor}`}
    >
      {subiu ? <ArrowUp size={11} /> : <ArrowDown size={11} />}
      <Text>{movimento.valor}</Text>
    </HStack>
  )
})

interface PainelTrilhaProps {
  trilha: TrilhaLinhaDoTempo
  meses: MesLinhaDoTempo[]
  tipo: TipoLinhaDoTempo
  onFechar: () => void
}

const PainelTrilha = memo(function PainelTrilha({
  trilha,
  meses,
  tipo,
  onFechar,
}: PainelTrilhaProps) {
  const pontos = useMemo(() => pontosDaTrilha(meses, trilha), [meses, trilha])
  const { item, melhorPosicao } = trilha

  return (
    <VStack
      align="stretch"
      gap={3}
      p={{ base: 3, md: 4 }}
      bg="cirqueira.musica.cartao"
      borderRadius="12px"
      border="1px solid"
      borderColor="cirqueira.musica.verde"
    >
      <HStack gap={3} align="center">
        <CapaMusica
          url={item.imagemUrl}
          alt={item.titulo}
          tipo={tipo === 'artistas' ? 'artista' : 'faixa'}
          w="52px"
          h="52px"
          borderRadius={tipo === 'artistas' ? 'full' : '6px'}
        />
        <VStack align="start" gap={0.5} flex="1" minW={0}>
          <Text
            fontSize="sm"
            fontWeight="bold"
            color="cirqueira.musica.textoPrincipal"
            lineClamp={1}
            wordBreak="break-all"
          >
            {item.titulo}
          </Text>
          <Text fontSize="xs" color="cirqueira.musica.textoSecundario" lineClamp={2}>
            {descreverPassagensTrilha(trilha)} · melhor posição {melhorPosicao.posicao}º em{' '}
            {formatarNomeMes(melhorPosicao.mes).toLowerCase()} de {melhorPosicao.ano}
          </Text>
          <HStack gap={2} wrap="wrap">
            {trilha.vezesNoTopo > 0 && (
              <HStack gap={1} fontSize="2xs" fontWeight="bold" color="cirqueira.musica.amarelo">
                <Crown size={11} />
                <Text>Já foi a nº 1</Text>
              </HStack>
            )}
            <LinkMusica to={item.rota}>
              <HStack
                as="span"
                gap={1}
                fontSize="2xs"
                fontWeight="semibold"
                color="cirqueira.musica.textoSecundario"
                _hover={{ color: 'cirqueira.musica.verde' }}
              >
                <Info size={11} /> Ver detalhes
              </HStack>
            </LinkMusica>
          </HStack>
        </VStack>
        <IconButton
          aria-label="Parar de seguir"
          size="xs"
          variant="ghost"
          color="cirqueira.musica.textoSecundario"
          onClick={onFechar}
        >
          <X size={14} />
        </IconButton>
      </HStack>

      <Flex
        align="flex-end"
        gap="3px"
        h="44px"
        overflowX="auto"
        css={{ scrollbarWidth: 'none' }}
        aria-label="Posição em cada mês"
      >
        {pontos.map((ponto) => (
          <Box
            key={ponto.chave}
            flex="1 0 6px"
            maxW="18px"
            h={`${ponto.alturaPercentual}%`}
            borderRadius="2px"
            bg={
              ponto.posicao === null
                ? 'cirqueira.musica.cartaoElevado'
                : ponto.posicao === 1
                  ? 'cirqueira.musica.amarelo'
                  : 'cirqueira.musica.verde'
            }
            title={
              ponto.posicao === null
                ? `${ponto.rotulo}: fora do top 10`
                : `${ponto.rotulo}: ${ponto.posicao}º`
            }
          />
        ))}
      </Flex>
      <HStack justify="space-between">
        <Text fontSize="2xs" color="cirqueira.musica.textoDesabilitado">
          {pontos[0]?.rotulo}
        </Text>
        <Text fontSize="2xs" color="cirqueira.musica.textoDesabilitado">
          {pontos[pontos.length - 1]?.rotulo}
        </Text>
      </HStack>
    </VStack>
  )
})
