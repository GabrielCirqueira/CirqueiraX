<?php

declare(strict_types=1);

namespace App\Service\YoutubeMusic;

use App\Entity\Usuario;
use App\Repository\ReproducaoYoutubeRepository;
use DateTimeImmutable;
use DateTimeZone;

final readonly class CalcularFatorFimDeSessaoYoutubeService
{
    public const int LIMITE_SESSAO_SEGUNDOS = 1800;
    private const float FATOR_PADRAO = 0.75;
    private const float FATOR_MINIMO = 0.3;
    private const float FATOR_MAXIMO = 1.0;
    private const int MINIMO_AMOSTRAS = 50;
    private const int DURACAO_MINIMA_MS = 30000;
    private const string ENCERRADAS_HA = '-2 hours';
    private const string FUSO_BANCO = 'UTC';

    public function __construct(
        private ReproducaoYoutubeRepository $reproducaoRepository,
    ) {
    }

    public function executar(Usuario $usuario): float
    {
        $encerradasAntesDe = new DateTimeImmutable(self::ENCERRADAS_HA, new DateTimeZone(self::FUSO_BANCO));
        $medicao = $this->reproducaoRepository->medirOuvidoNoFimDeSessao($usuario, self::LIMITE_SESSAO_SEGUNDOS, self::DURACAO_MINIMA_MS, $encerradasAntesDe);

        if ($medicao['total'] < self::MINIMO_AMOSTRAS || null === $medicao['fracaoMedia']) {
            return self::FATOR_PADRAO;
        }

        return max(self::FATOR_MINIMO, min(self::FATOR_MAXIMO, $medicao['fracaoMedia']));
    }
}
