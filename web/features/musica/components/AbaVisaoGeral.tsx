import { Skeleton, VStack } from '@chakra-ui/react'
import { memo, useState } from 'react'
import { useVisaoGeralMusica } from '../hooks'
import { criarOpcoesPeriodoVisao, filtroDaOpcao } from '../utils'
import { CabecalhoSecaoMusica } from './CabecalhoSecaoMusica'
import { SeletorPeriodoAnalise } from './SeletorPeriodoAnalise'
import { VisaoGeralAtalhos } from './VisaoGeralAtalhos'
import { VisaoGeralDestaque } from './VisaoGeralDestaque'
import { VisaoGeralTopos } from './VisaoGeralTopos'

export const AbaVisaoGeral = memo(function AbaVisaoGeral({ habilitado }: { habilitado: boolean }) {
  const opcoes = criarOpcoesPeriodoVisao(new Date().getFullYear())
  const [chavePeriodo, setChavePeriodo] = useState('7d')
  const { data, isLoading } = useVisaoGeralMusica(filtroDaOpcao(opcoes, chavePeriodo), habilitado)

  return (
    <VStack align="stretch" gap={4}>
      <CabecalhoSecaoMusica
        titulo="Visão geral"
        cor="cirqueira.musica.verde"
        descricao="O resumo do período: quanto, quem, o quê e onde você ouviu"
        acoes={
          <SeletorPeriodoAnalise
            opcoes={opcoes}
            selecionada={chavePeriodo}
            onSelecionar={setChavePeriodo}
          />
        }
      />
      {isLoading || !data ? (
        <VStack align="stretch" gap={4}>
          <Skeleton h="300px" borderRadius="16px" />
          <Skeleton h="260px" borderRadius="12px" />
        </VStack>
      ) : (
        <>
          <VisaoGeralDestaque dados={data} />
          <VisaoGeralTopos dados={data} />
          <VisaoGeralAtalhos dados={data} habilitado={habilitado} />
        </>
      )}
    </VStack>
  )
})
