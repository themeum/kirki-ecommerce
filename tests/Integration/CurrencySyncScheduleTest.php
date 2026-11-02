<?php

namespace Kirki\Ecommerce\Tests\Integration;

use Kirki\Ecommerce\App\Constants\OptionKeys;
use Kirki\Ecommerce\App\Constants\UpdateFrequency;
use Kirki\Ecommerce\App\Currency\CurrencyExchangeFactory;
use Kirki\Ecommerce\App\Currency\CurrencyExchangeManager;
use Kirki\Ecommerce\App\Hooks\Actions\RepairCurrencySyncSchedule;
use Kirki\Ecommerce\App\Jobs\SyncExchangeRatesJob;
use Kirki\Ecommerce\App\Models\Currency;
use Kirki\Ecommerce\App\Supports\Facades\Settings;
use Kirki\Ecommerce\Framework\Queue\QueueFake;
use Kirki\Ecommerce\Framework\Queue\QueueManager;
use Kirki\Ecommerce\Framework\Supports\Facades\Queue;
use Kirki\Ecommerce\Tests\Support\FakeCurrencyProvider;
use Kirki\Ecommerce\Tests\Support\RestTestCase;

use function Kirki\Ecommerce\Framework\app;

class CurrencySyncScheduleTest extends RestTestCase
{
    /**
     * The queue fake recording dispatched jobs.
     *
     * @var QueueFake
     */
    protected $queue;

    /**
     * Register the fake provider, seed USD and EUR, and fake the queue.
     *
     * @return void
     * @since 1.0.0
     */
    protected function setUp(): void
    {
        parent::setUp();

        FakeCurrencyProvider::reset();
        app(CurrencyExchangeFactory::class)->register(new FakeCurrencyProvider());

        $this->request('POST', 'currencies', [
            'items' => [
                ['code' => 'USD', 'name' => 'US Dollar', 'symbol' => '$', 'exchange_rate' => 1.0, 'is_base' => true, 'is_active' => true],
                ['code' => 'EUR', 'name' => 'Euro', 'symbol' => '€', 'exchange_rate' => 0.5, 'is_base' => false, 'is_active' => true],
            ],
        ]);

        $this->queue = Queue::fake();
    }

    /**
     * Drop the faked queue manager and the exchange manager so later tests resolve real ones.
     *
     * @return void
     * @since 1.0.0
     */
    protected function tearDown(): void
    {
        static::forget_singleton(QueueManager::class);
        static::forget_singleton(CurrencyExchangeManager::class);

        parent::tearDown();
    }

