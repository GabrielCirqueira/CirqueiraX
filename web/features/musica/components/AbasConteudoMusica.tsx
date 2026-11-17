import { api } from '@/config/api'
import type { RespostaApi } from '@/shared/types/api'
import { Box, SimpleGrid, Skeleton, Text, VStack } from '@chakra-ui/react'
import { useQuery } from '@tanstack/react-query'
import { memo, useState } from 'react'
import { useFonteMusica } from '../hooks'
import type { RespostaConsultaImagens, ResumoGeralMusica } from '../types'
import type { AbaMusica } from '../utils/abasMusica'
import {
  formatarDataExtensa,
  formatarMinutos,
  formatarNumeroPtBr,
  gerarRotaMusica,
  rotuloTipoVersao,
} from '../utils'
import { CabecalhoSecaoMusica } from './CabecalhoSecaoMusica'
import { LinkMusica } from './LinkMusica'
import { ModalHistoricoDia } from './ModalHistoricoDia'
import { SecaoCapsulaSonora } from './SecaoCapsulaSonora'
import { SecaoCuriosidades } from './SecaoCuriosidades'
import { SecaoDescobertas } from './SecaoDescobertas'
import { SecaoEvolucaoMensal } from './SecaoEvolucaoMensal'
import { SecaoHabitos } from './SecaoHabitos'
import { SecaoHojeSemana } from './SecaoHojeSemana'
import { SecaoLinhaDoTempo } from './SecaoLinhaDoTempo'
import { SecaoRecordes } from './SecaoRecordes'
import { SecaoRetrospectiva } from './SecaoRetrospectiva'

async function getJson<T>(
  path: string,
  params?: Record<string, string | number | undefined>
): Promise<T> {
  const { data } = await api.get<RespostaApi<T>>(path, { params })
  return data.data as T
}

function useExtraMusica<T>(
  chave: string,
  path: string,
  habilitado: boolean,
  params?: Record<string, string | number | undefined>
) {
  const { fonte } = useFonteMusica()
  return useQuery({
    queryKey: ['musica', fonte, chave, params],
    queryFn: () => getJson<T>(`/api/v1/musica/${path}`, { fonte, ...params }),
    enabled: habilitado,
    staleTime: 60_000,
  })
}

export const AbasConteudoMusica = memo(function AbasConteudoMusica({
  aba,
  habilitado,
  resumo,
  mapaImagensResumo,
  carregandoResumo,
}: {
  aba: AbaMusica
  habilitado: boolean
  resumo?: ResumoGeralMusica
  mapaImagensResumo?: RespostaConsultaImagens
  carregandoResumo: boolean
}) {
  const [diaAberto, setDiaAberto] = useState<string | null>(null)

  return (
    <>
      {aba === 'visao' ? (
        <VStack align="stretch" gap={6}>
          <SecaoHojeSemana
            resumo={resumo}
            mapaImagens={mapaImagensResumo}
            carregando={carregandoResumo}
            modo="visao"
          />
        </VStack>
      ) : null}

      {aba === 'rankings' ? (
        <SecaoHojeSemana
          resumo={resumo}
          mapaImagens={mapaImagensResumo}
          carregando={carregandoResumo}
          modo="rankings"
        />
      ) : null}

      {aba === 'habitos' ? (
        <VStack align="stretch" gap={6}>
          <SecaoHabitos habilitado={habilitado} />
          <BlocoRotina habilitado={habilitado} />
          <BlocoSessoes habilitado={habilitado} />
          <BlocoExtremos habilitado={habilitado} />
        </VStack>
      ) : null}

      {aba === 'descobertas' ? (
        <VStack align="stretch" gap={6}>
          <SecaoDescobertas habilitado={habilitado} />
          <BlocoSaudade habilitado={habilitado} />
          <BlocoProfundidade habilitado={habilitado} />
        </VStack>
      ) : null}

      {aba === 'versoes' ? <BlocoVersoes habilitado={habilitado} /> : null}

      {aba === 'historico' ? (
        <VStack align="stretch" gap={6}>
          <BlocoNesteDia habilitado={habilitado} onAbrirDia={setDiaAberto} />
          <BlocoAlbunsSequencia habilitado={habilitado} onAbrirDia={setDiaAberto} />
          <SecaoLinhaDoTempo habilitado={habilitado} />
        </VStack>
      ) : null}

      {aba === 'recordes' ? (
        <VStack align="stretch" gap={6}>
          <SecaoCuriosidades
            curiosidades={resumo?.curiosidades}
            onAbrirDia={setDiaAberto}
          />
          <SecaoRecordes habilitado={habilitado} onAbrirDia={setDiaAberto} />
          <SecaoEvolucaoMensal habilitado={habilitado} />
        </VStack>
      ) : null}

      {aba === 'retrospectiva' ? (
        <VStack align="stretch" gap={6}>
          <SecaoCapsulaSonora conectada={habilitado} />
          <SecaoRetrospectiva habilitado={habilitado} />
        </VStack>
      ) : null}

      {aba === 'servicos' ? (
        <VStack align="stretch" gap={4}>
          <CabecalhoSecaoMusica
            titulo="Spotify × YouTube Music"
            descricao="Compare os serviços com a evolução mensal empilhada por fonte"
          />
          <SecaoEvolucaoMensal habilitado={habilitado} />
          <Text fontSize="sm" color="cirqueira.musica.textoSecundario">
            Passe o mouse nas barras para ver minutos por serviço. Aparelho, país e modo offline
            ficam para quando o importador guardar esses campos do arquivo — sem nova consulta à
            API.
          </Text>
        </VStack>
      ) : null}

      <ModalHistoricoDia data={diaAberto} onFechar={() => setDiaAberto(null)} />
    </>
  )
})

