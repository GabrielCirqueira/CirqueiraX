import json
import re
import sys

from ytmusicapi import YTMusic
from ytmusicapi.exceptions import YTMusicError, YTMusicServerError, YTMusicUserError
from ytmusicapi.setup import setup_browser

SUCESSO = 0
CREDENCIAIS_INVALIDAS = 2
SERVICO_INDISPONIVEL = 3
FORMATO_INESPERADO = 4
LIMITE_BUSCA_PADRAO = 5
TEXTO_VISUALIZACOES = re.compile(r"\b(views?|visualiza\w*)\b", re.IGNORECASE)
TERMO_VERIFICACAO_SERVICO = "music"


class FalhaYoutubeMusic(Exception):
    def __init__(self, codigo, mensagem):
        super().__init__(mensagem)
        self.codigo = codigo
        self.mensagem = mensagem


def ler_entrada():
    try:
        entrada = json.loads(sys.stdin.read() or "{}")
    except json.JSONDecodeError:
        raise FalhaYoutubeMusic(FORMATO_INESPERADO, "A entrada não é um JSON válido.")
    if not isinstance(entrada, dict):
        raise FalhaYoutubeMusic(FORMATO_INESPERADO, "A entrada precisa ser um objeto JSON.")
    return entrada


def criar_cliente(entrada):
    cabecalhos = entrada.get("cabecalhos")
    if not isinstance(cabecalhos, str) or not cabecalhos.strip():
        raise FalhaYoutubeMusic(CREDENCIAIS_INVALIDAS, "Os cabeçalhos da sessão não foram informados.")
    try:
        autenticacao = json.loads(setup_browser(filepath=None, headers_raw=cabecalhos.strip()))
    except YTMusicError:
        raise FalhaYoutubeMusic(CREDENCIAIS_INVALIDAS, "Os cabeçalhos não têm cookie e x-goog-authuser de uma sessão logada.")
    return YTMusic(auth=autenticacao)


def servico_responde_sem_login():
    try:
        YTMusic().search(TERMO_VERIFICACAO_SERVICO, filter="songs", limit=1)
        return True
    except Exception:
        return False


def classificar_falha_servidor():
    if servico_responde_sem_login():
        return FalhaYoutubeMusic(CREDENCIAIS_INVALIDAS, "O YouTube Music recusou a sessão. O cookie provavelmente expirou.")
    return FalhaYoutubeMusic(SERVICO_INDISPONIVEL, "O YouTube Music não respondeu. Falha passageira ou limite de consultas.")


def executar_com_classificacao(operacao):
    try:
        return operacao()
    except FalhaYoutubeMusic:
        raise
    except YTMusicUserError:
        raise FalhaYoutubeMusic(CREDENCIAIS_INVALIDAS, "O YouTube Music recusou as credenciais informadas.")
    except YTMusicServerError:
        raise classificar_falha_servidor()
    except (KeyError, IndexError, TypeError, ValueError):
        raise FalhaYoutubeMusic(FORMATO_INESPERADO, "A resposta do YouTube Music veio num formato inesperado.")
    except Exception:
        raise FalhaYoutubeMusic(SERVICO_INDISPONIVEL, "Falha de rede ao consultar o YouTube Music.")


def texto_artistas(artistas):
    nomes = []
    for artista in artistas or []:
        nome = (artista or {}).get("name") or ""
        if nome and not TEXTO_VISUALIZACOES.search(nome):
            nomes.append(nome)
    return ", ".join(nomes)


def maior_capa(item):
    capas = item.get("thumbnails") or []
    if not capas:
        return None
    return max(capas, key=lambda capa: (capa.get("width") or 0)).get("url")


def duracao_ms(item):
    segundos = item.get("duration_seconds")
    if isinstance(segundos, (int, float)):
        return int(segundos * 1000)
    return None


def nome_album(item):
    album = item.get("album")
    if isinstance(album, dict):
        return album.get("name")
    return None


def mapear_item(item, posicao):
    return {
        "videoId": item["videoId"],
        "titulo": item.get("title") or "",
        "textoArtistas": texto_artistas(item.get("artists")),
        "album": nome_album(item),
        "urlCapa": maior_capa(item),
        "duracaoMs": duracao_ms(item),
        "secao": item.get("played"),
        "posicao": posicao,
        "tipoVideo": item.get("videoType"),
    }


def comando_validar(entrada):
    cliente = criar_cliente(entrada)
    conta = executar_com_classificacao(cliente.get_account_info)
    executar_com_classificacao(cliente.get_history)
    return {"nomeConta": conta.get("accountName"), "canal": conta.get("channelHandle")}


def comando_historico(entrada):
    cliente = criar_cliente(entrada)
    historico = executar_com_classificacao(cliente.get_history)
    itens = [item for item in historico if isinstance(item, dict) and item.get("videoId")]
    return {"itens": [mapear_item(item, posicao) for posicao, item in enumerate(itens)]}


def comando_buscar(entrada):
    texto = entrada.get("texto")
    if not isinstance(texto, str) or not texto.strip():
        raise FalhaYoutubeMusic(FORMATO_INESPERADO, "O texto da busca não foi informado.")
    limite = entrada.get("limite") or LIMITE_BUSCA_PADRAO
    cliente = YTMusic()
    resultados = executar_com_classificacao(lambda: cliente.search(texto.strip(), filter="songs", limit=int(limite)))
    itens = [item for item in resultados if isinstance(item, dict) and item.get("videoId")]
    return {"itens": [mapear_item(item, posicao) for posicao, item in enumerate(itens[: int(limite)])]}


def normalizar_nome(nome):
    return re.sub(r"\s+", " ", (nome or "").strip().lower())


def comando_foto_artista(entrada):
    nome = entrada.get("nome")
    if not isinstance(nome, str) or not nome.strip():
        raise FalhaYoutubeMusic(FORMATO_INESPERADO, "O nome do artista não foi informado.")
    cliente = YTMusic()
    resultados = executar_com_classificacao(lambda: cliente.search(nome.strip(), filter="artists", limit=LIMITE_BUSCA_PADRAO))
    procurado = normalizar_nome(nome)
    for item in resultados:
        if isinstance(item, dict) and normalizar_nome(item.get("artist")) == procurado:
            return {"urlFoto": maior_capa(item)}
    return {"urlFoto": None}


COMANDOS = {
    "validar": comando_validar,
    "historico": comando_historico,
    "buscar": comando_buscar,
    "foto_artista": comando_foto_artista,
}


def principal():
    if len(sys.argv) != 2 or sys.argv[1] not in COMANDOS:
        sys.stdout.write(json.dumps({"erro": "Use: ytmusic.py validar|historico|buscar|foto_artista"}))
        return FORMATO_INESPERADO
    try:
        resultado = COMANDOS[sys.argv[1]](ler_entrada())
    except FalhaYoutubeMusic as falha:
        sys.stdout.write(json.dumps({"erro": falha.mensagem}, ensure_ascii=False))
        return falha.codigo
    sys.stdout.write(json.dumps(resultado, ensure_ascii=False))
    return SUCESSO


if __name__ == "__main__":
    sys.exit(principal())
