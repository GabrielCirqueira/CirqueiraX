<?php

declare(strict_types=1);

namespace App\Service\YoutubeMusic;

use App\Exception\YoutubeMusic\YoutubeMusicException;
use SensitiveParameter;

final readonly class InterpretadorCabecalhosNavegadorService
{
    private const string CABECALHO_COOKIE = 'cookie';
    private const string CABECALHO_CONTA = 'x-goog-authuser';
    private const string CONTA_PADRAO = '0';
    private const string COOKIE_ESSENCIAL = '__Secure-3PAPISID=';
    private const string MARCA_TEXTO_CORTADO = '…';
    private const array CABECALHOS_ACEITOS = [
        self::CABECALHO_COOKIE,
        self::CABECALHO_CONTA,
        'x-goog-visitor-id',
        'user-agent',
        'accept-language',
    ];
    private const string PREFIXO_CURL = 'curl ';
    private const string PADRAO_CURL_CABECALHO = "/-H\\s+(['\"])(.*?)\\1/s";
    private const string PADRAO_CURL_COOKIE = "/(?:-b|--cookie)\\s+(['\"])(.*?)\\1/s";

    public function executar(#[SensitiveParameter] string $textoColado): string
    {
        $cabecalhos = $this->lerCabecalhos(trim($textoColado));
        $cookie = $cabecalhos[self::CABECALHO_COOKIE] ?? '';

        if ('' === $cookie) {
            throw YoutubeMusicException::cabecalhosSemCookie();
        }

        if (str_contains($cookie, self::MARCA_TEXTO_CORTADO)) {
            throw YoutubeMusicException::cookieCortado();
        }

        if (!str_contains($cookie, self::COOKIE_ESSENCIAL)) {
            throw YoutubeMusicException::cookieSemSessaoLogada();
        }

        $cabecalhos[self::CABECALHO_CONTA] ??= self::CONTA_PADRAO;

        return $this->montarTexto($cabecalhos);
    }

    /**
     * @return array<string, string>
     */
    private function lerCabecalhos(string $texto): array
    {
        if (str_starts_with($texto, self::PREFIXO_CURL)) {
            return $this->filtrarAceitos($this->lerCurl($texto));
        }

        return $this->filtrarAceitos($this->lerLinhas($texto));
    }

    /**
     * @return array<string, string>
     */
    private function lerCurl(string $texto): array
    {
        $cabecalhos = [];
        preg_match_all(self::PADRAO_CURL_CABECALHO, $texto, $ocorrencias);
        foreach ($ocorrencias[2] as $linha) {
            $cabecalhos = [...$cabecalhos, ...$this->lerLinhas($linha)];
        }

        if (1 === preg_match(self::PADRAO_CURL_COOKIE, $texto, $cookie)) {
            $cabecalhos[self::CABECALHO_COOKIE] = trim($cookie[2]);
        }

        return $cabecalhos;
    }

    /**
     * @return array<string, string>
     */
    private function lerLinhas(string $texto): array
    {
        $cabecalhos = [];
        $nomePendente = null;

        foreach (preg_split('/\R/', $texto) ?: [] as $linhaBruta) {
            $linha = trim($linhaBruta);
            if ('' === $linha || str_starts_with($linha, ':')) {
                continue;
            }

            if (null !== $nomePendente) {
                $cabecalhos[$nomePendente] = $linha;
                $nomePendente = null;
                continue;
            }

            $posicao = strpos($linha, ':');
            if (false === $posicao) {
                $nomePendente = mb_strtolower($linha);
                continue;
            }

            $nome = mb_strtolower(trim(substr($linha, 0, $posicao)));
            $valor = trim(substr($linha, $posicao + 1));
            if ('' === $valor) {
                $nomePendente = $nome;
                continue;
            }

            $cabecalhos[$nome] = $valor;
        }

        return $cabecalhos;
    }

    /**
     * @param array<string, string> $cabecalhos
     *
     * @return array<string, string>
     */
    private function filtrarAceitos(array $cabecalhos): array
    {
        return array_intersect_key($cabecalhos, array_flip(self::CABECALHOS_ACEITOS));
    }

    /**
     * @param array<string, string> $cabecalhos
     */
    private function montarTexto(array $cabecalhos): string
    {
        $linhas = [];
        foreach ($cabecalhos as $nome => $valor) {
            $linhas[] = sprintf('%s: %s', $nome, $valor);
        }

        return implode("\n", $linhas);
    }
}
