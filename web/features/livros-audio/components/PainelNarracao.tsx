import { Box, Button, Flex, HStack, IconButton, Input, Text, VStack } from '@chakra-ui/react'
import { ArrowRight, Info, Plus, SlidersHorizontal, Trash2, X } from 'lucide-react'
import { type FormEvent, useState } from 'react'
import type {
  ConfigurarNarracaoPayload,
  LivroAudio,
  ModoNotasLivroAudio,
  PronunciaLivro,
} from '../types'

interface PainelNarracaoProps {
  livro: LivroAudio
  salvando: boolean
  onSalvar: (payload: ConfigurarNarracaoPayload) => void
  onFechar: () => void
}

const OPCOES_NOTAS: { valor: ModoNotasLivroAudio; titulo: string; descricao: string }[] = [
  {
    valor: 'fim_capitulo',
    titulo: 'No fim do capítulo',
    descricao: 'Tira os marcadores como “(5)” do texto e lê as notas de rodapé depois do capítulo.',
  },
  {
    valor: 'pular',
    titulo: 'Pular notas',
    descricao: 'Não lê marcadores, notas de rodapé nem seções de “Notas”.',
  },
  {
    valor: 'normal',
    titulo: 'Ler normalmente',
    descricao: 'Lê tudo na ordem em que aparece na página.',
  },
]

function mesmaLista(a: PronunciaLivro[], b: PronunciaLivro[]): boolean {
  return (
    a.length === b.length &&
    a.every((item, indice) => item.de === b[indice]?.de && item.para === b[indice]?.para)
  )
}

