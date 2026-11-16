export const URL_PRIVACIDADE_SPOTIFY = 'https://www.spotify.com/account/privacy'

export const EXPLICACAO_TUTORIAL_HISTORICO_SPOTIFY =
  'A conexão com o Spotify guarda sozinha o que você ouvir daqui pra frente (a cada ~30 min). O passado só entra quando você pede os arquivos na conta Spotify e importa o ZIP aqui.'

export const OPCOES_PEDIDO_SPOTIFY = [
  {
    marcar: true,
    titulo: 'Dados da conta',
    detalhe: 'Histórico do último ano. Costuma chegar em cerca de 5 dias por e-mail.',
  },
  {
    marcar: true,
    titulo: 'Histórico de streaming estendido',
    detalhe:
      'Conta inteira, com tempo exato e código de cada faixa. Pode levar até 30 dias. O estendido sozinho bastaria, mas demora mais — pedindo os dois você começa a usar antes.',
  },
  {
    marcar: false,
    titulo: 'Informações técnicas de registro',
    detalhe: 'O CirqueiraX não usa. Deixe desmarcado.',
  },
] as const

export const PASSOS_TUTORIAL_HISTORICO_SPOTIFY = [
  'Abra a página de privacidade da conta Spotify (botão abaixo).',
  'Em "Baixar seus dados", marque só as duas caixas recomendadas.',
  'Confirme o pedido. Os arquivos chegam por e-mail, com link de download.',
  'Baixe o ZIP e envie em "Importar histórico do Spotify" — sem abrir nem separar pastas. O sistema lê só as reproduções e ignora o resto.',
  'Pode importar os dois arquivos e também um ZIP antigo: o que já existe não duplica. O tempo exato do estendido substitui a estimativa da coleta.',
]

export const NOTA_TUTORIAL_HISTORICO_SPOTIFY =
  'Vincule a conta o quanto antes. O arquivo cobre até o dia do pedido; a coleta automática pega o que você ouvir depois do vínculo. Quanto antes conectar, menor o buraco entre os dois.'
