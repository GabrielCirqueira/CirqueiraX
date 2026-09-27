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
        $io->title('Seed de OrigemRegra para Prints Automáticos');

        $categoriaEmpresa = $this->obterOuCriarCategoria('Print Empresa', 'prints/empresa');
        $categoriaPessoal = $this->obterOuCriarCategoria('Print Pessoal', 'prints/pessoal');

        $this->obterOuCriarOrigemRegra(OrigemMedia::PRINT_EMPRESA, $categoriaEmpresa);
        $this->obterOuCriarOrigemRegra(OrigemMedia::PRINT_PESSOAL, $categoriaPessoal);

        $io->success('Categorias e regras de origem para print_empresa e print_pessoal cadastradas com sucesso!');

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
