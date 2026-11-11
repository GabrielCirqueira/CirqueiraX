<?php

declare(strict_types=1);

namespace App\Enum;

enum EtapaImportacaoYoutube: string
{
    case Leitura = 'leitura';
    case Enriquecimento = 'enriquecimento';
    case Filtro = 'filtro';
    case Previa = 'previa';
    case Classificacao = 'classificacao';
    case TempoOuvido = 'tempo_ouvido';
    case Concluida = 'concluida';

    public function descricao(): string
    {
        return match ($this) {
            self::Leitura => 'Lendo o arquivo',
            self::Enriquecimento => 'Buscando detalhes dos vídeos',
            self::Filtro => 'Descartando o que não é música',
            self::Previa => 'Calculando a prévia de custo',
            self::Classificacao => 'Classificando com IA',
            self::TempoOuvido => 'Estimando o tempo ouvido',
            self::Concluida => 'Concluída',
        };
    }
}
