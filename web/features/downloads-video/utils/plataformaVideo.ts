import type { LucideIcon } from 'lucide-react'
import { Globe, Instagram, Video, Youtube } from 'lucide-react'

export interface PlataformaDetectada {
  id: string
  nome: string
  icone: LucideIcon
  colorPalette: string
  conhecido: boolean
}

interface DefinicaoPlataforma {
  id: string
  nome: string
  icone: LucideIcon
  colorPalette: string
  conhecido: boolean
  dominios: string[]
  regex?: RegExp
}

const PLATAFORMAS_REGISTRADAS: DefinicaoPlataforma[] = [
  {
    id: 'youtube',
    nome: 'YouTube',
    icone: Youtube,
    colorPalette: 'red',
    conhecido: true,
    dominios: ['youtube.com', 'youtu.be'],
  },
  {
    id: 'tiktok',
    nome: 'TikTok',
    icone: Video,
    colorPalette: 'cyan',
    conhecido: true,
    dominios: ['tiktok.com'],
  },
  {
    id: 'twitter',
    nome: 'X / Twitter',
    icone: Globe,
    colorPalette: 'blue',
    conhecido: true,
    dominios: ['twitter.com', 'x.com'],
  },
  {
    id: 'instagram',
    nome: 'Instagram',
    icone: Instagram,
    colorPalette: 'pink',
    conhecido: true,
    dominios: ['instagram.com'],
  },
  {
    id: 'social',
    nome: 'Vídeo Social',
    icone: Video,
    colorPalette: 'purple',
    conhecido: true,
    dominios: [
      'threads.net',
      'facebook.com',
      'fb.watch',
      'reddit.com',
      'twitch.tv',
      'vimeo.com',
      'kwai.com',
      'pinterest.com',
      'pin.it',
    ],
    regex: /\.(mp4|webm|mkv|mov)(\?.*)?$/i,
  },
]

export function identificarPlataforma(url: string): PlataformaDetectada | null {
  if (!url || !url.trim()) {
    return null
  }

  const urlLimpa = url.toLowerCase().trim()

  for (const definicao of PLATAFORMAS_REGISTRADAS) {
    const correspondeDominio = definicao.dominios.some((dom) => urlLimpa.includes(dom))
    const correspondeRegex = definicao.regex ? definicao.regex.test(urlLimpa) : false

    if (correspondeDominio || correspondeRegex) {
      return {
        id: definicao.id,
        nome: definicao.nome,
        icone: definicao.icone,
        colorPalette: definicao.colorPalette,
        conhecido: definicao.conhecido,
      }
    }
  }

  try {
    const parsed = new URL(url)
    if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
      return {
        id: 'web',
        nome: 'Vídeo Web',
        icone: Globe,
        colorPalette: 'gray',
        conhecido: false,
      }
    }
  } catch {}

  return null
}

export function isUrlVideoConhecida(url: string): boolean {
  const plataforma = identificarPlataforma(url)
  return Boolean(plataforma?.conhecido)
}
