<?php

declare(strict_types=1);

namespace App\Service\Usuario;

use App\Entity\Usuario;
use App\Enum\FuncionalidadeSistema;

final class ResolverPermissaoPorRotaService
{
    /**
     * @var list<array{prefixo: string, funcionalidades: list<FuncionalidadeSistema>}>
     */
    private const array MAPA = [
        ['prefixo' => '/api/v1/usuarios', 'funcionalidades' => [FuncionalidadeSistema::GerenciarUsuarios]],
        ['prefixo' => '/api/v1/musica', 'funcionalidades' => [FuncionalidadeSistema::Musica]],
        ['prefixo' => '/api/v1/spotify', 'funcionalidades' => [FuncionalidadeSistema::Musica]],
        ['prefixo' => '/api/v1/youtube-music', 'funcionalidades' => [FuncionalidadeSistema::Musica]],
        ['prefixo' => '/api/v1/transferencia-playlist', 'funcionalidades' => [FuncionalidadeSistema::Musica]],
        ['prefixo' => '/api/v1/dashboard', 'funcionalidades' => [FuncionalidadeSistema::Dashboard]],
        ['prefixo' => '/api/v1/downloads', 'funcionalidades' => [FuncionalidadeSistema::DownloadsVideo]],
        ['prefixo' => '/api/v1/videos', 'funcionalidades' => [FuncionalidadeSistema::DownloadsVideo]],
        ['prefixo' => '/api/v1/audios', 'funcionalidades' => [FuncionalidadeSistema::DownloadsAudio]],
        ['prefixo' => '/api/v1/livros-audio', 'funcionalidades' => [FuncionalidadeSistema::LivrosAudio]],
        ['prefixo' => '/api/v1/transcricoes', 'funcionalidades' => [FuncionalidadeSistema::Transcricoes]],
        ['prefixo' => '/api/v1/prints', 'funcionalidades' => [FuncionalidadeSistema::Prints]],
        ['prefixo' => '/api/v1/editor-imagem', 'funcionalidades' => [FuncionalidadeSistema::EditorImagem]],
        ['prefixo' => '/api/v1/extrair-texto', 'funcionalidades' => [FuncionalidadeSistema::ExtrairTexto]],
        ['prefixo' => '/api/v1/upload-manual', 'funcionalidades' => [FuncionalidadeSistema::UploadManual]],
        ['prefixo' => '/api/v1/google-fotos', 'funcionalidades' => [FuncionalidadeSistema::GoogleFotos]],
        [
            'prefixo' => '/api/v1/media-itens',
            'funcionalidades' => [
                FuncionalidadeSistema::CentralMidias,
                FuncionalidadeSistema::DownloadsVideo,
                FuncionalidadeSistema::DownloadsAudio,
                FuncionalidadeSistema::Prints,
                FuncionalidadeSistema::EditorImagem,
                FuncionalidadeSistema::ExtrairTexto,
                FuncionalidadeSistema::UploadManual,
                FuncionalidadeSistema::GoogleFotos,
                FuncionalidadeSistema::Dashboard,
            ],
        ],
    ];

    /**
     * @var list<string>
     */
    private const array IGNORAR = [
        '/api/v1/auth',
        '/api/v1/token',
        '/api/v1/health',
        '/api/v1/musica/capa',
        '/api/v1/livros-audio-arquivos',
        '/api/v1/ingestao',
        '/api/v1/youtube-music/extensao',
        '/api/v1/notificacoes',
        '/api/v1/sync',
        '/api/v1/categorias',
    ];

    public function usuarioTemAcesso(Usuario $usuario, string $caminho): bool
    {
        if ($usuario->isAdministrador()) {
            return true;
        }

        $exigidas = $this->funcionalidadesExigidas($caminho);
        if (null === $exigidas) {
            return true;
        }

        foreach ($exigidas as $funcionalidade) {
            if ($usuario->possuiPermissao($funcionalidade)) {
                return true;
            }
        }

        return false;
    }

    /**
     * @return list<FuncionalidadeSistema>|null
     */
    public function funcionalidadesExigidas(string $caminho): ?array
    {
        foreach (self::IGNORAR as $prefixo) {
            if (str_starts_with($caminho, $prefixo)) {
                return null;
            }
        }

        foreach (self::MAPA as $entrada) {
            if (str_starts_with($caminho, $entrada['prefixo'])) {
                return $entrada['funcionalidades'];
            }
        }

        return null;
    }

    public function executar(string $caminho): ?FuncionalidadeSistema
    {
        $exigidas = $this->funcionalidadesExigidas($caminho);
        if (null === $exigidas || [] === $exigidas) {
            return null;
        }

        return $exigidas[0];
    }
}
