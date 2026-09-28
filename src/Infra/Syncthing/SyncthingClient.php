<?php

declare(strict_types=1);

namespace App\Infra\Syncthing;

use App\Exception\Syncthing\SyncthingException;
use App\Interface\SyncthingClientInterface;
use App\Service\Dashboard\DashboardService;
use GuzzleHttp\ClientInterface;
use Psr\Log\LoggerInterface;
use Psr\Log\NullLogger;

final readonly class SyncthingClient implements SyncthingClientInterface
{
    public function __construct(
        private ClientInterface $client,
        private string $apiUrl = 'http://localhost:8384',
        private string $apiKey = '',
        private LoggerInterface $logger = new NullLogger(),
    ) {}

    public function isOnline(): bool
    {
        if ('' === trim($this->apiUrl)) {
            return false;
        }

        try {
            $response = $this->client->request('GET', $this->resolverUrl('/rest/system/ping'), [
                'headers' => $this->headers(),
                'timeout' => 2.0,
                'connect_timeout' => 2.0,
            ]);

            return 200 === $response->getStatusCode();
        } catch (\Throwable) {
            return false;
        }
    }

    public function obterStatusPastas(): array
    {
        if ('' === trim($this->apiUrl) || '' === trim($this->apiKey)) {
            return [
                'online' => false,
                'versao' => null,
                'pastas' => [],
            ];
        }

        try {
            // Obter status do sistema
            $statusResp = $this->client->request('GET', $this->resolverUrl('/rest/system/status'), [
                'headers' => $this->headers(),
                'timeout' => 3.0,
            ]);
            /** @var array<string, mixed> $statusData */
            $statusData = json_decode((string) $statusResp->getBody(), true) ?? [];
            $versao = isset($statusData['version']) ? (string) $statusData['version'] : null;

            // Obter configuração de pastas
            $configResp = $this->client->request('GET', $this->resolverUrl('/rest/config/folders'), [
                'headers' => $this->headers(),
                'timeout' => 3.0,
            ]);
            /** @var list<array<string, mixed>> $foldersConfig */
            $foldersConfig = json_decode((string) $configResp->getBody(), true) ?? [];

            $pastas = [];
            foreach ($foldersConfig as $folder) {
                $folderId = (string) ($folder['id'] ?? '');
                if ('' === $folderId) {
                    continue;
                }

                $estado = 'idle';
                $globalBytes = 0;
                $globalFiles = 0;
                $needBytes = 0;

                try {
                    $dbStatusResp = $this->client->request('GET', $this->resolverUrl('/rest/db/status'), [
                        'headers' => $this->headers(),
                        'query' => ['folder' => $folderId],
                        'timeout' => 3.0,
                    ]);
                    /** @var array<string, mixed> $dbStatus */
                    $dbStatus = json_decode((string) $dbStatusResp->getBody(), true) ?? [];
                    $estado = (string) ($dbStatus['state'] ?? 'idle');
                    $globalBytes = (int) ($dbStatus['globalBytes'] ?? 0);
                    $globalFiles = (int) ($dbStatus['globalFiles'] ?? 0);
                    $needBytes = (int) ($dbStatus['needBytes'] ?? 0);
                } catch (\Throwable $e) {
                    $this->logger->warning('Falha ao obter status db da pasta Syncthing', ['folder' => $folderId, 'error' => $e->getMessage()]);
                }

                $pausada = (bool) ($folder['paused'] ?? false);
                $pastas[] = [
                    'id' => $folderId,
                    'label' => (string) ($folder['label'] ?? $folderId),
                    'caminho' => (string) ($folder['path'] ?? ''),
                    'pausada' => $pausada,
                    'estado' => $pausada ? 'paused' : $estado,
                    'tamanhoBytes' => $globalBytes,
                    'tamanhoFormatado' => DashboardService::formatarBytes($globalBytes),
                    'arquivosTotal' => $globalFiles,
                    'precisaBytes' => $needBytes,
                    'emSincronizacao' => 'syncing' === $estado || 'scanning' === $estado,
                ];
            }

            return [
                'online' => true,
                'versao' => $versao,
                'pastas' => $pastas,
            ];
        } catch (\Throwable $e) {
            $this->logger->warning('Falha ao consultar API do Syncthing', ['error' => $e->getMessage()]);

            return [
                'online' => false,
                'versao' => null,
                'pastas' => [],
            ];
        }
    }

    public function sincronizarPasta(string $folderId): bool
    {
        if ('' === trim($this->apiUrl) || '' === trim($this->apiKey)) {
            throw SyncthingException::credenciaisNaoConfiguradas();
        }

        try {
            $response = $this->client->request('POST', $this->resolverUrl('/rest/db/scan'), [
                'headers' => $this->headers(),
                'query' => ['folder' => $folderId],
                'timeout' => 5.0,
            ]);

            return 200 === $response->getStatusCode() || 204 === $response->getStatusCode();
        } catch (\Throwable $e) {
            $this->logger->error('Erro ao disparar sincronização Syncthing', ['folder' => $folderId, 'error' => $e->getMessage()]);
            throw SyncthingException::falhaAoDispararSincronizacao($folderId, $e->getMessage(), $e);
        }
    }

    /**
     * @return array<string, string>
     */
    private function headers(): array
    {
        $headers = [
            'Accept' => 'application/json',
        ];

        if ('' !== trim($this->apiKey)) {
            $headers['X-API-Key'] = $this->apiKey;
        }

        return $headers;
    }

    private function resolverUrl(string $path): string
    {
        return rtrim($this->apiUrl, '/') . '/' . ltrim($path, '/');
    }
}
