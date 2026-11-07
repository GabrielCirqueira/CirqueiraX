import { useMemo } from 'react'
import type { ItemComImagemSpotify } from '../types'
import { chaveImagemItem } from '../utils'
import { useImagensSpotify } from './useImagensSpotify'

export function useImagensItensSpotify(itens: ItemComImagemSpotify[]) {
  const chavesFaltantes = useMemo(
    () => itens.filter((item) => !item.imagemUrl).map(chaveImagemItem),
    [itens]
  )
  const { data: mapa } = useImagensSpotify(chavesFaltantes)

  return (item: ItemComImagemSpotify): string | null =>
    item.imagemUrl ?? mapa?.[chaveImagemItem(item)]?.imagemUrl ?? null
}
