<?php

namespace Kirki\Ecommerce\Tests\Integration;

use Kirki\Ecommerce\App\Constants\OptionKeys;
use Kirki\Ecommerce\App\Models\Product;
use Kirki\Ecommerce\App\Payment\PaymentManager;
use Kirki\Ecommerce\App\Services\SetupChecklistService;
use Kirki\Ecommerce\Framework\Supports\Facades\Option;
use Kirki\Ecommerce\Tests\Support\CreatesTestProducts;
use Kirki\Ecommerce\Tests\Support\RestTestCase;

use function Kirki\Ecommerce\Framework\app;

class SetupChecklistApiTest extends RestTestCase
{
    use CreatesTestProducts;

    const PAYPAL_SETTINGS = 'paypal';

    /**
     * Start every test from a store with no products, payments, tax regions or shipping zones.
     *
     * PayPal keeps its settings in its own option, so that option is removed too.
     *
     * Plugin table state carries across tests in a class, and earlier test classes
     * can leave settings committed, so every input the checklist reads is reset.
     *
     * @return void
     * @since 1.0.0
     */
    protected function setUp(): void
    {
        parent::setUp();
        Product::query()->delete();
        Option::delete(OptionKeys::SETUP_CHECKLIST);
        Option::delete(static::PAYPAL_SETTINGS);
        $this->set_settings(OptionKeys::GENERAL_SETTINGS, ['is_tax_calculation_enabled' => true]);
        $this->set_settings(OptionKeys::TAX_SETTINGS, ['tax_regions' => []]);
        $this->set_settings(OptionKeys::SHIPPING_SETTINGS, ['shipping_zones' => []]);
        $this->set_offline_payments([]);
    }

    /**
     * Remove the PayPal settings a test wrote, so later test classes see none.
     *
     * @return void
     * @since 1.0.0
     */
    protected function tearDown(): void
    {
        Option::delete(static::PAYPAL_SETTINGS);
        parent::tearDown();
    }

    /**
     * A fresh store has no step completed, in display order.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_fresh_store_has_no_step_completed(): void
    {
        $steps = $this->get_steps();

        $this->assertSame(['products', 'payments', 'tax', 'shipping'], array_column($steps, 'id'));

        foreach ($steps as $step) {
            $this->assertFalse($step['is_completed'], $step['id']);
            $this->assertFalse($step['has_data'], $step['id']);
            $this->assertFalse($step['is_preconfigured'], $step['id']);
        }
    }

    /**
     * Adding a product completes the products step, and it stays completed after deletion.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_products_step_is_sticky(): void
    {
        $this->create_product();

        $this->assertTrue($this->find_step('products')['is_completed']);

        Product::query()->delete();

        $step = $this->find_step('products');
        $this->assertTrue($step['is_completed']);
        $this->assertFalse($step['has_data']);
    }

    /**
     * Only an enabled payment method completes the payments step.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_payments_step_needs_an_enabled_method(): void
    {
        $this->set_offline_payments([$this->offline_payment('cod', false)]);
        $this->assertFalse($this->find_step('payments')['is_completed']);

        $this->set_offline_payments([$this->offline_payment('cod', true)]);
        $step = $this->find_step('payments');
        $this->assertTrue($step['is_completed']);
        $this->assertTrue($step['has_data']);
    }

    /**
     * An enabled gateway counts only once every required setting has a value.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_payments_step_needs_a_set_up_gateway(): void
    {
        $credentials = ['client_id' => 'client-id', 'client_secret' => 'secret', 'webhook_id' => 'webhook-id'];

        $this->set_paypal_settings(['is_enabled' => true, 'client_secret' => '  '] + $credentials);
        $step = $this->find_step('payments');
        $this->assertFalse($step['is_completed']);
        $this->assertFalse($step['has_data']);

        $this->set_paypal_settings(['is_enabled' => false] + $credentials);
        $this->assertFalse($this->find_step('payments')['is_completed']);

        $this->set_paypal_settings(['is_enabled' => true] + $credentials);
        $this->assertTrue($this->find_step('payments')['is_completed']);
    }

    /**
     * Tax regions that are disabled or charge no product tax do not complete the tax step.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_tax_step_ignores_regions_without_a_product_rate(): void
    {
        $this->set_settings(OptionKeys::TAX_SETTINGS, ['tax_regions' => [
            $this->tax_region(['is_enabled' => false]),
            $this->tax_region(['central_product_tax' => 0]),
            $this->tax_region(['central_product_tax' => '']),
            $this->tax_region(['is_central_tax_enabled' => false, 'states' => [
                ['id' => 'CA', 'product_tax_rate' => 0, 'shipping_tax_rate' => 5],
            ]]),
            ['code' => 'EU', 'type' => 'oss', 'is_enabled' => true, 'countries' => [['code' => 'DE', 'rate' => 0]]],
        ]]);

        $step = $this->find_step('tax');
        $this->assertFalse($step['is_completed']);
        $this->assertFalse($step['has_data']);
    }

    /**
     * Each kind of region with a product rate above zero completes the tax step.
     *
     * @dataProvider tax_regions_with_a_product_rate
     *
     * @param array $region Tax region.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_tax_step_completes_for_a_region_with_a_product_rate(array $region): void
    {
        $this->set_settings(OptionKeys::TAX_SETTINGS, ['tax_regions' => [$region]]);

        $this->assertTrue($this->find_step('tax')['is_completed']);
    }

    /**
     * Regions with a product rate above zero, one per rate source.
     *
     * @return array<string, array{0: array}>
     * @since 1.0.0
     */
    public function tax_regions_with_a_product_rate(): array
    {
        return [
            'central rate' => [$this->tax_region()],
            'central rate as a string' => [$this->tax_region(['central_product_tax' => '7.5'])],
            'state rate' => [$this->tax_region(['is_central_tax_enabled' => false, 'states' => [
                ['id' => 'CA', 'product_tax_rate' => 0],
                ['id' => 'NY', 'product_tax_rate' => 4],
            ]])],
            'EU country rate' => [['code' => 'EU', 'type' => 'oss', 'is_enabled' => true, 'countries' => [
                ['code' => 'DE', 'rate' => 19],
            ]]],
        ];
    }

