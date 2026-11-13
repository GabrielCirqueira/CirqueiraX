<?php

declare(strict_types=1);

namespace App\Controller\Sistema;

use App\Controller\Common\DefaultController;
use App\Service\LivroAudio\PainelSistemaLivrosAudioService;
use DateTime;
use DateTimeInterface;
use Doctrine\DBAL\Connection;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;

final class HealthController extends DefaultController
{
    public function __construct(
        private readonly Connection $connection,
    ) {}

    #[Route('/api/v1/health', name: 'api_health', methods: ['GET'])]
    public function health(): Response
    {
        $databaseStatus = $this->checkDatabase();
        $diskStatus = $this->checkDisk('/');
        $caminhoLivros = sprintf('%s/var/livros', $this->getParameter('kernel.project_dir'));
        $diskLivrosStatus = $this->checkDisk($caminhoLivros);
        $isHealthy = 'ok' === $databaseStatus['status'] && 'ok' === $diskStatus['status'] && 'ok' === $diskLivrosStatus['status'];

        return $this->success([
            'status' => $isHealthy ? 'ok' : 'unhealthy',
            'timestamp' => (new DateTime())->format(DateTimeInterface::ATOM),
        ], $isHealthy ? Response::HTTP_OK : Response::HTTP_SERVICE_UNAVAILABLE);
    }

    /**
     * @return array{status: string, message?: string}
     */
    private function checkDatabase(): array
    {
        try {
            $this->connection->executeQuery('SELECT 1');

            return ['status' => 'ok'];
        } catch (\Exception) {
            return [
                'status' => 'error',
                'message' => 'Banco de dados inacessível.',
            ];
        }
    }

    /**
     * @return array{status: string, free_mb: float, threshold_mb: int, alerta: bool, alerta_mb: int}
     */
    private function checkDisk(string $caminho = '/'): array
    {
        $diretorioAlvo = is_dir($caminho) ? $caminho : '/';
        $freeSpace = disk_free_space($diretorioAlvo) ?: 0;
        $threshold = 100 * 1024 * 1024;

        return [
            'status' => $freeSpace > $threshold ? 'ok' : 'critical',
            'free_mb' => round($freeSpace / 1024 / 1024, 2),
            'threshold_mb' => 100,
            'alerta' => $freeSpace < PainelSistemaLivrosAudioService::BYTES_ATENCAO,
            'alerta_mb' => (int) (PainelSistemaLivrosAudioService::BYTES_ATENCAO / 1024 / 1024),
        ];
    }
}
