import { useEffect } from 'react'

interface UseSEOProps {
  /** Título da página — aparece na aba do browser */
  title: string
  /** Descrição da página — 150–160 caracteres */
  description?: string
  /** Palavras-chave separadas por vírgula */
  keywords?: string
  /** true para páginas que não devem ser indexadas (rotas autenticadas restritas) */
  noindex?: boolean
  /** Imagem para Open Graph e Twitter Card */
  image?: string
  /** Dado estruturado Schema.org (JSON-LD) */
  jsonLd?: Record<string, unknown>
}

/**
 * Configura dinamicamente as metatags de SEO da página.
 */
export function useSEO({
  title,
  description = 'Central inteligente para gestão, triagem e automação de downloads de vídeos, sincronização contínua e backup em nuvem.',
  keywords = 'CirqueiraX, central de mídias, automação de downloads, backup, syncthing, google fotos',
  noindex = false,
  image = '/og-image.png',
  jsonLd,
}: UseSEOProps) {
  useEffect(() => {
    const formattedTitle = title.toLowerCase().includes('cirqueirax')
      ? title
      : `${title} — CirqueiraX`

    document.title = formattedTitle

    setMeta('description', description)
    setMeta('keywords', keywords)

    if (noindex) {
      setMeta('robots', 'noindex, nofollow')
    } else {
      setMeta('robots', 'index, follow')
    }

    setMetaProperty('og:title', formattedTitle)
    setMetaProperty('og:description', description)
    setMetaProperty('og:image', image)
    setMetaProperty('og:type', 'website')
    setMetaProperty('og:locale', 'pt_BR')
    setMetaProperty('og:site_name', 'CirqueiraX')

    setMeta('twitter:card', 'summary_large_image')
    setMeta('twitter:title', formattedTitle)
    setMeta('twitter:description', description)
    setMeta('twitter:image', image)

    if (jsonLd) {
      const existing = document.getElementById('json-ld-schema')
      if (existing) {
        existing.textContent = JSON.stringify(jsonLd)
      } else {
        const script = document.createElement('script')
        script.id = 'json-ld-schema'
        script.type = 'application/ld+json'
        script.textContent = JSON.stringify(jsonLd)
        document.head.appendChild(script)
      }
    }

    return () => {
      const script = document.getElementById('json-ld-schema')
      if (script) script.remove()
    }
  }, [title, description, keywords, noindex, image, jsonLd])
}

function setMeta(name: string, content: string) {
  let el = document.querySelector<HTMLMetaElement>(`meta[name="${name}"]`)
  if (!el) {
    el = document.createElement('meta')
    el.name = name
    document.head.appendChild(el)
  }
  el.content = content
}

function setMetaProperty(property: string, content: string) {
  let el = document.querySelector<HTMLMetaElement>(`meta[property="${property}"]`)
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute('property', property)
    document.head.appendChild(el)
  }
  el.content = content
}
