<?php

declare(strict_types=1);

namespace App\Service\Spotify;

use App\DataObject\Spotify\AparelhoSpotifyDTO;
use App\Entity\Usuario;
use App\Enum\OrigemConsultaSpotify;
use App\Exception\Spotify\SpotifyException;
use App\Interface\SpotifyInterface;
use App\Repository\ContaSpotifyRepository;

final readonly class TocarFaixaSpotifyService
{
    private const string ESCOPO_CONTROLE = 'user-modify-playback-state';
    private const string ESCOPO_LEITURA = 'user-read-playback-state';
    private const int ESPERA_PADRAO_SEGUNDOS = 30;
    private const int CODIGO_NAO_AUTORIZADO = 401;

    public function __construct(
        private ContaSpotifyRepository $contaSpotifyRepository,
        private ObterTokenValidoSpotifyService $obterTokenValidoService,
        private SpotifyInterface $spotifyClient,
        private ControleLimiteSpotifyService $controleLimite,
    ) {
    }

    public function executar(Usuario $usuario, string $codigoFaixa): AparelhoSpotifyDTO
    {
        $conta = $this->contaSpotifyRepository->buscarDoUsuario($usuario);
        if (null === $conta || !$conta->isConectada()) {
            throw SpotifyException::contaNaoConectada();
        }

        $escopos = explode(' ', $conta->escopos() ?? '');
        if (!in_array(self::ESCOPO_CONTROLE, $escopos, true) || !in_array(self::ESCOPO_LEITURA, $escopos, true)) {
            throw SpotifyException::permissaoDeReproducaoAusente();
        }

        if ($this->controleLimite->estaBloqueado()) {
            throw SpotifyException::limiteRequisicoesExcedido(self::ESPERA_PADRAO_SEGUNDOS);
        }

        $this->controleLimite->registrarConsulta(OrigemConsultaSpotify::Player);

        try {
            $token = $this->obterTokenValidoService->executar($conta);
            $aparelho = $this->escolherAparelho($this->spotifyClient->listarAparelhos($token));
            $this->spotifyClient->tocarFaixa($token, $codigoFaixa, $aparelho->id);
        } catch (SpotifyException $excecao) {
            throw self::CODIGO_NAO_AUTORIZADO === $excecao->getCode() ? SpotifyException::permissaoDeReproducaoAusente() : $excecao;
        }

        return $aparelho;
    }

    /**
     * @param list<AparelhoSpotifyDTO> $aparelhos
     */
    private function escolherAparelho(array $aparelhos): AparelhoSpotifyDTO
    {
        $disponiveis = array_values(array_filter($aparelhos, static fn (AparelhoSpotifyDTO $aparelho): bool => $aparelho->isDisponivel()));
        $ativos = array_values(array_filter($disponiveis, static fn (AparelhoSpotifyDTO $aparelho): bool => $aparelho->ativo));

        return $ativos[0] ?? $disponiveis[0] ?? throw SpotifyException::nenhumAparelhoDisponivel();
    }
}
