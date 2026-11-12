import { useImportacoesYoutube, useMarcarRelatorioVistoImportacaoYoutube } from '../hooks'
import { DialogRelatorioImportacaoYoutube } from './DialogRelatorioImportacaoYoutube'

export function PopupRelatorioImportacaoYoutube() {
  const { data } = useImportacoesYoutube()
  const marcarVisto = useMarcarRelatorioVistoImportacaoYoutube()
  const pendentes = data?.relatoriosNaoVistos ?? []
  const atual = pendentes[0] ?? null

  return (
    <DialogRelatorioImportacaoYoutube
      importacao={atual}
      restantes={Math.max(0, pendentes.length - 1)}
      fechando={marcarVisto.isPending}
      onFechar={() => atual && marcarVisto.mutate(atual.uuid)}
    />
  )
}
