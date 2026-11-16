import manifestoSkin from '../../../../extensao/ytm-spotify-skin/manifest.json'

export const VERSAO_EXTENSAO_YTM_SPOTIFY_SKIN = manifestoSkin.version

export const URL_DOWNLOAD_EXTENSAO_YTM_SPOTIFY_SKIN = `/build/extensao/ytm-spotify-skin-${VERSAO_EXTENSAO_YTM_SPOTIFY_SKIN}.zip`

export const EXPLICACAO_EXTENSAO_YTM_SPOTIFY_SKIN =
  'Só visual. Deixa o YouTube Music com cara de Spotify (biblioteca à esquerda, lista em tabela, player em três zonas e painel Tocando agora), mantendo o vermelho do YouTube. Não envia dados para o CirqueiraX — a captura continua na extensão de cima.'

export const DESTAQUES_EXTENSAO_YTM_SPOTIFY_SKIN = [
  'Biblioteca à esquerda com capas, busca, filtros e largura arrastável.',
  'Playlists em tabela: número, título, canal, álbum e duração.',
  'Player em três zonas e painel Tocando agora com a fila.',
  'Cabeçalho da playlist tingido pela cor da capa.',
]

export const PASSOS_INSTALAR_EXTENSAO_YTM_SPOTIFY_SKIN = [
  'Baixe o arquivo da extensão e descompacte numa pasta que não vai apagar.',
  'No Chrome, abra chrome://extensions e ligue o "Modo do desenvolvedor" (canto superior direito).',
  'Clique em "Carregar sem compactação" e escolha a pasta descompactada.',
  'Abra ou recarregue o music.youtube.com. Se o YouTube Music estiver como app, feche e abra de novo.',
  'Para atualizar: baixe o arquivo de novo, substitua os arquivos da pasta e clique em recarregar em chrome://extensions.',
]
