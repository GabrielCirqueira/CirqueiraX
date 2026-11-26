import { useDebounce } from '@/shared/hooks'
import {
  Badge,
  Box,
  Button,
  Flex,
  HStack,
  IconButton,
  Input,
  Progress,
  SimpleGrid,
  Skeleton,
  Text,
  VStack,
} from '@chakra-ui/react'
import { FlaskConical, Pencil, Save, Search, Trash2 } from 'lucide-react'
import { memo, useState } from 'react'
import {
  useApagarExcecao,
  useExcecoesPronuncia,
  usePainelPronuncia,
  usePreviaPronuncia,
  useSalvarExcecao,
} from '../hooks'
import type { ExcecaoPronuncia } from '../types'
import {
  formatarDataCurta,
  formatarNumero,
  normalizarPronunciaDigitada,
  percentualUso,
} from '../utils'

const ATRASO_BUSCA_MS = 300

function CartaoNumero({ rotulo, valor }: { rotulo: string; valor: string }) {
  return (
    <Box bg="bg.panel" borderWidth="1px" borderColor="border.subtle" borderRadius="12px" p={4}>
      <Text fontSize="xs" color="fg.subtle">
        {rotulo}
      </Text>
      <Text fontSize="xl" fontWeight="black" color="fg">
        {valor}
      </Text>
    </Box>
  )
}

