<?php

declare(strict_types=1);

namespace App\Service\Musica\Analise;

use App\DataObject\Spotify\Analise\PeriodoAnaliseSpotifyDTO;

final readonly class ResolverPeriodoAnaliseMusicaService
{
    private const string TIPO_TODOS = 'todos';
    private const string TIPO_MES = 'mes';

    public function __construct(
        private ObterResumoIntervaloPersonalizadoService $obterResumoIntervaloService,
    ) {}

    public function executar(?string $tipo, ?int $dias, ?int $ano, ?int $mes, ?string $inicio, ?string $fim): PeriodoAnaliseSpotifyDTO
    {
        $tipoFinal = $tipo ?? (null !== $ano && null !== $mes ? self::TIPO_MES : self::TIPO_TODOS);
        if (self::TIPO_TODOS === $tipoFinal) {
            return PeriodoAnaliseSpotifyDTO::todos();
        }

        [$inicioLocal, $fimLocal, , , $rotulo] = $this->obterResumoIntervaloService->resolverIntervalo($tipoFinal, $dias, $ano, $mes, $inicio, $fim);

        return PeriodoAnaliseSpotifyDTO::entre($inicioLocal, $fimLocal, $rotulo);
    }
}
