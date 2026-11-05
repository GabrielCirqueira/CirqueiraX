import argparse
import json
import os
import re
import subprocess
import tempfile
import wave

from piper import PiperVoice

DADOS_ESPEAK = os.environ.get("ESPEAK_DATA_DIR", "/usr/share/espeak-ng-data")
SILENCIO_ENTRE_FRASES = 0.25
PADRAO_FRASE = re.compile(r"[^.!?…]+(?:[.!?…]+[\"'”’»)\]]*|$)", re.S)
PADRAO_PALAVRA = re.compile(r"\S+")


def separar_frases(texto: str) -> list[str]:
    frases = []
    for paragrafo in re.split(r"\n\s*\n", texto):
        for trecho in PADRAO_FRASE.findall(paragrafo):
            frase = " ".join(trecho.split())
            if frase:
                frases.append(frase)
    return frases


def estimar_palavras(frase: str, inicio: float, duracao: float) -> list[dict]:
    palavras = PADRAO_PALAVRA.findall(frase)
    if not palavras or duracao <= 0:
        return []
    pesos = [len(palavra) + 1 for palavra in palavras]
    total = sum(pesos)
    resultado = []
    cursor = inicio
    for palavra, peso in zip(palavras, pesos):
        fim = cursor + duracao * peso / total
        resultado.append({"inicio": round(cursor, 3), "fim": round(fim, 3), "texto": palavra})
        cursor = fim
    return resultado


def sintetizar(modelo: str, texto: str, caminho_audio: str, caminho_palavras: str) -> None:
    voz = PiperVoice.load(modelo, espeak_data_dir=DADOS_ESPEAK)
    taxa = voz.config.sample_rate
    silencio = b"\x00\x00" * int(taxa * SILENCIO_ENTRE_FRASES)
    palavras = []
    cursor = 0.0

    with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as temporario:
        caminho_wav = temporario.name

    try:
        with wave.open(caminho_wav, "wb") as arquivo_wav:
            arquivo_wav.setnchannels(1)
            arquivo_wav.setsampwidth(2)
            arquivo_wav.setframerate(taxa)

            for frase in separar_frases(texto):
                audio = b"".join(parte.audio_int16_bytes for parte in voz.synthesize(frase))
                if not audio:
                    continue
                duracao = len(audio) / 2 / taxa
                palavras.extend(estimar_palavras(frase, cursor, duracao))
                arquivo_wav.writeframes(audio + silencio)
                cursor += duracao + SILENCIO_ENTRE_FRASES

        subprocess.run(
            ["ffmpeg", "-y", "-loglevel", "error", "-i", caminho_wav, "-ac", "1", "-codec:a", "libmp3lame", "-b:a", "64k", caminho_audio],
            check=True,
        )
    finally:
        if os.path.exists(caminho_wav):
            os.remove(caminho_wav)

    with open(caminho_palavras, "w", encoding="utf-8") as arquivo_palavras:
        json.dump(palavras, arquivo_palavras, ensure_ascii=False)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--modelo", required=True)
    parser.add_argument("--arquivo-texto", required=True)
    parser.add_argument("--audio", required=True)
    parser.add_argument("--palavras", required=True)
    argumentos = parser.parse_args()

    with open(argumentos.arquivo_texto, encoding="utf-8") as arquivo_texto:
        texto = arquivo_texto.read()

    sintetizar(argumentos.modelo, texto, argumentos.audio, argumentos.palavras)


if __name__ == "__main__":
    main()
