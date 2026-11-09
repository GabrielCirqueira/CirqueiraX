<?php

declare(strict_types=1);

namespace App\Service\Transcricao;

use App\Entity\Transcricao;
use App\Enum\StatusCorrecaoTranscricao;
use App\Exception\Transcricao\TranscricaoException;
use App\Interface\CorretorTextoTranscricaoInterface;
use App\Repository\TranscricaoRepository;
use Psr\Log\LoggerInterface;

final readonly class CorrigirTextoTranscricaoService
{
    private const int PALAVRAS_POR_BLOCO = 1500;
    private const string SEPARADOR_PARAGRAFO = "\n\n";
    private const string PADRAO_PARAGRAFOS = '/\n\s*\n/u';
    private const string PADRAO_FRASES = '/(?<=[.!?…])\s+/u';
    private const string PADRAO_ESPACOS = '/\s+/u';

    public function __construct(
        private TranscricaoRepository $transcricaoRepository,
        private CorretorTextoTranscricaoInterface $corretor,
        private LoggerInterface $logger,
    ) {}

    public function executar(string $uuid): void
    {
        $transcricao = $this->transcricaoRepository->buscarPorUuid($uuid);
        if (null === $transcricao || StatusCorrecaoTranscricao::NA_FILA !== $transcricao->statusCorrecao() || null === $transcricao->texto()) {
            return;
        }

        $transcricao->iniciarCorrecao();
        $this->transcricaoRepository->flush();

        try {
            $textoCorrigido = $this->corrigir($transcricao, (string) $transcricao->texto());
        } catch (TranscricaoException $erro) {
            $transcricao->registrarFalhaCorrecao($erro->getMessage());
            $this->transcricaoRepository->flush();
            $this->logger->warning('Falha ao corrigir transcrição com IA.', [
                'transcricao' => $transcricao->uuidTexto(),
                'erro' => $erro->getMessage(),
            ]);

            return;
        }

        $transcricao->concluirCorrecao($textoCorrigido);
        $this->transcricaoRepository->flush();
    }

    private function corrigir(Transcricao $transcricao, string $texto): string
    {
        $blocos = $this->dividirEmBlocos($texto);
        $totalBlocos = count($blocos);
        $corrigidos = [];

        foreach ($blocos as $indice => $bloco) {
            $corrigidos[] = $this->corretor->corrigirBloco($bloco, $transcricao->idiomaDetectado(), $indice + 1, $totalBlocos);
        }

        return implode(self::SEPARADOR_PARAGRAFO, $corrigidos);
    }

    /**
     * @return list<string>
     */
    private function dividirEmBlocos(string $texto): array
    {
        $blocos = [];
        $atual = [];
        $palavrasAtual = 0;

        foreach ($this->dividirEmPedacos($texto) as $pedaco) {
            $palavras = $this->contarPalavras($pedaco);
            if ([] !== $atual && $palavrasAtual + $palavras > self::PALAVRAS_POR_BLOCO) {
                $blocos[] = implode(self::SEPARADOR_PARAGRAFO, $atual);
                $atual = [];
                $palavrasAtual = 0;
            }

            $atual[] = $pedaco;
            $palavrasAtual += $palavras;
        }

        if ([] !== $atual) {
            $blocos[] = implode(self::SEPARADOR_PARAGRAFO, $atual);
        }

        return $blocos;
    }

    /**
     * @return list<string>
     */
    private function dividirEmPedacos(string $texto): array
    {
        $pedacos = [];
        foreach ($this->separar(self::PADRAO_PARAGRAFOS, $texto) as $paragrafo) {
            array_push($pedacos, ...$this->dividirParagrafo($paragrafo));
        }

        return $pedacos;
    }

    /**
     * @return list<string>
     */
    private function dividirParagrafo(string $paragrafo): array
    {
        if ($this->contarPalavras($paragrafo) <= self::PALAVRAS_POR_BLOCO) {
            return [$paragrafo];
        }

        $pedacos = [];
        foreach ($this->separar(self::PADRAO_FRASES, $paragrafo) as $frase) {
            array_push($pedacos, ...$this->dividirFrase($frase));
        }

        return $pedacos;
    }

    /**
     * @return list<string>
     */
    private function dividirFrase(string $frase): array
    {
        $palavras = $this->separar(self::PADRAO_ESPACOS, $frase);
        if (count($palavras) <= self::PALAVRAS_POR_BLOCO) {
            return [$frase];
        }

        return array_map(
            static fn (array $grupo): string => implode(' ', $grupo),
            array_chunk($palavras, self::PALAVRAS_POR_BLOCO),
        );
    }

    /**
     * @return list<string>
     */
    private function separar(string $padrao, string $texto): array
    {
        return array_values(array_filter(
            array_map('trim', preg_split($padrao, $texto) ?: []),
            static fn (string $parte): bool => '' !== $parte,
        ));
    }

    private function contarPalavras(string $texto): int
    {
        return count($this->separar(self::PADRAO_ESPACOS, $texto));
    }
}
