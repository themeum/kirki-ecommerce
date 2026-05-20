<?php

namespace Kirki\Ecommerce\Tests\Integration;

use Kirki\Ecommerce\App\Constants\Coupon\CouponMethod;
use Kirki\Ecommerce\App\Constants\Coupon\CustomerEligibility;
use Kirki\Ecommerce\App\Constants\Coupon\DiscountTarget;
use Kirki\Ecommerce\App\Constants\Coupon\DiscountType;
use Kirki\Ecommerce\App\Constants\Coupon\DiscountValueType;
use Kirki\Ecommerce\Tests\Support\CreatesTestProducts;
use Kirki\Ecommerce\Tests\Support\RestTestCase;
use Kirki\Ecommerce\Tests\Support\SeedsTestShipping;

class CartApiTest extends RestTestCase
{
    use CreatesTestProducts;
    use SeedsTestShipping;

    private $variant_id;
    private $cart_item_id;
    private $cart_token;
    private $cart_headers = [];

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed_base_currency();
        $this->seed_shipping_settings();
        $this->variant_id = null;
        $this->cart_item_id = null;
        $this->cart_token = null;
        $this->cart_headers = [];
    }

    private function prepare_variant(): void
    {
        if ($this->variant_id) {
            return;
        }

        $product = $this->create_product([
            'title' => 'Cart Product ' . wp_generate_password(4, false),
        ]);
        $this->variant_id = $this->default_variant_id($product);
    }

    public function test_get_cart_returns_empty_cart_initially(): void
    {
        $response = $this->request('GET', 'cart');
        $payload = $this->assert_api_success($response);

        $this->assertArrayHasKey('items', $payload['data']);
        $this->assertEmpty($payload['data']['items']);
    }

    public function test_add_item_to_cart(): void
    {
        $this->prepare_variant();
        $payload = $this->add_cart_item(2);
        $this->assertCount(1, $payload['items']);
        $this->assertEquals(2, $payload['items'][0]['quantity']);

        $this->cart_item_id = $payload['items'][0]['id'];
    }

    public function test_cart_item_and_address_lifecycle(): void
    {
        $this->prepare_variant();
        $cart = $this->add_cart_item(2);
        $item_id = $cart['items'][0]['id'];

        $update = $this->request('PUT', 'cart/items/' . $item_id, [
            'id' => $item_id,
            'quantity' => 3,
        ], $this->cart_headers);
        $updated = $this->assert_api_success($update);
        $this->assertEquals(3, $updated['data']['items'][0]['quantity']);

        $remove = $this->request('DELETE', 'cart/items/' . $item_id, [], $this->cart_headers);
        $removed = $this->assert_api_success($remove);
        $this->assertEmpty($removed['data']['items']);

        $this->add_cart_item(1);

        $addresses = $this->request('PUT', 'cart', [
            'shipping_address' => [
                'first_name' => 'John',
                'last_name' => 'Doe',
                'email' => 'john@example.com',
                'phone' => '1234567890',
                'address_line1' => '123 Main St',
                'city' => 'New York',
                'state' => 'NY',
                'postal_code' => '10001',
                'country' => 'US',
            ],
            'billing_address' => [
                'first_name' => 'John',
                'last_name' => 'Doe',
                'email' => 'john@example.com',
                'phone' => '1234567890',
                'address_line1' => '123 Main St',
                'city' => 'New York',
                'state' => 'NY',
                'postal_code' => '10001',
                'country' => 'US',
            ],
        ], $this->cart_headers);
        $with_addresses = $this->assert_api_success($addresses);
        $this->assertEquals('John', $with_addresses['data']['shipping_address']['first_name']);

        $empty = $this->request('DELETE', 'cart', [], $this->cart_headers);
        $emptied = $this->assert_api_success($empty);
        $this->assertEmpty($emptied['data']['items']);
    }

    public function test_apply_and_remove_coupon_on_cart(): void
    {
        $this->prepare_variant();
        $code = 'CART-' . wp_generate_password(6, false);
        $this->create_coupon($code);
        $this->add_cart_item();

        $apply = $this->request('POST', 'cart/coupon', ['code' => $code], $this->cart_headers);
        $applied = $this->assert_api_success($apply);
        $this->assertEquals($code, $applied['data']['pricing']['discount_details']['code']);

        $remove = $this->request('DELETE', 'cart/coupon', [], $this->cart_headers);
        $removed = $this->assert_api_success($remove);
        $this->assertNull($removed['data']['pricing']['discount_details']);
    }

    public function test_add_item_validation_fails_without_variant_id(): void
    {
        $response = $this->request('POST', 'cart/items', [
            'quantity' => 1,
        ]);

        $this->assert_validation_error($response);
    }

    public function test_unauthenticated_request_returns_401(): void
    {
        $this->logout();

        $response = $this->request('GET', 'cart');
        $this->assert_api_error($response, 401);
    }

    private function add_cart_item(int $quantity = 1): array
    {
        $response = $this->request('POST', 'cart/items', [
            'variant_id' => $this->variant_id,
            'quantity' => $quantity,
        ], $this->cart_headers);

        $payload = $this->assert_api_success($response)['data'];

        if (!empty($payload['cart_token'])) {
            $this->cart_token = $payload['cart_token'];
            $this->cart_headers = ['x-cart-token' => $this->cart_token];
        }

        return $payload;
    }

    private function create_coupon(string $code): void
    {
        $response = $this->request('POST', 'coupons', [
            'method' => CouponMethod::CODE,
            'title' => 'Cart Coupon',
            'code' => $code,
            'discount_type' => DiscountType::AMOUNT_OFF,
            'discount_target' => DiscountTarget::ORDER,
            'discount_value_type' => DiscountValueType::PERCENTAGE,
            'discount_amount' => 10,
            'start_date' => '2025-01-01',
            'has_end_date' => false,
            'customer_eligibility' => CustomerEligibility::ALL,
            'is_active' => true,
        ]);

        $this->assert_api_success($response, 201);
    }
}
