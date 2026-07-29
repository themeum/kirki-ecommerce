<?php

namespace Kirki\Ecommerce\App\Scheduler;

use Kirki\Ecommerce\App\Scheduler\Constants\Config;
use Kirki\Ecommerce\App\Scheduler\Runner;
use Kirki\Ecommerce\Framework\Supports\Facades\Option;

use function Kirki\Ecommerce\Framework\app;
use function Kirki\Ecommerce\Framework\uuid;
use function Kirki\Ecommerce\Framework\with_prefix;

class Scheduler
{
    /**
     * Initializes the scheduler system.
     *
     * This method performs the necessary setup steps to ensure the scheduler is ready to operate.
     * It generates a unique security key for asynchronous worker authentication if one does not exist,
     * clears any previously scheduled cron events to avoid conflicts or duplicate executions,
     * and registers the primary cron schedule to handle background tasks.
     * 
     * Note: This method is intended to be called once during the plugin activation or initialization phase.
     * For kirki-ecommerce app we can call this at app installation or activation hooks.
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
     * Generates and stores a unique secret key for the async worker if it doesn't already exist.
     *
     * This key serves as a shared secret to authenticate internal asynchronous HTTP requests
     * sent to the background worker. It prevents unauthorized parties from triggering task
     * execution. If no key is found in the persistent options storage, a new unique 
     * identifier (UUID) is generated and saved.
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
     * Resets the scheduled cron event by un-scheduling any existing event with the
     * configured scheduler cron event name.
     *
     * This method is crucial for maintaining a clean state within the WordPress cron system.
     * It first checks if there is a pending execution for the scheduler's specific cron event
     * using the event name defined in the configuration. If an event is found, it retrieves 
     * its next scheduled timestamp and proceeds to unschedule it. This prevents the 
     * accumulation of multiple identical cron events and ensures that when the scheduler 
     * is re-initialized, it doesn't conflict with previously set tasks or stale schedules.
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
     * Schedules the primary background cron event if it hasn't been registered yet.
     *
     * This method acts as the entry point for registering the recurring scheduler task within 
     * the WordPress cron system. It first checks for the existence of the event to ensure 
     * idempotency and avoid duplicate scheduling. If the event is not present, it 
     * schedules a new recurring event starting immediately, using the customized event 
     * name and execution interval defined in the configuration.
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
     * Registers a custom cron execution interval within the WordPress environment.
     *
     * This method hooks into the 'cron_schedules' filter to inject a new recurring interval 
     * definition. Since WordPress does not provide a one-minute interval by default, this 
     * function explicitly defines it using the unique identifier from the configuration. 
     * By adding this custom schedule, the system can then utilize it to trigger the 
     * background scheduler at a higher frequency, ensuring that tasks are processed 
     * promptly every minute.
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
     * Hooks the main scheduler execution logic to the recurring cron event.
     *
     * This method attaches the 'run' method to the specific WordPress cron action 
     * hook defined in the configuration. This linkage is what allows the WordPress 
     * cron system to actually trigger the scheduler's task processing logic at 
     * the defined intervals (e.g., every minute). Without this hook, the 
     * scheduled event would fire but no code would be executed.
     *
     * @return void
     */
    protected static function trigger_event_every_minute()
    {
        add_action(Config::SCHEDULER_CRON_EVENT_NAME, [static::class, 'run']);
    }

    /**
     * Hooks the cleanup logic to the daily cron event.
     *
     * This method attaches the 'handle_cleanup' method to the specific WordPress cron action 
     * hook defined in the configuration. This linkage is what allows the WordPress 
     * cron system to actually trigger the scheduler's cleanup logic at 
     * the defined intervals (e.g., daily). Without this hook, the 
     * scheduled event would fire but no code would be executed.
     *
     * @return void
     */
    protected static function trigger_event_daily_cleanup()
    {
        add_action(Config::SCHEDULER_CRON_CLEANUP_EVENT_NAME, [static::class, 'handle_cleanup']);
    }


    /**
     * Registers AJAX actions for the async worker, allowing it to be triggered
     * via both authenticated and non-authenticated requests.
     *
     * This method hooks into WordPress's AJAX system to provide a secure endpoint 
     * for the background worker to initiate task processing. It registers two 
     * distinct AJAX actions: one for authenticated users and another for guests. 
     * Both actions are linked to the 'run_async_worker' method, which validates 
     * the authentication token (using the stored secret key) before allowing 
     * execution. This ensures that only authorized internal processes can trigger 
     * the background worker, enhancing security and preventing unauthorized access.
     *
     * @return void
     */
    protected static function trigger_event_by_async_worker()
    {
        add_action('wp_ajax_' . with_prefix(Config::ASYNC_WORKER_ACTION_NAME), [static::class, 'run_async_worker']);
        add_action('wp_ajax_nopriv_' . with_prefix(Config::ASYNC_WORKER_ACTION_NAME), [static::class, 'run_async_worker']);
    }

    /**
     * Executes the scheduler runner to process pending tasks.
     *
     * This method is the entry point for processing scheduled tasks. It creates a new 
     * instance of the Runner class and calls its run() method, which handles the 
     * execution of scheduled jobs. The result of this operation is returned to the 
     * caller, allowing for potential error handling or additional processing.
     *
     * @return mixed The result of the runner's execution.
     */
    public static function run()
    {
        return static::runner()->run();
    }

    /**
     * Returns the scheduler runner instance.
     *
     * @return Runner The scheduler runner instance.
     */
    protected static function runner()
    {
        return app()->make(Runner::class);
    }

    /**
     * Handles the async worker request. Validates the secret key provided in the POST request
     * before executing the scheduler. Terminates the request after execution.
     *
     * This method is the entry point for processing scheduled tasks. It creates a new 
     * instance of the Runner class and calls its run() method, which handles the 
     * execution of scheduled jobs. The result of this operation is returned to the 
     * caller, allowing for potential error handling or additional processing.
     *
     * @return void
     */
    public static function run_async_worker()
    {
        $secret = Option::get(Config::ASYNC_WORKER_SECRET_KEY_NAME);

        if (!isset($_POST['secret']) || $_POST['secret'] !== $secret) {
            wp_die(__('Access Denied!', 'kirki-ecommerce'));
        }

        static::run();
        wp_die();
    }

    /**
     * Handles the cleanup of failed and completed jobs to maintain database health.
     *
     * This method invokes the runner's cleanup routines to remove records of jobs
     * that have either failed or successfully completed, preventing the task 
     * tables from becoming bloated over time.
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
     * Initializes the scheduler system by setting up necessary WordPress hooks and cron events.
     *
     * This method orchestrates the setup process for the background task runner. It performs the following:
     * - Registers custom time intervals (like 'every_minute') into the WordPress cron schedule.
     * - Ensures the main cron event is registered and scheduled in the WordPress database.
     * - Attaches the scheduler's execution logic to the recurring cron event.
     * - Configures the asynchronous worker mechanism, enabling task execution via external HTTP POST requests
     *   to ensure high-frequency processing independent of standard WordPress cron triggers.
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
