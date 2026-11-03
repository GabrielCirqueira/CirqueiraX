<?php

declare(strict_types=1);

namespace App\Command;

use App\Service\LivroAudio\CorrigirVozLivrosAudioService;
use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Output\OutputInterface;
use Symfony\Component\Console\Style\SymfonyStyle;

#[AsCommand(
    name: 'app:livro-audio:corrigir-voz',
    description: 'Detecta o idioma dos livros e refaz as partes geradas com a voz errada ou antes da narração corrigida.',
)]
final class CorrigirVozLivrosAudioCommand extends Command
{
    public function __construct(
        private readonly CorrigirVozLivrosAudioService $corrigirVozLivrosAudioService,
    ) {
        parent::__construct();
    }

    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        $io = new SymfonyStyle($input, $output);
        $partesReiniciadas = $this->corrigirVozLivrosAudioService->executar();
        $io->success(sprintf('%d parte(s) voltaram para a fila de geração.', $partesReiniciadas));

        return Command::SUCCESS;
    }
}
