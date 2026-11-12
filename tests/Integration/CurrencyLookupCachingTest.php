<?php

namespace Kirki\Ecommerce\Tests\Integration;

use Kirki\Ecommerce\App\Constants\CookieNames;
use Kirki\Ecommerce\App\DTO\Currency\CreateCurrencyDTO;
use Kirki\Ecommerce\App\DTO\Currency\UpdateCurrencyDTO;
use Kirki\Ecommerce\App\DTO\ListFilterDTO;
use Kirki\Ecommerce\App\Facades\Money;
use Kirki\Ecommerce\App\Managers\MoneyManager;
use Kirki\Ecommerce\App\Models\Currency;
use Kirki\Ecommerce\App\Services\CurrencyService;
use Kirki\Ecommerce\App\Supports\Currency as CurrencySupport;
use Kirki\Ecommerce\Database\Seeders\CurrencySeeder;
use Kirki\Ecommerce\Tests\Support\CountsCurrencyQueries;
use Kirki\Ecommerce\Tests\Support\RestTestCase;
use Kirki\Ecommerce\Tests\Support\SeedsTestCurrency;

use function Kirki\Ecommerce\App\base_currency;
use function Kirki\Ecommerce\Framework\app;

/**
 * Checks that money and currency code reads the currencies table a bounded number of times,
 * and that the cached data is never stale after a write.
 *
 * See openspec/changes/cache-currency-lookups/specs/currency-lookup-caching/spec.md.
 */
class CurrencyLookupCachingTest extends RestTestCase
{
    use CountsCurrencyQueries;
    use SeedsTestCurrency;

    /**
     * Start each test with USD as the only currency.
     *
     * A base change opens its own transaction, which commits the one WordPress wraps around the test. So rows from
     * an earlier test can survive, and the table is emptied here instead of relying on the rollback.
     *
     * @return void
     * @since 1.0.0
     */
    protected function setUp(): void
    {
        parent::setUp();

        Currency::query()->delete();
        $this->seed_base_currency();
    }

    /**
     * Stop the query listener after each test.
     *
     * @return void
     * @since 1.0.0
     */
    protected function tearDown(): void
    {
        unset($_COOKIE[CookieNames::CURRENCY]);
        $this->stop_counting_currency_queries();
        parent::tearDown();
    }