    /**
     * Shipping zones that are disabled or have no enabled method do not complete the shipping step.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_shipping_step_ignores_zones_without_an_enabled_method(): void
    {
        $this->set_settings(OptionKeys::SHIPPING_SETTINGS, ['shipping_zones' => [
            $this->shipping_zone(['is_enabled' => false]),
            $this->shipping_zone(['shipping_methods' => []]),
            $this->shipping_zone(['shipping_methods' => [['id' => 'flat', 'is_enabled' => false]]]),
            $this->shipping_zone([
                'shipping_methods' => [],
                'shipping_carriers' => [['name' => 'Carrier', 'is_enabled' => true]],
            ]),
        ]]);

        $step = $this->find_step('shipping');
        $this->assertFalse($step['is_completed']);
        $this->assertFalse($step['has_data']);

        $this->set_settings(OptionKeys::SHIPPING_SETTINGS, ['shipping_zones' => [$this->shipping_zone()]]);
        $this->assertTrue($this->find_step('shipping')['is_completed']);
    }

    /**
     * With tax calculation off the tax step is hidden, and its completion is kept.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_hidden_tax_step_keeps_its_completion(): void
    {
        $this->set_settings(OptionKeys::TAX_SETTINGS, ['tax_regions' => [$this->tax_region()]]);
        $this->assertTrue($this->find_step('tax')['is_completed']);

        $this->set_settings(OptionKeys::GENERAL_SETTINGS, ['is_tax_calculation_enabled' => false]);
        $this->assertSame(['products', 'payments', 'shipping'], array_column($this->get_steps(), 'id'));

        $this->set_settings(OptionKeys::GENERAL_SETTINGS, ['is_tax_calculation_enabled' => true]);
        $this->assertTrue($this->find_step('tax')['is_completed']);
    }

    /**
     * Preconfigured steps wait for the merchant's confirmation.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_preconfigured_step_completes_only_when_confirmed(): void
    {
        $this->set_settings(OptionKeys::SHIPPING_SETTINGS, ['shipping_zones' => [$this->shipping_zone()]]);
        app()->make(SetupChecklistService::class)->record_preconfigured();

        $step = $this->find_step('shipping');
        $this->assertTrue($step['is_preconfigured']);
        $this->assertTrue($step['has_data']);
        $this->assertFalse($step['is_completed']);
        $this->assertFalse($this->find_step('tax')['is_preconfigured']);

        $payload = $this->assert_api_success($this->request('POST', 'setup-checklist/shipping/complete'));
        $completed = array_column($payload['data']['steps'], 'is_completed', 'id');
        $this->assertTrue($completed['shipping']);
    }

    /**
     * Confirming an already completed step keeps its original completion time.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_confirming_twice_keeps_the_first_completion(): void
    {
        Option::set(OptionKeys::SETUP_CHECKLIST, ['completed' => ['tax' => 100], 'preconfigured' => ['tax']]);

        $this->assert_api_success($this->request('POST', 'setup-checklist/tax/complete'));

        $this->assertSame(100, Option::get(OptionKeys::SETUP_CHECKLIST)['completed']['tax']);
    }

    /**
     * Steps driven by store data cannot be completed by request.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_data_driven_step_cannot_be_completed_by_request(): void
    {
        $this->assert_api_error($this->request('POST', 'setup-checklist/products/complete'), 422);

        $this->assertNull(Option::get(OptionKeys::SETUP_CHECKLIST));
    }

    /**
     * A store onboarded before the preconfigured snapshot existed treats nothing as preconfigured.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_store_without_snapshot_has_nothing_preconfigured(): void
    {
        $this->set_settings(OptionKeys::SHIPPING_SETTINGS, ['shipping_zones' => [$this->shipping_zone()]]);

        $step = $this->find_step('shipping');
        $this->assertFalse($step['is_preconfigured']);
        $this->assertTrue($step['is_completed']);
    }

    /**
     * Fetch the checklist steps through the API.
     *
     * @return array
     * @since 1.0.0
     */
    protected function get_steps(): array
    {
        $this->reset_option_manager_cache();

        return $this->assert_api_success($this->request('GET', 'setup-checklist'))['data']['steps'];
    }

