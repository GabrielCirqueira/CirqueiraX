import { Box, Flex, Grid, HStack, SimpleGrid, Skeleton, Text, VStack } from '@chakra-ui/react'
import { Blend, Shuffle, Waves } from 'lucide-react'
import { memo, useState } from 'react'
import { Cell, Pie, PieChart, ResponsiveContainer } from 'recharts'
import { useBlocoMusica, useImagensItensMusica } from '../hooks'
import type { VersoesMusica } from '../typesBlocos'
import {
  CORES_GRAFICO_MUSICA,
  criarOpcoesPeriodoBlocos,
  encontrarPico,
  filtroDaOpcao,
  formatarMinutos,
  formatarNumeroPtBr,
  gerarRotaArtista,
  gerarRotaMusica,
  musicasValidas,
  proporcao,
} from '../utils'
import { CabecalhoSecaoMusica } from './CabecalhoSecaoMusica'
import { CapaMusica } from './CapaMusica'
import { LinkMusica } from './LinkMusica'
import { BarraProporcaoMusica, CartaoBlocoMusica, VazioBlocoMusica } from './PecasBlocoMusica'
import { SeletorPeriodoAnalise } from './SeletorPeriodoAnalise'

const TIPO_ORIGINAL = 'original'

export const AbaVersoes = memo(function AbaVersoes({ habilitado }: { habilitado: boolean }) {
  const opcoes = criarOpcoesPeriodoBlocos(new Date().getFullYear())
  const [chavePeriodo, setChavePeriodo] = useState('todos')
  const { data, isLoading } = useBlocoMusica<VersoesMusica>('versoes-alteradas', habilitado, {
    ...filtroDaOpcao(opcoes, chavePeriodo),
  })

  return (
    <VStack align="stretch" gap={4}>
      <CabecalhoSecaoMusica
        titulo="Versões e mashups"
        descricao="Slowed, reverb, sped up, remix e mashups que você ouviu no YouTube Music"
        acoes={
          <SeletorPeriodoAnalise
            opcoes={opcoes}
            selecionada={chavePeriodo}
            onSelecionar={setChavePeriodo}
          />
        }
      />
      {isLoading || !data ? (
        <Skeleton h="420px" borderRadius="12px" />
      ) : (
        <>
          <Grid templateColumns={{ base: '1fr', lg: '1fr 1.6fr' }} gap={4}>
            <BlocoProporcaoVersoes dados={data} />
            <BlocoTopVersoes dados={data} />
          </Grid>
          <BlocoMashups dados={data} />
        </>
      )}
    </VStack>
  )
})

