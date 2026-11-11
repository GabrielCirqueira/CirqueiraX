import { type ReactNode, memo } from 'react'
import { Link as LinkRouter } from 'react-router-dom'
import { useFonteMusica } from '../hooks/useFonteMusica'
import { anexarFonteNaRota } from '../utils'

export interface LinkMusicaProps {
  to: string
  children: ReactNode
}

export const LinkMusica = memo(function LinkMusica({ to, children }: LinkMusicaProps) {
  const { fonte } = useFonteMusica()

  return <LinkRouter to={anexarFonteNaRota(to, fonte)}>{children}</LinkRouter>
})