    /**
     * Fetch one checklist step through the API.
     *
     * @param string $id Step id.
     *
     * @return array
     * @since 1.0.0
     */
    protected function find_step(string $id): array
    {
        $steps = array_column($this->get_steps(), null, 'id');
        $this->assertArrayHasKey($id, $steps);

        return $steps[$id];
    }

    /**
     * Merge values into a settings group and drop every cached copy of it.
     *
     * @param string $key    Settings option key.
     * @param array  $values Values to merge in.
     *
     * @return void
     * @since 1.0.0
     */
    protected function set_settings(string $key, array $values): void
    {
        $current = Option::get($key);
        Option::set($key, array_merge(is_array($current) ? $current : [], $values));

        $this->reset_facade_cache();
        $this->reset_settings_factory_cache();
        $this->reset_option_manager_cache();
        app()->instance(PaymentManager::class, new PaymentManager());
    }

    /**
     * Replace the offline payment methods and rebuild the provider registry.
     *
     * @param array $offline_payments Offline payment method definitions.
     *
     * @return void
     * @since 1.0.0
     */
    protected function set_offline_payments(array $offline_payments): void
    {
        $this->set_settings(OptionKeys::PAYMENT_SETTINGS, ['offline_payments' => $offline_payments]);
    }

    /**
     * Replace PayPal's settings and rebuild the provider registry.
     *
     * @param array $settings PayPal settings, with is_enabled.
     *
     * @return void
     * @since 1.0.0
     */
    protected function set_paypal_settings(array $settings): void
    {
        Option::delete(static::PAYPAL_SETTINGS);
        $this->set_settings(static::PAYPAL_SETTINGS, $settings);
    }

    /**
     * Build an enabled general tax region that charges a central product rate.
     *
     * @param array $overrides Values that replace the defaults.
     *
     * @return array
     * @since 1.0.0
     */
    protected function tax_region(array $overrides = []): array
    {
        return array_merge([
            'code' => 'US',
            'type' => 'general',
            'is_enabled' => true,
            'is_central_tax_enabled' => true,
            'central_product_tax' => 5,
            'states' => [],
        ], $overrides);
    }

    /**
     * Build an enabled shipping zone with one enabled shipping method.
     *
     * @param array $overrides Values that replace the defaults.
     *
     * @return array
     * @since 1.0.0
     */
    protected function shipping_zone(array $overrides = []): array
    {
        return array_merge([
            'id' => 'zone',
            'is_enabled' => true,
            'shipping_methods' => [['id' => 'flat', 'is_enabled' => true]],
        ], $overrides);
    }

    /**
     * Build an offline payment method definition.
     *
     * @param string $id         Method id.
     * @param bool   $is_enabled Whether the method is enabled.
     *
     * @return array
     * @since 1.0.0
     */
    protected function offline_payment(string $id, bool $is_enabled): array
    {
        return [
            'id' => $id,
            'name' => 'Method ' . $id,
            'instructions' => 'Instructions',
            'icon' => null,
            'is_enabled' => $is_enabled,
            'is_offline' => true,
            'config' => [],
        ];
    }
}