function Cartao({ titulo, valor, detalhe }: { titulo: string; valor: string; detalhe?: string }) {
  return (
    <Box
      p={4}
      bg="cirqueira.musica.cartao"
      borderRadius="8px"
      border="1px solid"
      borderColor="cirqueira.musica.cartaoElevado"
    >
      <Text fontSize="2xs" color="cirqueira.musica.textoSecundario" textTransform="uppercase">
        {titulo}
      </Text>
      <Text fontSize="xl" fontWeight="bold" color="cirqueira.musica.verde" mt={1}>
        {valor}
      </Text>
      {detalhe ? (
        <Text fontSize="xs" color="cirqueira.musica.textoSecundario" mt={1}>
          {detalhe}
        </Text>
      ) : null}
    </Box>
  )
}

function BlocoRotina({ habilitado }: { habilitado: boolean }) {
  const { data, isLoading } = useExtraMusica<{
    porHora: { hora: number; minutos: number }[]
    diaUtilMinutos: number
    fimDeSemanaMinutos: number
    periodos: { madrugada: number; manha: number; tarde: number; noite: number }
  }>('rotina', 'rotina', habilitado, { periodo: 'dias', dias: 90 })

  const maxHora = Math.max(1, ...(data?.porHora.map((h) => h.minutos) ?? [1]))

  return (
    <VStack align="stretch" gap={3}>
      <CabecalhoSecaoMusica
        titulo="Sua rotina"
        descricao="Barras por hora e períodos do dia (últimos 90 dias)"
      />
      {isLoading || !data ? (
        <Skeleton h="160px" borderRadius="8px" />
      ) : (
        <>
          <SimpleGrid columns={{ base: 2, md: 4 }} gap={3}>
            <Cartao titulo="Madrugada" valor={formatarMinutos(data.periodos.madrugada)} />
            <Cartao titulo="Manhã" valor={formatarMinutos(data.periodos.manha)} />
            <Cartao titulo="Tarde" valor={formatarMinutos(data.periodos.tarde)} />
            <Cartao titulo="Noite" valor={formatarMinutos(data.periodos.noite)} />
          </SimpleGrid>
          <SimpleGrid columns={2} gap={3}>
            <Cartao titulo="Dia útil" valor={formatarMinutos(data.diaUtilMinutos)} />
            <Cartao titulo="Fim de semana" valor={formatarMinutos(data.fimDeSemanaMinutos)} />
          </SimpleGrid>
          <Box
            p={4}
            bg="cirqueira.musica.cartao"
            borderRadius="8px"
            border="1px solid"
            borderColor="cirqueira.musica.cartaoElevado"
          >
            <Text fontSize="xs" color="cirqueira.musica.textoSecundario" mb={3}>
              Minutos por hora do dia
            </Text>
            <SimpleGrid columns={12} gap={1}>
              {data.porHora.map((hora) => (
                <Box key={hora.hora} title={`${hora.hora}h · ${formatarMinutos(hora.minutos)}`}>
                  <Box
                    h="64px"
                    display="flex"
                    alignItems="flex-end"
                    bg="cirqueira.musica.cartaoElevado"
                    borderRadius="4px"
                    overflow="hidden"
                  >
                    <Box
                      w="full"
                      bg="cirqueira.musica.verde"
                      opacity={0.35 + (hora.minutos / maxHora) * 0.65}
                      h={`${Math.max(4, Math.round((hora.minutos / maxHora) * 100))}%`}
                    />
                  </Box>
                  <Text
                    fontSize="2xs"
                    textAlign="center"
                    color="cirqueira.musica.textoDesabilitado"
                    mt={1}
                  >
                    {hora.hora}
                  </Text>
                </Box>
              ))}
            </SimpleGrid>
          </Box>
        </>
      )}
    </VStack>
  )
}

