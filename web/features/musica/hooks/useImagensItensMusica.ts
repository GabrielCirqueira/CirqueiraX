import { useMemo } from 'react'
import type { ItemComImagemMusica } from '../types'
import { chaveImagemItem } from '../utils'
import { useImagensMusica } from './useImagensMusica'

export function useImagensItensMusica(itens: ItemComImagemMusica[]) {
  const chavesFaltantes = useMemo(
    () => itens.filter((item) => !item.imagemUrl).map(chaveImagemItem),
    [itens]
  )
  const { data: mapa } = useImagensMusica(chavesFaltantes)

  return (item: ItemComImagemMusica): string | null =>
    item.imagemUrl ?? mapa?.[chaveImagemItem(item)]?.imagemUrl ?? null
}
