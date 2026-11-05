<?php

declare(strict_types=1);

namespace App\Service\LivroAudio;

use App\Entity\LivroAudio;
use App\Entity\Usuario;
use App\Repository\EscutaLivroAudioDiaRepository;
use App\Repository\LivroAudioRepository;
use App\Repository\UsuarioRepository;
use DateTimeImmutable;
use DateTimeInterface;

final readonly class EstatisticasEscutaLivrosAudioService
{
    private const int SEGUNDOS_MAXIMOS_POR_REGISTRO = 120;
    private const int DIAS_GRAFICO = 14;
    private const int DIAS_SEQUENCIA = 366;
    private const int LIMITE_CONTINUAR = 3;

    public function __construct(
        private ConsultarLivrosAudioService $consultarLivrosAudio,
        private EscutaLivroAudioDiaRepository $escutaRepository,
        private LivroAudioRepository $livroAudioRepository,
        private UsuarioRepository $usuarioRepository,
    ) {}

    public function registrar(string $uuid, int $segundos, Usuario $usuario): void
    {
        $livro = $this->consultarLivrosAudio->obterDoUsuario($uuid, $usuario);
        $segundos = min(self::SEGUNDOS_MAXIMOS_POR_REGISTRO, max(0, $segundos));
        if (0 === $segundos) {
            return;
        }

        $this->escutaRepository->somar($livro, new DateTimeImmutable('today'), $segundos);
    }

    /**
     * @return array<string, mixed>
     */
    public function definirMeta(int $minutos, Usuario $usuario): array
    {
        $usuario->definirMetaEscutaMinutos($minutos);
        $this->usuarioRepository->salvar($usuario, true);

        return $this->resumo($usuario);
    }

    /**
     * @return array<string, mixed>
     */
    public function resumo(Usuario $usuario): array
    {
        $hoje = new DateTimeImmutable('today');
        $porDia = $this->escutaRepository->segundosPorDia($usuario, $hoje->modify(sprintf('-%d days', self::DIAS_GRAFICO - 1)));
        $metaSegundos = $usuario->getMetaEscutaMinutos() * 60;

        $dias = [];
        for ($indice = self::DIAS_GRAFICO - 1; $indice >= 0; --$indice) {
            $dia = $hoje->modify(sprintf('-%d days', $indice))->format('Y-m-d');
            $dias[] = ['dia' => $dia, 'segundos' => $porDia[$dia] ?? 0];
        }

        $semana = array_sum(array_map(static fn(array $dia): int => $dia['segundos'], array_slice($dias, -7)));

        return [
            'metaMinutos' => $usuario->getMetaEscutaMinutos(),
            'hojeSegundos' => $porDia[$hoje->format('Y-m-d')] ?? 0,
            'semanaSegundos' => $semana,
            'totalSegundos' => $this->escutaRepository->totalSegundos($usuario),
            'sequenciaDias' => $this->calcularSequencia($usuario, $metaSegundos, $hoje),
            'dias' => $dias,
            'continuar' => $this->listarParaContinuar($usuario),
        ];
    }

    private function calcularSequencia(Usuario $usuario, int $metaSegundos, DateTimeImmutable $hoje): int
    {
        $diasCumpridos = array_flip($this->escutaRepository->diasComEscuta(
            $usuario,
            $metaSegundos,
            $hoje->modify(sprintf('-%d days', self::DIAS_SEQUENCIA)),
        ));

        $dia = isset($diasCumpridos[$hoje->format('Y-m-d')]) ? $hoje : $hoje->modify('-1 day');
        $sequencia = 0;
        while (isset($diasCumpridos[$dia->format('Y-m-d')])) {
            ++$sequencia;
            $dia = $dia->modify('-1 day');
        }

        return $sequencia;
    }

    /**
     * @return list<array<string, mixed>>
     */
    private function listarParaContinuar(Usuario $usuario): array
    {
        $livros = array_values(array_filter(
            $this->livroAudioRepository->listarDoUsuario($usuario),
            static fn(LivroAudio $livro): bool => null !== $livro->ultimaEscutaEm() && $livro->temAudioParaOuvir(),
        ));

        usort($livros, static fn(LivroAudio $a, LivroAudio $b): int => $b->ultimaEscutaEm() <=> $a->ultimaEscutaEm());

        return array_map(static function (LivroAudio $livro): array {
            $totalPaginas = max(1, $livro->totalPaginas());

            return [
                'uuid' => $livro->uuidTexto(),
                'titulo' => $livro->titulo(),
                'paginaAtual' => $livro->paginaAtual(),
                'totalPaginas' => $livro->totalPaginas(),
                'progresso' => round(min(1, $livro->paginaAtual() / $totalPaginas), 4),
                'blocoAtual' => $livro->blocoAtual(),
                'ultimaEscutaEm' => $livro->ultimaEscutaEm()?->format(DateTimeInterface::ATOM),
                'status' => $livro->status()->value,
            ];
        }, array_slice($livros, 0, self::LIMITE_CONTINUAR));
    }
}
