<?php

declare(strict_types=1);

namespace App\Service\YoutubeMusic;

use App\DataObject\YoutubeMusic\ConectarYoutubeMusicDTO;
use App\DataObject\YoutubeMusic\CredenciaisYoutubeMusicDTO;
use App\Entity\ContaYoutubeMusic;
use App\Entity\Usuario;
use App\Exception\YoutubeMusic\YoutubeMusicException;
use App\Interface\CriptografiaInterface;
use App\Interface\YoutubeMusicInterface;
use App\Repository\ContaYoutubeMusicRepository;
use DateTimeImmutable;
use Symfony\Component\RateLimiter\RateLimiterFactoryInterface;

final readonly class ConectarYoutubeMusicService
{
    private const string ATRASO_PRIMEIRA_COLETA = '+1 minute';

    public function __construct(
        private ContaYoutubeMusicRepository $contaRepository,
        private YoutubeMusicInterface $youtubeMusic,
        private CriptografiaInterface $criptografia,
        private InterpretadorCabecalhosNavegadorService $interpretador,
        private RateLimiterFactoryInterface $youtubeMusicConexaoLimiter,
    ) {
    }

    public function executar(Usuario $usuario, ConectarYoutubeMusicDTO $dto): ContaYoutubeMusic
    {
        if (!$this->youtubeMusicConexaoLimiter->create((string) $usuario->getId())->consume()->isAccepted()) {
            throw YoutubeMusicException::muitasTentativasDeConexao();
        }

        $credenciais = new CredenciaisYoutubeMusicDTO($this->interpretador->executar($dto->cabecalhos));
        $contaValidada = $this->youtubeMusic->validarCredenciais($credenciais);
        $historico = $this->youtubeMusic->listarHistorico($credenciais);

        $conta = $this->contaRepository->buscarDoUsuario($usuario) ?? new ContaYoutubeMusic($usuario);
        $conta->conectar(
            $this->criptografia->criptografar($credenciais->cabecalhos),
            $contaValidada->nomeConta,
            new DateTimeImmutable(self::ATRASO_PRIMEIRA_COLETA),
        );
        $conta->registrarConsulta(array_slice($historico->videoIds(), 0, ContaYoutubeMusic::TAMANHO_SNAPSHOT_TOPO), false);
        $this->contaRepository->salvar($conta);

        return $conta;
    }
}
