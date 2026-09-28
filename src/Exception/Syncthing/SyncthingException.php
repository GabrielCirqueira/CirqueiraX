<?php

declare(strict_types=1);

namespace App\Exception\Syncthing;

final class SyncthingException extends \RuntimeException
{
    public static function credenciaisNaoConfiguradas(): self
    {
        return new self('As credenciais do Syncthing (SYNCTHING_API_URL / SYNCTHING_API_KEY) não estão configuradas.');
    }

    public static function falhaAoDispararSincronizacao(string $folderId, string $motivo, ?\Throwable $anterior = null): self
    {
        return new self(sprintf('Falha ao sincronizar pasta [%s] no Syncthing: %s', $folderId, $motivo), 0, $anterior);
    }
}
