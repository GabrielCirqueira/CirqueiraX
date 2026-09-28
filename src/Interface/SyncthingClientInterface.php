<?php

declare(strict_types=1);

namespace App\Interface;

interface SyncthingClientInterface
{
    /**
     * @return array{
     *     online: bool,
     *     versao: ?string,
     *     pastas: list<array{
     *         id: string,
     *         label: string,
     *         caminho: string,
     *         pausada: bool,
     *         estado: string,
     *         tamanhoBytes: int,
     *         tamanhoFormatado: string,
     *         arquivosTotal: int,
     *         precisaBytes: int,
     *         emSincronizacao: bool
     *     }>
     * }
     */
    public function obterStatusPastas(): array;

    public function sincronizarPasta(string $folderId): bool;

    public function isOnline(): bool;
}
