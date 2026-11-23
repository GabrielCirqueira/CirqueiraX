import { memo } from 'react'
import { SeletorPeriodoMusica } from './SeletorPeriodoMusica'

export interface SeletorPeriodoAnaliseProps {
  opcoes: { chave: string; rotulo: string }[]
  selecionada: string
  onSelecionar: (chave: string) => void
}

export const SeletorPeriodoAnalise = memo(function SeletorPeriodoAnalise({
  opcoes,
  selecionada,
  onSelecionar,
}: SeletorPeriodoAnaliseProps) {
  return (
    <SeletorPeriodoMusica opcoes={opcoes} selecionada={selecionada} onSelecionar={onSelecionar} />
  )
})
