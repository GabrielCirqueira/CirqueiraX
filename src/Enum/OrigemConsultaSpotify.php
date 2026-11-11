<?php

declare(strict_types=1);

namespace App\Enum;

enum OrigemConsultaSpotify: string
{
    case Coleta = 'coleta_historico';
    case TocandoAgora = 'tocando_agora';
    case Capas = 'capas';
    case Artistas = 'busca_artistas';
    case Autorizacao = 'autorizacao';

    public function isArtistas(): bool
    {
        return self::Artistas === $this;
    }

    public function descricao(): string
    {
        return match ($this) {
            self::Coleta => 'Coleta das músicas recentes',
            self::TocandoAgora => 'Tocando agora',
            self::Capas => 'Capas e fotos',
            self::Artistas => 'Busca de artistas',
            self::Autorizacao => 'Conexão e renovação do acesso',
        };
    }
}
