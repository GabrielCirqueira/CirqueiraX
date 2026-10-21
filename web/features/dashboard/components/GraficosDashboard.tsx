import { Box, Grid, HStack, Skeleton, Text, VStack } from '@chakra-ui/react'
import { memo } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { CategoriaMetrica, ResumoDashboard } from '../types'
import {
  type BarraCategoria,
  COR_TOKEN,
  type FatiaOrigem,
  montarBarrasCategorias,
  montarFatiasOrigem,
  pluralizar,
} from '../utils/metricasDashboard'
import { BarraProporcao, PainelDashboard } from './PainelDashboard'

export interface GraficosDashboardProps {
  resumo?: ResumoDashboard
  categorias?: CategoriaMetrica[]
  carregando?: boolean
}

const COR_EIXO = 'var(--chakra-colors-fg-subtle)'
const COR_GRADE = 'var(--chakra-colors-border-subtle)'
const COR_FUNDO_PAINEL = 'var(--chakra-colors-bg-panel)'
const ESTILO_TICK = { fill: COR_EIXO, fontSize: 11 }

interface DicaGrafico {
  titulo: string
  linhas: { rotulo: string; valor: string }[]
}

function CaixaDica({ titulo, linhas }: DicaGrafico) {
  return (
    <VStack
      align="stretch"
      gap={1}
      p={3}
      minW="150px"
      bg="bg.panel"
      borderWidth="1px"
      borderColor="border.subtle"
      borderRadius="lg"
      fontSize="xs"
    >
      <Text fontWeight="semibold" color="fg">
        {titulo}
      </Text>
      {linhas.map((linha) => (
        <HStack key={linha.rotulo} justify="space-between" gap={4} color="fg.subtle">
          <Text as="span">{linha.rotulo}</Text>
          <Text as="span" color="fg" fontWeight="medium">
            {linha.valor}
          </Text>
        </HStack>
      ))}
    </VStack>
  )
}

function DicaOrigem({
  active,
  payload,
}: { active?: boolean; payload?: { payload: FatiaOrigem }[] }) {
  const fatia = payload?.[0]?.payload
  if (!active || !fatia) return null
  return (
    <CaixaDica
      titulo={fatia.rotulo}
      linhas={[{ rotulo: 'Mídias', valor: `${fatia.valor} (${fatia.percentual}%)` }]}
    />
  )
}

function DicaCategoria({
  active,
  payload,
}: { active?: boolean; payload?: { payload: BarraCategoria }[] }) {
  const barra = payload?.[0]?.payload
  if (!active || !barra) return null
  return (
    <CaixaDica
      titulo={barra.nome}
      linhas={[
        { rotulo: 'Espaço', valor: barra.tamanhoFormatado },
        { rotulo: 'Arquivos', valor: String(barra.totalItens) },
      ]}
    />
  )
}

function EstadoVazio({ mensagem }: { mensagem: string }) {
  return (
    <VStack h={56} justify="center" color="fg.subtle">
      <Text fontSize="sm">{mensagem}</Text>
    </VStack>
  )
}

