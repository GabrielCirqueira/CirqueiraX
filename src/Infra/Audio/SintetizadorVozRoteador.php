<?php

declare(strict_types=1);

namespace App\Infra\Audio;

use App\DataObject\ResultadoSinteseVozDTO;
use App\Enum\IdiomaLivroAudio;
use App\Enum\VozNarracao;
use App\Exception\Audio\SinteseVozException;
use App\Interface\SintetizadorVozInterface;
use Psr\Log\LoggerInterface;
use Throwable;

final readonly class SintetizadorVozRoteador implements SintetizadorVozInterface
{
    private const int PAUSA_ANTES_DE_REPETIR_SEGUNDOS = 5;

    public function __construct(
        private EdgeTtsClient $edgeTts,
        private PiperTtsClient $piperTts,
        private LoggerInterface $logger,
    ) {}

    public function sintetizar(string $texto, string $caminhoDestinoMp3, ?string $voz = null, ?callable $deveCancelar = null, bool $permitirMotorAlternativo = false): ResultadoSinteseVozDTO
    {
        $voz ??= EdgeTtsClient::VOZ_PADRAO;

        if ('piper' === VozNarracao::motorDe($voz)) {
            return $this->piperTts->sintetizar($texto, $caminhoDestinoMp3, $voz, $deveCancelar);
        }

        try {
            return $this->edgeTts->sintetizar($texto, $caminhoDestinoMp3, $voz, $deveCancelar);
        } catch (Throwable $e) {
            if (!$permitirMotorAlternativo || $this->foiCancelada($e)) {
                throw $e;
            }

            $this->logger->warning('Edge TTS falhou, tentando de novo antes de usar o Piper.', ['voz' => $voz, 'erro' => $e->getMessage()]);
        }

        sleep(self::PAUSA_ANTES_DE_REPETIR_SEGUNDOS);

        try {
            return $this->edgeTts->sintetizar($texto, $caminhoDestinoMp3, $voz, $deveCancelar);
        } catch (Throwable $e) {
            $alternativa = $this->vozAlternativa($voz);
            if ($this->foiCancelada($e) || null === $alternativa) {
                throw $e;
            }

            $this->logger->warning('Edge TTS falhou de novo, narrando esta parte com o Piper.', ['voz' => $voz, 'alternativa' => $alternativa, 'erro' => $e->getMessage()]);

            try {
                return $this->piperTts->sintetizar($texto, $caminhoDestinoMp3, $alternativa, $deveCancelar);
            } catch (Throwable $erroPiper) {
                $this->logger->error('Piper também falhou.', ['erro' => $erroPiper->getMessage()]);

                throw $e;
            }
        }
    }

    private function foiCancelada(Throwable $erro): bool
    {
        return $erro instanceof SinteseVozException && $erro->foiCancelada();
    }

    private function vozAlternativa(string $voz): ?string
    {
        $idioma = IdiomaLivroAudio::tryFrom(strtolower(substr($voz, 0, 2)));
        $alternativa = null !== $idioma ? VozNarracao::vozPiperPara($idioma) : null;

        return null !== $alternativa && $this->piperTts->disponivel($alternativa->value) ? $alternativa->value : null;
    }
}
