<?php

namespace Kirki\Ecommerce\Tests\Integration;

use Kirki\Ecommerce\App\Constants\BulkActions;
use Kirki\Ecommerce\Tests\Support\CreatesTestProducts;
use Kirki\Ecommerce\Tests\Support\RestTestCase;

class ProductApiTest extends RestTestCase
{
    use CreatesTestProducts;

    /**
     * Product id for the current test.
     *
     * @var mixed
     * @since 1.0.0
     */
    protected $product_id;

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
     * Create product returns 201 and persists.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_create_product_returns_201_and_persists(): void
    {
        $response = $this->request('POST', 'products', $this->product_payload([
            'title' => 'Summer T-Shirt',
        ]));

        $payload = $this->assert_api_success($response, 201);
        $this->assertArrayHasKey('id', $payload['data']);
        $this->assertEquals('Summer T-Shirt', $payload['data']['title']);
        $this->assertNotEmpty($payload['data']['variants']);

        $this->product_id = $payload['data']['id'];
    }

    /**
     * Show product returns resource.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_show_product_returns_resource(): void
    {
        $product = $this->create_product(['title' => 'Show Product']);
        $this->product_id = $product['id'];

        $response = $this->request('GET', 'products/' . $this->product_id);
        $payload = $this->assert_api_success($response);

        $this->assertEquals($this->product_id, $payload['data']['id']);
        $this->assertEquals('Show Product', $payload['data']['title']);
    }

    /**
     * Update product changes fields.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_update_product_changes_fields(): void
    {
        $created = $this->create_product();
        $this->product_id = $created['id'];

        $show = $this->request('GET', 'products/' . $this->product_id);
        $product = $this->assert_api_success($show)['data'];

        $response = $this->request('PUT', 'products/' . $this->product_id, $this->product_payload([
            'id' => $this->product_id,
            'title' => 'Updated Product',
            'variants' => $this->variants_for_update($product, [
                'base_price' => 39.99,
            ]),
        ]));

        $payload = $this->assert_api_success($response);
        $this->assertEquals('Updated Product', $payload['data']['title']);
    }

    /**
     * Delete product removes record.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_delete_product_removes_record(): void
    {
        $this->product_id = $this->create_product()['id'];

        $response = $this->request('DELETE', 'products/' . $this->product_id);
        $payload = $this->assert_api_success($response);

        $this->assertTrue($payload['data']);
    }

    /**
     * Show deleted product returns 404.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_show_deleted_product_returns_404(): void
    {
        $this->product_id = $this->create_product()['id'];
        $this->request('DELETE', 'products/' . $this->product_id);

        $response = $this->request('GET', 'products/' . $this->product_id);
        $this->assert_api_error($response, 404);
    }

    /**
     * Create product validation fails without title.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_create_product_validation_fails_without_title(): void
    {
        $response = $this->request('POST', 'products', $this->product_payload([
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

        $response = $this->request('GET', 'products');
        $this->assert_api_error($response, 401);
    }

    /**
     * List products returns paginated results.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_list_products_returns_paginated_results(): void
    {
        $this->create_product(['title' => 'Product Alpha']);
        $this->create_product(['title' => 'Product Beta']);

        $response = $this->request('GET', 'products', [
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
     * Bulk action on products.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_bulk_action_on_products(): void
    {
        $first = $this->create_product(['title' => 'Bulk One']);
        $second = $this->create_product(['title' => 'Bulk Two']);

        $response = $this->request('POST', 'products/bulk', [
            'action' => BulkActions::DELETE,
            'ids' => [$first['id'], $second['id']],
        ]);

        $payload = $this->assert_api_success($response);
        $this->assertTrue($payload['data']);

        $check = $this->request('GET', 'products/' . $first['id']);
        $this->assert_api_error($check, 404);
    }

    /**
     * Create a variant product with a single Color attribute.
     *
     * @return array
     * @since 1.0.0
     */
    protected function create_color_product(): array
    {
        $attribute = $this->request('POST', 'attributes', [
            'name' => 'Color ' . wp_generate_password(6, false),
            'slug' => 'color-' . wp_generate_password(6, false),
            'type' => 'list',
        ]);
        $attribute_id = $this->assert_api_success($attribute, 201)['data']['id'];

        $value_ids = [];

        foreach (['Red', 'Blue'] as $value) {
            $created = $this->request('POST', 'attributes/' . $attribute_id . '/values', [
                'attribute_id' => $attribute_id,
                'value' => $value,
            ]);
            $value_ids[] = $this->assert_api_success($created, 201)['data']['id'];
        }

        $response = $this->request('POST', 'products', $this->product_payload([
            'title' => 'Variant Product',
            'has_variants' => true,
            'attributes' => [
                ['id' => $attribute_id, 'values' => $value_ids],
            ],
            'variants' => [
                [
                    'base_price' => 29.99,
                    'sku' => 'SKU-' . wp_generate_password(6, false),
                    'available_quantity' => 40,
                    'in_stock' => true,
                    'is_default' => true,
                    'attribute_values' => [$value_ids[0]],
                ],
                [
                    'base_price' => 29.99,
                    'sku' => 'SKU-' . wp_generate_password(6, false),
                    'available_quantity' => 12,
                    'in_stock' => true,
                    'is_default' => false,
                    'attribute_values' => [$value_ids[1]],
                ],
            ],
        ]));

        $product = $this->assert_api_success($response, 201)['data'];
        $this->product_id = $product['id'];

        return [$product, $attribute_id, $value_ids];
    }

