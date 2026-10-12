<?php

namespace App;

use App\Message\LimparVideosAntigosMessage;
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
                // Executa a cada 1 dia para expurgar vídeos antigos com mais de 7 dias
                RecurringMessage::every('1 day', new LimparVideosAntigosMessage(7))
            );
    }
}
