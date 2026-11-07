import {
  Box,
  Button,
  Grid,
  HStack,
  Input,
  Progress,
  Skeleton,
  Text,
  VStack,
} from '@chakra-ui/react'
import {
  ArrowRight,
  BookOpen,
  Clock3,
  Flame,
  HardDrive,
  Headphones,
  Play,
  Target,
} from 'lucide-react'
import { memo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useDefinirMetaEscuta, useEstatisticasEscuta, usePainelLivros } from '../hooks/useDashboard'
import type { EstatisticasEscutaLivros, PainelSistemaLivros } from '../types'
import { COR_TOKEN, type TomMetrica, pluralizar } from '../utils/metricasDashboard'
import { BarraProporcao, IndicadorMetrica, PainelDashboard } from './PainelDashboard'

const COLUNAS_INDICADORES = { base: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' }
const NOMES_DIAS = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb']

function formatarBytes(bytes: number | null | undefined): string {
  if (bytes === null || bytes === undefined) return '—'
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  if (bytes < 1024 ** 3) return `${Math.round(bytes / 1024 ** 2)} MB`
  return `${(bytes / 1024 ** 3).toFixed(1).replace('.', ',')} GB`
}

function formatarMinutos(segundos: number): string {
  const minutos = Math.round(segundos / 60)
  if (minutos < 60) return `${minutos} min`
  const horas = Math.floor(minutos / 60)
  const resto = minutos % 60
  return resto > 0 ? `${horas} h ${resto} min` : `${horas} h`
}

function formatarHoras(segundos: number): string {
  const horas = segundos / 3600
  if (horas < 1) return `${Math.round(segundos / 60)} min`
  return `${horas.toFixed(horas < 10 ? 1 : 0).replace('.', ',')} h`
}

function percentual(parte: number, total: number): number {
  return total > 0 ? Math.min(100, Math.round((parte / total) * 100)) : 0
}

function tomDoDisco(nivel: PainelSistemaLivros['disco']['nivel']): TomMetrica {
  if (nivel === 'critico') return 'erro'
  if (nivel === 'atencao') return 'alerta'
  return 'neutro'
}

const ContinuarOuvindo = memo(function ContinuarOuvindo({
  livros,
}: {
  livros: EstatisticasEscutaLivros['continuar']
}) {
  if (livros.length === 0) {
    return (
      <HStack
        gap={3.5}
        p={4}
        borderRadius="8px"
        bg="bg.muted"
        borderWidth="1px"
        borderColor="border.subtle"
        align="center"
        justify="space-between"
        flexWrap="wrap"
      >
        <HStack gap={3} align="center" minW={0}>
          <Box
            p={2.5}
            borderRadius="8px"
            bg="cirqueira.purple.500/12"
            color="cirqueira.purple.400"
            display="inline-flex"
            flexShrink={0}
          >
            <Headphones size={20} strokeWidth={2.2} />
          </Box>
          <VStack align="flex-start" gap={0.5} minW={0}>
            <Text fontSize="xs" fontWeight="semibold" color="fg">
              Nenhuma escuta em andamento
            </Text>
            <Text fontSize="11px" color="fg.subtle">
              Inicie um audiolivro da sua biblioteca para acompanhar seu progresso
            </Text>
          </VStack>
        </HStack>
        <Button asChild size="xs" variant="outline" borderRadius="full">
          <Link to="/livros-audio">
            Explorar livros
            <ArrowRight size={12} />
          </Link>
        </Button>
      </HStack>
    )
  }

  return (
    <VStack align="stretch" gap={2}>
      {livros.map((livro, indice) => (
        <HStack
          key={livro.uuid}
          gap={3}
          p={3}
          borderRadius="8px"
          bg={indice === 0 ? 'bg.muted' : 'bg.panel'}
          borderWidth="1px"
          borderColor="border.subtle"
        >
          <Box color="fg.subtle" flexShrink={0}>
            <BookOpen size={18} />
          </Box>
          <VStack align="stretch" gap={1} flex={1} minW={0}>
            <Text fontSize="sm" fontWeight="semibold" color="fg" truncate title={livro.titulo}>
              {livro.titulo}
            </Text>
            <Progress.Root value={Math.round(livro.progresso * 100)} size="xs" colorPalette="brand">
              <Progress.Track borderRadius="full">
                <Progress.Range borderRadius="full" />
              </Progress.Track>
            </Progress.Root>
            <Text fontSize="xs" color="fg.subtle">
              Página {livro.paginaAtual}
              {livro.totalPaginas > 0 ? ` de ${livro.totalPaginas}` : ''} ·{' '}
              {Math.round(livro.progresso * 100)}%
            </Text>
          </VStack>
          <Button
            asChild
            size="xs"
            borderRadius="full"
            colorPalette="brand"
            variant={indice === 0 ? 'solid' : 'subtle'}
            flexShrink={0}
          >
            <Link to={`/livros-audio/${livro.uuid}`}>
              <Play size={12} />
              {indice === 0 ? 'Continuar' : 'Abrir'}
            </Link>
          </Button>
        </HStack>
      ))}
    </VStack>
  )
})

const GraficoEscuta = memo(function GraficoEscuta({
  dias,
  metaSegundos,
}: {
  dias: EstatisticasEscutaLivros['dias']
  metaSegundos: number
}) {
  const maximo = Math.max(metaSegundos, ...dias.map((dia) => dia.segundos), 1)
  const alturaMeta = (metaSegundos / maximo) * 100

  return (
    <Box>
      <Box position="relative" h="72px">
        <Box
          position="absolute"
          left={0}
          right={0}
          bottom={`${alturaMeta}%`}
          borderTop="1px dashed"
          borderColor="fg.subtle"
          opacity={0.5}
          pointerEvents="none"
        />
        <HStack h="full" align="flex-end" gap={1}>
          {dias.map((dia) => {
            const bateu = dia.segundos >= metaSegundos
            const data = new Date(`${dia.dia}T12:00:00`)
            return (
              <Box
                key={dia.dia}
                flex={1}
                h={`${Math.max(dia.segundos > 0 ? 4 : 2, (dia.segundos / maximo) * 100)}%`}
                bg={bateu ? COR_TOKEN.marca : dia.segundos > 0 ? 'fg.subtle' : 'bg.muted'}
                opacity={bateu ? 1 : 0.55}
                borderRadius="8px"
                title={`${data.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}: ${formatarMinutos(dia.segundos)}`}
              />
            )
          })}
        </HStack>
      </Box>
      <HStack gap={1} mt={1}>
        {dias.map((dia, indice) => (
          <Text key={dia.dia} flex={1} fontSize="9px" color="fg.subtle" textAlign="center">
            {indice % 2 === 1 || indice === dias.length - 1
              ? NOMES_DIAS[new Date(`${dia.dia}T12:00:00`).getDay()]
              : ''}
          </Text>
        ))}
      </HStack>
    </Box>
  )
})

const ResumoEscuta = memo(function ResumoEscuta({
  estatisticas,
}: {
  estatisticas: EstatisticasEscutaLivros
}) {
  const [editandoMeta, setEditandoMeta] = useState(false)
  const [metaDigitada, setMetaDigitada] = useState(String(estatisticas.metaMinutos))
  const definirMetaMutation = useDefinirMetaEscuta()
  const metaSegundos = estatisticas.metaMinutos * 60
  const progressoHoje = percentual(estatisticas.hojeSegundos, metaSegundos)

  function salvarMeta() {
    const minutos = Number.parseInt(metaDigitada, 10)
    if (!Number.isFinite(minutos)) return
    definirMetaMutation.mutate(minutos, { onSuccess: () => setEditandoMeta(false) })
  }

  return (
    <VStack align="stretch" gap={3}>
      <HStack justify="space-between" align="flex-end" gap={3} flexWrap="wrap">
        <VStack align="flex-start" gap={0}>
          <Text fontSize="xs" color="fg.subtle">
            Ouvido hoje
          </Text>
          <Text fontSize="2xl" fontWeight="semibold" letterSpacing="tight" color="fg">
            {formatarMinutos(estatisticas.hojeSegundos)}
          </Text>
        </VStack>
        <HStack gap={3} fontSize="xs" color="fg.subtle">
          <HStack gap={1} title="Dias seguidos batendo a meta">
            <Flame size={13} />
            <Text>{pluralizar(estatisticas.sequenciaDias, 'dia seguido', 'dias seguidos')}</Text>
          </HStack>
          <Text>7 dias: {formatarMinutos(estatisticas.semanaSegundos)}</Text>
        </HStack>
      </HStack>

      <VStack align="stretch" gap={1}>
        <Progress.Root value={progressoHoje} size="sm" colorPalette="brand">
          <Progress.Track borderRadius="full">
            <Progress.Range borderRadius="full" />
          </Progress.Track>
        </Progress.Root>
        <HStack justify="space-between" fontSize="xs" color="fg.subtle" gap={2}>
          {editandoMeta ? (
            <HStack gap={1.5}>
              <Input
                size="xs"
                w="64px"
                type="number"
                min={5}
                max={600}
                value={metaDigitada}
                onChange={(evento) => setMetaDigitada(evento.target.value)}
                onKeyDown={(evento) => {
                  if (evento.key === 'Enter') salvarMeta()
                  if (evento.key === 'Escape') setEditandoMeta(false)
                }}
                aria-label="Meta diária em minutos"
              />
              <Text>min por dia</Text>
              <Button
                size="2xs"
                colorPalette="brand"
                loading={definirMetaMutation.isPending}
                onClick={salvarMeta}
              >
                Salvar
              </Button>
            </HStack>
          ) : (
            <Button
              size="2xs"
              variant="ghost"
              color="fg.subtle"
              px={1}
              onClick={() => {
                setMetaDigitada(String(estatisticas.metaMinutos))
                setEditandoMeta(true)
              }}
            >
              <Target size={12} />
              Meta: {estatisticas.metaMinutos} min por dia
            </Button>
          )}
          <Text>
            {progressoHoje >= 100
              ? 'Meta de hoje cumprida'
              : `Faltam ${formatarMinutos(Math.max(0, metaSegundos - estatisticas.hojeSegundos))}`}
          </Text>
        </HStack>
      </VStack>

      <GraficoEscuta dias={estatisticas.dias} metaSegundos={metaSegundos} />
    </VStack>
  )
})

const ArmazenamentoLivros = memo(function ArmazenamentoLivros({
  painel,
}: {
  painel: PainelSistemaLivros
}) {
  const { disco, memoria, livros, audios, vozesExtras, fila } = painel
  const bytesLivros = painel.bytesNaPasta ?? painel.bytesNoBanco
  const outrosNoDisco = Math.max(0, disco.usadoBytes - bytesLivros)
  const memoriaServidorUsada =
    memoria.servidorTotalBytes !== null && memoria.servidorDisponivelBytes !== null
      ? memoria.servidorTotalBytes - memoria.servidorDisponivelBytes
      : null

  return (
    <>
      <Grid templateColumns={COLUNAS_INDICADORES} gap="1px" bg="border.subtle">
        <IndicadorMetrica
          rotulo="Livros"
          valor={livros.total}
          icone={BookOpen}
          detalhe={`${pluralizar(livros.pdfs, 'PDF', 'PDFs')} · ${formatarBytes(livros.bytesPdfs)}`}
        />
        <IndicadorMetrica
          rotulo="Áudio gerado"
          valor={formatarHoras(audios.segundos)}
          icone={Headphones}
          detalhe={`${audios.partesProntas} de ${audios.partes} partes · ${formatarBytes(audios.bytes)}`}
        />
        <IndicadorMetrica
          rotulo="Espaço dos livros"
          valor={formatarBytes(bytesLivros)}
          icone={HardDrive}
          detalhe={
            vozesExtras.bytes > 0
              ? `Vozes extras: ${formatarBytes(vozesExtras.bytes)}`
              : `Cerca de ${formatarBytes(audios.bytesPorParte)} por parte`
          }
        />
        <IndicadorMetrica
          rotulo="Fila de geração"
          valor={pluralizar(fila.partesNaFila, 'parte', 'partes')}
          icone={Clock3}
          detalhe={
            fila.partesNaFila > 0
              ? `Cerca de ${formatarMinutos(fila.segundosRestantes)} · ${fila.segundosPorParte} s por parte`
              : 'Nada para gerar'
          }
        />
      </Grid>

      <Grid
        templateColumns={{ base: 'minmax(0, 1fr)', lg: 'minmax(0, 1fr) minmax(0, 1fr)' }}
        gap="1px"
        bg="border.subtle"
        borderTopWidth="1px"
        borderColor="border.subtle"
      >
        <VStack align="stretch" gap={2.5} p={5} bg="bg.panel">
          <HStack justify="space-between" gap={2}>
            <Text fontSize="xs" color="fg.subtle">
              Disco
            </Text>
            <Text fontSize="xs" color="fg.subtle">
              {formatarBytes(disco.livreBytes)} livres de {formatarBytes(disco.totalBytes)}
            </Text>
          </HStack>
          <BarraProporcao
            segmentos={[
              { percentual: percentual(bytesLivros, disco.totalBytes), cor: COR_TOKEN.marca },
              { percentual: percentual(outrosNoDisco, disco.totalBytes), cor: COR_TOKEN.azul },
            ]}
          />
          <HStack gap={4} fontSize="xs" color="fg.subtle" flexWrap="wrap">
            <HStack gap={1.5}>
              <Box boxSize={2} borderRadius="full" bg={COR_TOKEN.marca} />
              <Text>Livros: {formatarBytes(bytesLivros)}</Text>
            </HStack>
            <HStack gap={1.5}>
              <Box boxSize={2} borderRadius="full" bg={COR_TOKEN.azul} />
              <Text>Resto do sistema: {formatarBytes(outrosNoDisco)}</Text>
            </HStack>
          </HStack>
          {disco.mensagem && (
            <Text
              fontSize="xs"
              color={tomDoDisco(disco.nivel) === 'erro' ? 'fg.error' : 'fg.warning'}
            >
              {disco.mensagem}
            </Text>
          )}
          {vozesExtras.porVoz.length > 0 && (
            <VStack align="stretch" gap={1} pt={1}>
              {vozesExtras.porVoz.map((voz) => (
                <HStack key={voz.voz} justify="space-between" fontSize="xs" color="fg.subtle">
                  <Text>Voz {voz.nome}</Text>
                  <Text>
                    {voz.partes} partes · {formatarBytes(voz.bytes)}
                  </Text>
                </HStack>
              ))}
            </VStack>
          )}
        </VStack>

        <VStack align="stretch" gap={2.5} p={5} bg="bg.panel">
          <HStack justify="space-between" gap={2}>
            <Text fontSize="xs" color="fg.subtle">
              Memória
            </Text>
            <Text fontSize="xs" color="fg.subtle">
              {memoria.servidorDisponivelBytes !== null
                ? `${formatarBytes(memoria.servidorDisponivelBytes)} livres no servidor`
                : 'Indisponível'}
            </Text>
          </HStack>
          {memoria.servidorTotalBytes !== null && memoriaServidorUsada !== null && (
            <BarraProporcao
              segmentos={[
                {
                  percentual: percentual(
                    memoria.containerUsadoBytes ?? 0,
                    memoria.servidorTotalBytes
                  ),
                  cor: COR_TOKEN.marca,
                },
                {
                  percentual: percentual(
                    Math.max(0, memoriaServidorUsada - (memoria.containerUsadoBytes ?? 0)),
                    memoria.servidorTotalBytes
                  ),
                  cor: COR_TOKEN.azul,
                },
              ]}
            />
          )}
          <VStack align="stretch" gap={1} fontSize="xs" color="fg.subtle">
            <HStack justify="space-between">
              <HStack gap={1.5}>
                <Box boxSize={2} borderRadius="full" bg={COR_TOKEN.marca} />
                <Text>Sistema CirqueiraX</Text>
              </HStack>
              <Text>
                {formatarBytes(memoria.containerUsadoBytes)}
                {memoria.containerLimiteBytes
                  ? ` de ${formatarBytes(memoria.containerLimiteBytes)}`
                  : ''}
              </Text>
            </HStack>
            <HStack justify="space-between">
              <Text pl={3.5}>Gerador de áudio</Text>
              <Text>{memoria.workerAtivo ? formatarBytes(memoria.workerBytes) : 'parado'}</Text>
            </HStack>
            <HStack justify="space-between">
              <HStack gap={1.5}>
                <Box boxSize={2} borderRadius="full" bg={COR_TOKEN.azul} />
                <Text>Outros programas do servidor</Text>
              </HStack>
              <Text>
                {memoriaServidorUsada !== null
                  ? formatarBytes(
                      Math.max(0, memoriaServidorUsada - (memoria.containerUsadoBytes ?? 0))
                    )
                  : '—'}
              </Text>
            </HStack>
            <HStack justify="space-between">
              <Text pl={3.5}>Total do servidor</Text>
              <Text>{formatarBytes(memoria.servidorTotalBytes)}</Text>
            </HStack>
          </VStack>
        </VStack>
      </Grid>
    </>
  )
})

export const SecaoLivrosDashboard = memo(function SecaoLivrosDashboard() {
  const { data: estatisticas, isLoading: carregandoEscuta } = useEstatisticasEscuta()
  const { data: painel, isLoading: carregandoPainel } = usePainelLivros()

  return (
    <PainelDashboard
      semEspacamento
      icone={BookOpen}
      titulo="Livros em áudio"
      descricao="Onde você parou, quanto ouviu e quanto espaço os livros ocupam"
      acao={
        <Button
          asChild
          size="xs"
          variant="outline"
          borderRadius="full"
          borderColor="border.subtle"
          color="fg.muted"
          _hover={{ bg: 'bg.muted', color: 'fg' }}
        >
          <Link to="/livros-audio">
            Abrir biblioteca
            <ArrowRight size={12} />
          </Link>
        </Button>
      }
    >
      <Grid
        templateColumns={{ base: 'minmax(0, 1fr)', lg: 'minmax(0, 3fr) minmax(0, 2fr)' }}
        gap="1px"
        bg="border.subtle"
        borderTopWidth="1px"
        borderColor="border.subtle"
      >
        <VStack align="stretch" gap={3} p={5} bg="bg.panel">
          <Text fontSize="xs" color="fg.subtle">
            Continuar ouvindo
          </Text>
          {carregandoEscuta || !estatisticas ? (
            <Skeleton h="120px" borderRadius="8px" />
          ) : (
            <ContinuarOuvindo livros={estatisticas.continuar} />
          )}
        </VStack>
        <Box p={5} bg="bg.panel">
          {carregandoEscuta || !estatisticas ? (
            <Skeleton h="160px" borderRadius="8px" />
          ) : (
            <ResumoEscuta estatisticas={estatisticas} />
          )}
        </Box>
      </Grid>

      <Box borderTopWidth="1px" borderColor="border.subtle">
        {carregandoPainel || !painel ? (
          <Skeleton h="180px" borderRadius="none" />
        ) : (
          <ArmazenamentoLivros painel={painel} />
        )}
      </Box>
    </PainelDashboard>
  )
})