function BlocoProporcaoVersoes({ dados }: { dados: VersoesMusica }) {
  const alteradas = dados.porTipo.filter((tipo) => tipo.tipo !== TIPO_ORIGINAL)
  const fatias = [
    {
      nome: 'Original',
      valor: Math.max(0, 100 - dados.percentualAlteradas),
      cor: CORES_GRAFICO_MUSICA.apagado,
    },
    { nome: 'Alterada', valor: dados.percentualAlteradas, cor: CORES_GRAFICO_MUSICA.azul },
  ]
  const maximo = encontrarPico(alteradas)?.minutos ?? 0

  return (
    <CartaoBlocoMusica
      titulo="Original × alterada"
      icone={<Waves size={14} />}
      cor="cirqueira.musica.azul"
    >
      <Flex align="center" gap={4} mb={4}>
        <Box position="relative" boxSize="120px" flexShrink={0}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={fatias}
                dataKey="valor"
                innerRadius="65%"
                outerRadius="100%"
                stroke="none"
                startAngle={90}
                endAngle={-270}
              >
                {fatias.map((fatia) => (
                  <Cell key={fatia.nome} fill={fatia.cor} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <Flex position="absolute" inset={0} align="center" justify="center" direction="column">
            <Text
              fontSize="xl"
              fontWeight="black"
              color="cirqueira.musica.textoPrincipal"
              lineHeight="1"
            >
              {dados.percentualAlteradas}%
            </Text>
            <Text fontSize="2xs" color="cirqueira.musica.textoSecundario">
              alteradas
            </Text>
          </Flex>
        </Box>
        <Text fontSize="xs" color="cirqueira.musica.textoSecundario">
          Parte do seu tempo de escuta que foi em versões modificadas da música original.
        </Text>
      </Flex>
      {alteradas.length === 0 ? (
        <VazioBlocoMusica texto="Nenhuma versão alterada no período." />
      ) : (
        <VStack align="stretch" gap={2}>
          {alteradas.slice(0, 8).map((tipo) => (
            <VStack key={tipo.tipo} align="stretch" gap={1}>
              <HStack justify="space-between">
                <Text fontSize="xs" color="cirqueira.musica.textoPrincipal">
                  {tipo.rotulo}
                </Text>
                <Text fontSize="2xs" color="cirqueira.musica.textoSecundario">
                  {tipo.percentual}% · {formatarMinutos(tipo.minutos)}
                </Text>
              </HStack>
              <BarraProporcaoMusica
                percentual={proporcao(tipo.minutos, maximo)}
                cor="cirqueira.musica.azul"
              />
            </VStack>
          ))}
        </VStack>
      )}
    </CartaoBlocoMusica>
  )
}

function BlocoTopVersoes({ dados }: { dados: VersoesMusica }) {
  const imagemDe = useImagensItensMusica(
    musicasValidas(dados.topVersoes.map((item) => item.musica))
  )

  return (
    <CartaoBlocoMusica titulo="Versões mais ouvidas" icone={<Shuffle size={14} />}>
      {dados.topVersoes.length === 0 ? (
        <VazioBlocoMusica texto="Nenhuma versão alterada no período." />
      ) : (
        <SimpleGrid columns={{ base: 2, sm: 3, md: 5 }} gap={3}>
          {dados.topVersoes.map((item) => (
            <LinkMusica
              key={`${item.musicaUuid}-${item.tipo}`}
              to={gerarRotaMusica(
                item.musica?.nomeFaixa ?? item.titulo,
                item.musica?.artista ?? '',
                item.musicaUuid
              )}
            >
              <VStack align="stretch" gap={1.5} title={item.titulo}>
                <Box position="relative">
                  <CapaMusica
                    url={item.urlCapa ?? (item.musica ? imagemDe(item.musica) : null)}
                    alt={item.titulo}
                    w="full"
                    aspectRatio={1}
                    borderRadius="8px"
                    tamanhoIcone={28}
                  />
                  <Box
                    position="absolute"
                    top={1.5}
                    left={1.5}
                    px={2}
                    borderRadius="full"
                    bg="cirqueira.musica.azul"
                    color="cirqueira.musica.fundo"
                    fontSize="2xs"
                    fontWeight="bold"
                  >
                    {item.rotulo}
                  </Box>
                </Box>
                <Text
                  fontSize="xs"
                  fontWeight="bold"
                  color="cirqueira.musica.textoPrincipal"
                  lineClamp={1}
                >
                  {item.musica?.nomeFaixa ?? item.titulo}
                </Text>
                <Text fontSize="2xs" color="cirqueira.musica.textoSecundario" lineClamp={1}>
                  {formatarNumeroPtBr(item.streams)} streams · {formatarMinutos(item.minutos)}
                </Text>
              </VStack>
            </LinkMusica>
          ))}
        </SimpleGrid>
      )}
    </CartaoBlocoMusica>
  )
}

function BlocoMashups({ dados }: { dados: VersoesMusica }) {
  const imagemDe = useImagensItensMusica([
    ...musicasValidas(dados.mashups.map((item) => item.musica)),
    ...dados.mashups.flatMap((item) => item.artistasComponentes),
  ])

  return (
    <CartaoBlocoMusica
      titulo="Mashups mais ouvidos"
      icone={<Blend size={14} />}
      cor="cirqueira.musica.verde"
    >
      {dados.mashups.length === 0 ? (
        <VazioBlocoMusica texto="Nenhum mashup no período." />
      ) : (
        <SimpleGrid columns={{ base: 1, sm: 2, lg: 3 }} gap={3}>
          {dados.mashups.map((item) => (
            <HStack
              key={item.musicaUuid}
              gap={3}
              p={3}
              borderRadius="10px"
              bg="cirqueira.musica.cartaoElevado"
              align="center"
            >
              <LinkMusica to={gerarRotaMusica(item.nome, item.artista, item.musicaUuid)}>
                <CapaMusica
                  url={item.musica ? imagemDe(item.musica) : null}
                  alt={item.nome}
                  boxSize="72px"
                  borderRadius="8px"
                  tamanhoIcone={24}
                />
              </LinkMusica>
              <VStack align="flex-start" gap={1} minW={0} flex={1}>
                <Text
                  fontSize="sm"
                  fontWeight="bold"
                  color="cirqueira.musica.textoPrincipal"
                  lineClamp={1}
                >
                  {item.nome}
                </Text>
                <HStack gap={0}>
                  {item.artistasComponentes.slice(0, 5).map((artista, indice) => (
                    <Box key={artista.nome} ml={indice === 0 ? 0 : '-10px'} title={artista.nome}>
                      <LinkMusica to={gerarRotaArtista(artista.nome, artista.artistaUuid)}>
                        <CapaMusica
                          url={imagemDe(artista)}
                          alt={artista.nome}
                          tipo="artista"
                          boxSize="28px"
                          border="2px solid"
                          borderColor="cirqueira.musica.cartaoElevado"
                          tamanhoIcone={12}
                        />
                      </LinkMusica>
                    </Box>
                  ))}
                </HStack>
                <Text fontSize="2xs" color="cirqueira.musica.textoSecundario" lineClamp={1}>
                  {formatarNumeroPtBr(item.streams)} streams · {formatarMinutos(item.minutos)}
                </Text>
              </VStack>
            </HStack>
          ))}
        </SimpleGrid>
      )}
    </CartaoBlocoMusica>
  )
}