function BlocoSessoes({ habilitado }: { habilitado: boolean }) {
  const { data, isLoading } = useExtraMusica<{
    sessoes: number
    duracaoMediaMinutos: number
    maratonaMinutos: number
  }>('sessoes', 'sessoes', habilitado, { periodo: 'dias', dias: 90 })

  return (
    <VStack align="stretch" gap={3}>
      <CabecalhoSecaoMusica
        titulo="Sessões de escuta"
        descricao="Reproduções com menos de 10 min de intervalo contam como a mesma sessão"
      />
      {isLoading || !data ? (
        <Skeleton h="100px" borderRadius="8px" />
      ) : (
        <SimpleGrid columns={{ base: 1, md: 3 }} gap={3}>
          <Cartao titulo="Sessões" valor={formatarNumeroPtBr(data.sessoes)} />
          <Cartao titulo="Duração média" valor={formatarMinutos(data.duracaoMediaMinutos)} />
          <Cartao titulo="Maior maratona" valor={formatarMinutos(data.maratonaMinutos)} />
        </SimpleGrid>
      )}
    </VStack>
  )
}

function BlocoExtremos({ habilitado }: { habilitado: boolean }) {
  const { data, isLoading } = useExtraMusica<{
    aberturas: { nome: string; artista: string; musicaUuid: string; dias: number }[]
    fechamentos: { nome: string; artista: string; musicaUuid: string; dias: number }[]
  }>('extremos-dia', 'extremos-dia', habilitado, { periodo: 'dias', dias: 90 })

  return (
    <VStack align="stretch" gap={3}>
      <CabecalhoSecaoMusica
        titulo="Primeira e última do dia"
        descricao="O que mais abre e fecha o seu dia (últimos 90 dias)"
      />
      {isLoading || !data ? (
        <Skeleton h="140px" borderRadius="8px" />
      ) : (
        <SimpleGrid columns={{ base: 1, md: 2 }} gap={4}>
          <ListaExtremo titulo="Mais abre o dia" itens={data.aberturas} />
          <ListaExtremo titulo="Mais fecha o dia" itens={data.fechamentos} />
        </SimpleGrid>
      )}
    </VStack>
  )
}

function ListaExtremo({
  titulo,
  itens,
}: {
  titulo: string
  itens: { nome: string; artista: string; musicaUuid: string; dias: number }[]
}) {
  return (
    <VStack align="stretch" gap={2}>
      <Text fontSize="xs" fontWeight="bold" color="cirqueira.musica.amarelo" textTransform="uppercase">
        {titulo}
      </Text>
      {itens.length === 0 ? (
        <Text fontSize="sm" color="cirqueira.musica.textoSecundario">
          Sem dados suficientes.
        </Text>
      ) : (
        itens.slice(0, 5).map((item) => (
          <Box
            key={`${titulo}-${item.musicaUuid}`}
            p={3}
            bg="cirqueira.musica.cartao"
            borderRadius="8px"
            border="1px solid"
            borderColor="cirqueira.musica.cartaoElevado"
          >
            <LinkMusica to={gerarRotaMusica(item.nome, item.artista, item.musicaUuid)}>
              <Text fontSize="sm" fontWeight="semibold">
                {item.nome}
              </Text>
            </LinkMusica>
            <Text fontSize="xs" color="cirqueira.musica.textoSecundario">
              {item.artista} · {item.dias} {item.dias === 1 ? 'dia' : 'dias'}
            </Text>
          </Box>
        ))
      )}
    </VStack>
  )
}

