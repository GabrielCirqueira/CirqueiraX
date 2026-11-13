<?php

declare(strict_types=1);

namespace App\Domain\Ia;

use JsonException;

final class LeitorJsonRespostaIa
{
    private const string EXPRESSAO_RACIOCINIO = '/<think>.*?<\/think>/s';
    private const string EXPRESSAO_CERCA_CODIGO = '/^```(?:json)?\s*|\s*```$/';
    private const int PROFUNDIDADE_MAXIMA = 64;
    private const string INICIO_OBJETO = '{';
    private const string FIM_OBJETO = '}';

    /**
     * Devolve o objeto JSON da resposta ou null quando o texto não traz um objeto com todos os campos obrigatórios.
     *
     * @param list<string> $camposObrigatorios
     *
     * @return array<string, mixed>|null
     */
    public function ler(string $texto, array $camposObrigatorios): ?array
    {
        $limpo = $this->limpar($texto);
        $json = $this->decodificar($limpo) ?? $this->decodificar($this->extrairObjeto($limpo));

        if (null === $json) {
            return null;
        }

        foreach ($camposObrigatorios as $campo) {
            if (!array_key_exists($campo, $json)) {
                return null;
            }
        }

        return $json;
    }

    private function limpar(string $texto): string
    {
        $semRaciocinio = trim((string) preg_replace(self::EXPRESSAO_RACIOCINIO, '', $texto));

        return trim((string) preg_replace(self::EXPRESSAO_CERCA_CODIGO, '', $semRaciocinio));
    }

    /**
     * @return array<string, mixed>|null
     */
    private function decodificar(?string $texto): ?array
    {
        if (null === $texto || '' === $texto) {
            return null;
        }

        try {
            $json = json_decode($texto, true, self::PROFUNDIDADE_MAXIMA, JSON_THROW_ON_ERROR);
        } catch (JsonException) {
            return null;
        }

        if (!is_array($json) || array_is_list($json)) {
            return null;
        }

        /** @var array<string, mixed> $json */
        return $json;
    }

    private function extrairObjeto(string $texto): ?string
    {
        $inicio = strpos($texto, self::INICIO_OBJETO);
        $fim = strrpos($texto, self::FIM_OBJETO);

        if (false === $inicio || false === $fim || $fim < $inicio) {
            return null;
        }

        return substr($texto, $inicio, $fim - $inicio + 1);
    }
}
