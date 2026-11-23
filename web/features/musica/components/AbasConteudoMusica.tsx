import { VStack } from '@chakra-ui/react'
import { memo, useState } from 'react'
import type { RespostaConsultaImagens, ResumoGeralMusica } from '../types'
import type { AbaMusica } from '../utils/abasMusica'
import { AbaDescobertas } from './AbaDescobertas'
import { AbaHabitos } from './AbaHabitos'
import { AbaHistorico } from './AbaHistorico'
import { AbaServicos } from './AbaServicos'
import { AbaVersoes } from './AbaVersoes'
import { AbaVisaoGeral } from './AbaVisaoGeral'
import { ModalHistoricoDia } from './ModalHistoricoDia'
import { SecaoCapsulaSonora } from './SecaoCapsulaSonora'
import { SecaoCuriosidades } from './SecaoCuriosidades'
import { SecaoEvolucaoMensal } from './SecaoEvolucaoMensal'
import { SecaoHojeSemana } from './SecaoHojeSemana'
import { SecaoRecordes } from './SecaoRecordes'
import { SecaoRetrospectiva } from './SecaoRetrospectiva'

export const AbasConteudoMusica = memo(function AbasConteudoMusica({
  aba,
  habilitado,
  resumo,
  mapaImagensResumo,
  carregandoResumo,
}: {
  aba: AbaMusica
  habilitado: boolean
  resumo?: ResumoGeralMusica
  mapaImagensResumo?: RespostaConsultaImagens
  carregandoResumo: boolean
}) {
  const [diaAberto, setDiaAberto] = useState<string | null>(null)

  return (
    <>
      {aba === 'visao' ? (
        <AbaVisaoGeral
          habilitado={habilitado}
          resumo={resumo}
          mapaImagensResumo={mapaImagensResumo}
          carregandoResumo={carregandoResumo}
        />
      ) : null}

      {aba === 'rankings' ? (
        <SecaoHojeSemana
          resumo={resumo}
          mapaImagens={mapaImagensResumo}
          carregando={carregandoResumo}
          modo="rankings"
        />
      ) : null}

      {aba === 'habitos' ? <AbaHabitos habilitado={habilitado} /> : null}

      {aba === 'descobertas' ? <AbaDescobertas habilitado={habilitado} /> : null}

      {aba === 'versoes' ? <AbaVersoes habilitado={habilitado} /> : null}

      {aba === 'historico' ? (
        <AbaHistorico habilitado={habilitado} onAbrirDia={setDiaAberto} />
      ) : null}

      {aba === 'recordes' ? (
        <VStack align="stretch" gap={6}>
          <SecaoCuriosidades curiosidades={resumo?.curiosidades} onAbrirDia={setDiaAberto} />
          <SecaoRecordes habilitado={habilitado} onAbrirDia={setDiaAberto} />
          <SecaoEvolucaoMensal habilitado={habilitado} />
        </VStack>
      ) : null}

      {aba === 'retrospectiva' ? (
        <VStack align="stretch" gap={6}>
          <SecaoCapsulaSonora conectada={habilitado} />
          <SecaoRetrospectiva habilitado={habilitado} />
        </VStack>
      ) : null}

      {aba === 'servicos' ? <AbaServicos habilitado={habilitado} /> : null}

      <ModalHistoricoDia data={diaAberto} onFechar={() => setDiaAberto(null)} />
    </>
  )
})
