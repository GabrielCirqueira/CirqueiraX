<?php

declare(strict_types=1);

namespace App\Command;

use App\Entity\Categoria;
use App\Entity\OrigemRegra;
use App\Enum\OrigemMedia;
use App\Repository\CategoriaRepository;
use App\Repository\OrigemRegraRepository;
use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Output\OutputInterface;
use Symfony\Component\Console\Style\SymfonyStyle;

#[AsCommand(
    name: 'app:seed:origem-regras',
    description: 'Cadastra as categorias e OrigemRegra padrão para print_empresa e print_pessoal.',
)]
final class SeedOrigemRegrasCommand extends Command
{
    public function __construct(
        private readonly CategoriaRepository $categoriaRepository,
        private readonly OrigemRegraRepository $origemRegraRepository,
    ) {
        parent::__construct();
    }

    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        $io = new SymfonyStyle($input, $output);
        $io->title('Seed de Categorias Padrão e OrigemRegra');

        // Categoria única para Prints (enviadas tanto do trabalho quanto de casa)
        $categoriaPrints = $this->obterOuCriarCategoria('Prints', 'prints');

        // As 3 categorias de vídeos
        $this->obterOuCriarCategoria('videos/memes', 'videos/memes');
        $this->obterOuCriarCategoria('Shingeki no Kyojin', 'videos/shingeki');
        $this->obterOuCriarCategoria('One Piece', 'videos/onepiece');

        // Ambas as origens de prints mapeiam para a pasta única "prints"
        $this->obterOuCriarOrigemRegra(OrigemMedia::PRINT_EMPRESA, $categoriaPrints);
        $this->obterOuCriarOrigemRegra(OrigemMedia::PRINT_PESSOAL, $categoriaPrints);

        $io->success('Categorias (Prints, videos/memes, Shingeki no Kyojin, One Piece) e regras de origem para prints configuradas com sucesso!');

        return Command::SUCCESS;
    }

    private function obterOuCriarCategoria(string $nome, string $pastaLocal): Categoria
    {
        $existente = $this->categoriaRepository->findOneBy(['nome' => $nome]);
        if (null !== $existente) {
            return $existente;
        }

        $categoria = new Categoria(nome: $nome, pastaLocal: $pastaLocal);
        $this->categoriaRepository->salvar($categoria);

        return $categoria;
    }

    private function obterOuCriarOrigemRegra(OrigemMedia $origem, Categoria $categoria): OrigemRegra
    {
        $existente = $this->origemRegraRepository->buscarPorOrigem($origem);
        if (null !== $existente) {
            return $existente;
        }

        $categoriaIdStr = $categoria->uuid()?->toString() ?? '';
        $regra = new OrigemRegra(origem: $origem, categoriaId: $categoriaIdStr);
        $this->origemRegraRepository->salvar($regra);

        return $regra;
    }
}
