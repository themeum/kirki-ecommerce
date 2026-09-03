<?php

namespace Kirki\Ecommerce\Tests\Integration;

use Kirki\Ecommerce\App\Actions\Cart\AddToCartAction;
use Kirki\Ecommerce\App\Constants\Cart;
use Kirki\Ecommerce\App\Constants\Coupon\CouponMethod;
use Kirki\Ecommerce\App\Constants\Coupon\CustomerExcludeEligibility;
use Kirki\Ecommerce\App\Constants\Coupon\CustomerIncludeEligibility;
use Kirki\Ecommerce\App\Constants\Coupon\DiscountTarget;
use Kirki\Ecommerce\App\Constants\Coupon\DiscountType;
use Kirki\Ecommerce\App\Constants\Coupon\DiscountValueType;
use Kirki\Ecommerce\App\Constants\Coupon\EligibleItemType;
use Kirki\Ecommerce\App\DTO\Cart\AddToCartDTO;
use Kirki\Ecommerce\App\Models\Cart as CartModel;
use Kirki\Ecommerce\App\Models\CartCoupon;
use Kirki\Ecommerce\App\Models\CartItem;
use Kirki\Ecommerce\App\Models\Coupon as CouponModel;
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
     * Two sequential add-to-cart calls whose combined quantity exceeds the
     * variant's per-order limit are rejected on the call that crosses it,
     * even though each call's own quantity is within the limit.
     *
     * @return void
     */
    public function test_add_item_rejects_when_cumulative_quantity_exceeds_limit(): void
    {
        $product = $this->create_product([
            'variants' => [[
                'base_price' => 29.99,
                'sku' => 'SKU-' . wp_generate_password(6, false),
                'available_quantity' => 100,
                'in_stock' => true,
                'is_default' => true,
                'attribute_values' => [],
                'has_limit_per_order' => true,
                'max_per_order' => 3,
            ]],
        ]);
        $this->variant_id = $this->default_variant_id($product);

        $cart = $this->add_cart_item(2);
        $this->assertEquals(2, $cart['items'][0]['quantity']);

        $response = $this->request('POST', 'cart/items', [
            'variant_id' => $this->variant_id,
            'quantity' => 2,
        ], $this->cart_headers);

        $this->assert_api_error($response, 500);

        $current = $this->assert_api_success($this->request('GET', 'cart', [], $this->cart_headers))['data'];
        $this->assertCount(1, $current['items']);
        $this->assertEquals(2, $current['items'][0]['quantity']);
    }

    /**
     * Two sequential add-to-cart calls whose combined quantity exceeds
     * available stock are rejected on the call that crosses it, even though
     * each call's own quantity is within stock.
     *
     * @return void
     */
    public function test_add_item_rejects_when_cumulative_quantity_exceeds_stock(): void
    {
        $product = $this->create_product([
            'variants' => [[
                'base_price' => 29.99,
                'sku' => 'SKU-' . wp_generate_password(6, false),
                'available_quantity' => 3,
                'in_stock' => true,
                'track_inventory' => true,
                'is_default' => true,
                'attribute_values' => [],
            ]],
        ]);
        $this->variant_id = $this->default_variant_id($product);

        $cart = $this->add_cart_item(2);
        $this->assertEquals(2, $cart['items'][0]['quantity']);

        $response = $this->request('POST', 'cart/items', [
            'variant_id' => $this->variant_id,
            'quantity' => 2,
        ], $this->cart_headers);

        $this->assert_api_error($response, 500);

        $current = $this->assert_api_success($this->request('GET', 'cart', [], $this->cart_headers))['data'];
        $this->assertCount(1, $current['items']);
        $this->assertEquals(2, $current['items'][0]['quantity']);
    }

    /**
     * A single add-to-cart call that alone exceeds the per-order limit is
     * still rejected, guarding against regressing the already-working
     * single-call case while fixing the cumulative one.
     *
     * @return void
     */
    public function test_add_item_rejects_single_call_exceeding_limit(): void
    {
        $product = $this->create_product([
            'variants' => [[
                'base_price' => 29.99,
                'sku' => 'SKU-' . wp_generate_password(6, false),
                'available_quantity' => 100,
                'in_stock' => true,
                'is_default' => true,
                'attribute_values' => [],
                'has_limit_per_order' => true,
                'max_per_order' => 3,
            ]],
        ]);
        $this->variant_id = $this->default_variant_id($product);

        $response = $this->request('POST', 'cart/items', [
            'variant_id' => $this->variant_id,
            'quantity' => 5,
        ], $this->cart_headers);

        $this->assert_api_error($response, 500);

        $current = $this->request('GET', 'cart', [], $this->cart_headers);
        $payload = $this->assert_api_success($current)['data'];
        $this->assertEmpty($payload);
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
        $this->assertEmpty($removed['data']);

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

    public function test_removing_non_last_item_keeps_cart_and_last_removal_deletes_it(): void
    {
        $this->prepare_variant();
        $first_cart = $this->add_cart_item(1);
        $first_item_id = $first_cart['items'][0]['id'];

        $second_product = $this->create_product([
            'title' => 'Second Cart Product ' . wp_generate_password(4, false),
        ]);
        $this->variant_id = $this->default_variant_id($second_product);

        $cart = $this->add_cart_item(1);
        $this->assertCount(2, $cart['items']);

        $second_item_id = current(array_values(array_diff(
            array_column($cart['items'], 'id'),
            [$first_item_id]
        )));

        $remove_first = $this->assert_api_success(
            $this->request('DELETE', 'cart/items/' . $first_item_id, [], $this->cart_headers)
        );

        $this->assertEquals($cart['id'], $remove_first['data']['id']);
        $this->assertCount(1, $remove_first['data']['items']);

        $remove_second = $this->assert_api_success(
            $this->request('DELETE', 'cart/items/' . $second_item_id, [], $this->cart_headers)
        );

        $this->assertEmpty($remove_second['data']);
        $this->assertNull(CartModel::find($cart['id']));
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
        $this->assertNotNull($this->find_coupon_in_response($applied['data'], $code));

        $remove = $this->request('DELETE', 'cart/coupon', ['code' => $code], $this->cart_headers);
        $removed = $this->assert_api_success($remove);
        $this->assertEmpty($removed['data']['pricing']['coupons']);
    }

    public function test_stacking_item_scoped_and_cart_wide_coupons(): void
    {
        $product_a = $this->create_product([
            'title' => 'Stack Product A ' . wp_generate_password(4, false),
            'variants' => [[
                'base_price' => 100,
                'sku' => 'SKU-' . wp_generate_password(6, false),
                'available_quantity' => 100,
                'in_stock' => true,
                'is_default' => true,
                'attribute_values' => [],
            ]],
        ]);
        $this->variant_id = $this->default_variant_id($product_a);
        $this->add_cart_item(1);

        $this->add_second_cart_item(50, 1);

        $item_code = 'ITEM-' . wp_generate_password(6, false);
        $this->create_coupon($item_code, [
            'discount_target' => DiscountTarget::PRODUCTS,
            'discount_value_type' => DiscountValueType::FIXED,
            'discount_amount' => 10,
            'eligible_item_type' => EligibleItemType::SPECIFIC_PRODUCTS,
            'product_ids' => [(int) $product_a['id']],
        ]);

        $order_code = 'ORDER-' . wp_generate_password(6, false);
        $this->create_coupon($order_code, [
            'discount_target' => DiscountTarget::ORDER,
            'discount_value_type' => DiscountValueType::PERCENTAGE,
            'discount_amount' => 10,
        ]);

        $this->assert_api_success($this->request('POST', 'cart/coupon', ['code' => $item_code], $this->cart_headers));
        $applied = $this->assert_api_success(
            $this->request('POST', 'cart/coupon', ['code' => $order_code], $this->cart_headers)
        );

        $this->assertCount(2, $applied['data']['pricing']['coupons']);

        // $10 fixed off product A ($1000) + 10% off the $140 remaining
        // ($90 + $50) = $1000 + $1400 = $2400 total discount.
        $this->assertEquals(2400, round($applied['data']['pricing']['base_discount_total_money_object']['raw'] * 100));
    }

    public function test_removing_one_of_several_applied_coupons_keeps_the_rest(): void
    {
        $this->prepare_variant();
        $this->add_cart_item();

        $first_code = 'FIRST-' . wp_generate_password(6, false);
        $this->create_coupon($first_code);
        $second_code = 'SECOND-' . wp_generate_password(6, false);
        $this->create_coupon($second_code);

        $this->assert_api_success($this->request('POST', 'cart/coupon', ['code' => $first_code], $this->cart_headers));
        $this->assert_api_success($this->request('POST', 'cart/coupon', ['code' => $second_code], $this->cart_headers));

        $removed = $this->assert_api_success(
            $this->request('DELETE', 'cart/coupon', ['code' => $first_code], $this->cart_headers)
        );

        $this->assertCount(1, $removed['data']['pricing']['coupons']);
        $this->assertNotNull($this->find_coupon_in_response($removed['data'], $second_code));
        $this->assertNull($this->find_coupon_in_response($removed['data'], $first_code));
    }

    public function test_applying_duplicate_coupon_is_rejected(): void
    {
        $this->prepare_variant();
        $this->add_cart_item();

        $code = 'DUP-' . wp_generate_password(6, false);
        $this->create_coupon($code);

        $this->assert_api_success($this->request('POST', 'cart/coupon', ['code' => $code], $this->cart_headers));

        $second_apply = $this->request('POST', 'cart/coupon', ['code' => $code], $this->cart_headers);
        $this->assertGreaterThanOrEqual(400, $second_apply->get_status());
    }

    public function test_invalid_coupon_is_dropped_without_disabling_other_coupons(): void
    {
        $this->prepare_variant();
        $this->add_cart_item();

        $valid_code = 'VALID-' . wp_generate_password(6, false);
        $this->create_coupon($valid_code);
        $soon_invalid_code = 'INVALID-' . wp_generate_password(6, false);
        $coupon_id = $this->create_coupon($soon_invalid_code);

        $this->assert_api_success($this->request('POST', 'cart/coupon', ['code' => $valid_code], $this->cart_headers));
        $this->assert_api_success($this->request('POST', 'cart/coupon', ['code' => $soon_invalid_code], $this->cart_headers));

        CouponModel::find($coupon_id)->update(['is_active' => false]);

        $cart = $this->assert_api_success($this->request('GET', 'cart', [], $this->cart_headers));

        $this->assertCount(1, $cart['data']['pricing']['coupons']);
        $this->assertNotNull($this->find_coupon_in_response($cart['data'], $valid_code));

        $cart_id = $cart['data']['id'];
        $this->assertEquals(0, CartCoupon::where('cart_id', $cart_id)->where('coupon_id', $coupon_id)->count());
    }

    public function test_cart_wide_coupon_discount_reconciles_across_multiple_items(): void
    {
        $product_a = $this->create_product([
            'title' => 'Reconcile Product A ' . wp_generate_password(4, false),
            'variants' => [[
                'base_price' => 100,
                'sku' => 'SKU-' . wp_generate_password(6, false),
                'available_quantity' => 100,
                'in_stock' => true,
                'is_default' => true,
                'attribute_values' => [],
            ]],
        ]);
        $this->variant_id = $this->default_variant_id($product_a);
        $this->add_cart_item(1);

        $this->add_second_cart_item(100.01, 1);

        $third_product = $this->create_product([
            'title' => 'Reconcile Product C ' . wp_generate_password(4, false),
            'variants' => [[
                'base_price' => 99.98,
                'sku' => 'SKU-' . wp_generate_password(6, false),
                'available_quantity' => 100,
                'in_stock' => true,
                'is_default' => true,
                'attribute_values' => [],
            ]],
        ]);
        $this->request('POST', 'cart/items', [
            'variant_id' => $this->default_variant_id($third_product),
            'quantity' => 1,
        ], $this->cart_headers);

        $code = 'RECON-' . wp_generate_password(6, false);
        $this->create_coupon($code, [
            'discount_target' => DiscountTarget::ORDER,
            'discount_value_type' => DiscountValueType::FIXED,
            'discount_amount' => 10,
        ]);

        $applied = $this->assert_api_success(
            $this->request('POST', 'cart/coupon', ['code' => $code], $this->cart_headers)
        );

        $items_discount_sum = array_sum(array_map(
            fn($item) => round($item['base_discount_amount_money_object']['raw'] * 100),
            $applied['data']['items']
        ));

        $coupon = $this->find_coupon_in_response($applied['data'], $code);
        $coupon_discount = round($coupon['base_discount_amount_money_object']['raw'] * 100);
        $cart_discount_total = round($applied['data']['pricing']['base_discount_total_money_object']['raw'] * 100);

        $this->assertEquals(1000, $coupon_discount);
        $this->assertEquals($coupon_discount, $items_discount_sum);
        $this->assertEquals($coupon_discount, $cart_discount_total);
    }

    public function test_display_price_has_no_strikethrough_without_sale_or_product_coupon(): void
    {
        $this->prepare_variant();
        $cart = $this->add_cart_item(1);
        $item = $cart['items'][0];

        $this->assertNull($item['display_strikethrough_price_money_object']);
        $this->assertEquals(29.99, $item['display_line_price_money_object']['raw']);
        $this->assertSame([], $item['applied_product_coupons']);
    }

    public function test_display_price_strikes_through_regular_price_when_only_a_sale_is_active(): void
    {
        $product = $this->create_product([
            'title' => 'Sale Only Product ' . wp_generate_password(4, false),
            'variants' => [[
                'base_price' => 50,
                'base_sale_price' => 25,
                'sku' => 'SKU-' . wp_generate_password(6, false),
                'available_quantity' => 100,
                'in_stock' => true,
                'is_default' => true,
                'attribute_values' => [],
            ]],
        ]);
        $this->variant_id = $this->default_variant_id($product);
        $cart = $this->add_cart_item(1);
        $item = $cart['items'][0];

        $this->assertEquals(25.0, $item['display_line_price_money_object']['raw']);
        $this->assertEquals(50.0, $item['display_strikethrough_price_money_object']['raw']);
        $this->assertSame([], $item['applied_product_coupons']);
    }

    public function test_display_price_strikes_through_sale_price_when_a_product_coupon_also_applies(): void
    {
        $product = $this->create_product([
            'title' => 'Sale Plus Coupon Product ' . wp_generate_password(4, false),
            'variants' => [[
                'base_price' => 50,
                'base_sale_price' => 25,
                'sku' => 'SKU-' . wp_generate_password(6, false),
                'available_quantity' => 100,
                'in_stock' => true,
                'is_default' => true,
                'attribute_values' => [],
            ]],
        ]);
        $this->variant_id = $this->default_variant_id($product);
        $this->add_cart_item(1);

        $code = 'ITEMCOUPON-' . wp_generate_password(6, false);
        $this->create_coupon($code, [
            'discount_target' => DiscountTarget::PRODUCTS,
            'discount_value_type' => DiscountValueType::FIXED,
            'discount_amount' => 10,
            'eligible_item_type' => EligibleItemType::SPECIFIC_PRODUCTS,
            'product_ids' => [(int) $product['id']],
        ]);

        $applied = $this->assert_api_success($this->request('POST', 'cart/coupon', ['code' => $code], $this->cart_headers));
        $item = $applied['data']['items'][0];

        // Sale-adjusted price ($25) minus the $10 product coupon.
        $this->assertEquals(15.0, $item['display_line_price_money_object']['raw']);
        // Strikethrough is the sale price ($25), not the original regular price ($50).
        $this->assertEquals(25.0, $item['display_strikethrough_price_money_object']['raw']);
        $this->assertCount(1, $item['applied_product_coupons']);
        $this->assertEquals($code, $item['applied_product_coupons'][0]['code']);
        $this->assertEquals(10.0, $item['applied_product_coupons'][0]['display_discount_amount_money_object']['raw']);
    }

    public function test_display_price_strikes_through_regular_price_when_product_coupon_applies_without_a_sale(): void
    {
        $product = $this->create_product([
            'title' => 'Coupon Only Product ' . wp_generate_password(4, false),
            'variants' => [[
                'base_price' => 50,
                'sku' => 'SKU-' . wp_generate_password(6, false),
                'available_quantity' => 100,
                'in_stock' => true,
                'is_default' => true,
                'attribute_values' => [],
            ]],
        ]);
        $this->variant_id = $this->default_variant_id($product);
        $this->add_cart_item(1);

        $code = 'NOCASE-' . wp_generate_password(6, false);
        $this->create_coupon($code, [
            'discount_target' => DiscountTarget::PRODUCTS,
            'discount_value_type' => DiscountValueType::FIXED,
            'discount_amount' => 10,
            'eligible_item_type' => EligibleItemType::SPECIFIC_PRODUCTS,
            'product_ids' => [(int) $product['id']],
        ]);

        $applied = $this->assert_api_success($this->request('POST', 'cart/coupon', ['code' => $code], $this->cart_headers));
        $item = $applied['data']['items'][0];

        $this->assertEquals(40.0, $item['display_line_price_money_object']['raw']);
        $this->assertEquals(50.0, $item['display_strikethrough_price_money_object']['raw']);
    }

    public function test_order_scoped_coupon_never_changes_line_item_display_price(): void
    {
        $product = $this->create_product([
            'title' => 'Order Coupon Only Product ' . wp_generate_password(4, false),
            'variants' => [[
                'base_price' => 50,
                'sku' => 'SKU-' . wp_generate_password(6, false),
                'available_quantity' => 100,
                'in_stock' => true,
                'is_default' => true,
                'attribute_values' => [],
            ]],
        ]);
        $this->variant_id = $this->default_variant_id($product);
        $this->add_cart_item(1);

        // create_coupon() defaults to an ORDER-scoped 10% coupon.
        $code = 'ORDERONLY-' . wp_generate_password(6, false);
        $this->create_coupon($code);

        $applied = $this->assert_api_success($this->request('POST', 'cart/coupon', ['code' => $code], $this->cart_headers));
        $item = $applied['data']['items'][0];

        // The order coupon still discounts the item's combined base_discount_amount...
        $this->assertGreaterThan(0, $item['base_discount_amount_money_object']['raw']);
        // ...but never changes its display price or strikethrough.
        $this->assertNull($item['display_strikethrough_price_money_object']);
        $this->assertEquals(50.0, $item['display_line_price_money_object']['raw']);
        $this->assertSame([], $item['applied_product_coupons']);
    }

    public function test_multiple_product_coupons_on_the_same_item_collapse_into_a_single_display_tier(): void
    {
        $product = $this->create_product([
            'title' => 'Stacked Coupons Product ' . wp_generate_password(4, false),
            'variants' => [[
                'base_price' => 100,
                'sku' => 'SKU-' . wp_generate_password(6, false),
                'available_quantity' => 100,
                'in_stock' => true,
                'is_default' => true,
                'attribute_values' => [],
            ]],
        ]);
        $this->variant_id = $this->default_variant_id($product);
        $this->add_cart_item(1);

        $first_code = 'STACK1-' . wp_generate_password(6, false);
        $this->create_coupon($first_code, [
            'discount_target' => DiscountTarget::PRODUCTS,
            'discount_value_type' => DiscountValueType::FIXED,
            'discount_amount' => 10,
            'eligible_item_type' => EligibleItemType::SPECIFIC_PRODUCTS,
            'product_ids' => [(int) $product['id']],
        ]);
        $second_code = 'STACK2-' . wp_generate_password(6, false);
        $this->create_coupon($second_code, [
            'discount_target' => DiscountTarget::PRODUCTS,
            'discount_value_type' => DiscountValueType::FIXED,
            'discount_amount' => 15,
            'eligible_item_type' => EligibleItemType::SPECIFIC_PRODUCTS,
            'product_ids' => [(int) $product['id']],
        ]);

        $this->assert_api_success($this->request('POST', 'cart/coupon', ['code' => $first_code], $this->cart_headers));
        $applied = $this->assert_api_success($this->request('POST', 'cart/coupon', ['code' => $second_code], $this->cart_headers));
        $item = $applied['data']['items'][0];

        // Both discounts summed into one tier: $100 - $10 - $15 = $75.
        $this->assertEquals(75.0, $item['display_line_price_money_object']['raw']);
        $this->assertEquals(100.0, $item['display_strikethrough_price_money_object']['raw']);
        $this->assertCount(2, $item['applied_product_coupons']);
        $this->assertEqualsCanonicalizing(
            [$first_code, $second_code],
            array_column($item['applied_product_coupons'], 'code')
        );
    }

    public function test_total_after_discount_excludes_free_shipping_waiver_but_grand_total_still_reconciles(): void
    {
        $product = $this->create_product([
            'title' => 'Free Shipping Product ' . wp_generate_password(4, false),
            'variants' => [[
                'base_price' => 100,
                'sku' => 'SKU-' . wp_generate_password(6, false),
                'available_quantity' => 100,
                'in_stock' => true,
                'is_default' => true,
                'attribute_values' => [],
            ]],
        ]);
        $this->variant_id = $this->default_variant_id($product);
        $this->add_cart_item(1);

        $this->assert_api_success($this->request('PUT', 'cart', [
            'shipping_address' => [
                'first_name' => 'Jane',
                'last_name' => 'Doe',
                'email' => 'jane@example.com',
                'phone' => '1234567890',
                'address_line1' => '1 Test St',
                'city' => 'New York',
                'state' => 'NY',
                'postal_code' => '10001',
                'country' => 'US',
            ],
            'shipping_method' => 'method-0001',
        ], $this->cart_headers));

        $amount_off_code = 'AMOUNTOFF-' . wp_generate_password(6, false);
        $this->create_coupon($amount_off_code, [
            'discount_target' => DiscountTarget::ORDER,
            'discount_value_type' => DiscountValueType::FIXED,
            'discount_amount' => 10,
        ]);
        $free_shipping_code = 'FREESHIP-' . wp_generate_password(6, false);
        $this->create_coupon($free_shipping_code, [
            'discount_type' => DiscountType::FREE_SHIPPING,
        ]);

        $this->assert_api_success($this->request('POST', 'cart/coupon', ['code' => $amount_off_code], $this->cart_headers));
        $applied = $this->assert_api_success(
            $this->request('POST', 'cart/coupon', ['code' => $free_shipping_code], $this->cart_headers)
        );

        $pricing = $applied['data']['pricing'];

        // $100 subtotal - $10 amount-off coupon, unaffected by the shipping waiver.
        $this->assertEquals(90.0, $pricing['display_total_after_discount_money_object']['raw']);

        // Grand total still reconciles: pre-shipping total + shipping (waived) + tax.
        $expected_total = round(
            $pricing['display_total_after_discount_money_object']['raw']
            + $pricing['display_shipping_total_money_object']['raw']
            + $pricing['display_tax_total_money_object']['raw'],
            2
        );
        $this->assertEquals($expected_total, round($pricing['display_total_money_object']['raw'], 2));
        $this->assertEquals(0.0, $pricing['display_shipping_total_money_object']['raw']);
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

        return app()->make(AddToCartAction::class)->execute($dto);
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
    protected function create_coupon(string $code, array $overrides = []): int
    {
        $response = $this->request('POST', 'coupons', array_merge([
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
        ], $overrides));

        $payload = $this->assert_api_success($response, 201);

        return (int) $payload['data']['id'];
    }

    /**
     * Create a second product (with its own variant) at a given price and add
     * it to the current cart, returning the new item's variant id.
     */
    protected function add_second_cart_item(float $base_price, int $quantity = 1): int
    {
        $product = $this->create_product([
            'title' => 'Second Cart Product ' . wp_generate_password(4, false),
            'variants' => [[
                'base_price' => $base_price,
                'sku' => 'SKU-' . wp_generate_password(6, false),
                'available_quantity' => 100,
                'in_stock' => true,
                'is_default' => true,
                'attribute_values' => [],
            ]],
        ]);

        $variant_id = $this->default_variant_id($product);

        $this->request('POST', 'cart/items', [
            'variant_id' => $variant_id,
            'quantity' => $quantity,
        ], $this->cart_headers);

        return $variant_id;
    }

    protected function find_coupon_in_response(array $cart, string $code): ?array
    {
        foreach ($cart['pricing']['coupons'] as $coupon) {
            if ($coupon['code'] === $code) {
                return $coupon;
            }
        }

        return null;
    }
}
