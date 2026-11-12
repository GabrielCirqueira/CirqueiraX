<?php

declare(strict_types=1);

namespace App\Service\YoutubeMusic;

use App\DataObject\YoutubeMusic\CredenciaisYoutubeMusicDTO;
use App\Entity\ContaYoutubeMusic;
use App\Exception\YoutubeMusic\YoutubeMusicException;
use App\Interface\CriptografiaInterface;
use App\Interface\YoutubeMusicInterface;
use App\Repository\ContaYoutubeMusicRepository;
use App\Service\Spotify\CacheAnaliseSpotifyService;
use DateTimeImmutable;
use Psr\Log\LoggerInterface;

final readonly class ColetarHistoricoYoutubeMusicService
{
    public const int INTERVALO_ATIVO_SEGUNDOS = 30;
    public const int INTERVALO_OCIOSO_SEGUNDOS = 120;
    public const int INTERVALO_MINIMO_SEGUNDOS = 15;
    private const int JANELA_ATIVIDADE_SEGUNDOS = 600;
    private const int RESERVA_CONSULTA_SEGUNDOS = 120;
    private const int TOLERANCIA_AGENDADOR_SEGUNDOS = 5;
    private const string FORMATO_SEGUNDOS_ADIANTE = '+%d seconds';
    private const string FORMATO_SEGUNDOS_ATRAS = '-%d seconds';

    public function __construct(
        private ContaYoutubeMusicRepository $contaRepository,
        private YoutubeMusicInterface $youtubeMusic,
        private CriptografiaInterface $criptografia,
        private DetectarNovasReproducoesYoutubeService $detectarNovas,
        private RegistrarReproducoesYoutubeService $registrarReproducoes,
        private AtualizarReproducaoEmAndamentoYoutubeService $atualizarEmAndamento,
        private TratarErroColetaYoutubeMusicService $tratarErro,
        private CacheAnaliseSpotifyService $cacheAnalise,
        private LoggerInterface $logger,
    ) {
    }

    public function executarContasVencidas(): int
    {
        $contas = $this->contaRepository->listarComConsultaVencida(new DateTimeImmutable());
        foreach ($contas as $conta) {
            $this->executar($conta);
        }

        return count($contas);
    }

    public function executar(ContaYoutubeMusic $conta): void
    {
        $credenciaisCriptografadas = $conta->credenciaisCriptografadas();
        if (!$conta->isConectada() || null === $credenciaisCriptografadas || !$this->isIntervaloMinimoRespeitado($conta)) {
            return;
        }

        $conta->definirProximaConsulta($this->adiante(self::RESERVA_CONSULTA_SEGUNDOS));
        $this->contaRepository->salvar($conta);

        $credenciais = new CredenciaisYoutubeMusicDTO($this->criptografia->descriptografar($credenciaisCriptografadas));

        try {
            $this->consultar($conta, $credenciais);
        } catch (YoutubeMusicException $erro) {
            $this->tratarErro->executar($conta, $credenciais, $erro);
        }

        $this->contaRepository->salvar($conta);
    }

    private function consultar(ContaYoutubeMusic $conta, CredenciaisYoutubeMusicDTO $credenciais): void
    {
        $vistoEm = new DateTimeImmutable();
        $historico = $this->youtubeMusic->listarHistorico($credenciais);
        $idsAtuais = $historico->videoIds();
        $snapshot = array_slice($idsAtuais, 0, ContaYoutubeMusic::TAMANHO_SNAPSHOT_TOPO);

        if ($conta->isPrimeiraConsulta()) {
            $conta->registrarConsulta($snapshot, false);
            $conta->definirProximaConsulta($this->adiante(self::INTERVALO_OCIOSO_SEGUNDOS));

            return;
        }

        $quantidadeNovas = $this->detectarNovas->executar($idsAtuais, $conta->snapshotTopo());
        $criadas = $this->registrarReproducoes->executar($conta->usuario(), array_slice($historico->itens, 0, $quantidadeNovas), $this->estimarInicioDoMaisRecente($conta, $vistoEm));
        $this->atualizarEmAndamento->executar($conta->usuario(), $idsAtuais, $vistoEm);

        $conta->registrarConsulta($snapshot, $quantidadeNovas > 0);
        $conta->definirProximaConsulta($vistoEm->modify(sprintf(self::FORMATO_SEGUNDOS_ADIANTE, $this->calcularIntervalo($conta, $vistoEm) - self::TOLERANCIA_AGENDADOR_SEGUNDOS)));

        if ($criadas > 0) {
            $this->cacheAnalise->invalidar($conta->usuario());
        }

        $this->logger->info('Coleta do YouTube Music concluída.', [
            'contaUuid' => $conta->uuid()->toRfc4122(),
            'itensNovos' => $quantidadeNovas,
            'reproducoesCriadas' => $criadas,
        ]);
    }

    private function calcularIntervalo(ContaYoutubeMusic $conta, DateTimeImmutable $agora): int
    {
        $ultimaNovidade = $conta->ultimaNovidadeEm();
        if (null !== $ultimaNovidade && $agora->getTimestamp() - $ultimaNovidade->getTimestamp() <= self::JANELA_ATIVIDADE_SEGUNDOS) {
            return max(self::INTERVALO_MINIMO_SEGUNDOS, self::INTERVALO_ATIVO_SEGUNDOS);
        }

        return max(self::INTERVALO_MINIMO_SEGUNDOS, self::INTERVALO_OCIOSO_SEGUNDOS);
    }

    private function estimarInicioDoMaisRecente(ContaYoutubeMusic $conta, DateTimeImmutable $vistoEm): DateTimeImmutable
    {
        $ultimaConsulta = $conta->ultimaConsultaEm();
        if (null === $ultimaConsulta) {
            return $vistoEm;
        }

        $intervalo = min(max(0, $vistoEm->getTimestamp() - $ultimaConsulta->getTimestamp()), self::INTERVALO_OCIOSO_SEGUNDOS);

        return $vistoEm->modify(sprintf(self::FORMATO_SEGUNDOS_ATRAS, intdiv($intervalo, 2)));
    }

    private function isIntervaloMinimoRespeitado(ContaYoutubeMusic $conta): bool
    {
        $ultimaConsulta = $conta->ultimaConsultaEm();

        return null === $ultimaConsulta || time() - $ultimaConsulta->getTimestamp() >= self::INTERVALO_MINIMO_SEGUNDOS;
    }

    private function adiante(int $segundos): DateTimeImmutable
    {
        return new DateTimeImmutable(sprintf(self::FORMATO_SEGUNDOS_ADIANTE, $segundos));
    }
}
