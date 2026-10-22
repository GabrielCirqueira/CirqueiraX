import type { CategoriaOpcao } from '@/features/downloads-video/types'
import { addToast } from '@/shared/components/ui/toaster'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { baixarArquivoDaMidia, detalharMidiaParaEdicao, salvarEdicaoImagem } from '../api'
import type { SalvarEdicaoInput } from '../types'
import { criarImagemEditor, nomeDaMidia } from '../utils/carregamentoImagem'

const CHAVES_INVALIDADAS_AO_SALVAR = [['prints'], ['central-midias'], ['media-itens']]

export function useImagemDaMidia(uuid: string | null) {
  return useQuery({
    queryKey: ['editor-imagem', 'midia', uuid],
    enabled: Boolean(uuid),
    staleTime: Number.POSITIVE_INFINITY,
    gcTime: 0,
    retry: false,
    queryFn: async () => {
      const midiaUuid = uuid ?? ''
      const [mediaItem, conteudo] = await Promise.all([
        detalharMidiaParaEdicao(midiaUuid),
        baixarArquivoDaMidia(midiaUuid),
      ])
      return criarImagemEditor(conteudo, nomeDaMidia(mediaItem), midiaUuid)
    },
  })
}

export function useSalvarEdicao(categorias: CategoriaOpcao[]) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (entrada: SalvarEdicaoInput) => salvarEdicaoImagem(entrada),
    onSuccess: (_mediaItem, entrada) => {
      for (const chave of CHAVES_INVALIDADAS_AO_SALVAR) {
        queryClient.invalidateQueries({ queryKey: chave })
      }
      const categoria = categorias.find((item) => item.uuid === entrada.categoriaId)
      addToast({
        title: categoria?.googlePhotosAlbumId
          ? 'Imagem salva e a caminho do Google Fotos'
          : 'Imagem salva no CirqueiraX',
        description: categoria
          ? `Categoria "${categoria.nome}".`
          : 'Ficou sem categoria. Ela aparece na Central de Mídias.',
        color: 'success',
      })
    },
    onError: () => {
      addToast({
        title: 'Não foi possível salvar a imagem',
        description: 'Tente novamente. Se continuar, baixe a imagem para não perder a edição.',
        color: 'danger',
      })
    },
  })
}
