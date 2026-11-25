import {
  Badge,
  Box,
  Button,
  Flex,
  HStack,
  IconButton,
  Input,
  Text,
  Textarea,
  VStack,
} from '@chakra-ui/react'
import { Check, Loader2, Plus, Sparkles, Trash2, X } from 'lucide-react'
import { memo, useState } from 'react'
import type { AprovarRelatoPayload, CorrecaoPalavra, RelatoPronuncia } from '../types'
import { formatarDataCurta, normalizarPronunciaDigitada } from '../utils'

const COR_STATUS: Record<RelatoPronuncia['status'], string> = {
  pendente: 'orange',
  sugerido: 'purple',
  aprovado: 'green',
  rejeitado: 'gray',
}

function palavrasIniciais(relato: RelatoPronuncia): CorrecaoPalavra[] {
  if (relato.sugestaoPalavras.length > 0) return relato.sugestaoPalavras
  return relato.palavra ? [{ palavra: relato.palavra, pronuncia: '' }] : []
}

export interface CartaoRelatoProps {
  relato: RelatoPronuncia
  sugerindo: boolean
  salvando: boolean
  onSugerir: (uuid: string) => void
  onAprovar: (uuid: string, payload: AprovarRelatoPayload) => void
  onRejeitar: (uuid: string) => void
}

export const CartaoRelato = memo(function CartaoRelato({
  relato,
  sugerindo,
  salvando,
  onSugerir,
  onAprovar,
  onRejeitar,
}: CartaoRelatoProps) {
  const [traducao, setTraducao] = useState(relato.sugestaoTraducao ?? '')
  const [palavras, setPalavras] = useState<CorrecaoPalavra[]>(() => palavrasIniciais(relato))

  function alterarPalavra(indice: number, campo: keyof CorrecaoPalavra, valor: string) {
    setPalavras((atuais) =>
      atuais.map((item, posicao) => (posicao === indice ? { ...item, [campo]: valor } : item))
    )
  }

  function aprovar() {
    onAprovar(relato.uuid, {
      traducao: traducao.trim() || null,
      palavras: palavras
        .filter((item) => item.palavra.trim() !== '' && item.pronuncia.trim() !== '')
        .map((item) => ({
          palavra: item.palavra.trim().toLowerCase(),
          pronuncia: normalizarPronunciaDigitada(item.pronuncia),
        })),
    })
  }

  const correcaoVazia =
    traducao.trim() === '' && palavras.every((item) => item.pronuncia.trim() === '')

  return (
    <Box
      bg="bg.panel"
      borderWidth="1px"
      borderColor="border.subtle"
      borderRadius="12px"
      p={4}
      shadow="xs"
    >
      <Flex justify="space-between" gap={3} wrap="wrap" mb={3}>
        <HStack gap={2} flexWrap="wrap">
          <Badge
            size="sm"
            colorPalette={COR_STATUS[relato.status]}
            variant="subtle"
            borderRadius="full"
          >
            {relato.statusDescricao}
          </Badge>
          <Badge size="sm" variant="outline" borderRadius="full">
            {relato.tipoDescricao}
          </Badge>
          {relato.palavra && (
            <Badge size="sm" variant="surface" colorPalette="brand" borderRadius="full">
              palavra: {relato.palavra}
            </Badge>
          )}
        </HStack>
        <Text fontSize="xs" color="fg.subtle">
          {relato.autor ?? 'Usuário removido'} · {formatarDataCurta(relato.criadoEm)}
        </Text>
      </Flex>

      <VStack align="stretch" gap={1} mb={3}>
        <Text fontSize="sm" color="fg.muted">
          {relato.frase.textoPortugues}
        </Text>
        <Text fontSize="md" fontWeight="semibold" color="fg">
          {relato.textoInglesAntes}
        </Text>
        <Text fontSize="md" fontWeight="bold" color="cirqueira.brand.300">
          {relato.pronunciaAntes}
        </Text>
        {relato.comentario && (
          <Text fontSize="sm" color="fg.muted" fontStyle="italic" mt={1}>
            “{relato.comentario}”
          </Text>
        )}
      </VStack>

      {relato.emAberto && (
        <VStack align="stretch" gap={3} borderTopWidth="1px" borderColor="border.subtle" pt={3}>
          {relato.explicacaoSugestao && (
            <HStack
              align="flex-start"
              gap={2}
              p={3}
              borderRadius="10px"
              bg="cirqueira.purple.500/10"
              color="cirqueira.purple.200"
              fontSize="sm"
            >
              <Box pt="2px" flexShrink={0}>
                <Sparkles size={14} />
              </Box>
              <Text>{relato.explicacaoSugestao}</Text>
            </HStack>
          )}

          <VStack align="stretch" gap={1.5}>
            <Text fontSize="xs" fontWeight="semibold" color="fg.muted">
              Tradução corrigida (deixe vazio para manter)
            </Text>
            <Textarea
              value={traducao}
              onChange={(evento) => setTraducao(evento.target.value)}
              rows={2}
              size="sm"
              borderRadius="8px"
              placeholder={relato.textoInglesAntes}
            />
          </VStack>

          <VStack align="stretch" gap={1.5}>
            <Text fontSize="xs" fontWeight="semibold" color="fg.muted">
              Pronúncia das palavras (sílabas com hífen, tônica em MAIÚSCULAS)
            </Text>
            {palavras.map((item, indice) => (
              <HStack key={`correcao-${indice}`} gap={2}>
                <Input
                  value={item.palavra}
                  onChange={(evento) => alterarPalavra(indice, 'palavra', evento.target.value)}
                  size="sm"
                  borderRadius="8px"
                  placeholder="palavra"
                  maxW="40%"
                />
                <Input
                  value={item.pronuncia}
                  onChange={(evento) => alterarPalavra(indice, 'pronuncia', evento.target.value)}
                  size="sm"
                  borderRadius="8px"
                  placeholder="ex.: UÓ-rer"
                  fontWeight="semibold"
                />
                <IconButton
                  size="sm"
                  variant="ghost"
                  aria-label="Remover palavra"
                  onClick={() =>
                    setPalavras((atuais) => atuais.filter((_, posicao) => posicao !== indice))
                  }
                >
                  <Trash2 size={14} />
                </IconButton>
              </HStack>
            ))}
            <Button
              size="xs"
              variant="ghost"
              alignSelf="flex-start"
              borderRadius="full"
              onClick={() => setPalavras((atuais) => [...atuais, { palavra: '', pronuncia: '' }])}
            >
              <Plus size={13} />
              Adicionar palavra
            </Button>
          </VStack>

          <Flex gap={2} wrap="wrap" justify="flex-end">
            <Button
              size="sm"
              variant="outline"
              colorPalette="purple"
              borderRadius="full"
              disabled={sugerindo}
              onClick={() => onSugerir(relato.uuid)}
            >
              {sugerindo ? (
                <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
              ) : (
                <Sparkles size={14} />
              )}
              {relato.status === 'sugerido' ? 'Pedir nova sugestão' : 'Sugerir com IA'}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              borderRadius="full"
              disabled={salvando}
              onClick={() => onRejeitar(relato.uuid)}
            >
              <X size={14} />
              Rejeitar
            </Button>
            <Button
              size="sm"
              colorPalette="green"
              borderRadius="full"
              disabled={salvando || correcaoVazia}
              onClick={aprovar}
            >
              <Check size={14} />
              Aprovar e aplicar
            </Button>
          </Flex>
        </VStack>
      )}
    </Box>
  )
})
