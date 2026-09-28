import { cn } from '@/shared/lib/cn'
import { Box, Flex, HStack, Text, VStack } from '@/shared/ui/layout'
import { Button, Card, CardContent, Chip } from '@heroui/react'
import {
  AlertCircle,
  CheckCircle2,
  CheckSquare,
  Clock,
  DownloadCloud,
  Edit3,
  ExternalLink,
  FolderPlus,
  Loader2,
  RotateCcw,
  Square,
  Trash2,
  User,
  Video,
} from 'lucide-react'
import { memo, useState } from 'react'
import type { MediaItem, StatusMediaItem } from '../types'

export interface CardVideoProps {
  item: MediaItem
  selecionado: boolean
  onToggleSelect: (uuid: string) => void
  onEditarMetadata?: (item: MediaItem) => void
  onCategorizar?: (item: MediaItem) => void
  onRebaixar?: (uuid: string) => void
  onRetentar?: (uuid: string) => void
  onApagar?: (uuid: string) => void
}

function formatarDuracao(segundos?: number): string | null {
  if (segundos === undefined || segundos === null || Number.isNaN(segundos) || segundos <= 0) {
    return null
  }

  const horas = Math.floor(segundos / 3600)
  const minutos = Math.floor((segundos % 3600) / 60)
  const segRestantes = Math.floor(segundos % 60)

  if (horas > 0) {
    return `${horas}:${String(minutos).padStart(2, '0')}:${String(segRestantes).padStart(2, '0')}`
  }

  return `${minutos}:${String(segRestantes).padStart(2, '0')}`
}

function tempoRelativoNativo(dataIso: string): string {
  try {
    const data = new Date(dataIso)
    if (Number.isNaN(data.getTime())) {
      return dataIso
    }

    const agora = new Date()
    const diffSegundos = Math.floor((agora.getTime() - data.getTime()) / 1000)

    if (diffSegundos < 60) {
      return 'agora há pouco'
    }

    const diffMinutos = Math.floor(diffSegundos / 60)
    if (diffMinutos < 60) {
      return `há ${diffMinutos} min`
    }

    const diffHoras = Math.floor(diffMinutos / 60)
    if (diffHoras < 24) {
      return `há ${diffHoras} ${diffHoras === 1 ? 'hora' : 'horas'}`
    }

    const diffDias = Math.floor(diffHoras / 24)
    if (diffDias < 30) {
      return `há ${diffDias} ${diffDias === 1 ? 'dia' : 'dias'}`
    }

    return data.toLocaleDateString('pt-BR')
  } catch {
    return dataIso
  }
}

function obterStatusConfig(status: StatusMediaItem) {
  switch (status) {
    case 'baixando':
      return {
        label: 'Baixando',
        classes: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30',
        animado: true,
      }
    case 'recebido':
      return {
        label: 'Recebido',
        classes: 'bg-slate-500/15 text-slate-600 dark:text-slate-400 border-slate-500/30',
        animado: false,
      }
    case 'em_fila':
      return {
        label: 'Em Fila',
        classes: 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30',
        animado: true,
      }
    case 'classificado':
      return {
        label: 'Classificado',
        classes: 'bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border-indigo-500/30',
        animado: false,
      }
    case 'distribuindo':
      return {
        label: 'Distribuindo',
        classes: 'bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 border-cyan-500/30',
        animado: true,
      }
    case 'distribuido_local':
      return {
        label: 'Distribuído',
        classes: 'bg-teal-500/15 text-teal-600 dark:text-teal-400 border-teal-500/30',
        animado: false,
      }
    case 'enviando_google_fotos':
      return {
        label: 'Google Fotos',
        classes: 'bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-500/30',
        animado: true,
      }
    case 'concluido':
      return {
        label: 'Concluído',
        classes: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
        animado: false,
      }
    case 'erro':
      return {
        label: 'Erro',
        classes: 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30',
        animado: false,
      }
    default:
      return {
        label: status,
        classes: 'bg-zinc-500/15 text-zinc-600 dark:text-zinc-400 border-zinc-500/30',
        animado: false,
      }
  }
}

