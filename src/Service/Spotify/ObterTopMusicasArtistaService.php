<?php

declare(strict_types=1);

namespace App\Service\Spotify;

use App\DataObject\Spotify\ItemTopMusicaArtistaDTO;
use App\Entity\ImagemSpotify;
use App\Entity\Usuario;
use App\Repository\ReproducaoSpotifyRepository;
use DateTimeImmutable;
use DateTimeZone;

final readonly class ObterTopMusicasArtistaService
{
    public const int LIMITE_PADRAO = 5;
    private const int LIMITE_MAXIMO = 500;

    public function __construct(
        private ReproducaoSpotifyRepository $reproducaoRepository,
        private EnriquecerImagensSpotifyService $enriquecerImagensService,
        private ObterResumoIntervaloPersonalizadoService $obterResumoIntervaloService,
    ) {
    }

    /**
     * @return array<int, ItemTopMusicaArtistaDTO>
     */
    public function executar(
        Usuario $usuario,
        string $nomeArtista,
        ?string $album = null,
        ?string $tipo = null,
        ?int $dias = null,
        ?int $ano = null,
        ?int $mes = null,
        ?string $inicio = null,
        ?string $fim = null,
        int $limite = self::LIMITE_PADRAO,
    ): array {
        $tipoFinal = $tipo ?? (null !== $ano && null !== $mes ? 'mes' : 'todos');
        [$inicioUtc, $fimUtc] = $this->resolverIntervaloUtc($tipoFinal, $dias, $ano, $mes, $inicio, $fim);

        $linhas = $this->reproducaoRepository->obterMusicasMaisOuvidasDoArtista(
            usuario: $usuario,
            nomeArtista: $nomeArtista,
            inicioUtc: $inicioUtc,
            fimUtc: $fimUtc,
            album: null !== $album && '' !== trim($album) ? trim($album) : null,
            limite: max(1, min(self::LIMITE_MAXIMO, $limite)),
        );

        if (empty($linhas)) {
            return [];
        }

        $faixasParaEnriquecer = [];
        foreach ($linhas as $linha) {
            $faixasParaEnriquecer[] = [
                'codigo' => $linha['codigoFaixa'],
                'nome' => $linha['nomeFaixa'],
                'artista' => $nomeArtista,
            ];
        }

        $mapaImagens = $this->enriquecerImagensService->enriquecerEAgendar(
            usuario: $usuario,
            faixas: $faixasParaEnriquecer,
            artistas: [],
            prioridade: 2,
        );

        $resultado = [];
        foreach ($linhas as $linha) {
            $chave = ImagemSpotify::gerarChaveFaixa(
                $linha['codigoFaixa'],
                $nomeArtista,
                $linha['nomeFaixa'],
            );

            $imagemUrl = $mapaImagens->obterImagem($chave);
            $urlSpotifyPadrao = ImagemSpotify::gerarUrlSpotifyFaixa(
                $linha['codigoFaixa'],
                $nomeArtista,
                $linha['nomeFaixa'],
            );
            $urlSpotify = $mapaImagens->obterUrlSpotify($chave, $urlSpotifyPadrao);

            $resultado[] = new ItemTopMusicaArtistaDTO(
                nomeFaixa: $linha['nomeFaixa'],
                codigoFaixa: $linha['codigoFaixa'],
                album: $linha['album'],
                totalStreams: $linha['streams'],
                totalMinutos: $linha['totalMinutos'],
                urlSpotify: $urlSpotify,
                imagemUrl: $imagemUrl,
            );
        }

        return $resultado;
    }

    /**
     * @return array{0: ?DateTimeImmutable, 1: ?DateTimeImmutable}
     */
    private function resolverIntervaloUtc(string $tipo, ?int $dias, ?int $ano, ?int $mes, ?string $inicio, ?string $fim): array
    {
        if ('todos' === $tipo) {
            return [null, null];
        }

        [$inicioLocal, $fimLocal] = $this->obterResumoIntervaloService->resolverIntervalo($tipo, $dias, $ano, $mes, $inicio, $fim);
        $fusoUtc = new DateTimeZone('UTC');

        return [$inicioLocal->setTimezone($fusoUtc), $fimLocal->setTimezone($fusoUtc)];
    }
}