export const PainelDicionario = memo(function PainelDicionario() {
  const painel = usePainelPronuncia()
  const [busca, setBusca] = useState('')
  const buscaAtrasada = useDebounce(busca, ATRASO_BUSCA_MS)
  const excecoes = useExcecoesPronuncia(buscaAtrasada, true)
  const salvar = useSalvarExcecao()
  const apagar = useApagarExcecao()
  const previa = usePreviaPronuncia()
  const [palavra, setPalavra] = useState('')
  const [pronuncia, setPronuncia] = useState('')
  const [observacao, setObservacao] = useState('')
  const [textoTeste, setTextoTeste] = useState('')

  function editar(excecao: ExcecaoPronuncia) {
    setPalavra(excecao.palavra)
    setPronuncia(excecao.pronuncia)
    setObservacao(excecao.observacao ?? '')
  }

  function salvarExcecao() {
    salvar.mutate(
      {
        palavra: palavra.trim().toLowerCase(),
        pronuncia: normalizarPronunciaDigitada(pronuncia),
        observacao: observacao.trim() || null,
      },
      {
        onSuccess: () => {
          setPalavra('')
          setPronuncia('')
          setObservacao('')
        },
      }
    )
  }

  const uso = painel.data?.usoTraducao
  const lista = excecoes.data ?? []

  return (
    <VStack align="stretch" gap={5}>
      {painel.data && (
        <SimpleGrid columns={{ base: 2, md: 4 }} gap={3}>
          <CartaoNumero
            rotulo="Palavras no dicionário"
            valor={formatarNumero(painel.data.palavrasDicionario)}
          />
          <CartaoNumero rotulo="Correções manuais" valor={formatarNumero(painel.data.excecoes)} />
          <CartaoNumero rotulo="Frases salvas" valor={formatarNumero(painel.data.frases)} />
          <CartaoNumero
            rotulo="Relatos em aberto"
            valor={formatarNumero(painel.data.relatosEmAberto)}
          />
        </SimpleGrid>
      )}

      {uso && (
        <Box bg="bg.panel" borderWidth="1px" borderColor="border.subtle" borderRadius="12px" p={4}>
          <Flex justify="space-between" mb={2} gap={2} wrap="wrap">
            <Text fontSize="sm" fontWeight="semibold" color="fg">
              Cota do tradutor (DeepL)
            </Text>
            <Text fontSize="xs" color="fg.subtle">
              {uso.configurado
                ? `${formatarNumero(uso.caracteresUsados)} de ${formatarNumero(uso.limiteCaracteres)} caracteres`
                : 'Chave não configurada'}
            </Text>
          </Flex>
          <Progress.Root
            value={percentualUso(uso.caracteresUsados, uso.limiteCaracteres)}
            size="sm"
            colorPalette={
              percentualUso(uso.caracteresUsados, uso.limiteCaracteres) > 85 ? 'red' : 'brand'
            }
          >
            <Progress.Track borderRadius="full">
              <Progress.Range />
            </Progress.Track>
          </Progress.Root>
          <Text fontSize="xs" color="fg.subtle" mt={2}>
            Frases já traduzidas ficam salvas e não gastam cota de novo.
          </Text>
        </Box>
      )}

      <SimpleGrid columns={{ base: 1, lg: 2 }} gap={4} alignItems="start">
        <Box bg="bg.panel" borderWidth="1px" borderColor="border.subtle" borderRadius="12px" p={4}>
          <Text fontSize="sm" fontWeight="semibold" color="fg" mb={1}>
            Corrigir uma palavra
          </Text>
          <Text fontSize="xs" color="fg.subtle" mb={3}>
            Sílabas separadas por hífen e a tônica em MAIÚSCULAS. Vale para todas as frases.
          </Text>
          <VStack align="stretch" gap={2}>
            <HStack gap={2}>
              <Input
                value={palavra}
                onChange={(evento) => setPalavra(evento.target.value)}
                placeholder="palavra (ex.: water)"
                size="sm"
                borderRadius="8px"
              />
              <Input
                value={pronuncia}
                onChange={(evento) => setPronuncia(evento.target.value)}
                placeholder="ex.: UÓ-rer"
                size="sm"
                borderRadius="8px"
                fontWeight="semibold"
              />
            </HStack>
            <Input
              value={observacao}
              onChange={(evento) => setObservacao(evento.target.value)}
              placeholder="observação (opcional)"
              size="sm"
              borderRadius="8px"
            />
            <Button
              size="sm"
              colorPalette="brand"
              borderRadius="full"
              alignSelf="flex-end"
              disabled={salvar.isPending || palavra.trim() === '' || pronuncia.trim() === ''}
              onClick={salvarExcecao}
            >
              <Save size={14} />
              Salvar
            </Button>
          </VStack>
        </Box>

        <Box bg="bg.panel" borderWidth="1px" borderColor="border.subtle" borderRadius="12px" p={4}>
          <Text fontSize="sm" fontWeight="semibold" color="fg" mb={1}>
            Testar o motor
          </Text>
          <Text fontSize="xs" color="fg.subtle" mb={3}>
            Escreva em inglês para ver a pronúncia sem traduzir nem salvar.
          </Text>
          <HStack gap={2}>
            <Input
              value={textoTeste}
              onChange={(evento) => setTextoTeste(evento.target.value)}
              onKeyDown={(evento) =>
                evento.key === 'Enter' && textoTeste.trim() && previa.mutate(textoTeste)
              }
              placeholder="ex.: I want to get it out of the water"
              size="sm"
              borderRadius="8px"
            />
            <Button
              size="sm"
              variant="outline"
              borderRadius="full"
              disabled={previa.isPending || textoTeste.trim() === ''}
              onClick={() => previa.mutate(textoTeste)}
            >
              <FlaskConical size={14} />
              Testar
            </Button>
          </HStack>
          {previa.data && (
            <VStack align="stretch" gap={1} mt={3}>
              <Text fontSize="md" fontWeight="bold" color="cirqueira.brand.300">
                {previa.data.pronuncia}
              </Text>
              <Text fontSize="sm" color="fg.muted">
                Simples: {previa.data.simples}
              </Text>
              <Text fontSize="sm" color="fg.muted">
                Fala natural: {previa.data.falaNatural}
              </Text>
              {previa.data.palavrasAproximadas.length > 0 && (
                <Text fontSize="xs" color="cirqueira.orange.300">
                  Aproximadas: {previa.data.palavrasAproximadas.join(', ')}
                </Text>
              )}
            </VStack>
          )}
        </Box>
      </SimpleGrid>

      <Box
        bg="bg.panel"
        borderWidth="1px"
        borderColor="border.subtle"
        borderRadius="12px"
        overflow="hidden"
      >
        <Flex
          px={4}
          py={3}
          justify="space-between"
          align="center"
          gap={3}
          borderBottomWidth="1px"
          borderColor="border.subtle"
          wrap="wrap"
        >
          <Text fontSize="sm" fontWeight="semibold" color="fg">
            Palavras corrigidas
          </Text>
          <HStack
            gap={2}
            px={2.5}
            bg="bg.subtle"
            borderRadius="8px"
            color="fg.subtle"
            maxW="260px"
            w="full"
          >
            <Search size={14} />
            <Input
              value={busca}
              onChange={(evento) => setBusca(evento.target.value)}
              placeholder="Buscar palavra"
              size="sm"
              border="none"
              px={0}
              _focusVisible={{ outline: 'none', boxShadow: 'none' }}
              aria-label="Buscar palavra corrigida"
            />
          </HStack>
        </Flex>
        {excecoes.isLoading && <Skeleton h="120px" m={4} />}
        {!excecoes.isLoading && lista.length === 0 && (
          <Text fontSize="sm" color="fg.subtle" textAlign="center" py={10}>
            Nenhuma palavra corrigida ainda.
          </Text>
        )}
        {lista.map((excecao) => (
          <Flex
            key={excecao.uuid}
            px={4}
            py={2.5}
            gap={3}
            align="center"
            borderBottomWidth="1px"
            borderColor="border.subtle"
            _last={{ borderBottomWidth: 0 }}
          >
            <VStack align="start" gap={0} flex="1" minW={0}>
              <HStack gap={2}>
                <Text fontSize="sm" fontWeight="semibold" color="fg">
                  {excecao.palavra}
                </Text>
                <Text fontSize="sm" fontWeight="bold" color="cirqueira.brand.300">
                  {excecao.pronuncia}
                </Text>
              </HStack>
              <Text fontSize="xs" color="fg.subtle" lineClamp={1}>
                {excecao.observacao ?? formatarDataCurta(excecao.atualizadaEm)}
              </Text>
            </VStack>
            <Badge
              size="xs"
              variant="subtle"
              colorPalette={excecao.origem === 'ia' ? 'purple' : 'gray'}
              borderRadius="full"
            >
              {excecao.origemDescricao}
            </Badge>
            <IconButton
              size="xs"
              variant="ghost"
              aria-label="Editar"
              onClick={() => editar(excecao)}
            >
              <Pencil size={13} />
            </IconButton>
            <IconButton
              size="xs"
              variant="ghost"
              aria-label="Apagar"
              color="fg.subtle"
              _hover={{ color: 'cirqueira.red.400' }}
              disabled={apagar.isPending}
              onClick={() => apagar.mutate(excecao.uuid)}
            >
              <Trash2 size={13} />
            </IconButton>
          </Flex>
        ))}
      </Box>
    </VStack>
  )
})