export const GraficosDashboard = memo(function GraficosDashboard({
  resumo,
  categorias = [],
  carregando = false,
}: GraficosDashboardProps) {
  if (carregando) {
    return (
      <Grid w="full" templateColumns={{ base: '1fr', lg: 'repeat(2, 1fr)' }} gap={4}>
        <Skeleton h="320px" borderRadius="xl" />
        <Skeleton h="320px" borderRadius="xl" />
      </Grid>
    )
  }

  const fatias = montarFatiasOrigem(resumo)
  const barras = montarBarrasCategorias(categorias)
  const totalMidias = resumo?.totalGeral ?? 0

  return (
    <VStack gap={4} w="full" align="stretch">
      <Grid w="full" templateColumns={{ base: '1fr', lg: 'repeat(2, 1fr)' }} gap={4}>
        <PainelDashboard titulo="Origem das mídias" descricao="Volume por canal de entrada">
          {fatias.length === 0 ? (
            <EstadoVazio mensagem="Nenhuma mídia registrada ainda." />
          ) : (
            <Grid templateColumns={{ base: '1fr', md: '1fr 1fr' }} gap={4} alignItems="center">
              <Box h={56} position="relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Tooltip content={<DicaOrigem />} />
                    <Pie
                      data={fatias}
                      dataKey="valor"
                      nameKey="rotulo"
                      innerRadius={62}
                      outerRadius={84}
                      paddingAngle={2}
                      stroke={COR_FUNDO_PAINEL}
                      strokeWidth={2}
                    >
                      {fatias.map((fatia) => (
                        <Cell key={fatia.chave} fill={fatia.cor} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <VStack
                  position="absolute"
                  top="50%"
                  left="50%"
                  transform="translate(-50%, -50%)"
                  gap={0}
                  pointerEvents="none"
                >
                  <Text fontSize="xl" fontWeight="semibold" color="fg" lineHeight="1">
                    {totalMidias}
                  </Text>
                  <Text fontSize="xs" color="fg.subtle">
                    mídias
                  </Text>
                </VStack>
              </Box>

              <VStack align="stretch" gap={0}>
                {fatias.map((fatia) => (
                  <HStack
                    key={fatia.chave}
                    justify="space-between"
                    py={2}
                    borderBottomWidth="1px"
                    borderColor="border.subtle"
                    _last={{ borderBottomWidth: 0 }}
                  >
                    <HStack gap={2}>
                      <Box w={2} h={2} borderRadius="full" bg={fatia.cor} />
                      <Text fontSize="xs" color="fg">
                        {fatia.rotulo}
                      </Text>
                    </HStack>
                    <Text fontSize="xs" color="fg.subtle">
                      {fatia.valor} · {fatia.percentual}%
                    </Text>
                  </HStack>
                ))}
              </VStack>
            </Grid>
          )}
        </PainelDashboard>

        <PainelDashboard
          titulo="Armazenamento por categoria"
          descricao="Espaço em disco por pasta (MB)"
        >
          {barras.length === 0 ? (
            <EstadoVazio mensagem="Nenhuma categoria com arquivos." />
          ) : (
            <Box h={56}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barras} margin={{ top: 4, right: 4, left: -12, bottom: 0 }}>
                  <CartesianGrid stroke={COR_GRADE} vertical={false} />
                  <XAxis
                    dataKey="nome"
                    tick={ESTILO_TICK}
                    tickLine={false}
                    axisLine={false}
                    interval={0}
                  />
                  <YAxis tick={ESTILO_TICK} tickLine={false} axisLine={false} width={48} />
                  <Tooltip
                    content={<DicaCategoria />}
                    cursor={{ fill: 'var(--chakra-colors-bg-muted)' }}
                  />
                  <Bar
                    dataKey="tamanhoMb"
                    fill={COR_TOKEN.marca}
                    radius={[4, 4, 0, 0]}
                    maxBarSize={36}
                  />
                </BarChart>
              </ResponsiveContainer>
            </Box>
          )}
        </PainelDashboard>
      </Grid>

      {barras.length > 0 && (
        <PainelDashboard
          titulo="Ocupação das pastas"
          descricao={`Total indexado: ${resumo?.tamanhoTotalFormatado ?? '0 B'}`}
        >
          <Grid
            templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' }}
            columnGap={8}
            rowGap={4}
          >
            {barras.map((barra) => (
              <VStack key={barra.nome} align="stretch" gap={1.5} minW={0}>
                <HStack justify="space-between" gap={2}>
                  <Text fontSize="xs" fontWeight="medium" color="fg" truncate>
                    {barra.nome}
                  </Text>
                  <Text fontSize="xs" color="fg.subtle" flexShrink={0}>
                    {barra.tamanhoFormatado}
                  </Text>
                </HStack>
                <BarraProporcao
                  segmentos={[{ percentual: barra.percentual, cor: COR_TOKEN.marca }]}
                />
                <Text fontSize="11px" color="fg.subtle">
                  {pluralizar(barra.totalItens, 'item', 'itens')} · {barra.percentual}% do total
                </Text>
              </VStack>
            ))}
          </Grid>
        </PainelDashboard>
      )}
    </VStack>
  )
})
