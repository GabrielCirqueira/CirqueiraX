<?php

declare(strict_types=1);

namespace App\Service\GoogleFotos;

use App\Entity\MediaItem;
use App\Entity\RegistroEnvioGoogleFotos;
use App\Enum\OrigemEnvioGoogleFotos;
use App\Repository\RegistroEnvioGoogleFotosRepository;
use Throwable;

final readonly class RegistrarEnvioGoogleFotosService
{
    public function __construct(
        private RegistroEnvioGoogleFotosRepository $registroRepository,
    ) {}

    public function iniciar(MediaItem $mediaItem, bool $forcado, bool $reenvioManual): RegistroEnvioGoogleFotos
    {
        $tentativa = $this->registroRepository->contarTentativasDaMidia($mediaItem->uuidTexto()) + 1;
        $registro = new RegistroEnvioGoogleFotos(
            $mediaItem,
            OrigemEnvioGoogleFotos::resolver($forcado, $reenvioManual, $tentativa),
            $tentativa,
        );
        $this->registroRepository->salvar($registro);

        return $registro;
    }

    public function finalizar(RegistroEnvioGoogleFotos $registro): void
    {
        $this->registroRepository->salvar($registro);
    }

    public function registrarFalha(RegistroEnvioGoogleFotos $registro, Throwable $erro): void
    {
        $registro->registrarFalha($erro->getMessage());
        $this->registroRepository->salvar($registro);
    }
}
