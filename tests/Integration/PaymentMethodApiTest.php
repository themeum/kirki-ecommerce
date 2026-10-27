<?php

namespace Kirki\Ecommerce\Tests\Integration;

use Kirki\Ecommerce\App\Constants\OptionKeys;
use Kirki\Ecommerce\App\Payment\Facades\Payment;
use Kirki\Ecommerce\App\Payment\PaymentManager;
use Kirki\Ecommerce\App\Supports\Facades\Settings;
use Kirki\Ecommerce\Tests\Support\RestTestCase;

class PaymentMethodApiTest extends RestTestCase
{
    /**
     * Start every test with no offline payments and no stored order.
     *
     * @return void
     * @since 1.0.0
     */
    protected function setUp(): void
    {
        parent::setUp();

        Settings::get(OptionKeys::PAYMENT_SETTINGS)->set(['offline_payments' => [], 'methods_order' => null], false);
        $this->start_new_request();
    }

    /**
     * Listing payment methods returns the registered providers with the documented fields.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_list_returns_registered_methods_with_documented_fields(): void
    {
        $response = $this->request('GET', 'payment-methods');
        $payload = $this->assert_api_success($response);

        $this->assertNotEmpty($payload['data']);

        foreach ($payload['data'] as $method) {
            foreach (['id', 'name', 'icon', 'icon_media', 'is_enabled', 'is_offline', 'description'] as $field) {
                $this->assertArrayHasKey($field, $method);
            }
        }

        $paypal = array_values(array_filter($payload['data'], fn($method) => $method['id'] === 'paypal'));
        $this->assertCount(1, $paypal);
        $this->assertFalse($paypal[0]['is_offline']);
    }

    /**
     * The combined listing is read-only.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_write_verbs_are_not_routed(): void
    {
        foreach (['POST', 'PUT', 'PATCH', 'DELETE'] as $verb) {
            $response = $this->request($verb, 'payment-methods', []);
            $this->assertSame(404, $response->get_status(), $verb);
        }
    }

    /**
     * Saving an order returns every provider in that order, and later listings follow it.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_reorder_saves_and_returns_the_new_order(): void
    {
        $cash = $this->create_offline_payment('Cash on Delivery');
        $bank = $this->create_offline_payment('Bank Transfer');

        $this->assertSame([$cash, $bank, 'paypal'], $this->listed_ids());

        $payload = $this->assert_api_success($this->request('PUT', 'payment-methods/order', ['ids' => ['paypal', $bank, $cash]]));
        $this->assertSame(['paypal', $bank, $cash], array_column($payload['data'], 'id'));

        $this->start_new_request();
        $this->assertSame(['paypal', $bank, $cash], $this->listed_ids());
    }

    /**
     * Per-kind listings keep the stored relative order.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_per_kind_listings_follow_the_stored_order(): void
    {
        $cash = $this->create_offline_payment('Cash on Delivery');
        $bank = $this->create_offline_payment('Bank Transfer');

        $this->assert_api_success($this->request('PUT', 'payment-methods/order', ['ids' => [$bank, 'paypal', $cash]]));
        $this->start_new_request();

        $offline = $this->assert_api_success($this->request('GET', 'offline-payments'))['data'];
        $this->assertSame([$bank, $cash], array_column($offline, 'id'));
    }

    /**
     * An unknown provider ID is rejected and the stored order is unchanged.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_reorder_rejects_unknown_ids(): void
    {
        $cash = $this->create_offline_payment('Cash on Delivery');
        $this->assert_api_success($this->request('PUT', 'payment-methods/order', ['ids' => ['paypal', $cash]]));

        $this->assert_api_error($this->request('PUT', 'payment-methods/order', ['ids' => [$cash, 'does-not-exist']]), 422);

        $this->start_new_request();
        $this->assertSame(['paypal', $cash], $this->listed_ids());
    }

    /**
     * A duplicate provider ID is rejected and the stored order is unchanged.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_reorder_rejects_duplicate_ids(): void
    {
        $cash = $this->create_offline_payment('Cash on Delivery');

        $this->assert_api_error($this->request('PUT', 'payment-methods/order', ['ids' => ['paypal', 'paypal', $cash]]), 422);

        $this->start_new_request();
        $this->assertSame([$cash, 'paypal'], $this->listed_ids());
    }

    /**
     * A missing or malformed ids field is rejected.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_reorder_requires_a_list_of_ids(): void
    {
        $this->assert_api_error($this->request('PUT', 'payment-methods/order', []), 422);
        $this->assert_api_error($this->request('PUT', 'payment-methods/order', ['ids' => 'paypal']), 422);
    }

    /**
     * A non-administrator cannot change the order.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_reorder_requires_an_administrator(): void
    {
        $cash = $this->create_offline_payment('Cash on Delivery');
        $this->logout();

        $response = $this->request('PUT', 'payment-methods/order', ['ids' => ['paypal', $cash]]);
        $this->assertContains($response->get_status(), [401, 403]);

        $this->login_as_admin();
        $this->start_new_request();
        $this->assertSame([$cash, 'paypal'], $this->listed_ids());
    }

    /**
     * A provider created after the order was saved is listed last.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_new_provider_is_listed_after_the_stored_order(): void
    {
        $cash = $this->create_offline_payment('Cash on Delivery');
        $this->assert_api_success($this->request('PUT', 'payment-methods/order', ['ids' => ['paypal', $cash]]));

        $cheque = $this->create_offline_payment('Cheque');

        $this->assertSame(['paypal', $cash, $cheque], $this->listed_ids());
    }

    /**
     * A deleted provider's stored ID is ignored and the rest keep their order.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_deleted_provider_id_is_ignored(): void
    {
        $cash = $this->create_offline_payment('Cash on Delivery');
        $bank = $this->create_offline_payment('Bank Transfer');
        $this->assert_api_success($this->request('PUT', 'payment-methods/order', ['ids' => [$bank, 'paypal', $cash]]));

        $this->assert_api_success($this->request('DELETE', 'offline-payments/' . $bank));
        $this->start_new_request();

        $this->assertSame(['paypal', $cash], $this->listed_ids());
    }

    /**
     * Toggling or creating an offline provider keeps the stored order.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_order_survives_other_payment_writes(): void
    {
        $cash = $this->create_offline_payment('Cash on Delivery');
        $this->assert_api_success($this->request('PUT', 'payment-methods/order', ['ids' => ['paypal', $cash]]));

        $this->assert_api_success($this->request('PATCH', 'offline-payments/' . $cash, ['is_enabled' => false]));
        $this->create_offline_payment('Cheque');

        $this->assertSame(['paypal', $cash], Settings::get(OptionKeys::PAYMENT_SETTINGS)->get('methods_order'));
    }

    /**
     * The providers offered at checkout follow the stored order.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_checkout_providers_follow_the_stored_order(): void
    {
        $cash = $this->create_offline_payment('Cash on Delivery');
        $this->assert_api_success($this->request('PATCH', 'online-payments/paypal', ['is_enabled' => true]));
        $this->assert_api_success($this->request('PUT', 'payment-methods/order', ['ids' => ['paypal', $cash]]));
        $this->start_new_request();

        $checkout_ids = array_map(fn($provider) => $provider->id(), Payment::get_available_providers());

        $this->assertSame(['paypal', $cash], $checkout_ids);
    }

    /**
     * Create an offline payment and rebuild the registry so it is listed.
     *
     * @param string $name Payment method name.
     * @return string The new provider ID.
     * @since 1.0.0
     */
    protected function create_offline_payment(string $name): string
    {
        $response = $this->request('POST', 'offline-payments', ['name' => $name, 'is_enabled' => true]);
        $id = $this->assert_api_success($response, 201)['data']['id'];
        $this->start_new_request();

        return $id;
    }

    /**
     * Get the provider IDs in the order the combined listing returns them.
     *
     * @return string[]
     * @since 1.0.0
     */
    protected function listed_ids(): array
    {
        return array_column($this->assert_api_success($this->request('GET', 'payment-methods'))['data'], 'id');
    }

    /**
     * Rebuild the provider registry, as the next real request would.
     *
     * @return void
     * @since 1.0.0
     */
    protected function start_new_request(): void
    {
        static::forget_singleton(PaymentManager::class);
        $this->reset_facade_cache();
    }
}
