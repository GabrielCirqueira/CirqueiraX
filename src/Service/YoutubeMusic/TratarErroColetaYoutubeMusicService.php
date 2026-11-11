<?php

declare(strict_types=1);

namespace App\Service\YoutubeMusic;

use App\DataObject\YoutubeMusic\CredenciaisYoutubeMusicDTO;
use App\Entity\ContaYoutubeMusic;
use App\Exception\YoutubeMusic\YoutubeMusicException;
use App\Interface\YoutubeMusicInterface;
use DateTimeImmutable;
use Psr\Log\LoggerInterface;

final readonly class TratarErroColetaYoutubeMusicService
{
    private const array ESPERAS_MINUTOS = [1, 2, 5, 15];
    private const int ERROS_PARA_REVALIDAR = 3;
    private const string FORMATO_ESPERA = '+%d minutes';

    public function __construct(
        private YoutubeMusicInterface $youtubeMusic,
        private LoggerInterface $logger,
    ) {
    }

    public function executar(ContaYoutubeMusic $conta, CredenciaisYoutubeMusicDTO $credenciais, YoutubeMusicException $erro): void
    {
        if ($erro->isCredenciaisInvalidas()) {
            $this->marcarReconectar($conta, $erro);

            return;
        }

        $conta->registrarErro($erro->getMessage());
        if ($conta->errosSeguidos() >= self::ERROS_PARA_REVALIDAR && !$this->isCredenciaisValidas($credenciais)) {
            $this->marcarReconectar($conta, YoutubeMusicException::credenciaisInvalidas());

            return;
        }

        $indice = min($conta->errosSeguidos(), count(self::ESPERAS_MINUTOS)) - 1;
        $conta->definirProximaConsulta(new DateTimeImmutable(sprintf(self::FORMATO_ESPERA, self::ESPERAS_MINUTOS[$indice])));
        $this->logger->warning('Coleta do YouTube Music falhou; nova tentativa agendada.', [
            'contaUuid' => $conta->uuid()->toRfc4122(),
            'codigo' => $erro->getCode(),
            'errosSeguidos' => $conta->errosSeguidos(),
            'esperaMinutos' => self::ESPERAS_MINUTOS[$indice],
        ]);
    }

    private function isCredenciaisValidas(CredenciaisYoutubeMusicDTO $credenciais): bool
    {
        try {
            $this->youtubeMusic->validarCredenciais($credenciais);

            return true;
        } catch (YoutubeMusicException $erro) {
            return !$erro->isCredenciaisInvalidas();
        }
    }

    private function marcarReconectar(ContaYoutubeMusic $conta, YoutubeMusicException $erro): void
    {
        $conta->marcarComoReconectar($erro->getMessage());
        $this->logger->warning('Sessão do YouTube Music recusada; conta marcada para reconectar.', [
            'contaUuid' => $conta->uuid()->toRfc4122(),
        ]);
    }
}
