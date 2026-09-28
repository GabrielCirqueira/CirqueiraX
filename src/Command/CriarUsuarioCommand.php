<?php

declare(strict_types=1);

namespace App\Command;

use App\DataObject\CriarUsuarioDTO;
use App\Exception\Usuario\UsuarioException;
use App\Service\Usuario\CriarUsuarioService;
use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Input\InputOption;
use Symfony\Component\Console\Output\OutputInterface;
use Symfony\Component\Console\Question\Question;
use Symfony\Component\Console\Style\SymfonyStyle;

#[AsCommand(
    name: 'app:usuario:criar',
    description: 'Cria um novo usuário no sistema com username, email e senha.',
    aliases: ['app:user:create']
)]
final class CriarUsuarioCommand extends Command
{
    public function __construct(
        private readonly CriarUsuarioService $criarUsuarioService,
    ) {
        parent::__construct();
    }

    protected function configure(): void
    {
        $this
            ->addOption('username', 'u', InputOption::VALUE_OPTIONAL, 'Nome de usuário para login')
            ->addOption('email', 'm', InputOption::VALUE_OPTIONAL, 'Endereço de e-mail do usuário')
            ->addOption('senha', 'p', InputOption::VALUE_OPTIONAL, 'Senha de acesso do usuário')
            ->addOption('nome', null, InputOption::VALUE_OPTIONAL, 'Nome completo do usuário')
            ->addOption('admin', null, InputOption::VALUE_NONE, 'Atribuir perfil de Administrador (ROLE_ADMIN)');
    }

    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        $io = new SymfonyStyle($input, $output);
        $io->title('CirqueiraX — Criação de Novo Usuário');

        $username = $input->getOption('username');
        if (null === $username || '' === trim((string) $username)) {
            $question = new Question('Nome de usuário (username): ');
            $question->setValidator(function (?string $answer) {
                if (empty($answer) || strlen(trim($answer)) < 3) {
                    throw new \RuntimeException('O nome de usuário deve ter ao menos 3 caracteres.');
                }

                return trim($answer);
            });
            $username = $io->askQuestion($question);
        }

        $email = $input->getOption('email');
        if (null === $email || '' === trim((string) $email)) {
            $question = new Question('Endereço de e-mail: ');
            $question->setValidator(function (?string $answer) {
                if (empty($answer) || false === filter_var(trim($answer), FILTER_VALIDATE_EMAIL)) {
                    throw new \RuntimeException('Por favor, informe um endereço de e-mail válido.');
                }

                return trim($answer);
            });
            $email = $io->askQuestion($question);
        }

        $nome = $input->getOption('nome');
        if (null === $nome || '' === trim((string) $nome)) {
            $defaultNome = ucfirst((string) $username);
            $question = new Question(sprintf('Nome completo [%s]: ', $defaultNome), $defaultNome);
            $nome = $io->askQuestion($question);
        }

        $senha = $input->getOption('senha');
        if (null === $senha || '' === trim((string) $senha)) {
            $question = new Question('Senha de acesso: ');
            $question->setHidden(true);
            $question->setHiddenFallback(false);
            $question->setValidator(function (?string $answer) {
                if (empty($answer) || strlen($answer) < 6) {
                    throw new \RuntimeException('A senha deve ter ao menos 6 caracteres.');
                }

                return $answer;
            });
            $senha = $io->askQuestion($question);
        }

        $roles = ['ROLE_USER'];
        if ($input->getOption('admin')) {
            $roles[] = 'ROLE_ADMIN';
        }

        $dto = new CriarUsuarioDTO(
            nomeCompleto: (string) $nome,
            username: (string) $username,
            email: (string) $email,
            senha: (string) $senha,
            roles: $roles,
        );

        try {
            $usuario = $this->criarUsuarioService->executar($dto);

            $io->success('Usuário criado com sucesso no banco de dados!');
            $io->table(
                ['ID', 'Nome Completo', 'Username', 'E-mail', 'Roles', 'Criado Em'],
                [[
                    (string) $usuario->getId(),
                    $usuario->getNomeCompleto(),
                    $usuario->getUsername(),
                    $usuario->getEmail(),
                    implode(', ', $usuario->getRoles()),
                    $usuario->getCriadoEm()->format('d/m/Y H:i:s'),
                ]]
            );

            return Command::SUCCESS;
        } catch (UsuarioException $e) {
            $io->error($e->getMessage());

            return Command::FAILURE;
        } catch (\Throwable $e) {
            $io->error(sprintf('Erro inesperado ao criar usuário: %s', $e->getMessage()));

            return Command::FAILURE;
        }
    }
}
