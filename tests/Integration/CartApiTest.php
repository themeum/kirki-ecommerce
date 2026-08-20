<?php

namespace Kirki\Ecommerce\Tests\Integration;

use Kirki\Ecommerce\App\Constants\Cart;
use Kirki\Ecommerce\App\Constants\Coupon\CouponMethod;
use Kirki\Ecommerce\App\Constants\Coupon\CustomerExcludeEligibility;
use Kirki\Ecommerce\App\Constants\Coupon\CustomerIncludeEligibility;
use Kirki\Ecommerce\App\Constants\Coupon\DiscountTarget;
use Kirki\Ecommerce\App\Constants\Coupon\DiscountType;
use Kirki\Ecommerce\App\Constants\Coupon\DiscountValueType;
use Kirki\Ecommerce\App\DTO\Cart\AddToCartDTO;
use Kirki\Ecommerce\App\Models\Cart as CartModel;
use Kirki\Ecommerce\App\Models\CartItem;
use Kirki\Ecommerce\App\Services\CartService;
use Kirki\Ecommerce\App\Services\VariantService;
use Kirki\Ecommerce\Framework\Http\Request;
use Kirki\Ecommerce\Tests\Support\CreatesTestProducts;
use Kirki\Ecommerce\Tests\Support\RestTestCase;
use Kirki\Ecommerce\Tests\Support\SeedsTestShipping;

use function Kirki\Ecommerce\Framework\app;
use function Kirki\Ecommerce\Framework\uuid;

class CartApiTest extends RestTestCase
{
    use CreatesTestProducts;
    use SeedsTestShipping;

    /**
     * Variant id for the current test.
     *
     * @var mixed
     * @since 1.0.0
     */
    protected $variant_id;
    /**
     * Cart item id for the current test.
     *
     * @var mixed
     * @since 1.0.0
     */
    protected $cart_item_id;
    /**
     * Cart token.
     *
     * @var mixed
     * @since 1.0.0
     */
    protected $cart_token;
    /**
     * Cart headers.
     *
     * @var mixed
     * @since 1.0.0
     */
    protected $cart_headers = [];

    /**
     * Prepare state before each test.
     *
     * @return void
     * @since 1.0.0
     */
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

    /**
     * Prepare variant.
     *
     * @return void
     * @since 1.0.0
     */
    protected function prepare_variant(): void
    {
        if ($this->variant_id) {
            return;
        }

        $product = $this->create_product([
            'title' => 'Cart Product ' . wp_generate_password(4, false),
        ]);
        $this->variant_id = $this->default_variant_id($product);
    }

