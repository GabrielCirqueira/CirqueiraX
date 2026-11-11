<?php

declare(strict_types=1);

namespace App\Interface;

use App\DataObject\YoutubeMusic\ContaValidadaYoutubeMusicDTO;
use App\DataObject\YoutubeMusic\CredenciaisYoutubeMusicDTO;
use App\DataObject\YoutubeMusic\ListaHistoricoYoutubeMusicDTO;
use App\DataObject\YoutubeMusic\ResultadoBuscaYoutubeMusicDTO;

interface YoutubeMusicInterface
{
    public function validarCredenciais(CredenciaisYoutubeMusicDTO $credenciais): ContaValidadaYoutubeMusicDTO;

    public function listarHistorico(CredenciaisYoutubeMusicDTO $credenciais): ListaHistoricoYoutubeMusicDTO;

    public function buscarMusica(string $texto, int $limite = 5): ResultadoBuscaYoutubeMusicDTO;
}
