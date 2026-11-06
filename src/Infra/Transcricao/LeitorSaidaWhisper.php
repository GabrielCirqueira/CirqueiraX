<?php

declare(strict_types=1);

namespace App\Infra\Transcricao;

use App\DataObject\Transcricao\SegmentoTranscricaoDTO;

final class LeitorSaidaWhisper
{
    private const int SEGUNDOS_POR_MINUTO = 60;
    private const int SEGUNDOS_POR_HORA = 3600;
    private const int MILISSEGUNDOS_POR_SEGUNDO = 1000;
    private const string QUEBRA_LINHA = "\n";

    private string $bufferSaidaPadrao = '';

    /**
     * @var list<SegmentoTranscricaoDTO>
     */
    private array $segmentos = [];

    private int $percentualInformado = 0;

    public function __construct(
        private readonly string $padraoSegmento,
        private readonly string $padraoProgresso,
    ) {}

    public function lerSaidaPadrao(string $conteudo): bool
    {
        $this->bufferSaidaPadrao .= $conteudo;
        $linhas = explode(self::QUEBRA_LINHA, $this->bufferSaidaPadrao);
        $this->bufferSaidaPadrao = (string) array_pop($linhas);
        $totalAntes = count($this->segmentos);

        foreach ($linhas as $linha) {
            $this->lerLinhaSegmento($linha);
        }

        return count($this->segmentos) > $totalAntes;
    }

    public function lerSaidaErro(string $conteudo): bool
    {
        if (0 === preg_match_all($this->padraoProgresso, $conteudo, $ocorrencias)) {
            return false;
        }

        $percentual = (int) max(array_map('intval', $ocorrencias[1]));
        if ($percentual <= $this->percentualInformado) {
            return false;
        }

        $this->percentualInformado = $percentual;

        return true;
    }

    /**
     * @return list<SegmentoTranscricaoDTO>
     */
    public function segmentos(): array
    {
        return $this->segmentos;
    }

    public function percentualInformado(): int
    {
        return $this->percentualInformado;
    }

    public function ultimoFimSegundos(): ?float
    {
        if ([] === $this->segmentos) {
            return null;
        }

        return $this->segmentos[count($this->segmentos) - 1]->fimSegundos;
    }

    private function lerLinhaSegmento(string $linha): void
    {
        if (1 !== preg_match($this->padraoSegmento, trim($linha), $partes)) {
            return;
        }

        $texto = trim(mb_check_encoding($partes[9], 'UTF-8') ? $partes[9] : mb_convert_encoding($partes[9], 'UTF-8', 'UTF-8'));

        $this->segmentos[] = new SegmentoTranscricaoDTO(
            $this->converterParaSegundos($partes[1], $partes[2], $partes[3], $partes[4]),
            $this->converterParaSegundos($partes[5], $partes[6], $partes[7], $partes[8]),
            $texto,
        );
    }

    private function converterParaSegundos(string $horas, string $minutos, string $segundos, string $milissegundos): float
    {
        return ((int) $horas * self::SEGUNDOS_POR_HORA)
            + ((int) $minutos * self::SEGUNDOS_POR_MINUTO)
            + (int) $segundos
            + ((int) $milissegundos / self::MILISSEGUNDOS_POR_SEGUNDO);
    }
}
