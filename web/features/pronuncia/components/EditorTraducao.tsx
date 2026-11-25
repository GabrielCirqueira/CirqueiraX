import { Box, Button, Flex, HStack, Kbd, Text, Textarea, VStack } from '@chakra-ui/react'
import { ArrowRightLeft, Languages, Loader2 } from 'lucide-react'
import { type KeyboardEvent, memo } from 'react'
import type { DirecaoTraducao } from '../types'
import { FRASES_RAPIDAS, LIMITE_CARACTERES, OPCOES_DIRECAO, contarCaracteres } from '../utils'

export interface EditorTraducaoProps {
  texto: string
  direcao: DirecaoTraducao
  traduzindo: boolean
  onMudarTexto: (texto: string) => void
  onMudarDirecao: (direcao: DirecaoTraducao) => void
  onTraduzir: (texto: string) => void
}

export const EditorTraducao = memo(function EditorTraducao({
  texto,
  direcao,
  traduzindo,
  onMudarTexto,
  onMudarDirecao,
  onTraduzir,
}: EditorTraducaoProps) {
  const caracteres = contarCaracteres(texto)
  const passouLimite = caracteres > LIMITE_CARACTERES
  const podeTraduzir = caracteres > 0 && !passouLimite && !traduzindo

  function aoPressionarTecla(evento: KeyboardEvent<HTMLTextAreaElement>) {
    if (evento.key === 'Enter' && (evento.ctrlKey || evento.metaKey) && podeTraduzir) {
      evento.preventDefault()
      onTraduzir(texto)
    }
  }

  function usarFraseRapida(frase: string) {
    onMudarTexto(frase)
    onTraduzir(frase)
  }

  return (
    <Box
      bg="bg.panel"
      borderWidth="1px"
      borderColor="border.subtle"
      borderRadius="12px"
      shadow="xs"
      overflow="hidden"
      transition="border-color 0.2s"
      _focusWithin={{ borderColor: 'cirqueira.brand.400/60' }}
    >
      <Flex
        px={3}
        py={2}
        gap={2}
        justify="space-between"
        align="center"
        borderBottomWidth="1px"
        borderColor="border.subtle"
        wrap="wrap"
      >
        <HStack gap={1} bg="bg.muted" p={1} borderRadius="10px">
          {OPCOES_DIRECAO.map((opcao) => {
            const ativa = opcao.valor === direcao
            return (
              <Button
                key={opcao.valor}
                size="xs"
                borderRadius="8px"
                variant={ativa ? 'solid' : 'ghost'}
                colorPalette={ativa ? 'brand' : 'gray'}
                aria-pressed={ativa}
                title={opcao.descricao}
                onClick={() => onMudarDirecao(opcao.valor)}
              >
                {opcao.valor === 'auto' && <ArrowRightLeft size={12} />}
                {opcao.rotulo}
              </Button>
            )
          })}
        </HStack>
        <Text fontSize="xs" color={passouLimite ? 'cirqueira.red.400' : 'fg.subtle'}>
          {caracteres.toLocaleString('pt-BR')} / {LIMITE_CARACTERES.toLocaleString('pt-BR')}
        </Text>
      </Flex>

      <Textarea
        value={texto}
        onChange={(evento) => onMudarTexto(evento.target.value)}
        onKeyDown={aoPressionarTecla}
        placeholder="Digite uma palavra, frase ou texto… ex.: eu não sei"
        aria-label="Texto para traduzir"
        autoresize
        minH="110px"
        maxH="320px"
        border="none"
        px={4}
        py={3}
        fontSize={{ base: 'md', md: 'lg' }}
        _focusVisible={{ outline: 'none', boxShadow: 'none' }}
      />

      <VStack align="stretch" gap={3} px={3} pb={3} pt={1}>
        <HStack gap={1.5} flexWrap="wrap">
          {FRASES_RAPIDAS.map((frase) => (
            <Button
              key={frase}
              size="2xs"
              variant="outline"
              borderRadius="full"
              color="fg.muted"
              fontWeight="normal"
              disabled={traduzindo}
              onClick={() => usarFraseRapida(frase)}
            >
              {frase}
            </Button>
          ))}
        </HStack>
        <Flex justify="space-between" align="center" gap={3}>
          <HStack gap={1} fontSize="xs" color="fg.subtle" display={{ base: 'none', sm: 'flex' }}>
            <Kbd size="sm">Ctrl</Kbd>
            <Text as="span">+</Text>
            <Kbd size="sm">Enter</Kbd>
            <Text as="span">para traduzir</Text>
          </HStack>
          <Button
            colorPalette="brand"
            borderRadius="full"
            size="sm"
            px={5}
            ml="auto"
            disabled={!podeTraduzir}
            onClick={() => onTraduzir(texto)}
          >
            {traduzindo ? (
              <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
            ) : (
              <Languages size={14} />
            )}
            {traduzindo ? 'Traduzindo…' : 'Traduzir'}
          </Button>
        </Flex>
      </VStack>
    </Box>
  )
})
