<?php

declare(strict_types=1);

namespace App\Infra\GoogleFotos;

use App\Infra\Client;
use GuzzleHttp\ClientInterface;
use Symfony\Component\Serializer\SerializerInterface;

abstract class GoogleFotosClient extends Client
{
    public function __construct(
        ClientInterface $client,
        string $baseUrl = 'https://photoslibrary.googleapis.com',
        ?SerializerInterface $serializer = null,
    ) {
        parent::__construct($client, $baseUrl, $serializer);
    }
}
