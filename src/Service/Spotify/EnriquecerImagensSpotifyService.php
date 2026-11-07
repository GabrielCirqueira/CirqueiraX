<?php

declare(strict_types=1);

namespace App\Service\Spotify;

use App\DataObject\Spotify\MapaImagensSpotifyDTO;
use App\Entity\ImagemSpotify;
use App\Entity\Usuario;
use App\Enum\TipoImagemSpotify;
use App\Message\BuscarImagemSpotifyMessage;
use App\Repository\ImagemSpotifyRepository;
use Symfony\Component\Messenger\MessageBusInterface;

final readonly class EnriquecerImagensSpotifyService
{
    public function __construct(
        private ImagemSpotifyRepository $imagemRepository,
        private MessageBusInterface $messageBus,
    ) {
    }

    /**
     * @param array<int, array{codigo: ?string, nome: string, artista: string, duracaoMs?: ?int}> $faixas
     * @param array<int, array{codigo: ?string, nome: string}> $artistas
     */
    public function enriquecerEAgendar(
        Usuario $usuario,
        array $faixas,
        array $artistas,
        int $prioridade = 1,
    ): MapaImagensSpotifyDTO {
        $chaves = [];
        $dadosPorChave = [];

        foreach ($faixas as $f) {
            $chave = ImagemSpotify::gerarChaveFaixa($f['codigo'], $f['artista'], $f['nome']);
            $chaves[] = $chave;
            $dadosPorChave[$chave] = [
                'tipo' => TipoImagemSpotify::Faixa,
                'codigo' => $f['codigo'],
                'nome' => $f['nome'],
                'artista' => $f['artista'],
                'duracaoMs' => $f['duracaoMs'] ?? null,
            ];
        }

        foreach ($artistas as $a) {
            $chave = ImagemSpotify::gerarChaveArtista($a['codigo'], $a['nome']);
            $chaves[] = $chave;
            $dadosPorChave[$chave] = [
                'tipo' => TipoImagemSpotify::Artista,
                'codigo' => $a['codigo'],
                'nome' => $a['nome'],
                'artista' => null,
                'duracaoMs' => null,
            ];
        }

        $imagensExistentes = $this->imagemRepository->buscarMapeamentoPorChaves($chaves);
        $imagensPorChave = [];
        $urlsSpotifyPorChave = [];
        $novasEntidades = [];
        $mensagensPendentes = [];

        foreach ($dadosPorChave as $chave => $dados) {
            if (isset($imagensExistentes[$chave])) {
                $imagem = $imagensExistentes[$chave];
                if ($imagem->isEncontrada() && null !== $imagem->primeiraImagemUrl()) {
                    $url = $imagem->primeiraImagemUrl();
                    if (null !== $url) {
                        $imagensPorChave[$chave] = $url;
                    }
                    if (null !== $imagem->urlSpotify()) {
                        $urlsSpotifyPorChave[$chave] = $imagem->urlSpotify();
                    }
                } elseif ($imagem->tipo()->isArtista() && null === $imagem->primeiraImagemUrl()) {
                    $this->messageBus->dispatch(new BuscarImagemSpotifyMessage(
                        usuarioId: (int) $usuario->getId(),
                        tipo: TipoImagemSpotify::Artista,
                        nome: (string) $dados['nome'],
                        artista: null,
                        codigoSpotify: $dados['codigo'],
                        duracaoMs: null,
                        prioridade: $prioridade,
                    ));
                }
                continue;
            }

            /** @var TipoImagemSpotify $tipo */
            $tipo = $dados['tipo'];
            /** @var string|null $codigo */
            $codigo = $dados['codigo'];
            /** @var string $nome */
            $nome = $dados['nome'];
            /** @var string|null $artista */
            $artista = $dados['artista'];
            /** @var int|null $duracaoMs */
            $duracaoMs = $dados['duracaoMs'];

            $nova = $tipo->isFaixa()
                ? ImagemSpotify::criarParaFaixa($nome, $artista ?? '', $codigo, $duracaoMs)
                : ImagemSpotify::criarParaArtista($nome, $codigo);

            $this->imagemRepository->salvar($nova, flush: false);
            $novasEntidades[] = $nova;

            $mensagensPendentes[] = new BuscarImagemSpotifyMessage(
                usuarioId: (int) $usuario->getId(),
                tipo: $tipo,
                nome: $nome,
                artista: $artista,
                codigoSpotify: $codigo,
                duracaoMs: $duracaoMs,
                prioridade: $prioridade,
            );
        }

        if (!empty($novasEntidades)) {
            $this->imagemRepository->flush();
        }

        foreach ($mensagensPendentes as $mensagem) {
            $this->messageBus->dispatch($mensagem);
        }

        return new MapaImagensSpotifyDTO($imagensPorChave, $urlsSpotifyPorChave);
    }

    public function catalogarCapaColetada(
        string $codigoFaixa,
        string $nomeFaixa,
        string $artistaPrincipal,
        string $urlCapaGrande,
        ?string $urlCapaMedia = null,
        ?string $urlCapaPequena = null,
        ?string $urlSpotify = null,
    ): void {
        $chave = ImagemSpotify::gerarChaveFaixa($codigoFaixa, $artistaPrincipal, $nomeFaixa);
        $existente = $this->imagemRepository->buscarPorChaveBusca($chave);

        if (null !== $existente) {
            if (!$existente->isEncontrada()) {
                $existente->marcarEncontrada(
                    $codigoFaixa,
                    $urlCapaGrande,
                    $urlCapaMedia,
                    $urlCapaPequena,
                    $urlSpotify,
                );
                $this->imagemRepository->salvar($existente);
            }
            return;
        }

        $imagem = ImagemSpotify::criarParaFaixa($nomeFaixa, $artistaPrincipal, $codigoFaixa);
        $imagem->marcarEncontrada(
            $codigoFaixa,
            $urlCapaGrande,
            $urlCapaMedia,
            $urlCapaPequena,
            $urlSpotify,
        );

        $this->imagemRepository->salvar($imagem);
    }
}

