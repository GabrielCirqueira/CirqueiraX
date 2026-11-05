import { Box, Button, HStack, IconButton, Text, Textarea } from '@chakra-ui/react'
import { Highlighter, Play, StickyNote, Trash2, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import type { MarcacaoLivro } from '../types'

export interface FraseSelecionada {
  x: number
  y: number
  pagina: number
  numeroBloco: number | null
  indiceTrecho: number | null
  indicePalavra: number | null
  texto: string | null
  existente: MarcacaoLivro | null
}

interface MenuFraseProps {
  frase: FraseSelecionada
  salvando: boolean
  onOuvir: () => void
  onDestacar: () => void
  onSalvarNota: (nota: string) => void
  onRemover: (marcacao: MarcacaoLivro) => void
  onFechar: () => void
}

const LARGURA_MENU = 320

export function MenuFrase({
  frase,
  salvando,
  onOuvir,
  onDestacar,
  onSalvarNota,
  onRemover,
  onFechar,
}: MenuFraseProps) {
  const [escrevendoNota, setEscrevendoNota] = useState(false)
  const [nota, setNota] = useState(frase.existente?.nota ?? '')
  const menuRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    function fecharAoClicarFora(evento: PointerEvent) {
      if (menuRef.current && !menuRef.current.contains(evento.target as Node)) onFechar()
    }
    function fecharComEsc(evento: KeyboardEvent) {
      if (evento.key === 'Escape') onFechar()
    }
    const temporizador = window.setTimeout(() => {
      document.addEventListener('pointerdown', fecharAoClicarFora)
    }, 0)
    document.addEventListener('keydown', fecharComEsc)
    return () => {
      window.clearTimeout(temporizador)
      document.removeEventListener('pointerdown', fecharAoClicarFora)
      document.removeEventListener('keydown', fecharComEsc)
    }
  }, [onFechar])

  const esquerda = Math.min(
    Math.max(12, frase.x - LARGURA_MENU / 2),
    window.innerWidth - LARGURA_MENU - 12
  )
  const abaixo = frase.y < window.innerHeight * 0.55
  const posicaoVertical = abaixo
    ? { top: `${frase.y + 14}px` }
    : { bottom: `${window.innerHeight - frase.y + 14}px` }
  const temFrase = frase.indiceTrecho !== null && frase.texto !== null

  return (
    <Box
      ref={menuRef}
      position="fixed"
      left={`${esquerda}px`}
      {...posicaoVertical}
      w={`${LARGURA_MENU}px`}
      maxW="calc(100vw - 24px)"
      bg="cirqueira.grey.900"
      border="1px solid"
      borderColor="cirqueira.grey.700"
      borderRadius="xl"
      p={2.5}
      boxShadow="0 18px 45px rgba(0, 0, 0, 0.85)"
      zIndex={80}
      animation="fade-in 0.12s ease-out"
    >
      <HStack justify="space-between" align="start" mb={2} gap={2}>
        <Text fontSize="11px" color="cirqueira.grey.300" lineClamp={3}>
          {temFrase ? `“${frase.texto}”` : `Página ${frase.pagina}`}
        </Text>
        <IconButton
          size="2xs"
          variant="ghost"
          color="cirqueira.grey.400"
          onClick={onFechar}
          aria-label="Fechar"
        >
          <X size={12} />
        </IconButton>
      </HStack>

      {escrevendoNota ? (
        <Box>
          <Textarea
            size="xs"
            autoFocus
            rows={3}
            value={nota}
            maxLength={10000}
            onChange={(evento) => setNota(evento.target.value)}
            placeholder="Escreva sua nota"
            bg="cirqueira.grey.950"
            borderColor="cirqueira.grey.800"
            mb={2}
          />
          <HStack justify="flex-end" gap={1.5}>
            <Button size="xs" variant="ghost" onClick={() => setEscrevendoNota(false)}>
              Cancelar
            </Button>
            <Button
              size="xs"
              colorPalette="brand"
              disabled={!nota.trim()}
              loading={salvando}
              onClick={() => onSalvarNota(nota.trim())}
            >
              Salvar nota
            </Button>
          </HStack>
        </Box>
      ) : (
        <HStack gap={1.5} flexWrap="wrap">
          <Button size="xs" colorPalette="brand" onClick={onOuvir}>
            <Play size={12} />
            Ouvir daqui
          </Button>
          {temFrase && !frase.existente && (
            <Button size="xs" variant="subtle" loading={salvando} onClick={onDestacar}>
              <Highlighter size={12} />
              Destacar
            </Button>
          )}
          {temFrase && (
            <Button size="xs" variant="subtle" onClick={() => setEscrevendoNota(true)}>
              <StickyNote size={12} />
              {frase.existente?.tipo === 'nota' ? 'Editar nota' : 'Nota'}
            </Button>
          )}
          {frase.existente && (
            <Button
              size="xs"
              variant="ghost"
              colorPalette="red"
              onClick={() => frase.existente && onRemover(frase.existente)}
            >
              <Trash2 size={12} />
              {frase.existente.tipo === 'nota' ? 'Apagar nota' : 'Tirar destaque'}
            </Button>
          )}
        </HStack>
      )}
    </Box>
  )
}
