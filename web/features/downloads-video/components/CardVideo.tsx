import { cn } from '@/shared/lib/cn'
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  DownloadCloud,
  Edit3,
  ExternalLink,
  FolderPlus,
  Loader2,
  RotateCcw,
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
    <div
      className={cn(
        'group relative flex flex-col rounded-2xl border transition-all duration-200 overflow-hidden',
        'bg-white dark:bg-zinc-900 shadow-sm hover:shadow-md',
        selecionado
          ? 'border-brand-500 ring-2 ring-brand-500/20 bg-brand-50/10'
          : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700'
      )}
    >
      <div className="relative aspect-video w-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
        {temThumbnail ? (
          <img
            src={item.metadata.thumbnail}
            alt={titulo}
            onError={() => setErroImagem(true)}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-zinc-400 dark:text-zinc-600">
            <Video className="size-10 stroke-[1.5]" />
            <span className="text-xs font-medium">Sem prévia</span>
          </div>
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-60 group-hover:opacity-80 transition-opacity" />

        <div className="absolute top-2.5 left-2.5 z-10">
          <input
            type="checkbox"
            checked={selecionado}
            onChange={() => onToggleSelect(item.uuid)}
            className="size-5 rounded-md border-zinc-300 dark:border-zinc-600 text-brand-600 focus:ring-brand-500 bg-white/90 dark:bg-zinc-900/90 cursor-pointer shadow"
            aria-label={`Selecionar ${titulo}`}
          />
        </div>

        <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5 z-10">
          <span
            className={cn(
              'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border backdrop-blur-md',
              statusInfo.classes
            )}
          >
            {statusInfo.animado ? (
              <Loader2 className="size-3 animate-spin" />
            ) : item.status === 'erro' ? (
              <AlertCircle className="size-3" />
            ) : item.status === 'concluido' ? (
              <CheckCircle2 className="size-3" />
            ) : (
              <Clock className="size-3" />
            )}
            {statusInfo.label}
          </span>
        </div>

        {duracaoFormatada && (
          <div className="absolute bottom-2.5 right-2.5 z-10 rounded-md bg-black/80 px-2 py-0.5 text-xs font-medium text-white backdrop-blur-sm">
            {duracaoFormatada}
          </div>
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
      </div>

      <div className="flex flex-1 flex-col p-4">
        <h3
          className="font-semibold text-sm line-clamp-2 text-zinc-900 dark:text-zinc-100 leading-snug mb-1.5"
          title={titulo}
        >
          {titulo}
        </h3>

        <div className="flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400 mb-2">
          <User className="size-3.5 shrink-0" />
          <span className="truncate">{uploader}</span>
        </div>

        <div className="flex items-center justify-between gap-2 text-xs text-zinc-400 dark:text-zinc-500 pt-1 border-t border-zinc-100 dark:border-zinc-800/80 mb-3">
          <span className="truncate">
            {item.categoria?.nome ? (
              <span className="inline-flex items-center gap-1 font-medium text-brand-600 dark:text-brand-400 bg-brand-500/10 px-2 py-0.5 rounded">
                <FolderPlus className="size-3" />
                {item.categoria.nome}
              </span>
            ) : (
              <span className="italic text-zinc-400">Sem categoria</span>
            )}
          </span>
          <span className="shrink-0">{tempoRelativoNativo(item.criadoEm)}</span>
        </div>

        {item.status === 'erro' && item.erroMotivo && (
          <div className="mb-3 rounded-lg bg-rose-50 dark:bg-rose-950/40 p-2 text-xs text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900 line-clamp-2">
            {item.erroMotivo}
          </div>
        )}

        <div className="mt-auto flex items-center justify-end gap-1 pt-2">
          {onEditarMetadata && (
            <button
              type="button"
              onClick={() => onEditarMetadata(item)}
              className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              title="Editar metadados"
              aria-label="Editar metadados"
            >
              <Edit3 className="size-4" />
            </button>
          )}

          {onCategorizar && (
            <button
              type="button"
              onClick={() => onCategorizar(item)}
              className="p-1.5 rounded-lg text-zinc-500 hover:text-brand-600 dark:text-zinc-400 dark:hover:text-brand-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              title="Categorizar vídeo"
              aria-label="Categorizar vídeo"
            >
              <FolderPlus className="size-4" />
            </button>
          )}

          {onRebaixar && (
            <button
              type="button"
              onClick={() => onRebaixar(item.uuid)}
              className="p-1.5 rounded-lg text-zinc-500 hover:text-blue-600 dark:text-zinc-400 dark:hover:text-blue-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              title="Rebaixar vídeo"
              aria-label="Rebaixar vídeo"
            >
              <DownloadCloud className="size-4" />
            </button>
          )}

          {item.status === 'erro' && onRetentar && (
            <button
              type="button"
              onClick={() => onRetentar(item.uuid)}
              className="p-1.5 rounded-lg text-amber-600 hover:text-amber-700 dark:text-amber-400 dark:hover:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-950/40 transition-colors"
              title="Retentar processamento"
              aria-label="Retentar processamento"
            >
              <RotateCcw className="size-4" />
            </button>
          )}

          {onApagar && (
            <button
              type="button"
              onClick={() => onApagar(item.uuid)}
              className="p-1.5 rounded-lg text-zinc-500 hover:text-rose-600 dark:text-zinc-400 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
              title="Apagar vídeo"
              aria-label="Apagar vídeo"
            >
              <Trash2 className="size-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  )
})