    /**
     * A client save cannot overwrite the sync state the server owns.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_save_ignores_server_owned_sync_keys(): void
    {
        Settings::get(OptionKeys::CURRENCY_SETTINGS)->set([
            'last_sync_at' => '2026-01-01 10:00:00',
            'next_sync_at' => '2026-01-01 11:00:00',
            'sync_token' => 'server-token',
        ], false);

        $this->save_currency_settings([
            'is_automatic_update_enabled' => false,
            'api_provider' => null,
            'api_configs' => null,
            'last_sync_at' => '1999-01-01 00:00:00',
            'next_sync_at' => '1999-01-01 01:00:00',
            'sync_token' => 'client-token',
        ]);

        $currency_settings = Settings::get(OptionKeys::CURRENCY_SETTINGS);
        $this->assertSame('2026-01-01 10:00:00', $currency_settings->get('last_sync_at'));
        $this->assertNotSame('client-token', $currency_settings->get('sync_token'));
    }

    /**
     * Turning automatic updates on queues one immediate run and does not call the provider in the request.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_turning_on_queues_an_immediate_run(): void
    {
        $this->save_currency_settings();

        $jobs = $this->queue->pushed(SyncExchangeRatesJob::class);

        $this->assertCount(1, $jobs);
        $this->assertSame(SyncExchangeRatesJob::QUEUE, $jobs[0]->get_queue());
        $this->assertEmpty($jobs[0]->get_delay());
        $this->assertSame($this->stored('sync_token'), $jobs[0]->token);
        $this->assertSame(0, FakeCurrencyProvider::$calls);
    }

    /**
     * Changing the frequency replaces the schedule.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_changing_the_frequency_replaces_the_schedule(): void
    {
        $this->save_currency_settings();
        $first_token = $this->stored('sync_token');

        $this->save_currency_settings(['api_configs' => [FakeCurrencyProvider::ID => $this->provider_config(UpdateFrequency::EVERY_15_MIN)]]);

        $this->assertCount(2, $this->queue->pushed(SyncExchangeRatesJob::class));
        $this->assertNotSame($first_token, $this->stored('sync_token'));
    }

    /**
     * Saving an unrelated currency setting leaves the schedule alone.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_unrelated_save_keeps_the_schedule(): void
    {
        $this->save_currency_settings();
        $token = $this->stored('sync_token');

        $this->save_currency_settings(['decimal_separator' => ',', 'thousand_separator' => '.']);

        $this->assertCount(1, $this->queue->pushed(SyncExchangeRatesJob::class));
        $this->assertSame($token, $this->stored('sync_token'));
    }

    /**
     * Turning automatic updates off stops the schedule.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_turning_off_stops_the_schedule(): void
    {
        $this->save_currency_settings();
        $token = $this->stored('sync_token');
        $this->run_job($token);

        $this->save_currency_settings(['is_automatic_update_enabled' => false]);

        $this->assertNull($this->stored('next_sync_at'));
        $this->assertNull($this->stored('sync_token'));

        $pushed_before = count($this->queue->pushed(SyncExchangeRatesJob::class));
        $calls_before = FakeCurrencyProvider::$calls;
        $this->run_job($token);

        $this->assertSame($calls_before, FakeCurrencyProvider::$calls);
        $this->assertCount($pushed_before, $this->queue->pushed(SyncExchangeRatesJob::class));
    }

    /**
     * A successful run updates the rates, records the next run and queues it one interval later.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_successful_run_syncs_and_queues_the_next_run(): void
    {
        FakeCurrencyProvider::$rates = ['USD' => 1.0, 'EUR' => 0.9];
        $this->save_currency_settings();
        $token = $this->stored('sync_token');

        $this->run_job($token);

        $this->assertEquals(0.9, Currency::where('code', 'EUR')->first()->exchange_rate);
        $this->assertNotEmpty($this->stored('last_sync_at'));
        $this->assert_next_sync_in(HOUR_IN_SECONDS);
        $this->assertNull($this->stored('last_sync_error'));

        $jobs = $this->queue->pushed(SyncExchangeRatesJob::class);
        $next_job = end($jobs);
        $this->assertSame($token, $next_job->token);
        $this->assertSame(HOUR_IN_SECONDS, $next_job->get_delay());
    }

    /**
     * A run from a replaced schedule does nothing.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_run_from_a_replaced_schedule_does_nothing(): void
    {
        $this->save_currency_settings();
        $pushed_before = count($this->queue->pushed(SyncExchangeRatesJob::class));

        $this->run_job('replaced-token');

        $this->assertSame(0, FakeCurrencyProvider::$calls);
        $this->assertCount($pushed_before, $this->queue->pushed(SyncExchangeRatesJob::class));
    }

    /**
     * A failed run keeps the rates, records the error and still queues the next run.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_failed_run_keeps_rates_and_continues(): void
    {
        FakeCurrencyProvider::$error = 'Invalid API key.';
        $this->save_currency_settings();
        $token = $this->stored('sync_token');

        $this->run_job($token);

        $this->assertEquals(0.5, Currency::where('code', 'EUR')->first()->exchange_rate);
        $this->assertSame('Invalid API key.', $this->stored('last_sync_error'));
        $this->assertNotEmpty($this->stored('last_sync_error_at'));
        $this->assert_next_sync_in(HOUR_IN_SECONDS);

        $jobs = $this->queue->pushed(SyncExchangeRatesJob::class);
        $this->assertSame(HOUR_IN_SECONDS, end($jobs)->get_delay());
    }

    /**
     * A successful run after a failure clears the recorded error.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_success_after_failure_clears_the_error(): void
    {
        FakeCurrencyProvider::$error = 'Invalid API key.';
        $this->save_currency_settings();
        $token = $this->stored('sync_token');
        $this->run_job($token);

        FakeCurrencyProvider::$error = null;
        FakeCurrencyProvider::$rates = ['EUR' => 0.8];
        $this->run_job($token);

        $this->assertNull($this->stored('last_sync_error'));
        $this->assertNull($this->stored('last_sync_error_at'));
    }

    /**
     * Sync now with automatic updates on moves the next run one interval ahead and replaces the schedule.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_sync_now_restarts_the_schedule(): void
    {
        FakeCurrencyProvider::$rates = ['EUR' => 0.7];
        $this->save_currency_settings();
        $token = $this->stored('sync_token');

        $payload = $this->assert_api_success($this->request('POST', 'currency-exchange/sync'));

        $this->assertNotSame($token, $this->stored('sync_token'));
        $this->assert_next_sync_in(HOUR_IN_SECONDS);
        $this->assertSame($this->stored('next_sync_at'), $payload['data']['next_sync_at']);

        $jobs = $this->queue->pushed(SyncExchangeRatesJob::class);
        $this->assertSame(HOUR_IN_SECONDS, end($jobs)->get_delay());
        $this->assertSame($this->stored('sync_token'), end($jobs)->token);
    }

    /**
     * A failed Sync now keeps the rates and also restarts the schedule.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_failed_sync_now_restarts_the_schedule(): void
    {
        FakeCurrencyProvider::$error = 'Invalid API key.';
        $this->save_currency_settings();
        $token = $this->stored('sync_token');

        $this->assert_api_error($this->request('POST', 'currency-exchange/sync'), 400);

        $this->assertEquals(0.5, Currency::where('code', 'EUR')->first()->exchange_rate);
        $this->assertNotSame($token, $this->stored('sync_token'));
        $this->assert_next_sync_in(HOUR_IN_SECONDS);
    }

    /**
     * A successful Sync now clears the error of the last failed automatic run.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_sync_now_clears_the_automatic_sync_error(): void
    {
        FakeCurrencyProvider::$error = 'Invalid API key.';
        $this->save_currency_settings();
        $this->run_job($this->stored('sync_token'));

        FakeCurrencyProvider::$error = null;
        FakeCurrencyProvider::$rates = ['EUR' => 0.7];
        $this->assert_api_success($this->request('POST', 'currency-exchange/sync'));

        $this->assertNull($this->stored('last_sync_error'));
        $this->assertNull($this->stored('last_sync_error_at'));
    }

    /**
     * Sync now with automatic updates off leaves no schedule.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_sync_now_with_automatic_updates_off_queues_nothing(): void
    {
        FakeCurrencyProvider::$rates = ['EUR' => 0.7];
        $this->save_currency_settings(['is_automatic_update_enabled' => false]);

        $this->assert_api_success($this->request('POST', 'currency-exchange/sync'));

        $this->assertCount(0, $this->queue->pushed(SyncExchangeRatesJob::class));
        $this->assertNull($this->stored('next_sync_at'));
    }

    /**
     * The sweep repairs a schedule whose next run is more than one interval late.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_repair_restarts_a_stalled_schedule(): void
    {
        $this->save_currency_settings();
        $token = $this->stored('sync_token');
        Settings::get(OptionKeys::CURRENCY_SETTINGS)->set([
            'next_sync_at' => gmdate('Y-m-d H:i:s', time() - 2 * HOUR_IN_SECONDS),
        ], false);

        (new RepairCurrencySyncSchedule())->handle();

        $this->assertNotSame($token, $this->stored('sync_token'));
        $this->assertCount(2, $this->queue->pushed(SyncExchangeRatesJob::class));
    }

    /**
     * The sweep leaves a healthy schedule alone.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_repair_leaves_a_healthy_schedule_alone(): void
    {
        $this->save_currency_settings();
        $this->run_job($this->stored('sync_token'));
        $token = $this->stored('sync_token');
        $pushed_before = count($this->queue->pushed(SyncExchangeRatesJob::class));

        (new RepairCurrencySyncSchedule())->handle();

        $this->assertSame($token, $this->stored('sync_token'));
        $this->assertCount($pushed_before, $this->queue->pushed(SyncExchangeRatesJob::class));
    }

    /**
     * Save the currency settings through the REST API, with automatic updates on by default.
     *
     * @param array<string, mixed> $overrides
     * @return void
     * @since 1.0.0
     */
    protected function save_currency_settings(array $overrides = []): void
    {
        $data = array_merge([
            'currency_format' => 'short',
            'currency_position' => 'before',
            'thousand_separator' => ',',
            'decimal_separator' => '.',
            'is_automatic_update_enabled' => true,
            'api_provider' => FakeCurrencyProvider::ID,
            'api_configs' => [FakeCurrencyProvider::ID => $this->provider_config(UpdateFrequency::EVERY_1_HOUR)],
        ], $overrides);

        $this->assert_api_success($this->request('PUT', 'settings', [
            'key' => OptionKeys::CURRENCY_SETTINGS,
            'data' => $data,
        ]));

        $this->refresh_exchange_manager();
    }

