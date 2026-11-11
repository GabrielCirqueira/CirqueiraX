<?php

declare(strict_types=1);

namespace App\DataObject\Musica;

use App\Enum\FiltroFonteMusica;
use App\Exception\Musica\AnaliseMusicaException;
use Symfony\Component\HttpFoundation\Request;

final readonly class FiltroFonteRequisicaoDTO
{
    public const string PARAMETRO = 'fonte';

    public static function daRequisicao(Request $request): FiltroFonteMusica
    {
        $padrao = (string) $request->attributes->get(self::PARAMETRO, FiltroFonteMusica::Todas->value);
        $valor = trim((string) $request->query->get(self::PARAMETRO, $padrao));

        return FiltroFonteMusica::tryFrom('' === $valor ? $padrao : $valor) ?? throw AnaliseMusicaException::fonteInvalida($valor);
    }
}
