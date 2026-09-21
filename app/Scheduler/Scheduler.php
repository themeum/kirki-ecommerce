<?php

namespace Kirki\Ecommerce\App\Scheduler;

use Kirki\Ecommerce\App\Scheduler\Constants\Config;
use Kirki\Ecommerce\App\Scheduler\Runner;
use Kirki\Ecommerce\Framework\Http\Superglobals;
use Kirki\Ecommerce\Framework\Sanitizer;
use Kirki\Ecommerce\Framework\Supports\Facades\Option;

use function Kirki\Ecommerce\Framework\app;
use function Kirki\Ecommerce\Framework\uuid;
use function Kirki\Ecommerce\Framework\with_prefix;

/**
 * Sets up and boots the scheduler: cron events, async worker endpoint and job cleanup.
 *
 * @since 1.0.0
 */
class Scheduler
{
    /**
     * Prepare the scheduler on plugin activation or installation.
     *
     * Creates the async worker secret key if missing, clears previously scheduled cron events
     * and schedules them again.
     *
     * @since 1.0.0
     *
     * @return void
     */
    public static function setup()
    {
        static::create_async_worker_key();
        static::reset_scheduled_cron();

        // Initiate the cron schedule once in the setup phase.
        static::schedule_cron();
    }

    /**
     * Generate and store the async worker secret key if it does not exist yet.
     *
     * The key authenticates the internal HTTP requests that trigger the background worker.
     *
     * @since 1.0.0
     *
     * @return void
     */
    protected static function create_async_worker_key()
    {
        if (!Option::get(Config::ASYNC_WORKER_SECRET_KEY_NAME)) {
            Option::set(Config::ASYNC_WORKER_SECRET_KEY_NAME, uuid());
        }
    }

    /**
     * Unschedule the scheduler and cleanup cron events if they are scheduled.
     *
     * @since 1.0.0
     *
     * @return void
     */
    protected static function reset_scheduled_cron()
    {
        if ($timeout = wp_next_scheduled(Config::SCHEDULER_CRON_EVENT_NAME)) {
            wp_unschedule_event($timeout, Config::SCHEDULER_CRON_EVENT_NAME);
        }

        if ($timeout = wp_next_scheduled(Config::SCHEDULER_CRON_CLEANUP_EVENT_NAME)) {
            wp_unschedule_event($timeout, Config::SCHEDULER_CRON_CLEANUP_EVENT_NAME);
        }
    }

    /**
     * Schedule the scheduler cron event (every minute) and the daily cleanup event if not already scheduled.
     *
     * @since 1.0.0
     *
     * @return void
     */
    protected static function schedule_cron()
    {
        if (!wp_next_scheduled(Config::SCHEDULER_CRON_EVENT_NAME)) {
            wp_schedule_event(time(), Config::CRON_EVENT_INTERVAL, Config::SCHEDULER_CRON_EVENT_NAME);
        }

        if (!wp_next_scheduled(Config::SCHEDULER_CRON_CLEANUP_EVENT_NAME)) {
            wp_schedule_event(time(), 'daily', Config::SCHEDULER_CRON_CLEANUP_EVENT_NAME);
        }
    }

    /**
     * Register the custom one-minute cron interval.
     *
     * Adds it to the `cron_schedules` filter, since WordPress has no one-minute interval by default.
     *
     * @since 1.0.0
     *
     * @return void
     */
    protected static function create_cron_interval()
    {
        add_filter('cron_schedules', function ($schedules) {
            $schedules[Config::CRON_EVENT_INTERVAL] = [
                'interval' => 60,
                'display' => __('Every Minute', 'kirki-ecommerce'),
            ];

            return $schedules;
        });
    }

    /**
     * Hook run() to the scheduler cron event.
     *
     * @since 1.0.0
     *
     * @return void
     */
    protected static function trigger_event_every_minute()
    {
        add_action(Config::SCHEDULER_CRON_EVENT_NAME, [static::class, 'run']);
    }

    /**
     * Hook handle_cleanup() to the daily cleanup cron event.
     *
     * @since 1.0.0
     *
     * @return void
     */
    protected static function trigger_event_daily_cleanup()
    {
        add_action(Config::SCHEDULER_CRON_CLEANUP_EVENT_NAME, [static::class, 'handle_cleanup']);
    }


    /**
     * Hook run_async_worker() to the async worker AJAX actions for logged-in and guest requests.
     *
     * @since 1.0.0
     *
     * @return void
     */
    protected static function trigger_event_by_async_worker()
    {
        add_action('wp_ajax_' . with_prefix(Config::ASYNC_WORKER_ACTION_NAME), [static::class, 'run_async_worker']);
        add_action('wp_ajax_nopriv_' . with_prefix(Config::ASYNC_WORKER_ACTION_NAME), [static::class, 'run_async_worker']);
    }

    /**
     * Process one batch of queued jobs through the runner.
     *
     * Hooked to the scheduler cron event.
     *
     * @since 1.0.0
     *
     * @return void
     */
    public static function run()
    {
        return static::runner()->run();
    }

    /**
     * Get the runner instance from the container.
     *
     * @since 1.0.0
     *
     * @return Runner
     */
    protected static function runner()
    {
        return app()->make(Runner::class);
    }

    /**
     * Handle the async worker AJAX request.
     *
     * Dies with an access denied message unless the posted secret matches the stored key. Otherwise
     * runs the scheduler and terminates the request.
     *
     * @since 1.0.0
     *
     * @return void
     */
    public static function run_async_worker()
    {
        $secret = Option::get(Config::ASYNC_WORKER_SECRET_KEY_NAME);
        $submitted_secret = Superglobals::post('secret', '', Sanitizer::TEXT);

        if (!is_string($secret) || $secret === '' || !hash_equals($secret, $submitted_secret)) {
            wp_die(esc_html__('Access Denied!', 'kirki-ecommerce'));
        }

        static::run();
        wp_die();
    }

    /**
     * Delete old failed and completed jobs.
     *
     * Hooked to the daily cleanup cron event.
     *
     * @since 1.0.0
     *
     * @return void
     */
    public static function handle_cleanup()
    {
        $runner = static::runner();
        $runner->clean_failed_jobs();
        $runner->clean_completed_jobs();
    }

    /**
     * Register the cron interval, cron events and the hooks that run the scheduler.
     *
     * Covers the every-minute run, the async worker AJAX endpoint and the daily cleanup.
     *
     * @since 1.0.0
     *
     * @return void
     */
    public static function boot()
    {
        static::create_cron_interval();
        static::schedule_cron();
        static::trigger_event_every_minute();
        static::trigger_event_by_async_worker();
        static::trigger_event_daily_cleanup();
    }
}
