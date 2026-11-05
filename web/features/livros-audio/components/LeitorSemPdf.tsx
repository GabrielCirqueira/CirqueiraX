import { Flex } from '@chakra-ui/react'
import { memo, useMemo, useState } from 'react'
import { useBlocosLivroAudio, useSalvarPosicaoLivroAudio } from '../hooks/useLivrosAudio'
import type { NarracaoAtual } from '../hooks/useNarracaoAtual'
import { usePreferenciasLeitura } from '../hooks/usePreferenciasLeitura'
import type { AlvoReproducao, LivroAudio } from '../types'
import { carimbarPosicao } from '../utils/posicao'
import { encontrarBlocoPorPagina } from '../utils/sincronizacao'
import { AvisoProgressoAudio } from './AvisoProgressoAudio'
import { BarraSuperiorLeitor } from './BarraSuperiorLeitor'
import { FaixaConexao } from './FaixaConexao'
import { LeitorTexto } from './LeitorTexto'
import { PlayerAudioLivro } from './PlayerAudioLivro'

interface LeitorSemPdfProps {
  livro: LivroAudio
}

export const LeitorSemPdf = memo(function LeitorSemPdf({ livro }: LeitorSemPdfProps) {
  const salvarPosicaoMutation = useSalvarPosicaoLivroAudio()
  const { data: blocos = [] } = useBlocosLivroAudio(livro.uuid)
  const [pagina, setPagina] = useState(livro.paginaAtual)
  const [narracao, setNarracao] = useState<NarracaoAtual | null>(null)
  const [seguir, setSeguir] = useState(true)
  const [alvoReproducao, setAlvoReproducao] = useState<AlvoReproducao | null>(null)
  const { tema, alternarTema, tamanhoFonte, aumentarFonte, diminuirFonte } =
    usePreferenciasLeitura()
  const totalPaginas = livro.totalPaginas ?? 1

  const bloco = useMemo(
    () =>
      blocos.find((item) => item.numeroBloco === narracao?.numeroBloco) ??
      encontrarBlocoPorPagina(blocos, pagina) ??
      null,
    [blocos, narracao?.numeroBloco, pagina]
  )

  function salvarPosicao(paginaAtual: number, numeroBloco?: number | null, segundos?: number) {
    salvarPosicaoMutation.mutate({
      uuid: livro.uuid,
      posicao: carimbarPosicao(livro.uuid, {
        paginaAtual,
        blocoAtual: numeroBloco ?? livro.blocoAtual,
        segundosNoBloco: segundos ?? 0,
      }),
    })
  }

  return (
    <Flex
      direction="column"
      w="full"
      h="100dvh"
      bg="cirqueira.grey.950"
      position="fixed"
      inset={0}
      zIndex={50}
      overflow="hidden"
    >
      <BarraSuperiorLeitor
        titulo={livro.titulo}
        paginaAtual={pagina}
        totalPaginas={totalPaginas}
        modoDuplo={false}
        escala={1}
        telaCheia={false}
        onAumentarZoom={() => {}}
        onDiminuirZoom={() => {}}
        onResetarZoom={() => {}}
        onAlternarModoDuplo={() => {}}
        onAlternarTelaCheia={() => {}}
        tema={tema}
        onAlternarTema={alternarTema}
        modoTexto
        onAumentarFonte={aumentarFonte}
        onDiminuirFonte={diminuirFonte}
      />

      <FaixaConexao compacta />

      <LeitorTexto
        narracao={narracao}
        bloco={bloco}
        tema={tema}
        tamanhoFonte={tamanhoFonte}
        seguir={seguir}
        destacarPalavra={false}
        onOuvirTrecho={(numeroBloco, indiceTrecho, texto) => {
          const alvo = blocos.find((item) => item.numeroBloco === numeroBloco)
          setSeguir(true)
          setAlvoReproducao({
            id: Date.now(),
            numeroBloco,
            pagina: alvo?.paginaInicio ?? pagina,
            indiceTrecho,
            texto,
          })
        }}
      />

      <AvisoProgressoAudio livro={livro} />

      {blocos.length > 0 && (
        <PlayerAudioLivro
          livro={livro}
          blocos={blocos}
          paginaAtualLeitor={pagina}
          totalPaginas={totalPaginas}
          acompanharAudio={seguir}
          onAlternarAcompanharAudio={() => setSeguir((atual) => !atual)}
          onMudarPaginaLeitor={setPagina}
          onSalvarPosicao={salvarPosicao}
          onNarracaoTexto={setNarracao}
          modoTexto
          alvoReproducao={alvoReproducao}
        />
      )}
    </Flex>
  )
})
