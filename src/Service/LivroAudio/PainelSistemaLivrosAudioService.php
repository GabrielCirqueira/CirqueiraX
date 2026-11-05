<?php

declare(strict_types=1);

namespace App\Service\LivroAudio;

use App\Entity\Usuario;
use App\Enum\VozNarracao;
use App\Repository\LivroAudioBlocoRepository;
use App\Repository\LivroAudioBlocoVozRepository;
use App\Repository\LivroAudioRepository;
use FilesystemIterator;
use RecursiveDirectoryIterator;
use RecursiveIteratorIterator;
use Throwable;

final readonly class PainelSistemaLivrosAudioService
{
    public const int BYTES_ATENCAO = 5 * 1024 * 1024 * 1024;
    public const int BYTES_CRITICO = 1024 * 1024 * 1024;
    private const float FRACAO_ATENCAO = 0.10;
    private const int BYTES_PARTE_PADRAO = 1_800_000;

    public function __construct(
        private LivroAudioRepository $livroAudioRepository,
        private LivroAudioBlocoRepository $livroAudioBlocoRepository,
        private LivroAudioBlocoVozRepository $livroAudioBlocoVozRepository,
        private FilaGeracaoLivrosAudioService $filaGeracao,
        private string $diretorioBaseLivros,
    ) {}

    /**
     * @return array<string, mixed>
     */
    public function obter(Usuario $usuario): array
    {
        $livros = $this->livroAudioRepository->resumoArmazenamento();
        $principais = $this->livroAudioBlocoRepository->resumoAudiosPrincipais();
        $vozes = array_map(static fn(array $voz): array => $voz + ['nome' => VozNarracao::nomeDe($voz['voz'])], $this->livroAudioBlocoVozRepository->resumoPorVoz());
        $bytesVozes = array_sum(array_column($vozes, 'bytes'));
        $fila = $this->filaGeracao->resumo($usuario);
        $bytesPorParte = $this->bytesPorParte();

        return [
            'disco' => $this->disco($fila['partesNaFila'] * $bytesPorParte),
            'memoria' => $this->memoria(),
            'livros' => [
                'total' => $livros['livros'],
                'porStatus' => $livros['porStatus'],
                'pdfs' => $livros['pdfs'],
                'bytesPdfs' => $livros['bytesPdfs'],
            ],
            'audios' => [
                'partes' => $principais['partes'],
                'partesProntas' => $principais['prontas'],
                'bytes' => $principais['bytes'],
                'segundos' => $principais['segundos'],
                'bytesPorParte' => $bytesPorParte,
            ],
            'vozesExtras' => [
                'partes' => array_sum(array_column($vozes, 'partes')),
                'bytes' => $bytesVozes,
                'porVoz' => $vozes,
            ],
            'bytesNoBanco' => $livros['bytesPdfs'] + $principais['bytes'] + $bytesVozes,
            'bytesNaPasta' => $this->tamanhoPasta($this->diretorioBaseLivros),
            'fila' => [
                'partesNaFila' => $fila['partesNaFila'],
                'segundosRestantes' => $fila['segundosRestantes'],
                'segundosPorParte' => $fila['segundosPorParte'],
                'livros' => count($fila['livros']),
            ],
        ];
    }

    public function bytesPorParte(): int
    {
        return (int) round($this->livroAudioBlocoRepository->mediaBytesPorParte() ?? self::BYTES_PARTE_PADRAO);
    }

    /**
     * @return array{livreBytes: int, totalBytes: int, usadoBytes: int, nivel: string, bytesParaFila: int, mensagem: string|null}
     */
    public function disco(int $bytesParaFila = 0): array
    {
        $caminho = is_dir($this->diretorioBaseLivros) ? $this->diretorioBaseLivros : '/';
        $livre = (int) (@disk_free_space($caminho) ?: 0);
        $total = (int) (@disk_total_space($caminho) ?: 0);
        $livreAposFila = $livre - $bytesParaFila;

        $nivel = match (true) {
            $livreAposFila < self::BYTES_CRITICO => 'critico',
            $livreAposFila < self::BYTES_ATENCAO || ($total > 0 && $livreAposFila / $total < self::FRACAO_ATENCAO) => 'atencao',
            default => 'ok',
        };

        $mensagem = match ($nivel) {
            'critico' => $bytesParaFila > 0 && $livre >= self::BYTES_CRITICO
                ? 'O disco não comporta tudo o que está na fila. Apague livros ou vozes extras antes que a geração pare.'
                : 'Disco quase cheio. A geração de áudio pode falhar.',
            'atencao' => $bytesParaFila > 0
                ? 'O disco vai ficar apertado depois que a fila terminar. Vozes extras dobram o tamanho de cada livro.'
                : 'O disco está ficando cheio. Vozes extras dobram o tamanho de cada livro.',
            default => null,
        };

        return [
            'livreBytes' => $livre,
            'totalBytes' => $total,
            'usadoBytes' => max(0, $total - $livre),
            'nivel' => $nivel,
            'bytesParaFila' => $bytesParaFila,
            'mensagem' => $mensagem,
        ];
    }

    /**
     * @return array{containerUsadoBytes: int|null, containerLimiteBytes: int|null, servidorTotalBytes: int|null, servidorDisponivelBytes: int|null, workerBytes: int|null, workerAtivo: bool}
     */
    private function memoria(): array
    {
        $meminfo = $this->lerMeminfo();
        $limite = $this->lerInteiro('/sys/fs/cgroup/memory.max');
        $workerBytes = $this->memoriaWorker();

        return [
            'containerUsadoBytes' => $this->lerInteiro('/sys/fs/cgroup/memory.current'),
            'containerLimiteBytes' => null !== $limite && $limite < PHP_INT_MAX / 2 ? $limite : null,
            'servidorTotalBytes' => $meminfo['MemTotal'] ?? null,
            'servidorDisponivelBytes' => $meminfo['MemAvailable'] ?? null,
            'workerBytes' => $workerBytes,
            'workerAtivo' => null !== $workerBytes,
        ];
    }

    private function memoriaWorker(): ?int
    {
        $total = null;
        foreach (glob('/proc/[0-9]*/cmdline') ?: [] as $arquivo) {
            $comando = @file_get_contents($arquivo);
            if (false === $comando || !str_contains($comando, 'messenger:consume') || !str_contains($comando, 'livro_audio')) {
                continue;
            }

            $status = @file_get_contents(dirname($arquivo) . '/status');
            if (false !== $status && preg_match('/^VmRSS:\s+(\d+)\s+kB/m', $status, $encontrado)) {
                $total = ($total ?? 0) + (int) $encontrado[1] * 1024;
            }
        }

        return $total;
    }

    /**
     * @return array<string, int>
     */
    private function lerMeminfo(): array
    {
        $conteudo = @file_get_contents('/proc/meminfo');
        if (false === $conteudo) {
            return [];
        }

        preg_match_all('/^(\w+):\s+(\d+)\s+kB/m', $conteudo, $linhas, PREG_SET_ORDER);
        $valores = [];
        foreach ($linhas as $linha) {
            $valores[$linha[1]] = (int) $linha[2] * 1024;
        }

        return $valores;
    }

    private function lerInteiro(string $caminho): ?int
    {
        $conteudo = @file_get_contents($caminho);
        if (false === $conteudo || !is_numeric(trim($conteudo))) {
            return null;
        }

        return (int) trim($conteudo);
    }

    private function tamanhoPasta(string $diretorio): ?int
    {
        if (!is_dir($diretorio)) {
            return null;
        }

        try {
            $total = 0;
            $iterador = new RecursiveIteratorIterator(new RecursiveDirectoryIterator($diretorio, FilesystemIterator::SKIP_DOTS));
            foreach ($iterador as $arquivo) {
                if ($arquivo->isFile()) {
                    $total += $arquivo->getSize();
                }
            }

            return $total;
        } catch (Throwable) {
            return null;
        }
    }
}
