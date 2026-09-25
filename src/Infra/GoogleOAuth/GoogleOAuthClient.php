<?php

declare(strict_types=1);

namespace App\Infra\GoogleOAuth;

use App\Infra\Client;
use GuzzleHttp\ClientInterface;
use Symfony\Component\Serializer\SerializerInterface;

abstract class GoogleOAuthClient extends Client
{
    public function __construct(
        ClientInterface $client,
        string $baseUrl = 'https://oauth2.googleapis.com',
        ?SerializerInterface $serializer = null,
    ) {
        parent::__construct($client, $baseUrl, $serializer);
    }
}