    /**
     * Build the API configuration for the fake provider.
     *
     * @param string $frequency
     * @return array<string, mixed>
     * @since 1.0.0
     */
    protected function provider_config(string $frequency): array
    {
        return [
            'api_key' => 'test-key',
            'update_frequency' => $frequency,
        ];
    }

    /**
     * Run one scheduled sync with the given token.
     *
     * @param string $token
     * @return void
     * @since 1.0.0
     */
    protected function run_job(string $token): void
    {
        $this->refresh_exchange_manager();
        (new SyncExchangeRatesJob($token))->handle();
    }

    /**
     * Rebuild the exchange manager so it reads the saved provider, as a new request would.
     *
     * @return void
     * @since 1.0.0
     */
    protected function refresh_exchange_manager(): void
    {
        static::forget_singleton(CurrencyExchangeManager::class);
        $this->reset_facade_cache();
    }

    /**
     * Read a stored currency setting.
     *
     * @param string $key
     * @return mixed
     * @since 1.0.0
     */
    protected function stored(string $key)
    {
        return Settings::get(OptionKeys::CURRENCY_SETTINGS)->get($key);
    }

    /**
     * Assert the stored next sync time is the given number of seconds from now.
     *
     * @param int $seconds
     * @return void
     * @since 1.0.0
     */
    protected function assert_next_sync_in(int $seconds): void
    {
        $next_sync_at = $this->stored('next_sync_at');

        $this->assertNotEmpty($next_sync_at);
        $this->assertEqualsWithDelta(
            \Kirki\Ecommerce\Framework\Supports\Facades\Date::now()->add_seconds($seconds)->get_timestamp(),
            \Kirki\Ecommerce\Framework\Supports\Facades\Date::parse($next_sync_at)->get_timestamp(),
            5
        );
    }
}
