<?php

declare(strict_types=1);

namespace App\Command;

use App\Entity\Categoria;
use App\Entity\OrigemRegra;
use App\Entity\Usuario;
use App\Enum\OrigemMedia;
use App\Repository\CategoriaRepository;
use App\Repository\OrigemRegraRepository;
use App\Repository\UsuarioRepository;
use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Input\InputOption;
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
        private readonly UsuarioRepository $usuarioRepository,
    ) {
        parent::__construct();
    }

    protected function configure(): void
    {
        $this->addOption('usuario', 'u', InputOption::VALUE_REQUIRED, 'E-mail ou username do dono');
    }

    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        $io = new SymfonyStyle($input, $output);
        $io->title('Seed de Categorias Padrão e OrigemRegra');

        /** @var string $identificadorUsuario */
        $identificadorUsuario = $input->getOption('usuario') ?? '';
        $usuario = $this->usuarioRepository->buscarPorEmailOuUsername($identificadorUsuario);
        if (null === $usuario) {
            $io->error('Informe um usuário existente com --usuario=<email ou username>.');

            return Command::FAILURE;
        }

        $categoriaPrints = $this->obterOuCriarCategoria($usuario, 'Prints', 'prints');

        $this->obterOuCriarCategoria($usuario, 'videos/memes', 'videos/memes');
        $this->obterOuCriarCategoria($usuario, 'Shingeki no Kyojin', 'videos/shingeki');
        $this->obterOuCriarCategoria($usuario, 'One Piece', 'videos/onepiece');

        $this->obterOuCriarOrigemRegra($usuario, OrigemMedia::PRINT_EMPRESA, $categoriaPrints);
        $this->obterOuCriarOrigemRegra($usuario, OrigemMedia::PRINT_PESSOAL, $categoriaPrints);

        $io->success('Categorias (Prints, videos/memes, Shingeki no Kyojin, One Piece) e regras de origem para prints configuradas com sucesso!');

        return Command::SUCCESS;
    }

    private function obterOuCriarCategoria(Usuario $usuario, string $nome, string $pastaLocal): Categoria
    {
        $existente = $this->categoriaRepository->buscarPorNome($usuario, $nome);
        if (null !== $existente) {
            return $existente;
        }

        $categoria = new Categoria(usuario: $usuario, nome: $nome, pastaLocal: $pastaLocal);
        $this->categoriaRepository->salvar($categoria);

        return $categoria;
    }

    private function obterOuCriarOrigemRegra(Usuario $usuario, OrigemMedia $origem, Categoria $categoria): OrigemRegra
    {
        $existente = $this->origemRegraRepository->buscarPorOrigem($usuario, $origem);
        if (null !== $existente) {
            return $existente;
        }

        $categoriaIdStr = $categoria->uuid()?->toString() ?? '';
        $regra = new OrigemRegra(usuario: $usuario, origem: $origem, categoriaId: $categoriaIdStr);
        $this->origemRegraRepository->salvar($regra);

        return $regra;
    }
}
