<?php

declare(strict_types=1);

namespace App\Command;

use App\Entity\ArtistaCatalogo;
use App\Entity\VideoYoutube;
use App\Enum\StatusClassificacaoVideo;
use App\Repository\UsuarioRepository;
use App\Repository\VideoYoutubeRepository;
use App\Service\IdentificacaoMusica\VincularVideoPeloHistoricoService;
use App\Service\Musica\Projecao\ProjetarReproducoesYoutubeService;
use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Input\InputOption;
use Symfony\Component\Console\Output\OutputInterface;
use Symfony\Component\Console\Style\SymfonyStyle;

#[AsCommand(
    name: 'app:youtube:vincular-pelo-historico',
    description: 'Vincula vídeos em revisão ou marcados como não música às músicas que o usuário já ouviu, quando o título traz o nome da música e do artista.',
)]
final class VincularVideosPeloHistoricoCommand extends Command
{
    private const int TAMANHO_LOTE = 500;
    private const int LIMITE_AMOSTRA = 40;

    public function __construct(
        private readonly UsuarioRepository $usuarioRepository,
        private readonly VideoYoutubeRepository $videoRepository,
        private readonly VincularVideoPeloHistoricoService $vincularPeloHistorico,
        private readonly ProjetarReproducoesYoutubeService $projetarYoutube,
    ) {
        parent::__construct();
    }

    protected function configure(): void
    {
        $this
            ->addOption('usuario', 'u', InputOption::VALUE_REQUIRED, 'Id do usuário')
            ->addOption('simular', null, InputOption::VALUE_NONE, 'Só mostra o que seria vinculado, sem gravar');
    }

    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        $io = new SymfonyStyle($input, $output);
        $idUsuario = (int) $input->getOption('usuario');
        $usuario = $this->usuarioRepository->find($idUsuario);
        if (null === $usuario) {
            $io->error('Informe um usuário válido com --usuario.');

            return Command::FAILURE;
        }

        $simular = (bool) $input->getOption('simular');
        $historico = $this->vincularPeloHistorico->carregarHistorico($usuario);
        $status = [StatusClassificacaoVideo::Revisar, StatusClassificacaoVideo::NaoMusica];
        $vinculadosPorStatus = [];
        $amostra = [];
        $analisados = 0;
        $ultimo = null;

        do {
            $videos = $this->videoRepository->listarParaVinculoPeloHistorico($usuario, $status, $ultimo, self::TAMANHO_LOTE);
            $vinculados = [];
            foreach ($videos as $video) {
                ++$analisados;
                $ultimo = $video->uuid();
                $statusAnterior = $video->status()->value;
                if (!$this->vincularPeloHistorico->vincular($video, $historico)) {
                    continue;
                }

                $vinculados[] = $video;
                $vinculadosPorStatus[$statusAnterior] = ($vinculadosPorStatus[$statusAnterior] ?? 0) + 1;
                if (count($amostra) < self::LIMITE_AMOSTRA) {
                    $amostra[] = $this->descrever($video, $statusAnterior);
                }
            }

            if (!$simular && [] !== $vinculados) {
                $this->videoRepository->flush();
                $this->projetarYoutube->projetarVideos($usuario, $vinculados);
            }
            $this->videoRepository->limparCache();
            $usuario = $this->usuarioRepository->find($idUsuario) ?? $usuario;
        } while (self::TAMANHO_LOTE === count($videos));

        $io->listing($amostra);
        $io->success(sprintf(
            '%s %d de %d vídeos analisados (revisão: %d, não música: %d).',
            $simular ? 'Seriam vinculados' : 'Vinculados',
            array_sum($vinculadosPorStatus),
            $analisados,
            $vinculadosPorStatus[StatusClassificacaoVideo::Revisar->value] ?? 0,
            $vinculadosPorStatus[StatusClassificacaoVideo::NaoMusica->value] ?? 0,
        ));

        return Command::SUCCESS;
    }

    private function descrever(VideoYoutube $video, string $statusAnterior): string
    {
        $musica = $video->musica();

        return sprintf(
            '[%s → %s] %s  ⇒  %s',
            $statusAnterior,
            $video->tipoVersao()?->value ?? '-',
            mb_substr($video->titulo(), 0, 70),
            null === $musica ? '?' : $musica->titulo().' — '.implode(', ', array_map(static fn (ArtistaCatalogo $artista): string => $artista->nome(), $musica->artistas())),
        );
    }
}
