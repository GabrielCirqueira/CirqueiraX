<?php

declare(strict_types=1);

namespace App\Enum;

enum FuncionalidadeSistema: string
{
    case Dashboard = 'dashboard';
    case Musica = 'musica';
    case CentralMidias = 'central_midias';
    case DownloadsVideo = 'downloads_video';
    case DownloadsAudio = 'downloads_audio';
    case LivrosAudio = 'livros_audio';
    case Transcricoes = 'transcricoes';
    case Pronuncia = 'pronuncia';
    case Prints = 'prints';
    case EditorImagem = 'editor_imagem';
    case ExtrairTexto = 'extrair_texto';
    case UploadManual = 'upload_manual';
    case GoogleFotos = 'google_fotos';
    case GerenciarUsuarios = 'gerenciar_usuarios';

    public function descricao(): string
    {
        return match ($this) {
            self::Dashboard => 'Dashboard',
            self::Musica => 'Música',
            self::CentralMidias => 'Central de Mídias',
            self::DownloadsVideo => 'Downloads de Vídeo',
            self::DownloadsAudio => 'Downloads MP3',
            self::LivrosAudio => 'Livros em Áudio',
            self::Transcricoes => 'Transcrições',
            self::Pronuncia => 'Inglês & Pronúncia',
            self::Prints => 'Prints & Capturas',
            self::EditorImagem => 'Editor de Imagem',
            self::ExtrairTexto => 'Extrair Texto',
            self::UploadManual => 'Upload Manual',
            self::GoogleFotos => 'Google Fotos',
            self::GerenciarUsuarios => 'Gerenciar Usuários',
        };
    }

    /**
     * @return list<string>
     */
    public static function valores(): array
    {
        return array_map(static fn (self $item): string => $item->value, self::cases());
    }
}
