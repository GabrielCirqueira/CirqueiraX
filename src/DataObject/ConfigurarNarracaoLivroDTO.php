<?php

declare(strict_types=1);

namespace App\DataObject;

use App\Enum\ModoNotasLivroAudio;
use Symfony\Component\Validator\Constraints as Assert;

final readonly class ConfigurarNarracaoLivroDTO
{
    /**
     * @param list<array{de: string, para: string}> $pronuncias
     */
    public function __construct(
        #[Assert\NotBlank(message: 'O modo de leitura das notas é obrigatório.')]
        #[Assert\Choice(choices: ['normal', 'fim_capitulo', 'pular'], message: 'Modo de leitura das notas inválido.')]
        public string $modoNotas,
        #[Assert\Count(max: 200, maxMessage: 'O dicionário aceita no máximo {{ limit }} palavras.')]
        #[Assert\All([
            new Assert\Collection(
                fields: [
                    'de' => [new Assert\NotBlank(message: 'Informe a palavra como está no livro.'), new Assert\Length(max: 120)],
                    'para' => [new Assert\Type('string'), new Assert\Length(max: 240)],
                ],
            ),
        ])]
        public array $pronuncias = [],
    ) {}

    public function modoNotas(): ModoNotasLivroAudio
    {
        return ModoNotasLivroAudio::from($this->modoNotas);
    }

    /**
     * @return list<array{de: string, para: string}>
     */
    public function pronuncias(): array
    {
        $normalizadas = [];
        foreach ($this->pronuncias as $pronuncia) {
            $de = trim((string) preg_replace('/\s+/u', ' ', $pronuncia['de']));
            $para = trim((string) preg_replace('/\s+/u', ' ', $pronuncia['para']));
            if ('' === $de) {
                continue;
            }

            $normalizadas[mb_strtolower($de)] = ['de' => $de, 'para' => $para];
        }

        return array_values($normalizadas);
    }
}
