<?php

namespace Kirki\Ecommerce\Tests\Integration;

use Kirki\Ecommerce\App\Constants\BulkActions;
use Kirki\Ecommerce\App\Constants\Coupon\CouponMethod;
use Kirki\Ecommerce\App\Constants\Coupon\CustomerEligibility;
use Kirki\Ecommerce\App\Constants\Coupon\DiscountTarget;
use Kirki\Ecommerce\App\Constants\Coupon\DiscountType;
use Kirki\Ecommerce\App\Constants\Coupon\DiscountValueType;
use Kirki\Ecommerce\App\Constants\Coupon\EligibleItemType;
use Kirki\Ecommerce\App\Models\Coupon;
use Kirki\Ecommerce\Tests\Support\CreatesTestProducts;
use Kirki\Ecommerce\Tests\Support\RestTestCase;

class CouponApiTest extends RestTestCase
{
    use CreatesTestProducts;

    /**
     * Coupon id for the current test.
     *
     * @var mixed
     * @since 1.0.0
     */
    protected $coupon_id;

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
    }

    /**
     * Create coupon returns 201 and persists.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_create_coupon_returns_201_and_persists(): void
    {
        $response = $this->request('POST', 'coupons', $this->coupon_payload([
            'title' => 'Summer Sale',
            'code' => 'SUMMER-' . wp_generate_password(6, false),
        ]));

        $payload = $this->assert_api_success($response, 201);
        $this->assertArrayHasKey('id', $payload['data']);
        $this->assertEquals('Summer Sale', $payload['data']['title']);
        $this->assertEquals(CouponMethod::CODE, $payload['data']['method']);
        $this->assertEquals(DiscountType::AMOUNT_OFF, $payload['data']['discount_type']);
        $this->assertTrue($payload['data']['is_active']);

        $this->coupon_id = $payload['data']['id'];
    }

    /**
     * Create coupon persists target countries.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_create_coupon_persists_target_countries(): void
    {
        $response = $this->request('POST', 'coupons', $this->coupon_payload([
            'title' => 'Target Countries Coupon',
            'code' => 'TARGET-' . wp_generate_password(6, false),
            'target_countries' => ['US', 'CA'],
        ]));

        $payload = $this->assert_api_success($response, 201);
        $this->assertEquals(['US', 'CA'], $payload['data']['target_countries']);

        $this->coupon_id = $payload['data']['id'];
        $fetched = $this->request('GET', 'coupons/' . $this->coupon_id);
        $fetched_payload = $this->assert_api_success($fetched);
        $this->assertEquals(['US', 'CA'], $fetched_payload['data']['target_countries']);
    }

    /**
     * Create coupon with empty target countries persists as an empty array.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_create_coupon_with_empty_target_countries_persists_empty_array(): void
    {
        $response = $this->request('POST', 'coupons', $this->coupon_payload([
            'title' => 'Empty Target Countries Coupon',
            'code' => 'EMPTY-' . wp_generate_password(6, false),
            'target_countries' => [],
        ]));

        $payload = $this->assert_api_success($response, 201);
        $this->assertEquals([], $payload['data']['target_countries']);

        $this->coupon_id = $payload['data']['id'];
        $fetched = $this->request('GET', 'coupons/' . $this->coupon_id);
        $fetched_payload = $this->assert_api_success($fetched);
        $this->assertEquals([], $fetched_payload['data']['target_countries']);
    }

    /**
     * Coupon persists combinations on save.
     *
     * `combinations` is not currently exposed through the coupon create/update
     * REST request (no validation rule wires it from the request payload), so
     * this asserts persistence at the model layer directly rather than via
     * the API, mirroring the existing `Coupon::create()` usage in
     * OrderApiTest.php for setup unrelated to API validation.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_coupon_persists_combinations(): void
    {
        $coupon = Coupon::create($this->coupon_payload([
            'title' => 'Combinations Coupon',
            'code' => 'COMBO-' . wp_generate_password(6, false),
            'combinations' => ['free-shipping', 'seasonal'],
        ]));

        $this->coupon_id = $coupon->id;
        $fetched = Coupon::find($coupon->id);
        $this->assertEquals(['free-shipping', 'seasonal'], $fetched->combinations);
    }

    /**
     * Show coupon returns resource.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_show_coupon_returns_resource(): void
    {
        $coupon = $this->create_coupon(['title' => 'Show Coupon']);
        $this->coupon_id = $coupon['id'];

        $response = $this->request('GET', 'coupons/' . $this->coupon_id);
        $payload = $this->assert_api_success($response);

        $this->assertEquals($this->coupon_id, $payload['data']['id']);
        $this->assertEquals('Show Coupon', $payload['data']['title']);
    }

    /**
     * Update coupon changes fields.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_update_coupon_changes_fields(): void
    {
        $coupon = $this->create_coupon();
        $this->coupon_id = $coupon['id'];

        $response = $this->request('PUT', 'coupons/' . $this->coupon_id, $this->coupon_payload([
            'id' => $this->coupon_id,
            'title' => 'Updated Coupon',
            'code' => $coupon['code'],
            'is_active' => false,
        ]));

        $payload = $this->assert_api_success($response);
        $this->assertEquals('Updated Coupon', $payload['data']['title']);
        $this->assertFalse($payload['data']['is_active']);
    }

    /**
     * Delete coupon removes record.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_delete_coupon_removes_record(): void
    {
        $this->coupon_id = $this->create_coupon()['id'];

        $response = $this->request('DELETE', 'coupons/' . $this->coupon_id);
        $payload = $this->assert_api_success($response);

        $this->assertTrue($payload['data']);
    }

    /**
     * Show deleted coupon returns 404.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_show_deleted_coupon_returns_404(): void
    {
        $this->coupon_id = $this->create_coupon()['id'];
        $this->request('DELETE', 'coupons/' . $this->coupon_id);

        $response = $this->request('GET', 'coupons/' . $this->coupon_id);
        $this->assert_api_error($response, 404);
    }

    /**
     * Create coupon validation fails without title.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_create_coupon_validation_fails_without_title(): void
    {
        $response = $this->request('POST', 'coupons', $this->coupon_payload([
            'title' => '',
        ]));

        $this->assert_validation_error($response);
    }

    /**
     * Unauthenticated request returns 401.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_unauthenticated_request_returns_401(): void
    {
        $this->logout();

        $response = $this->request('GET', 'coupons');
        $this->assert_api_error($response, 401);
    }

    /**
     * List coupons returns paginated results.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_list_coupons_returns_paginated_results(): void
    {
        $this->create_coupon(['title' => 'Coupon Alpha']);
        $this->create_coupon(['title' => 'Coupon Beta']);

        $response = $this->request('GET', 'coupons', [
            'page' => 1,
            'limit' => 10,
        ]);

        $payload = $this->assert_api_success($response);
        $this->assertArrayHasKey('results', $payload['data']);
        $this->assertArrayHasKey('total', $payload['data']);
        $this->assertGreaterThanOrEqual(2, $payload['data']['total']);
        $this->assertNotEmpty($payload['data']['results']);
    }

    /**
     * Bulk action on coupons.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_bulk_action_on_coupons(): void
    {
        $first = $this->create_coupon(['title' => 'Bulk One']);
        $second = $this->create_coupon(['title' => 'Bulk Two']);

        $response = $this->request('POST', 'coupons/bulk', [
            'action' => BulkActions::DELETE,
            'ids' => [$first['id'], $second['id']],
        ]);

        $payload = $this->assert_api_success($response);
        $this->assertTrue($payload['data']);

        $check = $this->request('GET', 'coupons/' . $first['id']);
        $this->assert_api_error($check, 404);
    }

    /**
     * Duplicating a coupon copies its category, product, and customer associations.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_duplicate_coupon_preserves_associations(): void
    {
        $category = $this->create_coupon_test_category();
        $product = $this->create_product();
        $reward_product = $this->create_product();
        $customer = $this->create_coupon_test_customer();

        $original = $this->create_coupon([
            'title' => 'Coupon With Associations',
            'eligible_item_type' => EligibleItemType::SPECIFIC_PRODUCTS,
            'customer_eligibility' => CustomerEligibility::SPECIFIC_CUSTOMERS,
            'category_ids' => [$category['id']],
            'product_ids' => [$product['id']],
            'reward_product_ids' => [$reward_product['id']],
            'customer_ids' => [$customer['id']],
        ]);

        $this->coupon_id = $original['id'];

        $response = $this->request('PATCH', 'coupons/' . $this->coupon_id . '/action', [
            'action' => 'duplicate',
        ]);

        $payload = $this->assert_api_success($response);
        $duplicated = $payload['data'];

        $this->assertNotEquals($this->coupon_id, $duplicated['id']);
        $this->assertEquals('Coupon With Associations - Copy', $duplicated['title']);
        $this->assertEqualsCanonicalizing([$category['id']], array_column($duplicated['categories'], 'id'));
        $this->assertEqualsCanonicalizing([$customer['id']], $duplicated['customers']);
        $this->assertEqualsCanonicalizing([$product['id'], $reward_product['id']], array_column($duplicated['products'], 'id'));
    }

    /**
     * Show coupon returns targeted products with the details the edit form renders.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_show_coupon_returns_detailed_products(): void
    {
        $product = $this->create_product();

        $coupon = $this->create_coupon([
            'title' => 'Coupon With Product Details',
            'discount_target' => DiscountTarget::PRODUCTS,
            'eligible_item_type' => EligibleItemType::SPECIFIC_PRODUCTS,
            'product_ids' => [$product['id']],
        ]);

        $this->coupon_id = $coupon['id'];

        $response = $this->request('GET', 'coupons/' . $this->coupon_id);
        $payload = $this->assert_api_success($response);

        $products = $payload['data']['products'];
        $this->assertCount(1, $products);
        $this->assertEquals($product['id'], $products[0]['id']);
        $this->assertEquals($product['title'], $products[0]['title']);
        $this->assertArrayHasKey('image', $products[0]);
        $this->assertArrayHasKey('attributes', $products[0]);
        $this->assertNotEmpty($products[0]['variants']);
    }

    /**
     * Duplicating a missing coupon returns 404.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_duplicate_missing_coupon_returns_404(): void
    {
        $response = $this->request('PATCH', 'coupons/999999/action', [
            'action' => 'duplicate',
        ]);

        $this->assert_api_error($response, 404);
    }

    /**
     * Create coupon.
     * @param array $overrides Overrides.
     *
     * @return array
     * @since 1.0.0
     */
    protected function create_coupon(array $overrides = []): array
    {
        $response = $this->request('POST', 'coupons', $this->coupon_payload($overrides));
        $payload = $this->assert_api_success($response, 201);

        return $payload['data'];
    }

    /**
     * Create a category for coupon association tests.
     *
     * @return array
     * @since 1.0.0
     */
    protected function create_coupon_test_category(): array
    {
        $response = $this->request('POST', 'categories', [
            'name' => 'Coupon Test Category',
            'slug' => 'coupon-test-category-' . wp_generate_password(6, false),
        ]);

        $payload = $this->assert_api_success($response, 201);

        return $payload['data'];
    }

    /**
     * Create a customer for coupon association tests.
     *
     * @return array
     * @since 1.0.0
     */
    protected function create_coupon_test_customer(): array
    {
        $unique = wp_generate_password(8, false);

        $response = $this->request('POST', 'customers', [
            'first_name' => 'Jane',
            'last_name' => 'Doe',
            'email' => 'coupon-customer-' . $unique . '@example.com',
            'phone' => '5550100',
            'is_billing_same_as_shipping' => true,
            'shipping_address' => [
                'first_name' => 'Jane',
                'last_name' => 'Doe',
                'email' => 'coupon-customer-' . $unique . '@example.com',
                'phone' => '5550100',
                'address_line1' => '123 Main St',
                'address_line2' => '',
                'city' => 'New York',
                'state' => 'NY',
                'postal_code' => '10001',
                'country' => 'US',
            ],
        ]);

        $payload = $this->assert_api_success($response, 201);

        return $payload['data'];
    }

    /**
     * Coupon payload.
     * @param array $overrides Overrides.
     *
     * @return array
     * @since 1.0.0
     */
    protected function coupon_payload(array $overrides = []): array
    {
        $payload = [
            'method' => CouponMethod::CODE,
            'title' => 'Test Coupon',
            'code' => 'TEST-' . wp_generate_password(6, false),
            'discount_type' => DiscountType::AMOUNT_OFF,
            'discount_target' => DiscountTarget::ORDER,
            'discount_value_type' => DiscountValueType::PERCENTAGE,
            'discount_amount' => 10,
            'start_datetime' => '2025-01-01T00:00:00+00:00',
            'has_end_datetime' => false,
            'customer_eligibility' => CustomerEligibility::ALL,
            'is_active' => true,
        ];

        return array_merge($payload, $overrides);
    }
}
