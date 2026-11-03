import argparse
import asyncio
import json

import edge_tts

UNIDADES_POR_SEGUNDO = 10_000_000


async def sintetizar(texto: str, voz: str, caminho_audio: str, caminho_palavras: str) -> None:
    comunicacao = edge_tts.Communicate(texto, voz, boundary="WordBoundary")
    palavras = []

    with open(caminho_audio, "wb") as arquivo_audio:
        async for parte in comunicacao.stream():
            if parte["type"] == "audio":
                arquivo_audio.write(parte["data"])
            elif parte["type"] == "WordBoundary":
                palavras.append(
                    {
                        "inicio": round(parte["offset"] / UNIDADES_POR_SEGUNDO, 3),
                        "fim": round((parte["offset"] + parte["duration"]) / UNIDADES_POR_SEGUNDO, 3),
                        "texto": parte["text"],
                    }
                )

    with open(caminho_palavras, "w", encoding="utf-8") as arquivo_palavras:
        json.dump(palavras, arquivo_palavras, ensure_ascii=False)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--voz", required=True)
    parser.add_argument("--arquivo-texto", required=True)
    parser.add_argument("--audio", required=True)
    parser.add_argument("--palavras", required=True)
    argumentos = parser.parse_args()

    with open(argumentos.arquivo_texto, encoding="utf-8") as arquivo_texto:
        texto = arquivo_texto.read()

    asyncio.run(sintetizar(texto, argumentos.voz, argumentos.audio, argumentos.palavras))


if __name__ == "__main__":
    main()
