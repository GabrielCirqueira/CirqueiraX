<?php

declare(strict_types=1);

namespace App\Command;

use App\Entity\ContaGoogleFotos;
use App\Infra\GoogleOAuth\GoogleOAuthAPI;
use App\Interface\CriptografiaInterface;
use App\Repository\ContaGoogleFotosRepository;
use DateTimeImmutable;
use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputArgument;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Input\InputOption;
use Symfony\Component\Console\Output\OutputInterface;
use Symfony\Component\Console\Style\SymfonyStyle;

#[AsCommand(
    name: 'app:google-fotos:autorizar-conta',
    description: 'Guia o fluxo OAuth2 para autorizar e registrar uma conta Google Fotos.',
)]
final class AutorizarContaGoogleFotosCommand extends Command
{
    private const string GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
    private const string SCOPES = 'https://www.googleapis.com/auth/photoslibrary.appendonly https://www.googleapis.com/auth/photoslibrary.readonly.appcreateddata https://www.googleapis.com/auth/photoslibrary.edit.appcreateddata https://www.googleapis.com/auth/userinfo.email';

    public function __construct(
        private readonly GoogleOAuthAPI $googleOAuthApi,
        private readonly CriptografiaInterface $criptografia,
        private readonly ContaGoogleFotosRepository $contaRepository,
    ) {
        parent::__construct();
    }

    protected function configure(): void
    {
        $this
            ->addArgument('email', InputArgument::OPTIONAL, 'E-mail da conta Google Fotos (opcional, será obtido no OAuth se omitido)')
            ->addOption('client-id', null, InputOption::VALUE_REQUIRED, 'Google OAuth Client ID')
            ->addOption('client-secret', null, InputOption::VALUE_REQUIRED, 'Google OAuth Client Secret')
            ->addOption('redirect-uri', null, InputOption::VALUE_REQUIRED, 'Google OAuth Redirect URI', 'http://localhost');
    }

    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        $io = new SymfonyStyle($input, $output);
        $io->title('Autorização OAuth — Google Fotos');

        /** @var string|null $clientId */
        $clientId = $input->getOption('client-id') ?? $_ENV['GOOGLE_CLIENT_ID'] ?? getenv('GOOGLE_CLIENT_ID') ?: null;
        if (empty($clientId)) {
            $clientId = $io->ask('Informe o GOOGLE_CLIENT_ID');
            if (empty($clientId)) {
                $io->error('O    é obrigatório.');

                return Command::FAILURE;
            }
        }

        /** @var string|null $clientSecret */
        $clientSecret = $input->getOption('client-secret') ?? $_ENV['GOOGLE_CLIENT_SECRET'] ?? getenv('GOOGLE_CLIENT_SECRET') ?: null;
        if (empty($clientSecret)) {
            $clientSecret = $io->askHidden('Informe o GOOGLE_CLIENT_SECRET');
            if (empty($clientSecret)) {
                $io->error('O GOOGLE_CLIENT_SECRET é obrigatório.');

                return Command::FAILURE;
            }
        }

        /** @var string $redirectUri */
        $redirectUri = $input->getOption('redirect-uri') ?? $_ENV['GOOGLE_REDIRECT_URI'] ?? getenv('GOOGLE_REDIRECT_URI') ?: 'http://localhost';

        $urlAutorizacao = sprintf(
            '%s?client_id=%s&redirect_uri=%s&response_type=code&scope=%s&access_type=offline&prompt=consent',
            self::GOOGLE_AUTH_URL,
            urlencode($clientId),
            urlencode($redirectUri),
            urlencode(self::SCOPES),
        );

        $io->section('Passo 1: Autorização no Navegador');
        $io->writeln('Abra o link abaixo no seu navegador e autorize a aplicação:');
        $io->newLine();
        $io->writeln($urlAutorizacao);
        $io->newLine();

        $io->section('Passo 2: Confirmação do Código ou URL');
        $io->writeln('Após autorizar no Google, você será redirecionado para uma página.');
        $io->writeln('Basta copiar toda a URL da barra de endereços (ou apenas o código) e colar abaixo.');
        $io->newLine();

