<?php

declare(strict_types=1);

namespace App\Service\Musica\Capa;

use App\DataObject\CapaMusicaArquivoDTO;
use App\Exception\Musica\CapaMusicaException;
use App\Repository\MusicaCatalogoRepository;
use GuzzleHttp\ClientInterface;
use Throwable;

final readonly class ObterCapaMusicaService
{
    private const string PADRAO_HOST_PERMITIDO = '/^(yt3\.googleusercontent\.com|lh3\.googleusercontent\.com|yt3\.ggpht\.com|i\.ytimg\.com|www\.gstatic\.com|i\.scdn\.co|mosaic\.scdn\.co|image-cdn-[a-z]+\.spotifycdn\.com|cdn-images\.dzcdn\.net|e-cdns-images\.dzcdn\.net)$/';
    private const string ESQUEMA_PERMITIDO = 'https';
    private const string SUBDIRETORIO = '/var/cache/thumbnails/capas-musica';
    private const string PREFIXO_TIPO_IMAGEM = 'image/';
    private const string TIPO_PADRAO = 'image/jpeg';
    private const int TAMANHO_MAXIMO_BYTES = 5242880;
    private const int TIMEOUT_SEGUNDOS = 10;
    private const int STATUS_SUCESSO = 200;
    private const int PERMISSAO_DIRETORIO = 0775;

    public function __construct(
        private MusicaCatalogoRepository $musicaCatalogoRepository,
        private ClientInterface $httpClient,
        private string $projectDir,
    ) {
    }

    public function executar(string $url): CapaMusicaArquivoDTO
    {
        if (!$this->isUrlPermitida($url)) {
            throw CapaMusicaException::naoDisponivel();
        }

        $caminho = $this->projectDir.self::SUBDIRETORIO.'/'.hash('sha256', $url);
        if (is_file($caminho)) {
            return new CapaMusicaArquivoDTO($caminho, $this->tipoDoArquivo($caminho));
        }

        if (!$this->musicaCatalogoRepository->isUrlCapaConhecida($url)) {
            throw CapaMusicaException::naoDisponivel();
        }

        $this->baixar($url, $caminho);

        return new CapaMusicaArquivoDTO($caminho, $this->tipoDoArquivo($caminho));
    }

    private function isUrlPermitida(string $url): bool
    {
        $partes = parse_url($url);

        return is_array($partes)
            && self::ESQUEMA_PERMITIDO === ($partes['scheme'] ?? null)
            && 1 === preg_match(self::PADRAO_HOST_PERMITIDO, (string) ($partes['host'] ?? ''));
    }

    private function baixar(string $url, string $caminho): void
    {
        try {
            $resposta = $this->httpClient->request('GET', $url, ['timeout' => self::TIMEOUT_SEGUNDOS, 'http_errors' => false]);
        } catch (Throwable) {
            throw CapaMusicaException::naoDisponivel();
        }

        $conteudo = (string) $resposta->getBody();
        $tipo = $resposta->getHeaderLine('Content-Type');
        if (self::STATUS_SUCESSO !== $resposta->getStatusCode() || !str_starts_with($tipo, self::PREFIXO_TIPO_IMAGEM) || '' === $conteudo || strlen($conteudo) > self::TAMANHO_MAXIMO_BYTES) {
            throw CapaMusicaException::naoDisponivel();
        }

        $diretorio = dirname($caminho);
        if (!is_dir($diretorio)) {
            mkdir($diretorio, self::PERMISSAO_DIRETORIO, true);
        }

        $temporario = $caminho.'.'.bin2hex(random_bytes(4));
        file_put_contents($temporario, $conteudo);
        rename($temporario, $caminho);
    }

    private function tipoDoArquivo(string $caminho): string
    {
        $tipo = mime_content_type($caminho);

        return is_string($tipo) && str_starts_with($tipo, self::PREFIXO_TIPO_IMAGEM) ? $tipo : self::TIPO_PADRAO;
    }
}
