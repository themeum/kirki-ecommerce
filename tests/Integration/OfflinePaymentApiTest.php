<?php

namespace Kirki\Ecommerce\Tests\Integration;

use Kirki\Ecommerce\App\Constants\OptionKeys;
use Kirki\Ecommerce\App\Supports\Facades\Settings;
use Kirki\Ecommerce\Tests\Support\RestTestCase;

class OfflinePaymentApiTest extends RestTestCase
{
    /**
     * Start every test from an empty offline payments list.
     *
     * @return void
     * @since 1.0.0
     */
    protected function setUp(): void
    {
        parent::setUp();

        Settings::get(OptionKeys::PAYMENT_SETTINGS)->set(['offline_payments' => []], false);
    }

    /**
     * Enabling and disabling flips only is_enabled.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_set_enabled_flips_only_is_enabled(): void
    {
        $id = $this->create_offline_payment(['name' => 'Bank Transfer', 'instructions' => 'Pay by wire', 'is_enabled' => true]);

        $response = $this->request('PATCH', 'offline-payments/' . $id, ['is_enabled' => false]);
        $payload = $this->assert_api_success($response);
        $this->assertTrue($payload['data']);

        $shown = $this->assert_api_success($this->request('GET', 'offline-payments/' . $id))['data'];
        $this->assertFalse($shown['is_enabled']);
        $this->assertSame('Bank Transfer', $shown['name']);
        $this->assertSame('Pay by wire', $shown['description']);

        $this->assert_api_success($this->request('PATCH', 'offline-payments/' . $id, ['is_enabled' => true]));

        $shown = $this->assert_api_success($this->request('GET', 'offline-payments/' . $id))['data'];
        $this->assertTrue($shown['is_enabled']);
        $this->assertSame('Bank Transfer', $shown['name']);
    }

    /**
     * Toggling one method does not touch the others.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_set_enabled_leaves_other_methods_unchanged(): void
    {
        $first = $this->create_offline_payment(['name' => 'Cash on Delivery', 'is_enabled' => true]);
        $second = $this->create_offline_payment(['name' => 'Cheque', 'is_enabled' => true]);

        $this->assert_api_success($this->request('PATCH', 'offline-payments/' . $first, ['is_enabled' => false]));

        $this->assertFalse($this->assert_api_success($this->request('GET', 'offline-payments/' . $first))['data']['is_enabled']);
        $this->assertTrue($this->assert_api_success($this->request('GET', 'offline-payments/' . $second))['data']['is_enabled']);
    }

    /**
     * Toggling an unknown id is a 404 and changes nothing.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_set_enabled_unknown_id_returns_404(): void
    {
        $id = $this->create_offline_payment(['name' => 'Cheque', 'is_enabled' => true]);

        $this->assert_api_error($this->request('PATCH', 'offline-payments/does-not-exist', ['is_enabled' => false]), 404);

        $this->assertTrue($this->assert_api_success($this->request('GET', 'offline-payments/' . $id))['data']['is_enabled']);
    }

    /**
     * An online provider id is not reachable through the offline endpoint.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_set_enabled_online_provider_id_returns_404(): void
    {
        $this->assert_api_error($this->request('PATCH', 'offline-payments/paypal', ['is_enabled' => true]), 404);
    }

    /**
     * The toggle endpoint requires an authenticated administrator.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_set_enabled_requires_authentication(): void
    {
        $id = $this->create_offline_payment(['name' => 'Cheque', 'is_enabled' => true]);

        $this->logout();

        $this->assert_api_error($this->request('PATCH', 'offline-payments/' . $id, ['is_enabled' => false]), 401);
    }

    /**
     * With no offline_payments list ever saved, lookups report not found instead of failing.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_unset_offline_payments_list_reports_not_found(): void
    {
        $this->forget_offline_payments();

        $this->assert_api_error($this->request('GET', 'offline-payments/missing'), 404);
        $this->assert_api_error($this->request('PATCH', 'offline-payments/missing', ['is_enabled' => true]), 404);
        $this->assert_api_error($this->request('DELETE', 'offline-payments/missing'), 404);
        $this->assert_api_error($this->request('PUT', 'offline-payments/missing', ['name' => 'Ghost']), 404);

        $this->assertSame([], $this->assert_api_success($this->request('GET', 'offline-payments'))['data']);
    }

    /**
     * The first method can be created when the list was never saved.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_create_works_when_offline_payments_list_is_unset(): void
    {
        $this->forget_offline_payments();

        $id = $this->create_offline_payment(['name' => 'Cheque', 'is_enabled' => true]);

        $listed = $this->assert_api_success($this->request('GET', 'offline-payments'))['data'];
        $this->assertCount(1, $listed);
        $this->assertSame($id, $listed[0]['id']);
    }

    /**
     * Updating an existing method still replaces it.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_update_replaces_existing_method(): void
    {
        $id = $this->create_offline_payment(['name' => 'Cheque', 'is_enabled' => true]);

        $response = $this->request('PUT', 'offline-payments/' . $id, ['id' => $id, 'name' => 'Cheque (renamed)', 'is_enabled' => false]);
        $payload = $this->assert_api_success($response);
        $this->assertSame('Cheque (renamed)', $payload['data']['name']);

        $shown = $this->assert_api_success($this->request('GET', 'offline-payments/' . $id))['data'];
        $this->assertSame('Cheque (renamed)', $shown['name']);
        $this->assertFalse($shown['is_enabled']);
    }

    /**
     * Create an offline payment method through the API and return its id.
     *
     * @param array<string, mixed> $overrides Fields to override on the create payload.
     * @return string
     * @since 1.0.0
     */
    protected function create_offline_payment(array $overrides = []): string
    {
        $response = $this->request('POST', 'offline-payments', array_merge([
            'name' => 'Cash on Delivery',
            'is_enabled' => true,
            'instructions' => 'Pay when it arrives',
        ], $overrides));

        return $this->assert_api_success($response, 201)['data']['id'];
    }

    /**
     * Drop the stored offline_payments list, as on a store that never saved one.
     *
     * @return void
     * @since 1.0.0
     */
    protected function forget_offline_payments(): void
    {
        Settings::get(OptionKeys::PAYMENT_SETTINGS)->set(['offline_payments' => null], false);
    }
}
