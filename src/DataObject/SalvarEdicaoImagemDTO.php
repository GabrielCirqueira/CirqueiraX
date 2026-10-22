<?php

declare(strict_types=1);

namespace App\DataObject;

use App\Support\TextoUtil;
use Symfony\Component\HttpFoundation\File\UploadedFile;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Validator\Constraints as Assert;

final readonly class SalvarEdicaoImagemDTO
{
    public function __construct(
        #[Assert\NotNull(message: 'A imagem editada é obrigatória.')]
        #[Assert\File(
            maxSize: '50M',
            mimeTypes: ['image/png', 'image/jpeg', 'image/webp'],
            mimeTypesMessage: 'A imagem editada deve ser PNG, JPEG ou WebP.'
        )]
        public ?UploadedFile $arquivo,
        #[Assert\Uuid(message: 'O formato do UUID da mídia original é inválido.')]
        public ?string $mediaItemOrigemUuid = null,
        public ?string $categoriaId = null,
        #[Assert\Length(max: 255, maxMessage: 'O nome da imagem deve ter no máximo 255 caracteres.')]
        public ?string $nomeArquivo = null,
    ) {}

    public static function fromRequest(Request $request): self
    {
        /** @var UploadedFile|null $arquivo */
        $arquivo = $request->files->get('arquivo');

        return new self(
            arquivo: $arquivo,
            mediaItemOrigemUuid: self::textoOuNulo($request->request->get('mediaItemOrigemUuid')),
            categoriaId: self::textoOuNulo($request->request->get('categoriaId')),
            nomeArquivo: self::textoOuNulo($request->request->get('nomeArquivo')),
        );
    }

    public function arquivo(): ?UploadedFile
    {
        return $this->arquivo;
    }

    public function mediaItemOrigemUuid(): ?string
    {
        return $this->mediaItemOrigemUuid;
    }

    public function categoriaId(): ?string
    {
        return $this->categoriaId;
    }

    public function nomeArquivo(): ?string
    {
        return $this->nomeArquivo;
    }

    private static function textoOuNulo(mixed $valor): ?string
    {
        if (!is_string($valor) || TextoUtil::estaEmBranco($valor)) {
            return null;
        }

        return trim($valor);
    }
}
