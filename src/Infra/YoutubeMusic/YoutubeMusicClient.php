<?php

declare(strict_types=1);

namespace App\Infra\YoutubeMusic;

use App\DataObject\YoutubeMusic\ContaValidadaYoutubeMusicDTO;
use App\DataObject\YoutubeMusic\CredenciaisYoutubeMusicDTO;
use App\DataObject\YoutubeMusic\ItemHistoricoYoutubeMusicDTO;
use App\DataObject\YoutubeMusic\ListaHistoricoYoutubeMusicDTO;
use App\DataObject\YoutubeMusic\ResultadoBuscaYoutubeMusicDTO;
use App\Exception\YoutubeMusic\YoutubeMusicException;
use App\Interface\YoutubeMusicInterface;
use JsonException;
use Symfony\Component\Process\Exception\ProcessTimedOutException;
use Symfony\Component\Process\Process;

final readonly class YoutubeMusicClient implements YoutubeMusicInterface
{
    private const float TIMEOUT_SEGUNDOS = 30.0;
    private const string CAMINHO_SCRIPT = '/bin/ytmusic.py';
    private const string INTERPRETADOR = 'python3';
    private const string COMANDO_VALIDAR = 'validar';
    private const string COMANDO_HISTORICO = 'historico';
    private const string COMANDO_BUSCAR = 'buscar';
    private const string COMANDO_FOTO_ARTISTA = 'foto_artista';
    private const int SAIDA_SUCESSO = 0;
    private const int SAIDA_CREDENCIAIS_INVALIDAS = 2;
    private const int SAIDA_SERVICO_INDISPONIVEL = 3;

    public function __construct(
        private string $projectDir,
    ) {
    }

    public function validarCredenciais(CredenciaisYoutubeMusicDTO $credenciais): ContaValidadaYoutubeMusicDTO
    {
        $resposta = $this->executar(self::COMANDO_VALIDAR, ['cabecalhos' => $credenciais->cabecalhos]);

        return new ContaValidadaYoutubeMusicDTO(
            $this->textoOuNulo($resposta['nomeConta'] ?? null),
            $this->textoOuNulo($resposta['canal'] ?? null),
        );
    }

    public function listarHistorico(CredenciaisYoutubeMusicDTO $credenciais): ListaHistoricoYoutubeMusicDTO
    {
        $resposta = $this->executar(self::COMANDO_HISTORICO, ['cabecalhos' => $credenciais->cabecalhos]);

        return new ListaHistoricoYoutubeMusicDTO($this->mapearItens($resposta));
    }

    public function buscarMusica(string $texto, int $limite = 5): ResultadoBuscaYoutubeMusicDTO
    {
        $resposta = $this->executar(self::COMANDO_BUSCAR, ['texto' => $texto, 'limite' => $limite]);

        return new ResultadoBuscaYoutubeMusicDTO($this->mapearItens($resposta));
    }

    public function buscarFotoArtista(string $nome): ?string
    {
        $resposta = $this->executar(self::COMANDO_FOTO_ARTISTA, ['nome' => $nome]);

        return $this->textoOuNulo($resposta['urlFoto'] ?? null);
    }

    /**
     * @param array<string, mixed> $entrada
     *
     * @return array<string, mixed>
     */
    private function executar(string $comando, array $entrada): array
    {
        $processo = new Process([self::INTERPRETADOR, $this->projectDir.self::CAMINHO_SCRIPT, $comando]);
        $processo->setTimeout(self::TIMEOUT_SEGUNDOS);
        $processo->setInput(json_encode($entrada, JSON_THROW_ON_ERROR));

        try {
            $processo->run();
        } catch (ProcessTimedOutException) {
            throw YoutubeMusicException::servicoIndisponivel();
        }

        $this->validarCodigoSaida($processo->getExitCode());

        return $this->decodificar($processo->getOutput());
    }

    private function validarCodigoSaida(?int $codigo): void
    {
        if (self::SAIDA_SUCESSO === $codigo) {
            return;
        }

        if (self::SAIDA_CREDENCIAIS_INVALIDAS === $codigo) {
            throw YoutubeMusicException::credenciaisInvalidas();
        }

        if (self::SAIDA_SERVICO_INDISPONIVEL === $codigo) {
            throw YoutubeMusicException::servicoIndisponivel();
        }

        throw YoutubeMusicException::respostaInesperada();
    }

    /**
     * @return array<string, mixed>
     */
    private function decodificar(string $saida): array
    {
        try {
            $dados = json_decode($saida, true, flags: JSON_THROW_ON_ERROR);
        } catch (JsonException) {
            throw YoutubeMusicException::respostaInesperada();
        }

        if (!is_array($dados)) {
            throw YoutubeMusicException::respostaInesperada();
        }

        return $dados;
    }

    /**
     * @param array<string, mixed> $resposta
     *
     * @return list<ItemHistoricoYoutubeMusicDTO>
     */
    private function mapearItens(array $resposta): array
    {
        $itensBrutos = $resposta['itens'] ?? null;
        if (!is_array($itensBrutos)) {
            throw YoutubeMusicException::respostaInesperada();
        }

        $itens = [];
        foreach ($itensBrutos as $itemBruto) {
            $item = is_array($itemBruto) ? $this->mapearItem($itemBruto) : null;
            if (null !== $item) {
                $itens[] = $item;
            }
        }

        return $itens;
    }

    /**
     * @param array<mixed> $item
     */
    private function mapearItem(array $item): ?ItemHistoricoYoutubeMusicDTO
    {
        $videoId = $this->textoOuNulo($item['videoId'] ?? null);
        if (null === $videoId) {
            return null;
        }

        return new ItemHistoricoYoutubeMusicDTO(
            videoId: $videoId,
            titulo: $this->textoOuNulo($item['titulo'] ?? null) ?? '',
            textoArtistas: $this->textoOuNulo($item['textoArtistas'] ?? null) ?? '',
            album: $this->textoOuNulo($item['album'] ?? null),
            urlCapa: $this->textoOuNulo($item['urlCapa'] ?? null),
            duracaoMs: is_int($item['duracaoMs'] ?? null) ? $item['duracaoMs'] : null,
            secao: $this->textoOuNulo($item['secao'] ?? null),
            posicao: is_int($item['posicao'] ?? null) ? $item['posicao'] : 0,
            tipoVideo: $this->textoOuNulo($item['tipoVideo'] ?? null),
        );
    }

    private function textoOuNulo(mixed $valor): ?string
    {
        if (!is_string($valor) || '' === trim($valor)) {
            return null;
        }

        return $valor;
    }
}
