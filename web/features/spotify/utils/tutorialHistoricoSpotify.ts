export const URL_PRIVACIDADE_SPOTIFY = 'https://www.spotify.com/account/privacy'

export const EXPLICACAO_TUTORIAL_HISTORICO_SPOTIFY =
  'A conexão com o Spotify guarda sozinha o que você ouvir daqui pra frente (a cada ~30 min). O passado só entra quando você pede o histórico ampliado na conta Spotify e importa o ZIP aqui.'

export const OPCOES_PEDIDO_SPOTIFY = [
  {
    marcar: true,
    titulo: 'Histórico ampliado de streams',
    detalhe:
      'É o único necessário. Cobre a conta inteira, com tempo exato e código de cada faixa. Pode levar até 30 dias para chegar por e-mail. Só com esse arquivo já dá para importar o passado completo.',
  },
  {
    marcar: false,
    titulo: 'Dados da conta',
    detalhe: 'Não precisa. O histórico ampliado já traz o passado — e com mais detalhe.',
  },
  {
    marcar: false,
    titulo: 'Informações técnicas de registro',
    detalhe: 'O CirqueiraX não usa. Deixe desmarcado.',
  },
] as const

export const PASSOS_TUTORIAL_HISTORICO_SPOTIFY = [
  'Abra a página de privacidade da conta Spotify (botão abaixo).',
  'Em "Baixar seus dados", marque só "Histórico ampliado de streams".',
  'Confirme o pedido. O arquivo chega por e-mail, com link de download (até ~30 dias).',
  'Baixe o ZIP e envie em "Importar histórico do Spotify" — sem abrir nem separar pastas. O sistema lê só as reproduções e ignora o resto.',
  'Pode importar de novo depois: o que já existe não duplica. O tempo exato do arquivo substitui a estimativa da coleta.',
]

export const NOTA_TUTORIAL_HISTORICO_SPOTIFY =
  'Vincule a conta o quanto antes. O arquivo cobre até o dia do pedido; a coleta automática pega o que você ouvir depois do vínculo. Quanto antes conectar, menor o buraco entre os dois.'
