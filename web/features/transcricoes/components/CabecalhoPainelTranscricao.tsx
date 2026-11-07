import { formatarDataHora } from '@/shared/utils/formatarData'
import { Badge, HStack, IconButton, Input, Text, VStack } from '@chakra-ui/react'
import { Check, Pencil, Star, X } from 'lucide-react'
import { type FormEvent, memo, useState } from 'react'
import type { TranscricaoDetalhe } from '../types'
import {
  formatarDuracao,
  formatarDuracaoExtensa,
  formatarTamanho,
  nomeIdioma,
  obterAparenciaStatus,
} from '../utils'

export interface CabecalhoPainelTranscricaoProps {
  transcricao: TranscricaoDetalhe
  salvando: boolean
  onRenomear: (titulo: string) => void
  onAlternarFavorita: () => void
  onFechar: () => void
}

export const CabecalhoPainelTranscricao = memo(function CabecalhoPainelTranscricao({
  transcricao,
  salvando,
  onRenomear,
  onAlternarFavorita,
  onFechar,
}: CabecalhoPainelTranscricaoProps) {
  const [editando, setEditando] = useState(false)
  const [titulo, setTitulo] = useState(transcricao.titulo)
  const aparencia = obterAparenciaStatus(transcricao.status)
  const idioma = nomeIdioma(transcricao)
  const informacoes = [
    formatarDataHora(transcricao.criadoEm),
    formatarDuracao(transcricao.duracaoSegundos),
    formatarTamanho(transcricao.tamanhoBytes),
    idioma,
    transcricao.status === 'concluida' ? `${transcricao.totalPalavras} palavras` : null,
    transcricao.segundosProcessamento !== null
      ? `transcrito em ${formatarDuracaoExtensa(transcricao.segundosProcessamento)}`
      : null,
  ].filter((item): item is string => Boolean(item))

  function iniciarEdicao() {
    setTitulo(transcricao.titulo)
    setEditando(true)
  }

  function salvar(evento: FormEvent) {
    evento.preventDefault()
    const novoTitulo = titulo.trim()
    if (novoTitulo && novoTitulo !== transcricao.titulo) onRenomear(novoTitulo)
    setEditando(false)
  }

  return (
    <VStack align="stretch" gap={2}>
      <HStack align="start" gap={2}>
        {editando ? (
          <form onSubmit={salvar} style={{ flex: 1, display: 'flex', gap: '0.5rem' }}>
            <Input
              size="sm"
              autoFocus
              value={titulo}
              maxLength={255}
              onChange={(evento) => setTitulo(evento.target.value)}
              onKeyDown={(evento) => evento.key === 'Escape' && setEditando(false)}
              borderRadius="lg"
            />
            <IconButton
              type="submit"
              size="sm"
              colorPalette="brand"
              borderRadius="lg"
              aria-label="Salvar título"
            >
              <Check size={14} />
            </IconButton>
            <IconButton
              size="sm"
              variant="ghost"
              borderRadius="lg"
              aria-label="Cancelar"
              onClick={() => setEditando(false)}
            >
              <X size={14} />
            </IconButton>
          </form>
        ) : (
          <HStack gap={1} flex={1} minW={0} role="group">
            <Text
              as="h2"
              fontSize={{ base: 'lg', md: 'xl' }}
              fontWeight="black"
              color="fg"
              lineClamp={2}
            >
              {transcricao.titulo}
            </Text>
            <IconButton
              size="2xs"
              variant="ghost"
              borderRadius="md"
              aria-label="Renomear"
              title="Renomear"
              color="fg.subtle"
              opacity={{ base: 1, md: 0 }}
              _groupHover={{ opacity: 1 }}
              loading={salvando}
              onClick={iniciarEdicao}
            >
              <Pencil size={12} />
            </IconButton>
          </HStack>
        )}

        <IconButton
          size="sm"
          variant="ghost"
          borderRadius="lg"
          aria-label={transcricao.favorita ? 'Remover dos favoritos' : 'Favoritar'}
          title={transcricao.favorita ? 'Remover dos favoritos' : 'Favoritar'}
          color={transcricao.favorita ? 'cirqueira.amber.400' : 'fg.subtle'}
          onClick={onAlternarFavorita}
        >
          <Star size={16} fill={transcricao.favorita ? 'currentColor' : 'none'} />
        </IconButton>
        <IconButton
          size="sm"
          variant="ghost"
          borderRadius="lg"
          aria-label="Fechar"
          color="fg.subtle"
          onClick={onFechar}
        >
          <X size={16} />
        </IconButton>
      </HStack>

      <HStack gap={1.5} flexWrap="wrap">
        <Badge size="sm" variant="subtle" colorPalette={aparencia.paleta} borderRadius="md">
          {aparencia.rotulo}
        </Badge>
        {informacoes.map((informacao) => (
          <Text key={informacao} fontSize="xs" color="fg.subtle">
            · {informacao}
          </Text>
        ))}
      </HStack>
      {transcricao.titulo !== transcricao.nomeArquivoOriginal && (
        <Text fontSize="11px" color="fg.subtle" truncate title={transcricao.nomeArquivoOriginal}>
          Arquivo: {transcricao.nomeArquivoOriginal}
        </Text>
      )}
    </VStack>
  )
})
