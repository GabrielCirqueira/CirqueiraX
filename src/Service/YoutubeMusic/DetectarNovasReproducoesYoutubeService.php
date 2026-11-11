<?php

declare(strict_types=1);

namespace App\Service\YoutubeMusic;

final readonly class DetectarNovasReproducoesYoutubeService
{
    private const int JANELA_COMPARACAO = 15;

    /**
     * @param list<string> $idsAtuais
     * @param list<string> $snapshotAnterior
     */
    public function executar(array $idsAtuais, array $snapshotAnterior): int
    {
        if ([] === $idsAtuais || [] === $snapshotAnterior) {
            return 0;
        }

        $alinhamento = $this->buscarAlinhamento($idsAtuais, $snapshotAnterior);
        if (null !== $alinhamento) {
            return $alinhamento;
        }

        return $this->contarAteItemConhecido($idsAtuais, $snapshotAnterior);
    }

    /**
     * @param list<string> $idsAtuais
     * @param list<string> $snapshotAnterior
     */
    private function buscarAlinhamento(array $idsAtuais, array $snapshotAnterior): ?int
    {
        $limite = min(count($idsAtuais), count($snapshotAnterior));

        for ($novos = 0; $novos <= $limite; ++$novos) {
            if ($this->isAlinhado($idsAtuais, $snapshotAnterior, $novos)) {
                return $novos;
            }
        }

        return null;
    }

    /**
     * @param list<string> $idsAtuais
     * @param list<string> $snapshotAnterior
     */
    private function isAlinhado(array $idsAtuais, array $snapshotAnterior, int $novos): bool
    {
        $subiram = array_flip(array_slice($idsAtuais, 0, $novos));
        $restante = array_values(array_filter($snapshotAnterior, static fn (string $id): bool => !isset($subiram[$id])));
        $tamanho = min(self::JANELA_COMPARACAO, count($restante), count($idsAtuais) - $novos);

        if (0 === $tamanho) {
            return [] === $restante;
        }

        return array_slice($idsAtuais, $novos, $tamanho) === array_slice($restante, 0, $tamanho);
    }

    /**
     * @param list<string> $idsAtuais
     * @param list<string> $snapshotAnterior
     */
    private function contarAteItemConhecido(array $idsAtuais, array $snapshotAnterior): int
    {
        $posicao = array_search($snapshotAnterior[0], $idsAtuais, true);
        if (false !== $posicao) {
            return $posicao;
        }

        $conhecidos = array_flip($snapshotAnterior);
        $novos = 0;
        foreach ($idsAtuais as $id) {
            if (isset($conhecidos[$id])) {
                break;
            }
            ++$novos;
        }

        return $novos;
    }
}
