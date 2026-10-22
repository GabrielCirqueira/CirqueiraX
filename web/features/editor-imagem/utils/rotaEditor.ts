const ROTA_EDITOR_IMAGEM = '/editor-imagem'
const PARAMETRO_MIDIA = 'midia'
const STATUS_SEM_ARQUIVO = ['arquivo_removido', 'arquivo_expurgado']

export function montarRotaEditorImagem(uuid: string): string {
  return `${ROTA_EDITOR_IMAGEM}?${new URLSearchParams({ [PARAMETRO_MIDIA]: uuid })}`
}

export function isMidiaEditavelNoEditor(status?: string | null): boolean {
  return !STATUS_SEM_ARQUIVO.includes(status ?? '')
}