    /**
     * Get cart returns empty cart initially.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_get_cart_returns_empty_cart_initially(): void
    {
        $response = $this->request('GET', 'cart');
        $payload = $this->assert_api_success($response);

        $this->assertEmpty($payload['data']);
    }

    /**
     * Add item to cart.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_add_item_to_cart(): void
    {
        $this->prepare_variant();
        $payload = $this->add_cart_item(2);
        $this->assertCount(1, $payload['items']);
        $this->assertEquals(2, $payload['items'][0]['quantity']);

        $this->cart_item_id = $payload['items'][0]['id'];
    }

    /**
     * Cart item and address lifecycle.
     *
     * @return void
     * @since 1.0.0
     */
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
        $this->assertEmpty($emptied['data']);
    }

    /**
     * Apply and remove coupon on cart.
     *
     * @return void
     * @since 1.0.0
     */
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

    /**
     * Add item validation fails without variant id.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_add_item_validation_fails_without_variant_id(): void
    {
        $response = $this->request('POST', 'cart/items', [
            'quantity' => 1,
        ]);

        $this->assert_validation_error($response);
    }

    /**
     * Unauthenticated cart lookup returns an empty cart.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_unauthenticated_request_returns_empty_cart(): void
    {
        $this->logout();

        $response = $this->request('GET', 'cart');
        $payload = $this->assert_api_success($response);

        $this->assertEmpty($payload['data']);
    }

    public function test_cookie_lookup_missing_stale_unknown_and_header_fallback(): void
    {
        $this->prepare_variant();

        $empty = $this->assert_api_success($this->request('GET', 'cart'));
        $this->assertEmpty($empty['data']);

        $expired = $this->raw_cart([
            'cart_token' => uuid(),
            'expires_at' => date('Y-m-d H:i:s', time() - DAY_IN_SECONDS),
        ]);

        $expired_payload = $this->with_cart_cookie($expired->cart_token, function () {
            return $this->assert_api_success($this->request('GET', 'cart'));
        });

        $this->assertEmpty($expired_payload['data']);

        $unknown_payload = $this->with_cart_cookie(uuid(), function () {
            return $this->assert_api_success($this->request('GET', 'cart'));
        });

        $this->assertEmpty($unknown_payload['data']);

        $guest_cart = $this->create_service_cart(null, $this->variant_id, 1);
        $header_payload = $this->assert_api_success($this->request('GET', 'cart', [], [
            Cart::HEADER_TOKEN => $guest_cart->cart_token,
        ]));

        $this->assertEquals(get_current_user_id(), $header_payload['data']['user_id']);
        $this->assertNull($header_payload['data']['cart_token']);
    }

    public function test_authenticated_cart_lookup_uses_user_id_without_customer_record(): void
    {
        $this->prepare_variant();
        $user_id = static::factory()->user->create(['role' => 'subscriber']);
        wp_set_current_user($user_id);

        $cart = $this->add_cart_item(2);

        $this->assertEquals($user_id, $cart['user_id']);
        $this->assertArrayNotHasKey('customer_id', $cart);
        $this->assertNull($cart['cart_token']);

        $payload = $this->assert_api_success($this->request('GET', 'cart'));

        $this->assertEquals($cart['id'], $payload['data']['id']);
        $this->assertEquals($user_id, $payload['data']['user_id']);
    }

    public function test_sign_in_resolver_handles_none_owned_adoption_and_merge(): void
    {
        $this->prepare_variant();
        $service = app()->make(CartService::class);

        $user_without_cart = static::factory()->user->create(['role' => 'subscriber']);
        $none = $service->get_cart($user_without_cart);
        $this->assertNull($none);

        $owned_user = static::factory()->user->create(['role' => 'subscriber']);
        $owned_cart = $this->create_service_cart($owned_user, $this->variant_id, 1);
        $owned = $service->get_cart($owned_user);
        $this->assertEquals($owned_cart->id, $owned->id);

        $adopt_user = static::factory()->user->create(['role' => 'subscriber']);
        $anonymous_cart = $this->create_service_cart(null, $this->variant_id, 1);
        $adopted = $service->get_cart($adopt_user, $anonymous_cart->cart_token);
        $this->assertEquals($adopt_user, $adopted->user_id);
        $this->assertNull($adopted->cart_token);

        $merge_user = static::factory()->user->create(['role' => 'subscriber']);
        $merge_owned = $this->create_service_cart($merge_user, $this->variant_id, 1);
        $second_product = $this->create_product([
            'title' => 'Merge Product ' . wp_generate_password(4, false),
        ]);
        $second_variant_id = $this->default_variant_id($second_product);
        $merge_guest = $this->create_service_cart(null, $second_variant_id, 2);

        $merged = $service->get_cart($merge_user, $merge_guest->cart_token);

        $this->assertEquals($merge_owned->id, $merged->id);
        $this->assertCount(2, $merged->items);
        $this->assertNull(CartModel::find($merge_guest->id));
    }

    public function test_login_with_guest_cart_merges_on_plain_get(): void
    {
        $this->prepare_variant();

        $owned_user = static::factory()->user->create(['role' => 'subscriber']);
        $this->create_service_cart($owned_user, $this->variant_id, 1);

        $second_product = $this->create_product([
            'title' => 'Login Merge Product ' . wp_generate_password(4, false),
        ]);
        $second_variant_id = $this->default_variant_id($second_product);
        $guest_cart = $this->create_service_cart(null, $second_variant_id, 2);

        wp_set_current_user($owned_user);

        $payload = $this->with_cart_cookie($guest_cart->cart_token, function () {
            return $this->assert_api_success($this->request('GET', 'cart'));
        });

        $this->assertCount(2, $payload['data']['items']);
    }

    public function test_current_cart_merges_guest_cart_for_authenticated_shopper(): void
    {
        $this->prepare_variant();

        $owned_user = static::factory()->user->create(['role' => 'subscriber']);
        $this->create_service_cart($owned_user, $this->variant_id, 1);

        $second_product = $this->create_product([
            'title' => 'Current Cart Merge Product ' . wp_generate_password(4, false),
        ]);
        $second_variant_id = $this->default_variant_id($second_product);
        $guest_cart = $this->create_service_cart(null, $second_variant_id, 2);

        wp_set_current_user($owned_user);

        $merged = $this->with_cart_cookie($guest_cart->cart_token, function () {
            app()->instance('request', Request::capture());
            return app()->make(CartService::class)->get_current_cart();
        });

        $this->assertCount(2, $merged->items);
        $this->assertNull(CartModel::find($guest_cart->id));
    }

    public function test_duplicate_variant_merge_uses_guest_quantity(): void
    {
        $product = $this->create_product([
            'variants' => [
                [
                    'base_price' => 29.99,
                    'sku' => 'SKU-' . wp_generate_password(6, false),
                    'available_quantity' => 5,
                    'in_stock' => true,
                    'track_inventory' => true,
                    'is_default' => true,
                    'attribute_values' => [],
                ],
            ],
        ]);
        $variant_id = $this->default_variant_id($product);
        $user_id = static::factory()->user->create(['role' => 'subscriber']);
        $owned = $this->raw_cart(['user_id' => $user_id]);
        $guest = $this->raw_cart(['cart_token' => uuid()]);

        CartItem::create([
            'cart_id' => $owned->id,
            'product_id' => $product['id'],
            'variant_id' => $variant_id,
            'quantity' => 3,
        ]);
        CartItem::create([
            'cart_id' => $guest->id,
            'product_id' => $product['id'],
            'variant_id' => $variant_id,
            'quantity' => 9,
        ]);

        $result = app()->make(CartService::class)->get_cart($user_id, $guest->cart_token);
        $item = $result->items->first();

        $this->assertEquals(9, $item->quantity);
    }

    public function test_cross_shopper_item_update_and_remove_are_forbidden(): void
    {
        $this->prepare_variant();
        $owner_id = static::factory()->user->create(['role' => 'subscriber']);
        $attacker_id = static::factory()->user->create(['role' => 'subscriber']);
        $owner_cart = $this->create_service_cart($owner_id, $this->variant_id, 1);

        $second_product = $this->create_product([
            'title' => 'Attacker Cart Product ' . wp_generate_password(4, false),
        ]);
        $this->create_service_cart($attacker_id, $this->default_variant_id($second_product), 1);

        wp_set_current_user($attacker_id);

        $item_id = $owner_cart->items->first()->id;

        $update = $this->request('PUT', 'cart/items/' . $item_id, [
            'id' => $item_id,
            'quantity' => 2,
        ]);
        $this->assert_api_error($update, 403);

        $remove = $this->request('DELETE', 'cart/items/' . $item_id);
        $this->assert_api_error($remove, 403);
    }

    /**
     * Add cart item.
     * @param int $quantity Quantity.
     *
     * @return array
     * @since 1.0.0
     */
    protected function add_cart_item(int $quantity = 1): array
    {
        $response = $this->request('POST', 'cart/items', [
            'variant_id' => $this->variant_id,
            'quantity' => $quantity,
        ], $this->cart_headers);

        $payload = $this->assert_api_success($response)['data'];

        if (!empty($payload['cart_token'])) {
            $this->cart_token = $payload['cart_token'];
            $this->cart_headers = [Cart::HEADER_TOKEN => $this->cart_token];
        }

        return $payload;
    }

    protected function create_service_cart($user_id, int $variant_id, int $quantity)
    {
        $variant = app()->make(VariantService::class)->find_or_null($variant_id);

        $dto = new AddToCartDTO();
        $dto->product_id = $variant ? $variant->product_id : null;
        $dto->variant_id = $variant_id;
        $dto->quantity = $quantity;
        $dto->user_id = $user_id;

        return app()->make(CartService::class)->add_item($dto);
    }

    protected function raw_cart(array $overrides = [])
    {
        return CartModel::create(array_merge([
            'currency_code' => 'USD',
            'base_currency_code' => 'USD',
        ], $overrides));
    }

    protected function with_cart_cookie(string $token, callable $callback)
    {
        $had_cookie = array_key_exists(Cart::COOKIE_TOKEN, $_COOKIE);
        $previous = $_COOKIE[Cart::COOKIE_TOKEN] ?? null;
        $_COOKIE[Cart::COOKIE_TOKEN] = $token;

        try {
            return $callback();
        } finally {
            if ($had_cookie) {
                $_COOKIE[Cart::COOKIE_TOKEN] = $previous;
            } else {
                unset($_COOKIE[Cart::COOKIE_TOKEN]);
            }
        }
    }

    /**
     * Create coupon.
     * @param string $code Code.
     *
     * @return void
     * @since 1.0.0
     */
    protected function create_coupon(string $code): void
    {
        $response = $this->request('POST', 'coupons', [
            'method' => CouponMethod::CODE,
            'title' => 'Cart Coupon',
            'code' => $code,
            'discount_type' => DiscountType::AMOUNT_OFF,
            'discount_target' => DiscountTarget::ORDER,
            'discount_value_type' => DiscountValueType::PERCENTAGE,
            'discount_amount' => 10,
            'start_datetime' => '2025-01-01T00:00:00+00:00',
            'has_end_datetime' => false,
            'customer_include_eligibility' => CustomerIncludeEligibility::EVERYONE,
            'customer_exclude_eligibility' => CustomerExcludeEligibility::NONE,
            'is_active' => true,
        ]);

        $this->assert_api_success($response, 201);
    }
}
