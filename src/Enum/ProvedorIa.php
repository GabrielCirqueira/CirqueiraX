<?php

declare(strict_types=1);

namespace App\Enum;

enum ProvedorIa: string
{
    case Groq = 'groq';
    case Gemini = 'gemini';
    case Mistral = 'mistral';
    case OpenRouter = 'openrouter';
    case Cloudflare = 'cloudflare';
    case Nvidia = 'nvidia';
    case Zai = 'zai';
    case OpenAi = 'openai';

    public function nome(): string
    {
        return match ($this) {
            self::Groq => 'Groq',
            self::Gemini => 'Google Gemini',
            self::Mistral => 'Mistral',
            self::OpenRouter => 'OpenRouter',
            self::Cloudflare => 'Cloudflare Workers AI',
            self::Nvidia => 'NVIDIA NIM',
            self::Zai => 'Z.AI',
            self::OpenAi => 'OpenAI',
        };
    }
}