function BlocoSaudade({ habilitado }: { habilitado: boolean }) {
  const { data, isLoading } = useExtraMusica<{
    itens: {
      nome: string
      artista: string
      musicaUuid: string
      streams: number
      diasSemOuvir: number
      minutos: number
    }[]
  }>('saudade', 'saudade', habilitado, { dias: 90 })

  return (
    <VStack align="stretch" gap={3}>
      <CabecalhoSecaoMusica
        titulo="Saudade"
        descricao="Músicas que você ouvia bastante e não toca há 90+ dias"
      />
      {isLoading || !data ? (
        <Skeleton h="180px" borderRadius="8px" />
      ) : data.itens.length === 0 ? (
        <Text fontSize="sm" color="cirqueira.musica.textoSecundario">
          Nada parado há tanto tempo — ou ainda não há volume suficiente.
        </Text>
      ) : (
        <VStack align="stretch" gap={2}>
          {data.itens.slice(0, 15).map((item) => (
            <Box
              key={item.musicaUuid}
              p={3}
              bg="cirqueira.musica.cartao"
              borderRadius="8px"
              border="1px solid"
              borderColor="cirqueira.musica.cartaoElevado"
            >
              <LinkMusica to={gerarRotaMusica(item.nome, item.artista, item.musicaUuid)}>
                <Text fontSize="sm" fontWeight="semibold" color="cirqueira.musica.textoPrincipal">
                  {item.nome}
                </Text>
              </LinkMusica>
              <Text fontSize="xs" color="cirqueira.musica.textoSecundario">
                {item.artista} · {formatarNumeroPtBr(item.streams)} streams · {item.diasSemOuvir}{' '}
                dias sem ouvir · {formatarMinutos(item.minutos)}
              </Text>
            </Box>
          ))}
        </VStack>
      )}
    </VStack>
  )
}

function BlocoProfundidade({ habilitado }: { habilitado: boolean }) {
  const { data, isLoading } = useExtraMusica<{
    itens: { nome: string; musicasDistintas: number; mesesAtivos: number; minutos: number }[]
  }>('profundidade', 'profundidade', habilitado, { periodo: 'todos' })

  return (
    <VStack align="stretch" gap={3}>
      <CabecalhoSecaoMusica
        titulo="Profundidade do artista"
        descricao="Quantas músicas diferentes e por quantos meses cada artista aparece"
      />
      {isLoading || !data ? (
        <Skeleton h="180px" borderRadius="8px" />
      ) : (
        <VStack align="stretch" gap={2}>
          {data.itens.slice(0, 15).map((item) => (
            <Box
              key={item.nome}
              p={3}
              bg="cirqueira.musica.cartao"
              borderRadius="8px"
              border="1px solid"
              borderColor="cirqueira.musica.cartaoElevado"
            >
              <Text fontSize="sm" fontWeight="semibold">
                {item.nome}
              </Text>
              <Text fontSize="xs" color="cirqueira.musica.textoSecundario">
                {formatarNumeroPtBr(item.musicasDistintas)} músicas · {item.mesesAtivos} meses ·{' '}
                {formatarMinutos(item.minutos)}
              </Text>
            </Box>
          ))}
        </VStack>
      )}
    </VStack>
  )
}

function BlocoVersoes({ habilitado }: { habilitado: boolean }) {
  const { data, isLoading } = useExtraMusica<{
    percentualAlteradas: number
    porTipo: { tipo: string; rotulo: string; minutos: number; percentual: number }[]
    mashups: { nome: string; artista: string; streams: number; minutos: number }[]
  }>('versoes-alteradas', 'versoes-alteradas', habilitado, { periodo: 'todos' })

  return (
    <VStack align="stretch" gap={4}>
      <CabecalhoSecaoMusica
        titulo="Versões e mashups"
        descricao="Só o seu catálogo tem isso: slowed, reverb, sped up, remix e mashups"
      />
      {isLoading || !data ? (
        <Skeleton h="220px" borderRadius="8px" />
      ) : (
        <>
          <Cartao
            titulo="Tempo em versões alteradas"
            valor={`${data.percentualAlteradas}%`}
            detalhe="Com base no tipoVersao dos vídeos do YouTube Music já identificados"
          />
          <SimpleGrid columns={{ base: 2, md: 4 }} gap={3}>
            {data.porTipo
              .filter((t) => t.tipo !== 'original')
              .slice(0, 8)
              .map((tipo) => (
                <Cartao
                  key={tipo.tipo}
                  titulo={tipo.rotulo || rotuloTipoVersao(tipo.tipo)}
                  valor={`${tipo.percentual}%`}
                  detalhe={formatarMinutos(tipo.minutos)}
                />
              ))}
          </SimpleGrid>
          <CabecalhoSecaoMusica titulo="Mashups mais ouvidos" descricao="" />
          <VStack align="stretch" gap={2}>
            {data.mashups.slice(0, 12).map((item) => (
              <Box
                key={item.nome}
                p={3}
                bg="cirqueira.musica.cartao"
                borderRadius="8px"
                border="1px solid"
                borderColor="cirqueira.musica.cartaoElevado"
              >
                <Text fontSize="sm" fontWeight="semibold">
                  {item.nome}
                </Text>
                <Text fontSize="xs" color="cirqueira.musica.textoSecundario">
                  {item.artista} · {formatarNumeroPtBr(item.streams)} streams ·{' '}
                  {formatarMinutos(item.minutos)}
                </Text>
              </Box>
            ))}
            {data.mashups.length === 0 ? (
              <Text fontSize="sm" color="cirqueira.musica.textoSecundario">
                Nenhum mashup no período/filtro atual.
              </Text>
            ) : null}
          </VStack>
        </>
      )}
    </VStack>
  )
}