    /**
     * A variant product round-trips its attribute values.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_create_variant_product_persists_attribute_values(): void
    {
        [$product, , $value_ids] = $this->create_color_product();

        $this->assertTrue($product['has_variants']);
        $this->assertCount(2, $product['variants']);
        $this->assertEquals([$value_ids[0]], $product['variants'][0]['attribute_values']);
        $this->assertEquals([$value_ids[1]], $product['variants'][1]['attribute_values']);
    }

    /**
     * A value that belongs to no listed attribute is rejected.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_variant_referencing_an_unlisted_value_is_rejected(): void
    {
        [$product, $attribute_id, $value_ids] = $this->create_color_product();

        $response = $this->request('PUT', 'products/' . $product['id'], $this->product_payload([
            'id' => $product['id'],
            'has_variants' => true,
            'attributes' => [
                ['id' => $attribute_id, 'values' => $value_ids],
            ],
            'variants' => [
                [
                    'id' => $product['variants'][0]['id'],
                    'base_price' => 29.99,
                    'is_default' => true,
                    'attribute_values' => [$value_ids[0]],
                ],
                [
                    'id' => $product['variants'][1]['id'],
                    'base_price' => 29.99,
                    'is_default' => false,
                    'attribute_values' => [999999],
                ],
            ],
        ]));

        $this->assert_validation_error($response);
    }

    /**
     * Two variants sharing a combination are rejected.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_duplicate_variant_combination_is_rejected(): void
    {
        [$product, $attribute_id, $value_ids] = $this->create_color_product();

        $response = $this->request('PUT', 'products/' . $product['id'], $this->product_payload([
            'id' => $product['id'],
            'has_variants' => true,
            'attributes' => [
                ['id' => $attribute_id, 'values' => $value_ids],
            ],
            'variants' => [
                [
                    'id' => $product['variants'][0]['id'],
                    'base_price' => 29.99,
                    'is_default' => true,
                    'attribute_values' => [$value_ids[0]],
                ],
                [
                    'id' => $product['variants'][1]['id'],
                    'base_price' => 29.99,
                    'is_default' => false,
                    'attribute_values' => [$value_ids[0]],
                ],
            ],
        ]));

        $this->assert_validation_error($response);
    }

    /**
     * Omitting attribute values on a variant product is rejected, since the
     * service would otherwise detach every pivot row.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_update_without_attribute_values_is_rejected(): void
    {
        [$product, $attribute_id, $value_ids] = $this->create_color_product();

        $response = $this->request('PUT', 'products/' . $product['id'], $this->product_payload([
            'id' => $product['id'],
            'has_variants' => true,
            'attributes' => [
                ['id' => $attribute_id, 'values' => $value_ids],
            ],
            'variants' => [
                [
                    'id' => $product['variants'][0]['id'],
                    'base_price' => 29.99,
                    'is_default' => true,
                ],
                [
                    'id' => $product['variants'][1]['id'],
                    'base_price' => 29.99,
                    'is_default' => false,
                ],
            ],
        ]));

        $this->assert_validation_error($response);

        $check = $this->request('GET', 'products/' . $product['id']);
        $unchanged = $this->assert_api_success($check)['data'];
        $this->assertEquals([$value_ids[0]], $unchanged['variants'][0]['attribute_values']);
    }

    /**
     * A payload with no default variant is rejected.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_product_without_a_default_variant_is_rejected(): void
    {
        $response = $this->request('POST', 'products', $this->product_payload([
            'title' => 'No Default',
            'variants' => [
                [
                    'base_price' => 29.99,
                    'sku' => 'SKU-' . wp_generate_password(6, false),
                    'is_default' => false,
                    'attribute_values' => [],
                ],
            ],
        ]));

        $this->assert_validation_error($response);
    }
}
