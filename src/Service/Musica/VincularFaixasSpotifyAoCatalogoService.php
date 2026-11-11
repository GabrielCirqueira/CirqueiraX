<?php

declare(strict_types=1);

namespace App\Service\Musica;

use App\Entity\Usuario;
use App\Entity\VinculoMusicaSpotify;
use App\Enum\TipoImagemSpotify;
use App\Repository\ArtistaFaixaSpotifyRepository;
use App\Repository\ImagemSpotifyRepository;
use App\Repository\MusicaCatalogoRepository;
use App\Repository\ReproducaoSpotifyRepository;
use App\Repository\UsuarioRepository;
use App\Repository\VinculoMusicaSpotifyRepository;
use DateTimeImmutable;

final readonly class VincularFaixasSpotifyAoCatalogoService
{
    public const int TAMANHO_LOTE = 200;
    private const string SEPARADOR_IDENTIDADE = '|';

    public function __construct(
        private ReproducaoSpotifyRepository $reproducaoRepository,
        private ArtistaFaixaSpotifyRepository $artistaFaixaRepository,
        private ImagemSpotifyRepository $imagemRepository,
        private VinculoMusicaSpotifyRepository $vinculoRepository,
        private MusicaCatalogoRepository $musicaRepository,
        private UsuarioRepository $usuarioRepository,
        private ObterMusicaCatalogoService $obterMusica,
        private NormalizarTextoMusicaService $normalizador,
    ) {
    }

    /**
     * @param callable(int, int): void|null $aoConcluirLote
     */
    public function executar(Usuario $usuario, ?DateTimeImmutable $tocadasDesde = null, ?callable $aoConcluirLote = null): int
    {
        $usuarioId = (int) $usuario->getId();
        $identidades = $this->vinculoRepository->listarIdentidadesDoUsuario($usuario);
        $vinculadas = 0;
        $deslocamento = 0;

        while (true) {
            $usuarioAtual = $this->usuarioRepository->find($usuarioId);
            if (null === $usuarioAtual) {
                return $vinculadas;
            }

            $faixas = $this->reproducaoRepository->listarFaixasDistintas($usuarioAtual, $tocadasDesde, $deslocamento, self::TAMANHO_LOTE);
            if ([] === $faixas) {
                return $vinculadas;
            }

            $vinculadas += $this->vincularLote($usuarioAtual, $faixas, $identidades);
            $deslocamento += count($faixas);
            $this->musicaRepository->liberarMemoria();

            if (null !== $aoConcluirLote) {
                $aoConcluirLote($deslocamento, $vinculadas);
            }
        }
    }

    /**
     * @param list<array{nome: string, artista: string, album: ?string, codigo: ?string, duracao: ?int}> $faixas
     * @param array<string, true>                                                                      $identidades
     */
    private function vincularLote(Usuario $usuario, array $faixas, array &$identidades): int
    {
        $novas = array_values(array_filter($faixas, fn (array $faixa): bool => !isset($identidades[$this->identidade($faixa['nome'], $faixa['artista'])])));
        if ([] === $novas) {
            return 0;
        }

        $codigos = array_values(array_filter(array_map(static fn (array $faixa): ?string => $faixa['codigo'], $novas)));
        $artistasPorFaixa = $this->artistaFaixaRepository->listarNomesPorFaixas($codigos);
        $imagens = $this->imagemRepository->buscarMapeamentoPorCodigos(TipoImagemSpotify::Faixa, $codigos);

        $vinculadas = 0;
        foreach ($novas as $faixa) {
            $identidade = $this->identidade($faixa['nome'], $faixa['artista']);
            if (isset($identidades[$identidade])) {
                continue;
            }

            $codigo = $faixa['codigo'] ?? '';
            $artistas = $artistasPorFaixa[$codigo] ?? [$faixa['artista']];
            $musica = $this->obterMusica->obterMusica($usuario, $faixa['nome'], $artistas, $faixa['album'], isset($imagens[$codigo]) ? $imagens[$codigo]->imagemMediaUrl() : null);
            $this->vinculoRepository->salvar(new VinculoMusicaSpotify($usuario, $this->normalizador->normalizar($faixa['nome']), $this->normalizador->normalizar($faixa['artista']), $musica));
            $identidades[$identidade] = true;
            ++$vinculadas;
        }

        return $vinculadas;
    }

    private function identidade(string $nome, string $artista): string
    {
        return $this->normalizador->normalizar($nome).self::SEPARADOR_IDENTIDADE.$this->normalizador->normalizar($artista);
    }
}
