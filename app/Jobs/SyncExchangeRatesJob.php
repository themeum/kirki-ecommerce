<?php

namespace Kirki\Ecommerce\App\Jobs;

defined('ABSPATH') || exit;

use Kirki\Ecommerce\App\Facades\CurrencyExchange;
use Kirki\Ecommerce\Framework\Contracts\ShouldQueue;
use Kirki\Ecommerce\Framework\Queue\Concerns\Queueable;
use Throwable;

/**
 * Syncs exchange rates for one run of the automatic sync schedule, then queues the next run.
 *
 * The queue cannot cancel a job, so a run left behind by a replaced or stopped
 * schedule is neutralised by comparing its token with the stored one: a run
 * whose token is no longer current is a silent no-op.
 *
 * @since 1.0.0
 */
class SyncExchangeRatesJob implements ShouldQueue
{
    use Queueable;

    const QUEUE = 'currency-sync';

    /**
     * The number of times the job may be attempted.
     *
     * A failed sync is recorded and the next run is queued, so the queue never retries it.
     *
     * @var int
     */
    protected $tries = 1;

    /**
     * Token of the schedule this run belongs to.
     *
     * @var string
     */
    public $token;

    /**
     * Create a new job instance.
     *
     * @since 1.0.0
     *
     * @param string $token Token of the schedule this run belongs to.
     */
    public function __construct(string $token)
    {
        $this->token = $token;
        $this->on_queue(static::QUEUE);
    }

    /**
     * Sync the rates if this run's schedule is still current, then queue the next run.
     *
     * A failed sync keeps the stored rates and records the error.
     *
     * @since 1.0.0
     *
     * @return void
     */
    public function handle()
    {
        if (!CurrencyExchange::is_automatic_update_active() || !CurrencyExchange::is_current_schedule($this->token)) {
            return;
        }

        try {
            CurrencyExchange::sync();
            CurrencyExchange::clear_sync_error();
        } catch (Throwable $exception) {
            CurrencyExchange::record_sync_error($exception->getMessage());
        }

        CurrencyExchange::schedule_next($this->token);
    }
}
