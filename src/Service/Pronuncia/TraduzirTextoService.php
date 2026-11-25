<?php

declare(strict_types=1);

namespace App\Service\Pronuncia;

use App\DataObject\Pronuncia\AnalisePronunciaDTO;
use App\DataObject\Pronuncia\TextosTraduzidosDTO;
use App\DataObject\Pronuncia\TraduzirTextoDTO;
use App\Entity\ConsultaPronuncia;
use App\Entity\FrasePronuncia;
use App\Entity\Usuario;
use App\Enum\DirecaoTraducao;
use App\Enum\IdiomaFrase;
use App\Exception\Pronuncia\PronunciaException;
use App\Exception\Pronuncia\TraducaoException;
use App\Interface\TradutorTextoInterface;
use App\Repository\ConsultaPronunciaRepository;
use App\Repository\FrasePronunciaRepository;

final readonly class TraduzirTextoService
{
    private const string ALGORITMO_HASH = 'sha256';
    private const string CHAVE_VERSAO_MOTOR = 'versaoMotor';

    public function __construct(
        private FrasePronunciaRepository $fraseRepository,
        private ConsultaPronunciaRepository $consultaRepository,
        private TradutorTextoInterface $tradutor,
        private GerarAnalisePronunciaService $gerarAnalise,
    ) {
    }

    /**
     * Traduz entre português e inglês e gera a pronúncia figurada do inglês. Frases já traduzidas saem do banco, sem gastar cota do DeepL.
     *
     * @throws PronunciaException|TraducaoException
     */
    public function executar(TraduzirTextoDTO $dto, Usuario $usuario): ConsultaPronuncia
    {
        $texto = $dto->texto();
        if ('' === $texto) {
            throw PronunciaException::textoVazio();
        }

        if (mb_strlen($texto) > TraduzirTextoDTO::TAMANHO_MAXIMO) {
            throw PronunciaException::textoMuitoLongo(TraduzirTextoDTO::TAMANHO_MAXIMO);
        }

        $frase = $this->obterFrase($texto, $dto->direcao());

        return $this->registrarConsulta($usuario, $frase);
    }

    private function obterFrase(string $texto, DirecaoTraducao $direcao): FrasePronuncia
    {
        $hash = hash(self::ALGORITMO_HASH, mb_strtolower($texto));
        $frase = $this->fraseRepository->buscarPorHash($hash);

        if (null !== $frase && $direcao->isCompativelCom($frase->idiomaOrigem())) {
            $frase->registrarConsulta();
            $this->atualizarAnaliseDesatualizada($frase);

            return $frase;
        }

        $textos = $this->traduzir($texto, $direcao);
        $analise = $this->gerarAnalise->executar($textos->ingles);

        if (null !== $frase) {
            $frase->retraduzir($textos->idiomaOrigem, $textos->portugues, $textos->ingles);
            $frase->atualizarAnalise($analise->paraArray(), $analise->palavrasIndexadas());
            $frase->registrarConsulta();

            return $frase;
        }

        return new FrasePronuncia($hash, $textos->idiomaOrigem, $textos->portugues, $textos->ingles, $analise->paraArray(), $analise->palavrasIndexadas());
    }

    private function atualizarAnaliseDesatualizada(FrasePronuncia $frase): void
    {
        if (AnalisePronunciaDTO::VERSAO_MOTOR === ($frase->analise()[self::CHAVE_VERSAO_MOTOR] ?? null)) {
            return;
        }

        $analise = $this->gerarAnalise->executar($frase->textoIngles());
        $frase->atualizarAnalise($analise->paraArray(), $analise->palavrasIndexadas());
    }

    private function traduzir(string $texto, DirecaoTraducao $direcao): TextosTraduzidosDTO
    {
        $origemFixa = $direcao->idiomaOrigemFixo();
        if (null !== $origemFixa) {
            return $this->traduzirDe($texto, $origemFixa);
        }

        $paraIngles = $this->tradutor->traduzir($texto, IdiomaFrase::Ingles);
        if (IdiomaFrase::Ingles === $paraIngles->idiomaDetectado) {
            return $this->traduzirDe($texto, IdiomaFrase::Ingles);
        }

        return new TextosTraduzidosDTO(IdiomaFrase::Portugues, $texto, $paraIngles->texto);
    }

    private function traduzirDe(string $texto, IdiomaFrase $origem): TextosTraduzidosDTO
    {
        $traducao = $this->tradutor->traduzir($texto, $origem->oposto(), $origem);

        return $origem->isIngles()
            ? new TextosTraduzidosDTO(IdiomaFrase::Ingles, $traducao->texto, $texto)
            : new TextosTraduzidosDTO(IdiomaFrase::Portugues, $texto, $traducao->texto);
    }

    private function registrarConsulta(Usuario $usuario, FrasePronuncia $frase): ConsultaPronuncia
    {
        $this->fraseRepository->salvar($frase, flush: false);
        $consulta = $this->consultaRepository->buscarDoUsuarioPorFrase($usuario, $frase);
        $consulta?->registrarNovaConsulta();
        $consulta ??= new ConsultaPronuncia($usuario, $frase);

        $this->consultaRepository->salvar($consulta);

        return $consulta;
    }
}
