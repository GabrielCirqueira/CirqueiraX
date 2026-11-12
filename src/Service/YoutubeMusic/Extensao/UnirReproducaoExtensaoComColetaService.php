<?php

declare(strict_types=1);

namespace App\Service\YoutubeMusic\Extensao;

use App\Entity\ReproducaoYoutube;
use App\Entity\Usuario;
use App\Entity\VideoYoutube;
use App\Repository\ReproducaoYoutubeRepository;
use DateTimeImmutable;

final readonly class UnirReproducaoExtensaoComColetaService
{
    public const int JANELA_UNIAO_SEGUNDOS = 600;
    private const string FORMATO_SEGUNDOS_ATRAS = '-%d seconds';
    private const string FORMATO_SEGUNDOS_ADIANTE = '+%d seconds';

    public function __construct(
        private ReproducaoYoutubeRepository $reproducaoRepository,
    ) {
    }

    public function buscarEstimadaParaExtensao(Usuario $usuario, VideoYoutube $video, DateTimeImmutable $inicio): ?ReproducaoYoutube
    {
        $candidatas = $this->reproducaoRepository->listarEstimadasDoVideoNoIntervalo(
            $usuario,
            $video,
            $inicio->modify(sprintf(self::FORMATO_SEGUNDOS_ATRAS, self::JANELA_UNIAO_SEGUNDOS)),
            $inicio->modify(sprintf(self::FORMATO_SEGUNDOS_ADIANTE, self::JANELA_UNIAO_SEGUNDOS)),
        );

        return $this->maisProxima($candidatas, $inicio);
    }

    /**
     * @param list<ReproducaoYoutube> $detectadasPelaColeta
     *
     * @return list<ReproducaoYoutube>
     */
    public function descartarJaRegistradasPelaExtensao(Usuario $usuario, array $detectadasPelaColeta): array
    {
        if ([] === $detectadasPelaColeta) {
            return [];
        }

        $momentos = array_map(static fn (ReproducaoYoutube $reproducao): int => $reproducao->tocadaEm()->getTimestamp(), $detectadasPelaColeta);
        $candidatas = $this->agruparPorVideo($this->reproducaoRepository->listarDaExtensaoSemColetaNoIntervalo(
            $usuario,
            array_map(static fn (ReproducaoYoutube $reproducao): string => $reproducao->video()->videoId(), $detectadasPelaColeta),
            new DateTimeImmutable('@'.(min($momentos) - self::JANELA_UNIAO_SEGUNDOS)),
            new DateTimeImmutable('@'.(max($momentos) + self::JANELA_UNIAO_SEGUNDOS)),
        ));

        $restantes = [];
        foreach ($detectadasPelaColeta as $detectada) {
            $videoId = $detectada->video()->videoId();
            $daExtensao = $this->maisProxima(array_values($candidatas[$videoId] ?? []), $detectada->tocadaEm());
            if (null === $daExtensao) {
                $restantes[] = $detectada;

                continue;
            }

            unset($candidatas[$videoId][spl_object_id($daExtensao)]);
            $this->reproducaoRepository->salvar($daExtensao->marcarVistaPeloColetor(), flush: false);
        }

        return $restantes;
    }

    /**
     * @param list<ReproducaoYoutube> $reproducoes
     *
     * @return array<string, array<int, ReproducaoYoutube>>
     */
    private function agruparPorVideo(array $reproducoes): array
    {
        $agrupadas = [];
        foreach ($reproducoes as $reproducao) {
            $agrupadas[$reproducao->video()->videoId()][spl_object_id($reproducao)] = $reproducao;
        }

        return $agrupadas;
    }

    /**
     * @param list<ReproducaoYoutube> $candidatas
     */
    private function maisProxima(array $candidatas, DateTimeImmutable $momento): ?ReproducaoYoutube
    {
        $escolhida = null;
        $menorDistancia = self::JANELA_UNIAO_SEGUNDOS + 1;
        foreach ($candidatas as $candidata) {
            $distancia = abs($candidata->tocadaEm()->getTimestamp() - $momento->getTimestamp());
            if ($distancia < $menorDistancia) {
                $escolhida = $candidata;
                $menorDistancia = $distancia;
            }
        }

        return $escolhida;
    }
}