function BlocoNesteDia({
  habilitado,
  onAbrirDia,
}: {
  habilitado: boolean
  onAbrirDia: (data: string) => void
}) {
  const hoje = new Date()
  const [mes] = useState(hoje.getMonth() + 1)
  const [dia] = useState(hoje.getDate())
  const { data, isLoading } = useExtraMusica<{
    mes: number
    dia: number
    anos: { ano: number; streams: number; minutos: number; musicas: number }[]
  }>('neste-dia', 'neste-dia', habilitado, { mes, dia })

  return (
    <VStack align="stretch" gap={3}>
      <CabecalhoSecaoMusica
        titulo={`Neste dia · ${String(dia).padStart(2, '0')}/${String(mes).padStart(2, '0')}`}
        descricao="O que você ouvia nesta data em anos anteriores — toque para abrir o dia"
      />
      {isLoading || !data ? (
        <Skeleton h="140px" borderRadius="8px" />
      ) : data.anos.length === 0 ? (
        <Text fontSize="sm" color="cirqueira.musica.textoSecundario">
          Sem escuta registrada neste dia em anos anteriores.
        </Text>
      ) : (
        <SimpleGrid columns={{ base: 1, md: 2 }} gap={3}>
          {data.anos.map((ano) => {
            const dataIso = `${ano.ano}-${String(mes).padStart(2, '0')}-${String(dia).padStart(2, '0')}`
            return (
              <Box
                key={ano.ano}
                as="button"
                type="button"
                textAlign="left"
                onClick={() => onAbrirDia(dataIso)}
                cursor="pointer"
              >
                <Cartao
                  titulo={String(ano.ano)}
                  valor={formatarMinutos(ano.minutos)}
                  detalhe={`${formatarNumeroPtBr(ano.streams)} streams · ${formatarNumeroPtBr(ano.musicas)} músicas · toque para ver`}
                />
              </Box>
            )
          })}
        </SimpleGrid>
      )}
    </VStack>
  )
}

function BlocoAlbunsSequencia({
  habilitado,
  onAbrirDia,
}: {
  habilitado: boolean
  onAbrirDia: (data: string) => void
}) {
  const { data, isLoading } = useExtraMusica<{
    itens: { data: string; album: string; artista: string; faixas: number; minutos: number }[]
  }>('albuns-sequencia', 'albuns-sequencia', habilitado, { periodo: 'dias', dias: 365 })

  return (
    <VStack align="stretch" gap={3}>
      <CabecalhoSecaoMusica
        titulo="Álbum em sequência"
        descricao="Dias em que você ouviu 5+ faixas do mesmo álbum seguidas"
      />
      {isLoading || !data ? (
        <Skeleton h="140px" borderRadius="8px" />
      ) : data.itens.length === 0 ? (
        <Text fontSize="sm" color="cirqueira.musica.textoSecundario">
          Nenhuma sequência de álbum encontrada no período.
        </Text>
      ) : (
        <VStack align="stretch" gap={2}>
          {data.itens.slice(0, 12).map((item) => (
            <Box
              key={`${item.data}-${item.album}`}
              as="button"
              type="button"
              textAlign="left"
              p={3}
              bg="cirqueira.musica.cartao"
              borderRadius="8px"
              border="1px solid"
              borderColor="cirqueira.musica.cartaoElevado"
              onClick={() => onAbrirDia(item.data)}
              cursor="pointer"
              _hover={{ bg: 'cirqueira.musica.cartaoElevado' }}
            >
              <Text fontSize="sm" fontWeight="semibold">
                {item.album}
              </Text>
              <Text fontSize="xs" color="cirqueira.musica.textoSecundario">
                {item.artista} · {item.faixas} faixas · {formatarMinutos(item.minutos)} ·{' '}
                {formatarDataExtensa(item.data)}
              </Text>
            </Box>
          ))}
        </VStack>
      )}
    </VStack>
  )
}