export function PainelNarracao({ livro, salvando, onSalvar, onFechar }: PainelNarracaoProps) {
  const [modoNotas, setModoNotas] = useState<ModoNotasLivroAudio>(livro.modoNotas)
  const [pronuncias, setPronuncias] = useState<PronunciaLivro[]>(livro.pronuncias)
  const [novoDe, setNovoDe] = useState('')
  const [novoPara, setNovoPara] = useState('')

  const alterado = modoNotas !== livro.modoNotas || !mesmaLista(pronuncias, livro.pronuncias)
  const textoEmPreparo = livro.isEnviado || livro.isExtraindo
  const podeSalvar = (alterado || livro.narracaoDesatualizada) && !textoEmPreparo

  function adicionarPronuncia(evento: FormEvent) {
    evento.preventDefault()
    const de = novoDe.trim()
    if (!de) return
    const para = novoPara.trim()
    setPronuncias((atuais) => [
      ...atuais.filter((item) => item.de.toLowerCase() !== de.toLowerCase()),
      { de, para },
    ])
    setNovoDe('')
    setNovoPara('')
  }

  function salvar() {
    const confirmado = window.confirm(
      'O áudio do livro inteiro, e das outras vozes geradas, vai ser feito de novo. As partes ficam indisponíveis enquanto são refeitas. Continuar?'
    )
    if (confirmado) onSalvar({ modoNotas, pronuncias })
  }

  return (
    <Box
      position="absolute"
      bottom="calc(100% + 8px)"
      right={{ base: 4, md: 24 }}
      w={{ base: 'calc(100vw - 32px)', sm: '440px' }}
      maxH="min(640px, calc(100vh - 150px))"
      bg="cirqueira.grey.900"
      border="1px solid"
      borderColor="cirqueira.grey.800"
      borderRadius="2xl"
      p={3.5}
      overflowY="auto"
      boxShadow="0 20px 50px rgba(0, 0, 0, 0.9)"
      zIndex={60}
    >
      <HStack
        justify="space-between"
        mb={2.5}
        pb={2}
        borderBottom="1px solid"
        borderColor="cirqueira.grey.800"
      >
        <HStack gap={2} color="cirqueira.brand.400">
          <SlidersHorizontal size={16} />
          <Text fontSize="xs" fontWeight="bold" color="white">
            Ajustes da narração
          </Text>
        </HStack>
        <IconButton
          size="xs"
          variant="ghost"
          color="cirqueira.grey.400"
          _hover={{ color: 'white' }}
          onClick={onFechar}
          aria-label="Fechar ajustes"
        >
          <X size={14} />
        </IconButton>
      </HStack>

      {livro.narracaoDesatualizada && (
        <HStack
          align="start"
          gap={2}
          mb={3}
          p={2.5}
          borderRadius="xl"
          bg="cirqueira.brand.500/10"
          border="1px solid"
          borderColor="cirqueira.brand.500/30"
        >
          <Box color="cirqueira.brand.300" pt="1px">
            <Info size={14} />
          </Box>
          <Text fontSize="11px" color="cirqueira.grey.200">
            Este livro foi narrado antes da limpeza nova. Refaça o áudio para a voz parar de ler
            cabeçalhos, rodapés e números de página e para ler as colunas na ordem certa.
          </Text>
        </HStack>
      )}

      <Text fontSize="11px" fontWeight="bold" color="cirqueira.grey.200" mb={1.5}>
        Notas e marcadores
      </Text>
      <VStack align="stretch" gap={1.5} mb={4}>
        {OPCOES_NOTAS.map((opcao) => {
          const selecionada = modoNotas === opcao.valor
          return (
            <Box
              key={opcao.valor}
              as="button"
              textAlign="left"
              px={2.5}
              py={2}
              borderRadius="xl"
              bg={selecionada ? 'cirqueira.brand.500/15' : 'rgba(255, 255, 255, 0.03)'}
              border="1px solid"
              borderColor={selecionada ? 'cirqueira.brand.500/40' : 'transparent'}
              _hover={{ bg: selecionada ? 'cirqueira.brand.500/20' : 'rgba(255, 255, 255, 0.06)' }}
              onClick={() => setModoNotas(opcao.valor)}
              aria-pressed={selecionada}
            >
              <Text fontSize="xs" fontWeight="bold" color="white">
                {opcao.titulo}
              </Text>
              <Text fontSize="10px" color="cirqueira.grey.400">
                {opcao.descricao}
              </Text>
            </Box>
          )
        })}
      </VStack>

      <Text fontSize="11px" fontWeight="bold" color="cirqueira.grey.200" mb={0.5}>
        Dicionário de pronúncia
      </Text>
      <Text fontSize="10px" color="cirqueira.grey.400" mb={2}>
        Troca o texto antes da voz ler, por exemplo “Dr.” por “Doutor” ou “Cap. XII” por “Capítulo
        doze”. Não diferencia maiúsculas.
      </Text>

      <form onSubmit={adicionarPronuncia}>
        <HStack gap={1.5} mb={2}>
          <Input
            size="xs"
            value={novoDe}
            onChange={(e) => setNovoDe(e.target.value)}
            placeholder="No livro"
            maxLength={120}
            bg="cirqueira.grey.950"
            borderColor="cirqueira.grey.800"
          />
          <Box color="cirqueira.grey.500" flexShrink={0}>
            <ArrowRight size={12} />
          </Box>
          <Input
            size="xs"
            value={novoPara}
            onChange={(e) => setNovoPara(e.target.value)}
            placeholder="Como falar"
            maxLength={240}
            bg="cirqueira.grey.950"
            borderColor="cirqueira.grey.800"
          />
          <IconButton
            type="submit"
            size="xs"
            variant="subtle"
            colorPalette="brand"
            disabled={!novoDe.trim() || pronuncias.length >= 200}
            aria-label="Adicionar ao dicionário"
          >
            <Plus size={13} />
          </IconButton>
        </HStack>
      </form>

      {pronuncias.length > 0 && (
        <Flex direction="column" gap={1} mb={3}>
          {pronuncias.map((item) => (
            <HStack
              key={item.de.toLowerCase()}
              gap={2}
              px={2.5}
              py={1}
              borderRadius="lg"
              bg="rgba(255, 255, 255, 0.03)"
            >
              <Text fontSize="xs" color="white" truncate flex={1} minW={0}>
                {item.de}
              </Text>
              <Box color="cirqueira.grey.500" flexShrink={0}>
                <ArrowRight size={11} />
              </Box>
              <Text
                fontSize="xs"
                color={item.para ? 'cirqueira.grey.200' : 'cirqueira.grey.500'}
                truncate
                flex={1}
                minW={0}
              >
                {item.para || '(não ler)'}
              </Text>
              <IconButton
                size="2xs"
                variant="ghost"
                color="cirqueira.grey.500"
                _hover={{ color: 'cirqueira.red.400' }}
                onClick={() =>
                  setPronuncias((atuais) => atuais.filter((outro) => outro.de !== item.de))
                }
                aria-label={`Remover ${item.de} do dicionário`}
              >
                <Trash2 size={12} />
              </IconButton>
            </HStack>
          ))}
        </Flex>
      )}

      <Text fontSize="10px" color="cirqueira.grey.500" mb={3}>
        Cabeçalhos, rodapés e números de página repetidos são ignorados sempre, e textos em colunas
        são lidos coluna por coluna.
      </Text>

      <Button
        w="full"
        size="sm"
        colorPalette="brand"
        disabled={!podeSalvar}
        loading={salvando}
        onClick={salvar}
        fontSize="xs"
      >
        {alterado ? 'Salvar e refazer o áudio' : 'Refazer o áudio'}
      </Button>
      {textoEmPreparo && (
        <Text fontSize="10px" color="cirqueira.grey.400" mt={1.5} textAlign="center">
          Espere o texto do livro terminar de ser extraído para mudar os ajustes.
        </Text>
      )}
    </Box>
  )
}
