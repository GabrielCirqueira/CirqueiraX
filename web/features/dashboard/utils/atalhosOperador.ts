import type { FuncionalidadeSistema } from '@/shared/utils/funcionalidadesSistema'
import {
  AudioLines,
  BookOpen,
  Camera,
  DownloadCloud,
  Images,
  Layers,
  Music,
  PenLine,
  Radio,
  ScanText,
  UploadCloud,
  type LucideIcon,
} from 'lucide-react'

export interface AtalhoOperador {
  rota: string
  rotulo: string
  descricao: string
  funcionalidade: FuncionalidadeSistema
  icone: LucideIcon
  cor: string
}

export const ATALHOS_OPERADOR: AtalhoOperador[] = [
  {
    rota: '/musica',
    rotulo: 'Música',
    descricao: 'Histórico e análises',
    funcionalidade: 'musica',
    icone: Radio,
    cor: 'cirqueira.musica.verde',
  },
  {
    rota: '/central-midias',
    rotulo: 'Central de Mídias',
    descricao: 'Seu acervo completo',
    funcionalidade: 'central_midias',
    icone: Layers,
    cor: 'cirqueira.cyan.300',
  },
  {
    rota: '/downloads',
    rotulo: 'Downloads',
    descricao: 'Baixar vídeos da web',
    funcionalidade: 'downloads_video',
    icone: DownloadCloud,
    cor: 'cirqueira.blue.400',
  },
  {
    rota: '/downloads-mp3',
    rotulo: 'Downloads MP3',
    descricao: 'Áudios salvos',
    funcionalidade: 'downloads_audio',
    icone: Music,
    cor: 'cirqueira.purple.300',
  },
  {
    rota: '/livros-audio',
    rotulo: 'Livros em Áudio',
    descricao: 'Continuar a leitura',
    funcionalidade: 'livros_audio',
    icone: BookOpen,
    cor: 'cirqueira.emerald.400',
  },
  {
    rota: '/transcricoes',
    rotulo: 'Transcrições',
    descricao: 'Áudio em texto',
    funcionalidade: 'transcricoes',
    icone: AudioLines,
    cor: 'cirqueira.teal.300',
  },
  {
    rota: '/prints',
    rotulo: 'Prints',
    descricao: 'Capturas recentes',
    funcionalidade: 'prints',
    icone: Camera,
    cor: 'cirqueira.yellow.300',
  },
  {
    rota: '/editor-imagem',
    rotulo: 'Editor',
    descricao: 'Editar imagens',
    funcionalidade: 'editor_imagem',
    icone: PenLine,
    cor: 'cirqueira.rose.400',
  },
  {
    rota: '/extrair-texto',
    rotulo: 'Extrair texto',
    descricao: 'OCR de imagens',
    funcionalidade: 'extrair_texto',
    icone: ScanText,
    cor: 'cirqueira.purple.400',
  },
  {
    rota: '/upload-manual',
    rotulo: 'Upload',
    descricao: 'Enviar arquivos',
    funcionalidade: 'upload_manual',
    icone: UploadCloud,
    cor: 'cirqueira.orange.300',
  },
  {
    rota: '/google-fotos',
    rotulo: 'Google Fotos',
    descricao: 'Backup na nuvem',
    funcionalidade: 'google_fotos',
    icone: Images,
    cor: 'cirqueira.blue.300',
  },
]

export function filtrarAtalhosOperador(
  possuiPermissao: (codigo: FuncionalidadeSistema) => boolean
): AtalhoOperador[] {
  return ATALHOS_OPERADOR.filter((atalho) => possuiPermissao(atalho.funcionalidade))
}
