import { cn } from '@/shared/lib/cn'
import { Clipboard, Download, Globe, Instagram, Loader2, Video, X, Youtube } from 'lucide-react'
import { type FormEvent, memo, useState } from 'react'
import { useCriarDownload } from '../hooks/useDownloadsVideo'

export interface CampoNovoLinkProps {
  onDownloadIniciado?: () => void
}

function identificarPlataforma(url: string): {
  nome: string
  icone: typeof Youtube
  cor: string
} | null {
  if (!url || !url.trim()) {
    return null
  }

  const urlLimpa = url.toLowerCase()

  if (urlLimpa.includes('youtube.com') || urlLimpa.includes('youtu.be')) {
    return { nome: 'YouTube', icone: Youtube, cor: 'text-red-500 bg-red-500/10 border-red-500/20' }
  }

  if (urlLimpa.includes('tiktok.com')) {
    return {
      nome: 'TikTok',
      icone: Video,
      cor: 'text-cyan-500 bg-cyan-500/10 border-cyan-500/20',
    }
  }

  if (urlLimpa.includes('twitter.com') || urlLimpa.includes('x.com')) {
    return {
      nome: 'X / Twitter',
      icone: Globe,
      cor: 'text-sky-500 bg-sky-500/10 border-sky-500/20',
    }
  }

  if (urlLimpa.includes('instagram.com')) {
    return {
      nome: 'Instagram',
      icone: Instagram,
      cor: 'text-pink-500 bg-pink-500/10 border-pink-500/20',
    }
  }

  return { nome: 'Vídeo Web', icone: Globe, cor: 'text-zinc-500 bg-zinc-500/10 border-zinc-500/20' }
}

export const CampoNovoLink = memo(function CampoNovoLink({
  onDownloadIniciado,
}: CampoNovoLinkProps) {
  const [url, setUrl] = useState('')
  const { mutate: criarDownload, isPending } = useCriarDownload()

  const plataforma = identificarPlataforma(url)
  const IconePlataforma = plataforma?.icone || Globe

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    const urlFormatada = url.trim()
    if (!urlFormatada || isPending) {
      return
    }

    criarDownload(
      { url: urlFormatada },
      {
        onSuccess: () => {
          setUrl('')
          onDownloadIniciado?.()
        },
      }
    )
  }

  const colarAreaTransferencia = async () => {
    try {
      const texto = await navigator.clipboard.readText()
      if (texto) {
        setUrl(texto.trim())
      }
    } catch {}
  }

  return (
    <div className="w-full rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 sm:p-5 shadow-sm">
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
          <div className="relative flex-1 flex items-center">
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="Cole aqui o link do YouTube, TikTok, Twitter ou Instagram..."
              disabled={isPending}
              required
              className={cn(
                'w-full h-12 rounded-xl px-4 text-sm font-medium transition-all',
                'bg-zinc-50 dark:bg-zinc-800/60 text-zinc-900 dark:text-zinc-100',
                'border border-zinc-200 dark:border-zinc-700/80 focus:border-brand-500 dark:focus:border-brand-500',
                'focus:outline-none focus:ring-2 focus:ring-brand-500/20',
                'disabled:opacity-60 disabled:cursor-not-allowed',
                url ? 'pr-20' : 'pr-24'
              )}
            />

            <div className="absolute right-2.5 flex items-center gap-1">
              {url ? (
                <button
                  type="button"
                  onClick={() => setUrl('')}
                  className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-200/60 dark:hover:bg-zinc-700 transition-colors"
                  aria-label="Limpar campo"
                >
                  <X className="size-4" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={colarAreaTransferencia}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold text-zinc-600 dark:text-zinc-300 bg-zinc-200/60 dark:bg-zinc-700/60 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                >
                  <Clipboard className="size-3.5" />
                  <span>Colar</span>
                </button>
              )}
            </div>
          </div>

          <button
            type="submit"
            disabled={!url.trim() || isPending}
            className={cn(
              'h-12 px-6 rounded-xl font-semibold text-sm inline-flex items-center justify-center gap-2 transition-all shadow-sm shrink-0',
              'bg-brand-500 hover:bg-brand-600 text-white',
              'focus:outline-none focus:ring-2 focus:ring-brand-500/30',
              'disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-brand-500'
            )}
          >
            {isPending ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                <span>Iniciando...</span>
              </>
            ) : (
              <>
                <Download className="size-4" />
                <span>Baixar Vídeo</span>
              </>
            )}
          </button>
        </div>

        {plataforma && (
          <div className="flex items-center gap-2 text-xs">
            <span
              className={cn(
                'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-medium border text-xs',
                plataforma.cor
              )}
            >
              <IconePlataforma className="size-3.5" />
              {plataforma.nome} detectado
            </span>
          </div>
        )}
      </form>
    </div>
  )
})
