<?php

namespace App;

use App\Message\ColetarHistoricoYoutubeMusicMessage;
use App\Message\ExpirarAudiosAntigosMessage;
use App\Message\ExpirarAudiosTranscricaoMessage;
use App\Message\LimparVideosAntigosMessage;
use App\Message\SincronizarArtistasFaixasSpotifyMessage;
use App\Message\SincronizarHistoricoSpotifyMessage;
use Symfony\Component\Messenger\Message\RedispatchMessage;
use Symfony\Component\Scheduler\Attribute\AsSchedule;
use Symfony\Component\Scheduler\RecurringMessage;
use Symfony\Component\Scheduler\Schedule as SymfonySchedule;
use Symfony\Component\Scheduler\ScheduleProviderInterface;
use Symfony\Contracts\Cache\CacheInterface;

#[AsSchedule]
class Schedule implements ScheduleProviderInterface
{
    public function __construct(
        private CacheInterface $cache,
    ) {}

    public function getSchedule(): SymfonySchedule
    {
        return (new SymfonySchedule())
            ->stateful($this->cache)
            ->processOnlyLastMissedRun(true)
            ->add(
                RecurringMessage::every('5 minutes', new SincronizarHistoricoSpotifyMessage()),
                RecurringMessage::every('1 minute', new SincronizarArtistasFaixasSpotifyMessage()),
                RecurringMessage::every('30 seconds', new RedispatchMessage(new ColetarHistoricoYoutubeMusicMessage(), 'youtube_coleta')),
                RecurringMessage::every('1 day', new LimparVideosAntigosMessage(7)),
                RecurringMessage::every('1 day', new ExpirarAudiosAntigosMessage()),
                RecurringMessage::every('1 hour', new ExpirarAudiosTranscricaoMessage()),
            );
    }
}
