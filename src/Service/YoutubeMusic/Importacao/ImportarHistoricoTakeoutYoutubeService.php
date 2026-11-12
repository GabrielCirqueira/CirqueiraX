<?php

declare(strict_types=1);

namespace App\Service\YoutubeMusic\Importacao;

use App\DataObject\YoutubeMusic\ItemHistoricoTakeoutYoutubeDTO;
use App\DataObject\YoutubeMusic\ResultadoImportacaoTakeoutYoutubeDTO;
use App\Entity\ImportacaoYoutube;
use App\Entity\ReproducaoYoutube;
use App\Entity\Usuario;
use App\Entity\VideoYoutube;
use App\Enum\FonteReproducaoYoutube;
use App\Interface\LeitorArquivoTakeoutYoutubeInterface;
use App\Repository\ImportacaoYoutubeRepository;
use App\Repository\ReproducaoYoutubeRepository;
use App\Repository\VideoYoutubeRepository;
use DateTimeImmutable;
use DateTimeZone;

final readonly class ImportarHistoricoTakeoutYoutubeService
{
    public const int JANELA_TOLERANCIA_TAKEOUT_SEGUNDOS = 600;
    private const int TAMANHO_LOTE = 500;
    private const int MS_INICIAL_TAKEOUT = 0;
    private const string FORMATO_GRAVADO = 'Y-m-d H:i:s';
    private const string FUSO_UTC = 'UTC';

    public function __construct(
        private LeitorArquivoTakeoutYoutubeInterface $leitor,
        private VideoYoutubeRepository $videoRepository,
        private ReproducaoYoutubeRepository $reproducaoRepository,
        private ImportacaoYoutubeRepository $importacaoRepository,
    ) {
    }

    public function executar(string $caminhoArquivo, ImportacaoYoutube $importacao): ResultadoImportacaoTakeoutYoutubeDTO
    {
        $usuario = $importacao->usuario();
        $contadores = ['lidos' => 0, 'novos' => 0, 'ignorados' => 0, 'unificados' => 0, 'videosNovos' => 0];
        $lote = [];
        $primeira = null;
        $ultima = null;
        $leitura = $this->leitor->ler($caminhoArquivo);

        foreach ($leitura as $item) {
            ++$contadores['lidos'];
            $lote[] = $item;
            $primeira = null === $primeira || $item->tocadaEm < $primeira ? $item->tocadaEm : $primeira;
            $ultima = null === $ultima || $item->tocadaEm > $ultima ? $item->tocadaEm : $ultima;

            if (count($lote) < self::TAMANHO_LOTE) {
                continue;
            }

            $this->processarLote($lote, $usuario, $importacao, $contadores);
            $usuario = $this->reproducaoRepository->obterReferenciaUsuario($usuario);
            $importacao = $this->importacaoRepository->obterReferencia($importacao);
            $lote = [];
        }

        if ([] !== $lote) {
            $this->processarLote($lote, $usuario, $importacao, $contadores);
        }

        return new ResultadoImportacaoTakeoutYoutubeDTO(
            totalLidos: $contadores['lidos'],
            totalDescartados: $leitura->getReturn(),
            totalNovos: $contadores['novos'],
            totalIgnorados: $contadores['ignorados'],
            totalUnificados: $contadores['unificados'],
            totalVideosNovos: $contadores['videosNovos'],
            primeiraReproducaoEm: $primeira,
            ultimaReproducaoEm: $ultima,
        );
    }

    /**
     * @param list<ItemHistoricoTakeoutYoutubeDTO>                                             $lote
     * @param array{lidos: int, novos: int, ignorados: int, unificados: int, videosNovos: int} $contadores
     */
    private function processarLote(array $lote, Usuario $usuario, ImportacaoYoutube $importacao, array &$contadores): void
    {
        $videoIds = array_values(array_unique(array_map(static fn (ItemHistoricoTakeoutYoutubeDTO $item): string => $item->videoId, $lote)));
        $videos = $this->videoRepository->buscarPorVideoIds($usuario, $videoIds);
        $chavesExistentes = array_fill_keys($this->reproducaoRepository->buscarChavesExistentes(
            $usuario,
            array_map(static fn (ItemHistoricoTakeoutYoutubeDTO $item): string => ReproducaoYoutube::gerarChaveDeduplicacao($item->videoId, $item->tocadaEm), $lote),
        ), true);
        $candidatosColeta = $this->agruparPorVideo($this->buscarCandidatosDaColeta($lote, $videoIds, $usuario));

        foreach ($lote as $item) {
            $chave = ReproducaoYoutube::gerarChaveDeduplicacao($item->videoId, $item->tocadaEm);

            if (isset($chavesExistentes[$chave])) {
                ++$contadores['ignorados'];

                continue;
            }

            $chavesExistentes[$chave] = true;
            $candidato = $this->extrairCandidatoMaisProximo($candidatosColeta, $item);

            if (null !== $candidato && $candidato->isTempoExato()) {
                $candidato->vincularImportacao($importacao);
                ++$contadores['unificados'];

                continue;
            }

            if (null !== $candidato) {
                $candidato->unificarComTakeout($item->tocadaEm)->vincularImportacao($importacao);
                ++$contadores['unificados'];

                continue;
            }

            $video = $videos[$item->videoId] ?? $this->criarVideo($usuario, $item, $contadores);
            $videos[$item->videoId] = $video;
            $this->reproducaoRepository->salvar((new ReproducaoYoutube($usuario, $video, $item->tocadaEm, self::MS_INICIAL_TAKEOUT, FonteReproducaoYoutube::Takeout))->vincularImportacao($importacao), false);
            ++$contadores['novos'];
        }

        $this->reproducaoRepository->flush();
        $this->reproducaoRepository->limparCache();
    }

    /**
     * @param array{lidos: int, novos: int, ignorados: int, unificados: int, videosNovos: int} $contadores
     */
    private function criarVideo(Usuario $usuario, ItemHistoricoTakeoutYoutubeDTO $item, array &$contadores): VideoYoutube
    {
        $video = (new VideoYoutube($usuario, $item->videoId, $item->titulo ?? $item->videoId, $item->canal ?? ''))->reservarParaImportacao();
        $this->videoRepository->salvar($video, false);
        ++$contadores['videosNovos'];

        return $video;
    }

    /**
     * @param list<ItemHistoricoTakeoutYoutubeDTO> $lote
     * @param list<string>                         $videoIds
     *
     * @return list<ReproducaoYoutube>
     */
    private function buscarCandidatosDaColeta(array $lote, array $videoIds, Usuario $usuario): array
    {
        $momentos = array_map(static fn (ItemHistoricoTakeoutYoutubeDTO $item): int => $item->tocadaEm->getTimestamp(), $lote);
        $fuso = new DateTimeZone(self::FUSO_UTC);

        return $this->reproducaoRepository->listarDasFontesNoIntervalo(
            $usuario,
            [FonteReproducaoYoutube::Coletor, FonteReproducaoYoutube::Extensao],
            $videoIds,
            (new DateTimeImmutable('@'.(min($momentos) - self::JANELA_TOLERANCIA_TAKEOUT_SEGUNDOS)))->setTimezone($fuso),
            (new DateTimeImmutable('@'.(max($momentos) + self::JANELA_TOLERANCIA_TAKEOUT_SEGUNDOS)))->setTimezone($fuso),
        );
    }

    /**
     * @param list<ReproducaoYoutube> $reproducoes
     *
     * @return array<string, array<int, ReproducaoYoutube>>
     */
    private function agruparPorVideo(array $reproducoes): array
    {
        $agrupadas = [];
        foreach ($reproducoes as $reproducao) {
            $agrupadas[$reproducao->video()->videoId()][spl_object_id($reproducao)] = $reproducao;
        }

        return $agrupadas;
    }

    /**
     * @param array<string, array<int, ReproducaoYoutube>> $candidatos
     */
    private function extrairCandidatoMaisProximo(array &$candidatos, ItemHistoricoTakeoutYoutubeDTO $item): ?ReproducaoYoutube
    {
        $escolhido = null;
        $menorDiferenca = self::JANELA_TOLERANCIA_TAKEOUT_SEGUNDOS + 1;

        foreach ($candidatos[$item->videoId] ?? [] as $identificador => $candidato) {
            $diferenca = abs($this->timestampGravadoEmUtc($candidato->tocadaEm()) - $item->tocadaEm->getTimestamp());

            if ($diferenca < $menorDiferenca) {
                $menorDiferenca = $diferenca;
                $escolhido = $identificador;
            }
        }

        if (null === $escolhido) {
            return null;
        }

        $candidato = $candidatos[$item->videoId][$escolhido];
        unset($candidatos[$item->videoId][$escolhido]);

        return $candidato;
    }

    private function timestampGravadoEmUtc(DateTimeImmutable $momento): int
    {
        $momentoUtc = DateTimeImmutable::createFromFormat(self::FORMATO_GRAVADO, $momento->format(self::FORMATO_GRAVADO), new DateTimeZone(self::FUSO_UTC));

        return false === $momentoUtc ? $momento->getTimestamp() : $momentoUtc->getTimestamp();
    }
}
