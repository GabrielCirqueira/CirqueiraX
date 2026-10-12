<?php

declare(strict_types=1);

namespace App\Support;

final class MetadataKeys
{
    public const string URL_ORIGINAL = 'url_original';
    public const string NOME_ORIGINAL = 'nome_original';
    public const string CATEGORIA_ID_DESEJADA = 'categoria_id_desejada';
    public const string TIMESTAMP_CAPTURA = 'timestamp_captura';
    public const string ORIGEM_TOKEN = 'origem_token';
    public const string TITULO = 'titulo';
    public const string UPLOADER = 'uploader';
    public const string DURACAO = 'duracao';
    public const string DATA = 'data';
    public const string EXTENSAO = 'extensao';
    public const string THUMBNAIL = 'thumbnail';

    // Metadados de integridade, identificação e deduplicação
    public const string HASH_SHA256 = 'hash_sha256';
    public const string HASH_MD5 = 'hash_md5';
    public const string TAMANHO_BYTES = 'tamanho_bytes';
    public const string MIME_TYPE = 'mime_type';
    public const string LARGURA = 'largura';
    public const string ALTURA = 'altura';
    public const string DIMENSOES = 'dimensoes';
    public const string FINGERPRINT = 'fingerprint';
    public const string DATA_CRIACAO_ARQUIVO = 'data_criacao_arquivo';

    // Metadados de sincronização Google Fotos
    public const string GOOGLE_PHOTOS_ID = 'google_photos_id';
    public const string GOOGLE_PHOTOS_ALBUM_ID = 'google_photos_album_id';
    public const string GOOGLE_PHOTOS_UPLOADED_AT = 'google_photos_uploaded_at';

    // Rastreamento de duplicidade
    public const string DUPLICADO = 'duplicado';
    public const string DUPLICADO_DE_UUID = 'duplicado_de_uuid';
    public const string DATA_DETECCAO_DUPLICADO = 'data_deteccao_duplicado';
    public const string TENTATIVAS_DUPLICADAS = 'tentativas_duplicadas';
}
