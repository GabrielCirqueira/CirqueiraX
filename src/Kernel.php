<?php

namespace App;

use RecursiveDirectoryIterator;
use RecursiveIteratorIterator;
use SplFileInfo;
use Symfony\Bundle\FrameworkBundle\Kernel\MicroKernelTrait;
use Symfony\Component\Config\Resource\DirectoryResource;
use Symfony\Component\Config\Resource\FileResource;
use Symfony\Component\DependencyInjection\ContainerBuilder;
use Symfony\Component\HttpKernel\Kernel as BaseKernel;

class Kernel extends BaseKernel
{
    use MicroKernelTrait;

    private const array DIRETORIOS_CODIGO_ANALISE = [
        'src/DataObject',
        'src/Enum',
        'src/Service/Musica/Analise',
    ];

    private const array ARQUIVOS_CODIGO_ANALISE = [
        'src/Repository/AnaliseReproducaoMusicalRepository.php',
        'src/Service/Spotify/AplicarImagensAnaliseSpotifyService.php',
        'src/Service/Spotify/CacheAnaliseSpotifyService.php',
        'src/Service/Spotify/CalcularSequenciasSpotifyService.php',
        'src/Service/Spotify/EnriquecerImagensSpotifyService.php',
    ];

    protected function build(ContainerBuilder $container): void
    {
        $container->setParameter('app.versao_codigo_analise', $this->calcularVersaoCodigoAnalise($container));
    }

    private function calcularVersaoCodigoAnalise(ContainerBuilder $container): string
    {
        $raiz = $this->getProjectDir().'/';
        $arquivos = [];
        foreach (self::ARQUIVOS_CODIGO_ANALISE as $arquivo) {
            if (is_file($raiz.$arquivo)) {
                $arquivos[$arquivo] = $raiz.$arquivo;
                $container->addResource(new FileResource($raiz.$arquivo));
            }
        }

        foreach (self::DIRETORIOS_CODIGO_ANALISE as $diretorio) {
            if (!is_dir($raiz.$diretorio)) {
                continue;
            }

            $container->addResource(new DirectoryResource($raiz.$diretorio, '/\\.php$/'));
            $iterador = new RecursiveIteratorIterator(new RecursiveDirectoryIterator($raiz.$diretorio, RecursiveDirectoryIterator::SKIP_DOTS));
            foreach ($iterador as $arquivo) {
                if ($arquivo instanceof SplFileInfo && $arquivo->isFile() && 'php' === $arquivo->getExtension()) {
                    $arquivos[substr($arquivo->getPathname(), strlen($raiz))] = $arquivo->getPathname();
                }
            }
        }

        ksort($arquivos);
        $contexto = hash_init('xxh128');
        foreach ($arquivos as $relativo => $caminho) {
            hash_update($contexto, $relativo);
            hash_update_file($contexto, $caminho);
        }

        return hash_final($contexto);
    }
}