    /**
     * The counting helper sees every currencies query.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_query_counter_counts_each_currencies_select(): void
    {
        $this->start_counting_currency_queries();

        Currency::base()->first();
        Currency::base()->first();

        $this->assertSame(2, $this->currency_query_count());
    }

    /**
     * Mixed reads of the base currency, the symbols and a currency by code share one query.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_mixed_currency_reads_run_one_query(): void
    {
        $service = app(CurrencyService::class);

        $this->start_counting_currency_queries();

        for ($i = 0; $i < 7; $i++) {
            $service->get_base_currency();
            $service->get_symbol_map();
            $service->get_by_code('USD');
        }

        $this->assertSame(1, $this->currency_query_count(), implode(' | ', $this->currency_queries));
    }

    /**
     * The cached reads return the same data as the database.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_cached_reads_match_the_database(): void
    {
        $service = app(CurrencyService::class);

        $base = $service->get_base_currency();
        $stored_base = Currency::base()->first();

        $this->assertSame($stored_base->code, $base->code);
        $this->assertSame('USD', $service->get_by_code('usd')->code);
        $this->assertNull($service->get_by_code('ZZZ'));
        $this->assertSame('$', $service->get_symbol_map()['USD']);
    }

    /**
     * A write through one service object is visible to another object.
     *
     * The router builds its own service objects, so the cache must not belong to one object.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_a_write_through_one_service_object_is_visible_to_another(): void
    {
        $writer = new CurrencyService();
        $reader = new CurrencyService();

        $this->assertNull($reader->get_by_code('EUR'));

        $writer->create($this->currency_dto('EUR', 0.9));

        $this->assertNotNull($reader->get_by_code('EUR'));
        $this->assertNotNull($this->app_service()->get_by_code('EUR'));
    }

    /**
     * Separate service objects share one query.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_separate_service_objects_share_one_query(): void
    {
        $this->start_counting_currency_queries();

        (new CurrencyService())->get_base_currency();
        (new CurrencyService())->get_by_code('USD');
        $this->app_service()->get_symbol_map();

        $this->assertSame(1, $this->currency_query_count(), implode(' | ', $this->currency_queries));
    }

    /**
     * A currency created through the REST endpoint is visible to money code in the same request.
     *
     * The controller uses its own service object, not the one `app()` returns.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_a_currency_created_through_the_api_is_visible_to_money_code(): void
    {
        $this->assertNull($this->app_service()->get_by_code('GBP'));
        $this->assertFalse(CurrencySupport::is_active('GBP'));

        $response = $this->request('POST', 'currencies', ['items' => [[
            'code' => 'GBP',
            'name' => 'Pound',
            'symbol' => '£',
            'exchange_rate' => 0.8,
            'is_active' => true,
            'is_base' => false,
        ]]]);

        $this->assert_api_success($response, 201);
        $this->assertTrue(CurrencySupport::is_active('GBP'));
        $this->assertEquals(0.8, CurrencySupport::exchange_rate('GBP'));
    }

    /**
     * Repeated calls of the base currency helper share one query.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_base_currency_helper_runs_one_query_for_repeated_calls(): void
    {
        $this->start_counting_currency_queries();

        for ($i = 0; $i < 5; $i++) {
            base_currency();
        }

        $this->assertSame(1, $this->currency_query_count(), implode(' | ', $this->currency_queries));
    }

    /**
     * A currency created after a read is found by the next read.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_create_is_visible_to_the_next_read(): void
    {
        $service = app(CurrencyService::class);

        $this->assertNull($service->get_by_code('EUR'));

        $service->create($this->currency_dto('EUR', 0.9));

        $this->assertSame('EUR', $service->get_by_code('EUR')->code);
        $this->assertArrayHasKey('EUR', $service->get_symbol_map());
    }

    /**
     * A currency created as the base replaces the base for the next read.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_create_as_base_changes_the_base_for_the_next_read(): void
    {
        $service = app(CurrencyService::class);

        $this->assertSame('USD', $service->get_base_currency()->code);

        $service->create($this->currency_dto('EUR', 0.9, true));

        $this->assertSame('EUR', $service->get_base_currency()->code);
    }

    /**
     * A new exchange rate is used by the next read.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_update_of_a_rate_is_visible_to_the_next_read(): void
    {
        $service = app(CurrencyService::class);
        $created = $service->create($this->currency_dto('EUR', 0.9));

        $this->assertEquals(0.9, $service->get_by_code('EUR')->exchange_rate);

        $service->update(UpdateCurrencyDTO::from_array([
            'id' => $created->id,
            'code' => 'EUR',
            'name' => 'Euro',
            'symbol' => '€',
            'exchange_rate' => 0.8,
            'is_base' => false,
            'is_active' => true,
        ]));

        $this->assertEquals(0.8, $service->get_by_code('EUR')->exchange_rate);
        $this->assertSame('€', $service->get_symbol_map()['EUR']);
    }

    /**
     * Turning a currency inactive is used by the next read.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_update_of_the_active_flag_is_visible_to_the_next_read(): void
    {
        $service = app(CurrencyService::class);
        $created = $service->create($this->currency_dto('EUR', 0.9));

        $this->assertTrue($service->get_by_code('EUR')->is_active);

        $service->update(UpdateCurrencyDTO::from_array([
            'id' => $created->id,
            'code' => 'EUR',
            'name' => 'Euro',
            'symbol' => '€',
            'exchange_rate' => 0.9,
            'is_base' => false,
            'is_active' => false,
        ]));

        $this->assertFalse($service->get_by_code('EUR')->is_active);
    }

    /**
     * Making a currency the base through an update is used by the next read.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_update_to_base_changes_the_base_for_the_next_read(): void
    {
        $service = app(CurrencyService::class);
        $created = $service->create($this->currency_dto('EUR', 0.9));

        $this->assertSame('USD', $service->get_base_currency()->code);

        $service->update(UpdateCurrencyDTO::from_array([
            'id' => $created->id,
            'code' => 'EUR',
            'name' => 'Euro',
            'symbol' => '€',
            'exchange_rate' => 0.9,
            'is_base' => true,
            'is_active' => true,
        ]));

        $this->assertSame('EUR', $service->get_base_currency()->code);
    }

    /**
     * Setting the base is used by the next read.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_set_base_changes_the_base_for_the_next_read(): void
    {
        $service = app(CurrencyService::class);
        $service->create($this->currency_dto('EUR', 0.9));

        $this->assertSame('USD', $service->get_base_currency()->code);

        $service->set_base('EUR');

        $this->assertSame('EUR', $service->get_base_currency()->code);
        $this->assertEquals(1, $service->get_by_code('EUR')->exchange_rate);
    }

    /**
     * Ensuring a base that is not stored yet is used by the next read.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_ensure_base_changes_the_base_for_the_next_read(): void
    {
        $service = app(CurrencyService::class);

        $this->assertSame('USD', $service->get_base_currency()->code);

        $service->ensure_base('GBP');

        $this->assertSame('GBP', $service->get_base_currency()->code);
    }

    /**
     * Currencies inserted in bulk are found by the next read.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_insert_is_visible_to_the_next_read(): void
    {
        $service = app(CurrencyService::class);

        $this->assertNull($service->get_by_code('EUR'));

        $service->insert([$this->currency_dto('EUR', 0.9), $this->currency_dto('GBP', 0.8)]);

        $this->assertNotNull($service->get_by_code('EUR'));
        $this->assertNotNull($service->get_by_code('GBP'));
    }

    /**
     * A deleted currency is no longer found.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_delete_is_visible_to_the_next_read(): void
    {
        $service = app(CurrencyService::class);
        $created = $service->create($this->currency_dto('EUR', 0.9));

        $this->assertNotNull($service->get_by_code('EUR'));

        $service->delete($created->id);

        $this->assertNull($service->get_by_code('EUR'));
        $this->assertArrayNotHasKey('EUR', $service->get_symbol_map());
    }

    /**
     * Currencies deleted in bulk are no longer found.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_bulk_delete_is_visible_to_the_next_read(): void
    {
        $service = app(CurrencyService::class);
        $eur = $service->create($this->currency_dto('EUR', 0.9));
        $gbp = $service->create($this->currency_dto('GBP', 0.8));

        $this->assertNotNull($service->get_by_code('GBP'));

        $service->bulk_delete([$eur->id, $gbp->id]);

        $this->assertNull($service->get_by_code('EUR'));
        $this->assertNull($service->get_by_code('GBP'));
    }

    /**
     * Currencies deleted by a filter are no longer found.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_delete_all_is_visible_to_the_next_read(): void
    {
        $service = app(CurrencyService::class);
        $service->create($this->currency_dto('EUR', 0.9));

        $this->assertNotNull($service->get_by_code('EUR'));

        $service->delete_all(ListFilterDTO::from_array(['search' => 'EUR']));

        $this->assertNull($service->get_by_code('EUR'));
    }

    /**
     * Currencies seeded after a read are found by the next read.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_seeder_is_visible_to_the_next_read(): void
    {
        Currency::query()->delete();
        $this->app_service()->flush_cache();

        $this->assertNull($this->app_service()->get_base_currency());

        (new CurrencySeeder())->run();

        $this->assertSame('USD', $this->app_service()->get_base_currency()->code);
        $this->assertSame('USD', $this->app_service()->get_by_code('usd')->code);
    }

    /**
     * A failed base change leaves the next read equal to the database.
     *
     * The callback reads the currencies inside the transaction, after the old base was demoted. The rollback
     * restores the base, so the data cached inside the transaction must not survive.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_failed_base_change_does_not_leave_stale_data(): void
    {
        $service = new class extends CurrencyService {
            /**
             * Run the protected base change with a callback.
             *
             * @param callable $save Callback that saves the new base.
             * @return mixed
             */
            public function run_base_change(callable $save)
            {
                return $this->with_demoted_bases($save);
            }
        };

        try {
            $service->run_base_change(function () use ($service) {
                $this->assertNull($service->get_base_currency(), 'The old base is demoted inside the transaction.');

                throw new \RuntimeException('save failed');
            });

            $this->fail('The callback exception was not rethrown.');
        } catch (\RuntimeException $e) {
            $this->assertSame('save failed', $e->getMessage());
        }

        $this->assertSame(Currency::base()->first()->code, $service->get_base_currency()->code);
        $this->assertSame('USD', $service->get_base_currency()->code);
    }

    /**
     * Many conversions to minor units, with and without a named currency, share one query.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_many_to_minor_calls_run_at_most_one_query(): void
    {
        $this->start_counting_currency_queries();

        for ($i = 0; $i < 50; $i++) {
            Money::to_minor('10.99');
            Money::to_minor('10.99', 'USD');
        }

        $this->assert_currency_queries_at_most(1);
    }

    /**
     * Many minor-unit amounts built into Money objects share one query.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_many_from_minor_calls_run_at_most_one_query(): void
    {
        $this->start_counting_currency_queries();

        for ($i = 0; $i < 50; $i++) {
            Money::from_minor(1099);
            Money::from_minor(1099, 'USD');
        }

        $this->assert_currency_queries_at_most(1);
    }

    /**
     * Formatting minor-unit and decimal amounts shares one query.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_many_format_calls_run_at_most_one_query(): void
    {
        $this->start_counting_currency_queries();

        for ($i = 0; $i < 20; $i++) {
            Money::format_from_minor(1099);
            Money::format_from_minor(1099, 'USD');
            Money::format_from_decimal('10.99');
        }

        $this->assert_currency_queries_at_most(1);
    }

    /**
     * Converting many amounts to the display currency shares one query, including the rate and the active check.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_many_display_currency_conversions_run_at_most_one_query(): void
    {
        $this->app_service()->create($this->currency_dto('EUR', 0.9));
        $_COOKIE[CookieNames::CURRENCY] = 'EUR';

        $this->start_counting_currency_queries();

        $display_currency = Money::resolve_display_currency();

        for ($i = 1; $i <= 20; $i++) {
            Money::prepare_amount_object_from_minor($i * 100, 'USD', $display_currency);
        }

        $this->assertSame('EUR', $display_currency);
        $this->assert_currency_queries_at_most(1);
    }

    /**
     * Creating the manager and calling helpers that need no currency data run no query.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_request_without_money_runs_no_currencies_query(): void
    {
        $this->start_counting_currency_queries();

        app(MoneyManager::class);
        Money::get_currency_numeric_code('USD');

        $this->assertSame(0, $this->currency_query_count(), implode(' | ', $this->currency_queries));
    }

    /**
     * A display currency that is not stored gives the base currency.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_unknown_requested_currency_shows_the_base_currency(): void
    {
        $_COOKIE[CookieNames::CURRENCY] = 'ZZZ';

        $this->assertSame('USD', Money::resolve_display_currency());
    }

    /**
     * A display currency that is stored but inactive gives the base currency.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_inactive_requested_currency_shows_the_base_currency(): void
    {
        $dto = $this->currency_dto('EUR', 0.9);
        $dto->is_active = false;
        $this->app_service()->create($dto);
        $_COOKIE[CookieNames::CURRENCY] = 'EUR';

        $this->assertSame('USD', Money::resolve_display_currency());
    }

    /**
     * A display currency that is stored and active is used.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_active_requested_currency_is_used(): void
    {
        $this->app_service()->create($this->currency_dto('EUR', 0.9));
        $_COOKIE[CookieNames::CURRENCY] = 'eur';

        $this->assertSame('EUR', Money::resolve_display_currency());
    }

    /**
     * Converting to a currency that is not stored, with no rate given, fails as before.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_conversion_to_an_unknown_currency_without_a_rate_fails(): void
    {
        $this->expectException(\Exception::class);
        $this->expectExceptionMessage('Currency not found');

        Money::convert_to_currency(Money::from_minor(1000, 'USD'), 'ZZZ');
    }

    /**
     * Amounts, display strings and currency objects equal the values the code returned before caching.
     *
     * The expected values were checked against the code before this change as well.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_money_objects_equal_the_values_from_before_caching(): void
    {
        $service = $this->app_service();
        $service->create($this->currency_dto('BDT', 110, false, '৳'));
        $service->create($this->currency_dto('EUR', 0.9, false, '€'));

        $usd = $this->as_json(Money::prepare_amount_object_from_minor(1099, 'USD'));
        $base = $this->as_json(Money::prepare_amount_object_from_minor(500));
        $bdt = $this->as_json(Money::prepare_amount_object_from_minor(1099, 'USD', 'BDT'));
        $eur = $this->as_json(Money::prepare_amount_object_from_minor(1099, 'USD', 'EUR'));

        $this->assertEquals(['raw' => 10.99, 'display' => '$10.99', 'currency' => ['code' => 'USD', 'symbol' => '$']], $usd);
        $this->assertEquals(['raw' => 5.0, 'display' => '$5.00', 'currency' => ['code' => 'USD', 'symbol' => '$']], $base);
        $this->assertEquals(['raw' => 1208.9, 'display' => '৳1,208.90', 'currency' => ['code' => 'BDT', 'symbol' => '৳']], $bdt);
        $this->assertEquals(['raw' => 9.89, 'display' => '€9.89', 'currency' => ['code' => 'EUR', 'symbol' => '€']], $eur);
        $this->assertSame(1099, Money::to_minor('10.99'));
        $this->assertSame('$10.99', Money::format_from_minor(1099));
    }

    /**
     * Get a value the way the API sends it: as decoded JSON.
     *
     * @param mixed $value Value to encode.
     * @return array<string, mixed>
     */
    protected function as_json($value): array
    {
        return json_decode(wp_json_encode($value), true);
    }

    /**
     * Get the shared currency service.
     *
     * @return CurrencyService
     */
    protected function app_service(): CurrencyService
    {
        return app(CurrencyService::class);
    }

    /**
     * Build a currency DTO for the create and insert calls.
     *
     * @param string $code          Currency code.
     * @param float  $exchange_rate Rate against the base currency.
     * @param bool   $is_base       Whether it is created as the base.
     * @param string|null $symbol   Currency symbol; the code when null.
     * @return CreateCurrencyDTO
     */
    protected function currency_dto(string $code, float $exchange_rate, bool $is_base = false, ?string $symbol = null): CreateCurrencyDTO
    {
        return CreateCurrencyDTO::from_array([
            'code' => $code,
            'name' => $code . ' currency',
            'symbol' => $symbol ?? $code,
            'exchange_rate' => $exchange_rate,
            'is_base' => $is_base,
            'is_active' => true,
        ]);
    }
}
