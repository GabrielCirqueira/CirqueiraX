import { cn } from '@/shared/lib/cn'
import { Box, Flex, HStack, VStack } from '@/shared/ui/layout'
import { Button, Card, CardContent, Chip, Input } from '@heroui/react'
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
    <Card className="w-full rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm">
      <CardContent className="p-4 sm:p-5">
        <form onSubmit={handleSubmit}>
          <VStack className="gap-3">
            <Flex className="flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
              <Box className="relative flex-1 flex items-center">
                <Input
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="Cole aqui o link do YouTube, TikTok, Twitter ou Instagram..."
                  isDisabled={isPending}
                  required
                  className="w-full h-12 pr-24"
                />

                <HStack className="absolute right-2.5 gap-1">
                  {url ? (
                    <Button
                      size="sm"
                      variant="quiet"
                      isIconOnly
                      onPress={() => setUrl('')}
                      aria-label="Limpar campo"
                    >
                      <X className="size-4 text-zinc-400" />
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      variant="quiet"
                      onPress={colarAreaTransferencia}
                      className="text-xs text-zinc-600 dark:text-zinc-300 bg-zinc-200/60 dark:bg-zinc-700/60"
                    >
                      <Clipboard className="size-3.5" />
                      <span>Colar</span>
                    </Button>
                  )}
                </HStack>
              </Box>

              <Button
                type="submit"
                isDisabled={!url.trim() || isPending}
                className="h-12 px-6 bg-brand-500 hover:bg-brand-600 text-white font-semibold text-sm shrink-0"
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
              </Button>
            </Flex>

            {plataforma && (
              <HStack className="gap-2">
                <Chip
                  size="sm"
                  variant="soft"
                  className={cn('gap-1 text-xs font-medium border', plataforma.cor)}
                >
                  <IconePlataforma className="size-3.5" />
                  <span>{plataforma.nome} detectado</span>
                </Chip>
              </HStack>
            )}
          </VStack>
        </form>
      </CardContent>
    </Card>
  )
})
