<?php

namespace Kirki\Ecommerce\Tests\Integration;

use Kirki\Ecommerce\App\Constants\BulkActions;
use Kirki\Ecommerce\App\Constants\Product\AvailabilityStatus;
use Kirki\Ecommerce\App\Constants\Product\ProductStatus;
use Kirki\Ecommerce\App\Models\AttributeValue;
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
     * Create product persists additional info and SEO keywords.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_create_product_persists_additional_info_and_seo_keywords(): void
    {
        $response = $this->request('POST', 'products', $this->product_payload([
            'title' => 'Info Product',
            'additional_info' => ['material' => 'cotton', 'origin' => 'US'],
            'seo_keywords' => ['shirt', 'summer'],
        ]));

        $payload = $this->assert_api_success($response, 201);
        $this->assertEquals(['material' => 'cotton', 'origin' => 'US'], $payload['data']['additional_info']);
        $this->assertEquals(['shirt', 'summer'], $payload['data']['seo_keywords']);

        $this->product_id = $payload['data']['id'];
        $fetched = $this->request('GET', 'products/' . $this->product_id);
        $fetched_payload = $this->assert_api_success($fetched);
        $this->assertEquals(['material' => 'cotton', 'origin' => 'US'], $fetched_payload['data']['additional_info']);
        $this->assertEquals(['shirt', 'summer'], $fetched_payload['data']['seo_keywords']);
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

        $trash_response = $this->request('POST', 'products/bulk', [
            'action' => BulkActions::TRASH,
            'ids' => [$first['id'], $second['id']],
        ]);
        $this->assert_api_success($trash_response);

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
     * Bulk trash sets product status to trashed.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_bulk_trash_sets_status_to_trashed(): void
    {
        $product = $this->create_product(['title' => 'Trash Target']);
        $this->product_id = $product['id'];

        $response = $this->request('POST', 'products/bulk', [
            'action' => BulkActions::TRASH,
            'ids' => [$product['id']],
        ]);
        $this->assert_api_success($response);

        $check = $this->request('GET', 'products/' . $product['id']);
        $payload = $this->assert_api_success($check);
        $this->assertEquals(ProductStatus::TRASHED, $payload['data']['status']);
    }

    /**
     * Bulk restore sets product status back to draft.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_bulk_restore_sets_status_to_draft(): void
    {
        $product = $this->create_product(['title' => 'Restore Target']);
        $this->product_id = $product['id'];

        $this->request('POST', 'products/bulk', [
            'action' => BulkActions::TRASH,
            'ids' => [$product['id']],
        ]);

        $response = $this->request('POST', 'products/bulk', [
            'action' => BulkActions::RESTORE,
            'ids' => [$product['id']],
        ]);
        $this->assert_api_success($response);

        $check = $this->request('GET', 'products/' . $product['id']);
        $payload = $this->assert_api_success($check);
        $this->assertEquals(ProductStatus::DRAFT, $payload['data']['status']);
    }

    /**
     * Bulk delete on non-trashed products returns 404.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_bulk_delete_on_non_trashed_products_returns_404(): void
    {
        $product = $this->create_product(['title' => 'Not Trashed Delete']);
        $this->product_id = $product['id'];

        $response = $this->request('POST', 'products/bulk', [
            'action' => BulkActions::DELETE,
            'ids' => [$product['id']],
        ]);

        $this->assert_api_error($response, 404);
    }

    /**
     * Bulk restore on non-trashed products returns 404.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_bulk_restore_on_non_trashed_products_returns_404(): void
    {
        $product = $this->create_product(['title' => 'Not Trashed Restore']);
        $this->product_id = $product['id'];

        $response = $this->request('POST', 'products/bulk', [
            'action' => BulkActions::RESTORE,
            'ids' => [$product['id']],
        ]);

        $this->assert_api_error($response, 404);
    }

    /**
     * Trash-all and restore-all affect products matching the given filters.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_trash_all_and_restore_all_products(): void
    {
        $unique = 'TrashAllTarget-' . wp_generate_password(6, false);
        $first = $this->create_searchable_product($unique . '-One');
        $this->create_searchable_product($unique . '-Two');
        $this->product_id = $first['id'];

        $trash_all = $this->request('POST', 'products/bulk', [
            'action' => BulkActions::TRASH_ALL,
            'search' => $unique,
        ]);
        $this->assert_api_success($trash_all);

        $trashed_list = $this->request('GET', 'products', [
            'search' => $unique,
            'status' => ProductStatus::TRASHED,
        ]);
        $trashed_payload = $this->assert_api_success($trashed_list);
        $this->assertCount(2, $trashed_payload['data']['results']);

        $restore_all = $this->request('POST', 'products/bulk', [
            'action' => BulkActions::RESTORE_ALL,
            'search' => $unique,
        ]);
        $this->assert_api_success($restore_all);

        $restored_list = $this->request('GET', 'products', [
            'search' => $unique,
            'status' => ProductStatus::DRAFT,
        ]);
        $restored_payload = $this->assert_api_success($restored_list);
        $this->assertCount(2, $restored_payload['data']['results']);
    }

    /**
     * Default product listing excludes trashed products.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_list_products_excludes_trashed_by_default(): void
    {
        $unique = 'ListExcludeTrashed-' . wp_generate_password(6, false);
        $product = $this->create_searchable_product($unique);
        $this->product_id = $product['id'];

        $this->request('POST', 'products/bulk', [
            'action' => BulkActions::TRASH,
            'ids' => [$product['id']],
        ]);

        $response = $this->request('GET', 'products', [
            'search' => $unique,
        ]);
        $payload = $this->assert_api_success($response);
        $this->assertEmpty($payload['data']['results']);
    }

    /**
     * Listing with status=trashed returns trashed products.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_list_products_with_status_trashed_filter_returns_trashed_products(): void
    {
        $unique = 'ListTrashedFilter-' . wp_generate_password(6, false);
        $product = $this->create_searchable_product($unique);
        $this->product_id = $product['id'];

        $this->request('POST', 'products/bulk', [
            'action' => BulkActions::TRASH,
            'ids' => [$product['id']],
        ]);

        $response = $this->request('GET', 'products', [
            'search' => $unique,
            'status' => ProductStatus::TRASHED,
        ]);
        $payload = $this->assert_api_success($response);
        $this->assertCount(1, $payload['data']['results']);
        $this->assertEquals($product['id'], $payload['data']['results'][0]['id']);
    }

    /**
     * Create a product whose title and variant SKU both contain the given
     * unique token, so it can be reliably isolated by the `search` filter.
     *
     * `ProductService::apply_filters()` requires both a title/description
     * match and a variant SKU match when `search` is set, so a title-only
     * substring will not be found unless the SKU also contains it.
     *
     * @param string $unique Unique token to embed in the title and SKU.
     *
     * @return array
     * @since 1.0.0
     */
    /**
     * Products can be sorted by every column the list presents, including the
     * price, which lives on the variants rather than the product.
     *
     * @dataProvider derived_product_sort_fields
     *
     * @param string $sort_by Sort field.
     * @return void
     */
    public function test_list_products_accepts_derived_sort_fields(string $sort_by): void
    {
        $this->request('POST', 'products', $this->product_payload(['title' => 'Sortable Product']));

        foreach (['asc', 'desc'] as $direction) {
            $response = $this->request('GET', 'products', [
                'sort_by' => $sort_by,
                'sort_order' => $direction,
                'limit' => 10,
            ]);

            $payload = $this->assert_api_success($response);
            $this->assertNotEmpty($payload['data']['results'], "{$sort_by} {$direction} returned no rows");
        }
    }

    /**
     * @return array
     */
    public function derived_product_sort_fields(): array
    {
        return [
            'title' => ['title'],
            'status' => ['status'],
            'price' => ['base_price'],
            'created at' => ['created_at'],
        ];
    }

    /**
     * Sorting by price orders products by their cheapest variant ascending and
     * their dearest descending.
     *
     * @return void
     */
    public function test_list_products_sorts_by_price(): void
    {
        $cheap = $this->request('POST', 'products', $this->product_payload([
            'title' => 'Cheap Sortable',
            'variants' => [[
                'base_price' => 5.00,
                'sku' => 'CHEAP-' . wp_generate_password(6, false),
                'available_quantity' => 10,
                'in_stock' => true,
                'is_default' => true,
                'attribute_values' => [],
            ]],
        ]));
        $dear = $this->request('POST', 'products', $this->product_payload([
            'title' => 'Dear Sortable',
            'variants' => [[
                'base_price' => 500.00,
                'sku' => 'DEAR-' . wp_generate_password(6, false),
                'available_quantity' => 10,
                'in_stock' => true,
                'is_default' => true,
                'attribute_values' => [],
            ]],
        ]));

        $cheap_id = $this->assert_api_success($cheap, 201)['data']['id'];
        $dear_id = $this->assert_api_success($dear, 201)['data']['id'];
        $only = [$cheap_id, $dear_id];

        $this->assertSame($only, $this->sorted_product_ids('base_price', 'asc', $only));
        $this->assertSame(array_reverse($only), $this->sorted_product_ids('base_price', 'desc', $only));
    }

    /**
     * Request the product list sorted, restricted to the given ids.
     *
     * @param string $sort_by Sort field.
     * @param string $sort_order Sort direction.
     * @param array $only Product ids to keep.
     *
     * @return array
     */
    protected function sorted_product_ids(string $sort_by, string $sort_order, array $only): array
    {
        $response = $this->request('GET', 'products', [
            'sort_by' => $sort_by,
            'sort_order' => $sort_order,
            'limit' => 100,
        ]);

        $payload = $this->assert_api_success($response);
        $ids = [];

        foreach ($payload['data']['results'] as $row) {
            if (in_array($row['id'], $only, false)) {
                $ids[] = $row['id'];
            }
        }

        return $ids;
    }

    protected function create_searchable_product(string $unique): array
    {
        return $this->create_product([
            'title' => $unique,
            'variants' => [
                [
                    'base_price' => 29.99,
                    'sku' => 'SKU-' . $unique,
                    'available_quantity' => 100,
                    'in_stock' => true,
                    'is_default' => true,
                    'attribute_values' => [],
                ],
            ],
        ]);
    }

    /**
     * Resolve an attribute value label that is not taken yet.
     *
     * Attribute values are globally unique, and this class creates the same
     * colors more than once, so a taken label gets a numbered suffix.
     *
     * @param string $value Desired value label.
     *
     * @return string
     * @since 1.0.0
     */
    protected function unused_attribute_value(string $value): string
    {
        $candidate = $value;
        $suffix = 1;

        while (AttributeValue::where('value', $candidate)->first()) {
            $suffix++;
            $candidate = $value . ' ' . $suffix;
        }

        return $candidate;
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
                'value' => $this->unused_attribute_value($value),
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
        [$product,, $value_ids] = $this->create_color_product();

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

    /**
     * Duplicating a product copies its associations and resets identifying/stock variant fields.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_duplicate_product_preserves_associations_and_resets_variant_fields(): void
    {
        $category = $this->request('POST', 'categories', [
            'name' => 'Duplicate Test Category',
            'slug' => 'duplicate-test-category-' . wp_generate_password(6, false),
        ]);
        $category = $this->assert_api_success($category, 201)['data'];

        $tag = $this->request('POST', 'tags', [
            'name' => 'Duplicate Test Tag',
            'slug' => 'duplicate-test-tag-' . wp_generate_password(6, false),
        ]);
        $tag = $this->assert_api_success($tag, 201)['data'];

        $collection = $this->request('POST', 'collections', [
            'title' => 'Duplicate Test Collection',
            'slug' => 'duplicate-test-collection-' . wp_generate_password(6, false),
        ]);
        $collection = $this->assert_api_success($collection, 201)['data'];

        $attribute = $this->request('POST', 'attributes', [
            'name' => 'Duplicate Size ' . wp_generate_password(6, false),
            'slug' => 'duplicate-size-' . wp_generate_password(6, false),
            'type' => 'list',
        ]);
        $attribute_id = $this->assert_api_success($attribute, 201)['data']['id'];

        $value = $this->request('POST', 'attributes/' . $attribute_id . '/values', [
            'attribute_id' => $attribute_id,
            'value' => 'Small',
        ]);
        $value_id = $this->assert_api_success($value, 201)['data']['id'];

        $product = $this->create_product([
            'title' => 'Duplicate Source Product',
            'status' => ProductStatus::PUBLISHED,
            'has_variants' => true,
            'categories' => [$category['id']],
            'tags' => [$tag['id']],
            'collections' => [$collection['id']],
            'attributes' => [
                ['id' => $attribute_id, 'values' => [$value_id]],
            ],
            'variants' => [
                [
                    'base_price' => 49.5,
                    'weight' => 1.25,
                    'sku' => 'SKU-' . wp_generate_password(6, false),
                    'available_quantity' => 40,
                    'in_stock' => true,
                    'is_default' => true,
                    'attribute_values' => [$value_id],
                ],
            ],
        ]);
        $this->product_id = $product['id'];

        $response = $this->request('POST', 'products/' . $this->product_id . '/duplicate');

        $payload = $this->assert_api_success($response, 201);
        $duplicated = $payload['data'];

        $this->assertNotEquals($this->product_id, $duplicated['id']);
        $this->assertEquals('Duplicate Source Product - Copy', $duplicated['title']);
        $this->assertEquals(ProductStatus::DRAFT, $duplicated['status']);

        $this->assertEqualsCanonicalizing([$category['id']], array_column($duplicated['categories'], 'id'));
        $this->assertEqualsCanonicalizing([$tag['id']], array_column($duplicated['tags'], 'id'));
        $this->assertEqualsCanonicalizing([$collection['id']], array_column($duplicated['collections'], 'id'));

        $this->assertCount(1, $duplicated['attributes']);
        $this->assertEquals($attribute_id, $duplicated['attributes'][0]['id']);
        $this->assertEqualsCanonicalizing([$value_id], array_column($duplicated['attributes'][0]['values'], 'id'));

        $duplicated_variant = $duplicated['variants'][0];
        $this->assertNull($duplicated_variant['sku']);
        $this->assertEquals(0, $duplicated_variant['available_quantity']);
        $this->assertFalse($duplicated_variant['in_stock']);
        $this->assertEquals(49.5, $duplicated_variant['base_price']);
        $this->assertEquals(1.25, $duplicated_variant['weight']);
        $this->assertEquals([$value_id], $duplicated_variant['attribute_values']);
    }

    /**
     * Duplicating a missing product returns 404.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_duplicate_missing_product_returns_404(): void
    {
        $response = $this->request('POST', 'products/999999/duplicate');

        $this->assert_api_error($response, 404);
    }

    /**
     * Duplicating a product with no categories/tags/collections/attributes
     * and a single default variant with no attribute values does not error.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_duplicate_bare_product_without_associations_succeeds(): void
    {
        $product = $this->create_product(['title' => 'Bare Product']);
        $this->product_id = $product['id'];

        $response = $this->request('POST', 'products/' . $this->product_id . '/duplicate');

        $payload = $this->assert_api_success($response, 201);
        $duplicated = $payload['data'];

        $this->assertNotEquals($this->product_id, $duplicated['id']);
        $this->assertEquals('Bare Product - Copy', $duplicated['title']);
        $this->assertEquals([], $duplicated['categories']);
        $this->assertEquals([], $duplicated['tags']);
        $this->assertEquals([], $duplicated['collections']);
        $this->assertEquals([], $duplicated['attributes']);
        $this->assertCount(1, $duplicated['variants']);
        $this->assertNull($duplicated['variants'][0]['sku']);
        $this->assertEquals([], $duplicated['variants'][0]['attribute_values']);
    }

    /**
     * Filtering by a single category narrows the list.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_list_products_filters_by_category(): void
    {
        $category_id = $this->create_category();
        $unique = 'CatFilter-' . wp_generate_password(6, false);

        $matching = $this->create_product([
            'title' => $unique . ' Matching',
            'categories' => [$category_id],
        ]);
        $this->create_product(['title' => $unique . ' Other']);

        $response = $this->request('GET', 'products', [
            'search' => $unique,
            'category_ids' => [$category_id],
        ]);

        $payload = $this->assert_api_success($response);
        $this->assertEquals([$unique . ' Matching'], $this->listed_titles($payload));

        $this->product_id = $matching['id'];
    }

    /**
     * Filtering by several categories lists products in any of them.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_list_products_filters_by_several_categories(): void
    {
        $first_category = $this->create_category();
        $second_category = $this->create_category();
        $unique = 'MultiCatFilter-' . wp_generate_password(6, false);

        $this->create_product([
            'title' => $unique . ' First',
            'categories' => [$first_category],
        ]);
        $this->create_product([
            'title' => $unique . ' Second',
            'categories' => [$second_category],
        ]);
        $this->create_product(['title' => $unique . ' Neither']);

        $response = $this->request('GET', 'products', [
            'search' => $unique,
            'category_ids' => [$first_category, $second_category],
        ]);

        $payload = $this->assert_api_success($response);
        $this->assertEqualsCanonicalizing(
            [$unique . ' First', $unique . ' Second'],
            $this->listed_titles($payload)
        );
    }

    /**
     * Filtering by collection narrows the list.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_list_products_filters_by_collection(): void
    {
        $collection_id = $this->create_collection();
        $unique = 'CollectionFilter-' . wp_generate_password(6, false);

        $this->create_product([
            'title' => $unique . ' Matching',
            'collections' => [$collection_id],
        ]);
        $this->create_product(['title' => $unique . ' Other']);

        $response = $this->request('GET', 'products', [
            'search' => $unique,
            'collection_id' => $collection_id,
        ]);

        $payload = $this->assert_api_success($response);
        $this->assertEquals([$unique . ' Matching'], $this->listed_titles($payload));
    }

    /**
     * Filtering by brand narrows the list.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_list_products_filters_by_brand(): void
    {
        $brand_id = $this->create_brand();
        $unique = 'BrandFilter-' . wp_generate_password(6, false);

        $this->create_product([
            'title' => $unique . ' Matching',
            'brand_id' => $brand_id,
        ]);
        $this->create_product(['title' => $unique . ' Other']);

        $response = $this->request('GET', 'products', [
            'search' => $unique,
            'brand_id' => $brand_id,
        ]);

        $payload = $this->assert_api_success($response);
        $this->assertEquals([$unique . ' Matching'], $this->listed_titles($payload));
    }

    /**
     * Combining a category filter with a brand filter narrows by both.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_list_products_combines_category_and_brand_filters(): void
    {
        $category_id = $this->create_category();
        $brand_id = $this->create_brand();
        $unique = 'ComboFilter-' . wp_generate_password(6, false);

        $this->create_product([
            'title' => $unique . ' Both',
            'categories' => [$category_id],
            'brand_id' => $brand_id,
        ]);
        $this->create_product([
            'title' => $unique . ' CategoryOnly',
            'categories' => [$category_id],
        ]);
        $this->create_product([
            'title' => $unique . ' BrandOnly',
            'brand_id' => $brand_id,
        ]);

        $response = $this->request('GET', 'products', [
            'search' => $unique,
            'category_ids' => [$category_id],
            'brand_id' => $brand_id,
        ]);

        $payload = $this->assert_api_success($response);
        $this->assertEquals([$unique . ' Both'], $this->listed_titles($payload));
    }

    /**
     * Filtering by draft status lists only drafts.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_list_products_filters_by_draft_status(): void
    {
        $unique = 'DraftFilter-' . wp_generate_password(6, false);

        $this->create_product([
            'title' => $unique . ' Draft',
            'status' => ProductStatus::DRAFT,
        ]);
        $this->create_product([
            'title' => $unique . ' Published',
            'status' => ProductStatus::PUBLISHED,
        ]);

        $response = $this->request('GET', 'products', [
            'search' => $unique,
            'status' => ProductStatus::DRAFT,
        ]);

        $payload = $this->assert_api_success($response);
        $this->assertEquals([$unique . ' Draft'], $this->listed_titles($payload));
    }

    /**
     * Filtering by out of stock lists only products with nothing to sell.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_list_products_filters_by_out_of_stock_availability(): void
    {
        $unique = 'StockFilter-' . wp_generate_password(6, false);

        $this->create_product([
            'title' => $unique . ' InStock',
            'variants' => [
                [
                    'base_price' => 10.0,
                    'sku' => 'SKU-' . wp_generate_password(6, false),
                    'available_quantity' => 25,
                    'in_stock' => true,
                    'is_default' => true,
                    'track_inventory' => true,
                    'attribute_values' => [],
                ],
            ],
        ]);
        $this->create_product([
            'title' => $unique . ' OutOfStock',
            'variants' => [
                [
                    'base_price' => 10.0,
                    'sku' => 'SKU-' . wp_generate_password(6, false),
                    'available_quantity' => 0,
                    'in_stock' => false,
                    'is_default' => true,
                    'track_inventory' => true,
                    'attribute_values' => [],
                ],
            ],
        ]);

        $response = $this->request('GET', 'products', [
            'search' => $unique,
            'availability_status' => AvailabilityStatus::OUT_OF_STOCK,
        ]);

        $payload = $this->assert_api_success($response);
        $this->assertEquals([$unique . ' OutOfStock'], $this->listed_titles($payload));
    }
}