export const CardVideo = memo(function CardVideo({
  item,
  selecionado,
  onToggleSelect,
  onEditarMetadata,
  onCategorizar,
  onRebaixar,
  onRetentar,
  onApagar,
}: CardVideoProps) {
  const [erroImagem, setErroImagem] = useState(false)
  const statusInfo = obterStatusConfig(item.status)
  const duracaoFormatada = formatarDuracao(item.metadata?.duracao)
  const titulo = item.metadata?.titulo || `Vídeo ${item.hash.slice(0, 10)}`
  const uploader = item.metadata?.uploader || 'Uploader desconhecido'
  const temThumbnail = Boolean(item.metadata?.thumbnail) && !erroImagem
  const urlOriginal = item.metadata?.url_original

  return (
    <Card
      className={cn(
        'group relative flex flex-col rounded-2xl border transition-all duration-200 overflow-hidden shadow-none',
        'bg-white dark:bg-zinc-900',
        selecionado
          ? 'border-brand-500 ring-2 ring-brand-500/20 bg-brand-50/10'
          : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700'
      )}
    >
      <Box className="relative aspect-video w-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
        {temThumbnail ? (
          <img
            src={item.metadata.thumbnail}
            alt={titulo}
            onError={() => setErroImagem(true)}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <VStack className="h-full w-full items-center justify-center gap-2 text-zinc-400 dark:text-zinc-600">
            <Video className="size-10 stroke-[1.5]" />
            <Text className="text-xs font-medium">Sem prévia</Text>
          </VStack>
        )}

        <Box className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-60 group-hover:opacity-80 transition-opacity" />

        <Box className="absolute top-2.5 left-2.5 z-10">
          <Button
            size="sm"
            variant="ghost"
            isIconOnly
            onPress={() => onToggleSelect(item.uuid)}
            className="p-1 rounded-lg bg-black/40 hover:bg-black/60 text-white backdrop-blur-md transition-colors"
            aria-label={`Selecionar ${titulo}`}
          >
            {selecionado ? (
              <CheckSquare className="size-4 text-brand-400" />
            ) : (
              <Square className="size-4" />
            )}
          </Button>
        </Box>

        <Box className="absolute top-2.5 right-2.5 z-10">
          <Chip
            size="sm"
            variant="soft"
            className={cn('backdrop-blur-md border', statusInfo.classes)}
          >
            <HStack className="gap-1 items-center">
              {statusInfo.animado ? (
                <Loader2 className="size-3 animate-spin" />
              ) : item.status === 'erro' ? (
                <AlertCircle className="size-3" />
              ) : item.status === 'concluido' ? (
                <CheckCircle2 className="size-3" />
              ) : (
                <Clock className="size-3" />
              )}
              <span>{statusInfo.label}</span>
            </HStack>
          </Chip>
        </Box>

        {duracaoFormatada && (
          <Box className="absolute bottom-2.5 right-2.5 z-10 rounded-md bg-black/80 px-2 py-0.5 text-xs font-medium text-white backdrop-blur-sm">
            {duracaoFormatada}
          </Box>
        )}

        {urlOriginal && (
          <a
            href={urlOriginal}
            target="_blank"
            rel="noopener noreferrer"
            className="absolute bottom-2.5 left-2.5 z-10 p-1 rounded-md bg-black/60 hover:bg-black/80 text-white/80 hover:text-white transition-colors"
            title="Abrir link original"
          >
            <ExternalLink className="size-3.5" />
          </a>
        )}
      </Box>

      <CardContent className="flex flex-1 flex-col p-4">
        <Text
          as="h3"
          className="font-semibold text-sm line-clamp-2 text-zinc-900 dark:text-zinc-100 leading-snug mb-1.5"
          title={titulo}
        >
          {titulo}
        </Text>

        <HStack className="gap-1.5 text-xs text-zinc-500 dark:text-zinc-400 mb-2">
          <User className="size-3.5 shrink-0" />
          <Text as="span" className="truncate">
            {uploader}
          </Text>
        </HStack>

        <Flex className="items-center justify-between gap-2 text-xs text-zinc-400 dark:text-zinc-500 pt-1 border-t border-zinc-100 dark:border-zinc-800/80 mb-3">
          <Box className="truncate">
            {item.categoria?.nome ? (
              <Chip
                size="sm"
                variant="soft"
                className="bg-brand-500/10 text-brand-600 dark:text-brand-400 border border-brand-500/20"
              >
                <HStack className="gap-1 items-center">
                  <FolderPlus className="size-3" />
                  <span>{item.categoria.nome}</span>
                </HStack>
              </Chip>
            ) : (
              <Text as="span" className="italic text-zinc-400">
                Sem categoria
              </Text>
            )}
          </Box>
          <Text as="span" className="shrink-0">
            {tempoRelativoNativo(item.criadoEm)}
          </Text>
        </Flex>

        {item.status === 'erro' && item.erroMotivo && (
          <Box className="mb-3 rounded-lg bg-rose-50 dark:bg-rose-950/40 p-2 text-xs text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900 line-clamp-2">
            {item.erroMotivo}
          </Box>
        )}

        <HStack className="mt-auto items-center justify-end gap-1 pt-2">
          {onEditarMetadata && (
            <Button
              size="sm"
              variant="ghost"
              isIconOnly
              onPress={() => onEditarMetadata(item)}
              aria-label="Editar metadados"
            >
              <Edit3 className="size-4 text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-100" />
            </Button>
          )}

          {onCategorizar && (
            <Button
              size="sm"
              variant="ghost"
              isIconOnly
              onPress={() => onCategorizar(item)}
              aria-label="Categorizar vídeo"
            >
              <FolderPlus className="size-4 text-zinc-500 hover:text-brand-600 dark:text-zinc-400 dark:hover:text-brand-400" />
            </Button>
          )}

          {onRebaixar && (
            <Button
              size="sm"
              variant="ghost"
              isIconOnly
              onPress={() => onRebaixar(item.uuid)}
              aria-label="Rebaixar vídeo"
            >
              <DownloadCloud className="size-4 text-zinc-500 hover:text-blue-600 dark:text-zinc-400 dark:hover:text-blue-400" />
            </Button>
          )}

          {item.status === 'erro' && onRetentar && (
            <Button
              size="sm"
              variant="ghost"
              isIconOnly
              onPress={() => onRetentar(item.uuid)}
              aria-label="Retentar processamento"
            >
              <RotateCcw className="size-4 text-amber-600 hover:text-amber-700 dark:text-amber-400" />
            </Button>
          )}

          {onApagar && (
            <Button
              size="sm"
              variant="ghost"
              isIconOnly
              onPress={() => onApagar(item.uuid)}
              aria-label="Apagar vídeo"
            >
              <Trash2 className="size-4 text-zinc-500 hover:text-rose-600 dark:text-zinc-400 dark:hover:text-rose-400" />
            </Button>
          )}
        </HStack>
      </CardContent>
    </Card>
  )
})
