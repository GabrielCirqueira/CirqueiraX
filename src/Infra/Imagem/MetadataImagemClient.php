<?php

declare(strict_types=1);

namespace App\Infra\Imagem;

use App\Interface\MetadataImagemInterface;
use DateTimeImmutable;
use DateTimeZone;
use Psr\Log\LoggerInterface;

final readonly class MetadataImagemClient implements MetadataImagemInterface
{
    private const string ASSINATURA_PNG = "\x89PNG\r\n\x1a\n";
    private const int TAMANHO_ASSINATURA_PNG = 8;
    private const int TAMANHO_ESTRUTURA_CHUNK = 12;
    private const string CHUNK_CABECALHO = 'IHDR';
    private const string CHUNK_EXIF = 'eXIf';
    private const string CHUNK_TEXTO_INTERNACIONAL = 'iTXt';
    private const string PALAVRA_CHAVE_XMP = "XML:com.adobe.xmp\0";
    private const string FUSO_PADRAO = 'America/Sao_Paulo';
    private const string FORMATO_DATA_EXIF = 'Y:m:d H:i:s';
    private const string FORMATO_DATA_XMP = 'Y-m-d\TH:i:sP';
    private const string PREFIXO_COPIA = 'cirqueirax_upload_';
    private const int TAG_DATA_HORA = 0x0132;
    private const int TAG_PONTEIRO_EXIF = 0x8769;
    private const int TAG_DATA_HORA_ORIGINAL = 0x9003;
    private const int TAG_DATA_HORA_DIGITALIZADA = 0x9004;
    private const int TAG_FUSO_ORIGINAL = 0x9011;
    private const int TIPO_TEXTO = 2;
    private const int TIPO_LONGO = 4;
    private const int TAMANHO_DATA_EXIF = 20;
    private const int TAMANHO_FUSO_EXIF = 7;
    private const int POSICAO_IFD_PRINCIPAL = 8;
    private const int POSICAO_DATA_HORA = 38;
    private const int POSICAO_IFD_EXIF = 58;
    private const int POSICAO_DATA_ORIGINAL = 100;
    private const int POSICAO_DATA_DIGITALIZADA = 120;
    private const int POSICAO_FUSO_ORIGINAL = 140;

    public function __construct(
        private LoggerInterface $logger,
    ) {}

    public function gerarCopiaPngComData(string $caminhoArquivo, DateTimeImmutable $dataCaptura): ?string
    {
        $conteudo = is_file($caminhoArquivo) ? file_get_contents($caminhoArquivo) : false;
        if (false === $conteudo || !str_starts_with($conteudo, self::ASSINATURA_PNG)) {
            return null;
        }

        $dataLocal = $dataCaptura->setTimezone(new DateTimeZone(self::FUSO_PADRAO));
        $caminhoCopia = sprintf('%s/%s%s.png', sys_get_temp_dir(), self::PREFIXO_COPIA, bin2hex(random_bytes(6)));

        if (false === file_put_contents($caminhoCopia, $this->inserirChunksDeData($conteudo, $dataLocal))) {
            $this->logger->warning('Não foi possível gerar a cópia do PNG com a data de captura.', ['caminho' => $caminhoArquivo]);

            return null;
        }

        return $caminhoCopia;
    }

    public function removerCopia(string $caminhoCopia): void
    {
        if (!is_file($caminhoCopia) || unlink($caminhoCopia)) {
            return;
        }

        $this->logger->warning('Não foi possível remover a cópia temporária do PNG.', ['caminho' => $caminhoCopia]);
    }

    private function inserirChunksDeData(string $conteudo, DateTimeImmutable $data): string
    {
        $chunksDeData = $this->montarChunk(self::CHUNK_EXIF, $this->montarExif($data))
            . $this->montarChunk(self::CHUNK_TEXTO_INTERNACIONAL, self::PALAVRA_CHAVE_XMP . "\0\0\0\0" . $this->montarXmp($data));

        $saida = substr($conteudo, 0, self::TAMANHO_ASSINATURA_PNG);
        $posicao = self::TAMANHO_ASSINATURA_PNG;
        $tamanhoConteudo = strlen($conteudo);

        while ($posicao + self::TAMANHO_ESTRUTURA_CHUNK <= $tamanhoConteudo) {
            $tamanhoDados = unpack('N', substr($conteudo, $posicao, 4))[1];
            $chunk = substr($conteudo, $posicao, self::TAMANHO_ESTRUTURA_CHUNK + $tamanhoDados);
            $posicao += self::TAMANHO_ESTRUTURA_CHUNK + $tamanhoDados;
            $saida .= $this->filtrarChunk($chunk, $chunksDeData);
        }

        return $saida;
    }

    private function filtrarChunk(string $chunk, string $chunksDeData): string
    {
        $tipo = substr($chunk, 4, 4);
        $ehXmp = self::CHUNK_TEXTO_INTERNACIONAL === $tipo && str_starts_with(substr($chunk, 8), self::PALAVRA_CHAVE_XMP);

        if (self::CHUNK_EXIF === $tipo || $ehXmp) {
            return '';
        }

        if (self::CHUNK_CABECALHO === $tipo) {
            return $chunk . $chunksDeData;
        }

        return $chunk;
    }

    private function montarChunk(string $tipo, string $dados): string
    {
        return pack('N', strlen($dados)) . $tipo . $dados . pack('N', crc32($tipo . $dados));
    }

    private function montarExif(DateTimeImmutable $data): string
    {
        $dataExif = $data->format(self::FORMATO_DATA_EXIF) . "\0";
        $fusoExif = $data->format('P') . "\0";

        $ifdPrincipal = pack('n', 2)
            . $this->montarEntradaIfd(self::TAG_DATA_HORA, self::TIPO_TEXTO, self::TAMANHO_DATA_EXIF, self::POSICAO_DATA_HORA)
            . $this->montarEntradaIfd(self::TAG_PONTEIRO_EXIF, self::TIPO_LONGO, 1, self::POSICAO_IFD_EXIF)
            . pack('N', 0);

        $ifdExif = pack('n', 3)
            . $this->montarEntradaIfd(self::TAG_DATA_HORA_ORIGINAL, self::TIPO_TEXTO, self::TAMANHO_DATA_EXIF, self::POSICAO_DATA_ORIGINAL)
            . $this->montarEntradaIfd(self::TAG_DATA_HORA_DIGITALIZADA, self::TIPO_TEXTO, self::TAMANHO_DATA_EXIF, self::POSICAO_DATA_DIGITALIZADA)
            . $this->montarEntradaIfd(self::TAG_FUSO_ORIGINAL, self::TIPO_TEXTO, self::TAMANHO_FUSO_EXIF, self::POSICAO_FUSO_ORIGINAL)
            . pack('N', 0);

        return "MM\x00\x2A" . pack('N', self::POSICAO_IFD_PRINCIPAL)
            . $ifdPrincipal . $dataExif
            . $ifdExif . $dataExif . $dataExif . $fusoExif;
    }

    private function montarEntradaIfd(int $tag, int $tipo, int $quantidade, int $valor): string
    {
        return pack('nnNN', $tag, $tipo, $quantidade, $valor);
    }

    private function montarXmp(DateTimeImmutable $data): string
    {
        $dataIso = $data->format(self::FORMATO_DATA_XMP);

        return '<?xpacket begin="' . "\u{FEFF}" . '" id="W5M0MpCehiHzreSzNTczkc9d"?>'
            . '<x:xmpmeta xmlns:x="adobe:ns:meta/"><rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#">'
            . '<rdf:Description rdf:about="" xmlns:xmp="http://ns.adobe.com/xap/1.0/"'
            . ' xmlns:photoshop="http://ns.adobe.com/photoshop/1.0/" xmlns:exif="http://ns.adobe.com/exif/1.0/"'
            . sprintf(' xmp:CreateDate="%1$s" photoshop:DateCreated="%1$s" exif:DateTimeOriginal="%1$s"/>', $dataIso)
            . '</rdf:RDF></x:xmpmeta><?xpacket end="w"?>';
    }
}
