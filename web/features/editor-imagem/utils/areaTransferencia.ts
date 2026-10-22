const PREFIXO_TIPO_IMAGEM = 'image/'
const ETIQUETAS_CAMPO_TEXTO = ['INPUT', 'TEXTAREA', 'SELECT']

export function extrairImagemDaTransferencia(transferencia: DataTransfer | null): File | null {
  if (!transferencia) return null

  const arquivo = Array.from(transferencia.files).find((item) =>
    item.type.startsWith(PREFIXO_TIPO_IMAGEM)
  )
  if (arquivo) return arquivo

  const itemImagem = Array.from(transferencia.items).find(
    (item) => item.kind === 'file' && item.type.startsWith(PREFIXO_TIPO_IMAGEM)
  )
  return itemImagem?.getAsFile() ?? null
}

export function isCampoDeTexto(alvo: EventTarget | null): boolean {
  if (!(alvo instanceof HTMLElement)) return false
  return ETIQUETAS_CAMPO_TEXTO.includes(alvo.tagName) || alvo.isContentEditable
}

export function isAreaTransferenciaDisponivel(): boolean {
  return (
    window.isSecureContext &&
    typeof ClipboardItem !== 'undefined' &&
    Boolean(navigator.clipboard?.write)
  )
}

export async function copiarImagemParaAreaTransferencia(
  gerarImagem: () => Promise<Blob>,
  tipo: string
): Promise<void> {
  await navigator.clipboard.write([new ClipboardItem({ [tipo]: gerarImagem() })])
}

export function baixarArquivo(conteudo: Blob, nomeArquivo: string) {
  const url = URL.createObjectURL(conteudo)
  const link = document.createElement('a')
  link.href = url
  link.download = nomeArquivo
  link.click()
  URL.revokeObjectURL(url)
}
