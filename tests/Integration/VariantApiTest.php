<?php

namespace Kirki\Ecommerce\Tests\Integration;

use Kirki\Ecommerce\Tests\Support\CreatesTestProducts;
use Kirki\Ecommerce\Tests\Support\RestTestCase;

class VariantApiTest extends RestTestCase
{
    use CreatesTestProducts;

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
     * List variants returns paginated results.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_list_variants_returns_paginated_results(): void
    {
        $this->create_product();

        $response = $this->request('GET', 'variants', [
            'page' => 1,
            'limit' => 10,
        ]);

        $payload = $this->assert_api_success($response);
        $this->assertArrayHasKey('results', $payload['data']);
        $this->assertArrayHasKey('total', $payload['data']);
        $this->assertGreaterThanOrEqual(1, $payload['data']['total']);
    }

    /**
     * Get variants by ids returns resources.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_get_variants_by_ids_returns_resources(): void
    {
        $product = $this->create_product();
        $variant_id = $this->default_variant_id($product);

        $response = $this->request('GET', 'variants/bulk/' . $variant_id);
        $payload = $this->assert_api_success($response);

        $this->assertNotEmpty($payload['data']);
        $this->assertEquals($variant_id, $payload['data'][0]['id']);
    }

    /**
     * Show returns a single variant carrying its product identifier.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_show_variant_returns_product_id(): void
    {
        $product = $this->create_product();
        $variant_id = $this->default_variant_id($product);

        $response = $this->request('GET', 'variants/' . $variant_id);
        $payload = $this->assert_api_success($response);

        $this->assertEquals($variant_id, $payload['data']['id']);
        $this->assertEquals((int) $product['id'], (int) $payload['data']['product_id']);
        $this->assertArrayHasKey('preview_url', $payload['data']);
    }

    /**
     * Show returns not found for an unknown identifier.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_show_unknown_variant_returns_not_found(): void
    {
        $response = $this->request('GET', 'variants/999999');

        $this->assert_api_error($response, 404);
    }

    /**
     * Update converts major currency units to minor units.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_update_variant_persists_price_in_minor_units(): void
    {
        $product = $this->create_product();
        $variant_id = $this->default_variant_id($product);

        $response = $this->request('PUT', 'variants/' . $variant_id, [
            'id' => $variant_id,
            'base_price' => 29.00,
        ]);

        $payload = $this->assert_api_success($response);
        $this->assertEquals(29.00, (float) $payload['data']['base_price']);

        $variant = \Kirki\Ecommerce\App\Models\Variant::find($variant_id);
        $this->assertEquals(2900, (int) $variant->base_price);
    }

    /**
     * Update only writes the fields the request carries.
     *
     * Guards the regression where a partial update reset `product_id` and
     * `is_default` to their defaults, detaching the variant from its product.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_update_variant_leaves_omitted_fields_untouched(): void
    {
        $product = $this->create_product();
        $variant_id = $this->default_variant_id($product);

        $before = \Kirki\Ecommerce\App\Models\Variant::find($variant_id);
        $original_sku = $before->sku;

        $response = $this->request('PUT', 'variants/' . $variant_id, [
            'id' => $variant_id,
            'is_visible' => false,
        ]);

        $this->assert_api_success($response);

        $after = \Kirki\Ecommerce\App\Models\Variant::find($variant_id);
        $this->assertEquals((int) $product['id'], (int) $after->product_id);
        $this->assertTrue((bool) $after->is_default);
        $this->assertEquals($original_sku, $after->sku);
        $this->assertFalse((bool) $after->is_visible);
    }

    /**
     * Update refuses to write a committed quantity.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_update_variant_ignores_committed_quantity(): void
    {
        $product = $this->create_product();
        $variant_id = $this->default_variant_id($product);

        $before = (int) \Kirki\Ecommerce\App\Models\Variant::find($variant_id)->committed_quantity;

        $response = $this->request('PUT', 'variants/' . $variant_id, [
            'id' => $variant_id,
            'committed_quantity' => 77,
        ]);

        $this->assert_api_success($response);

        $after = (int) \Kirki\Ecommerce\App\Models\Variant::find($variant_id)->committed_quantity;
        $this->assertEquals($before, $after);
    }

    /**
     * The bulk update route is not shadowed by the single-variant route.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_bulk_update_route_is_not_shadowed_by_single_variant_route(): void
    {
        $product = $this->create_product();
        $variant_id = $this->default_variant_id($product);

        $response = $this->request('PUT', 'variants/bulk', [
            'variants' => [
                [
                    'id' => $variant_id,
                    'base_price' => 12.50,
                ],
            ],
        ]);

        $payload = $this->assert_api_success($response);
        $this->assertIsArray($payload['data']);
        $this->assertEquals($variant_id, $payload['data'][0]['id']);

        $variant = \Kirki\Ecommerce\App\Models\Variant::find($variant_id);
        $this->assertEquals(1250, (int) $variant->base_price);
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

        $response = $this->request('GET', 'variants');
        $this->assert_api_error($response, 401);
    }
}