        $entrada = $io->ask('Cole a URL completa ou o código retornado');
        if (empty($entrada) || !is_string($entrada)) {
            $io->error('Nenhuma entrada foi fornecida.');

            return Command::FAILURE;
        }

        $code = $this->extrairCodigoAutorizacao($entrada);
        if (null === $code) {
            $io->error('Não foi possível identificar o parâmetro "code" na entrada fornecida.');

            return Command::FAILURE;
        }

        $io->section('Passo 3: Troca de código por tokens');

        try {
            $dadosToken = $this->googleOAuthApi->trocarCodigoPorToken(
                $clientId,
                $clientSecret,
                $code,
                $redirectUri
            );

            $refreshToken = $dadosToken['refresh_token'] ?? null;
            $accessToken = $dadosToken['access_token'] ?? null;
            $expiresIn = (int) ($dadosToken['expires_in'] ?? 3600);

            if (empty($refreshToken)) {
                $io->error('O Google não retornou um refresh_token. Certifique-se de usar prompt=consent e revogar acessos prévios se necessário.');

                return Command::FAILURE;
            }

            /** @var string|null $email */
            $email = $input->getArgument('email');
            if (empty($email) && !empty($accessToken) && is_string($accessToken)) {
                try {
                    $userInfo = $this->googleOAuthApi->obterUserInfo($accessToken);
                    $email = $userInfo['email'] ?? null;
                } catch (\Throwable) {
                    $email = null;
                }
            }

            if (empty($email)) {
                $email = $io->ask('Informe o e-mail da conta Google Fotos correspondente');
                if (empty($email)) {
                    $io->error('O e-mail da conta é obrigatório.');

                    return Command::FAILURE;
                }
            }

            $expiraEm = (new DateTimeImmutable())->modify(sprintf('+%d seconds', $expiresIn));
            $refreshTokenCriptografado = $this->criptografia->criptografar($refreshToken);

            $conta = $this->contaRepository->buscarPorEmail($email);
            if (null === $conta) {
                $conta = new ContaGoogleFotos($email, $refreshTokenCriptografado);
            } else {
                $conta->setRefreshTokenCriptografado($refreshTokenCriptografado);
            }

            $conta->setAccessTokenCache($accessToken, $expiraEm);
            $this->contaRepository->salvar($conta);

            $io->success('Conta Google Fotos autorizada e salva com sucesso!');
            $io->definitionList(
                ['UUID' => $conta->uuid()?->toString() ?? 'N/A'],
                ['E-mail' => $conta->email()],
                ['Refresh Token' => 'Criptografado e armazenado (Sodium)'],
                ['Access Token Expira Em' => $expiraEm->format('Y-m-d H:i:s')],
            );

            return Command::SUCCESS;
        } catch (\Throwable $e) {
            $io->error('Erro ao processar autorização OAuth: ' . $e->getMessage());

            return Command::FAILURE;
        }
    }

    private function extrairCodigoAutorizacao(string $entrada): ?string
    {
        $limpo = trim($entrada);
        if ('' === $limpo) {
            return null;
        }

        if (str_starts_with($limpo, 'http://') || str_starts_with($limpo, 'https://') || str_contains($limpo, '?') || str_contains($limpo, 'code=')) {
            $parsedUrl = parse_url($limpo);
            $queryString = $parsedUrl['query'] ?? (str_contains($limpo, '?') ? explode('?', $limpo, 2)[1] : $limpo);

            parse_str($queryString, $queryParams);

            if (isset($queryParams['error'])) {
                $descricaoErro = is_string($queryParams['error_description'] ?? null) ? $queryParams['error_description'] : (string) $queryParams['error'];
                throw new \DomainException(sprintf('Google OAuth recusado: %s', $descricaoErro));
            }

            if (isset($queryParams['code']) && is_string($queryParams['code']) && '' !== trim($queryParams['code'])) {
                return trim((string) $queryParams['code']);
            }
        }

        return $limpo;
    }
}
