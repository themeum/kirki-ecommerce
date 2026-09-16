<?php

namespace Kirki\Ecommerce\Tests\Integration;

use Kirki\Ecommerce\App\Constants\BulkActions;
use Kirki\Ecommerce\Tests\Support\CreatesTestProducts;
use Kirki\Ecommerce\Tests\Support\RestTestCase;

class BrandApiTest extends RestTestCase
{
    use CreatesTestProducts;

    /**
     * Brand id for the current test.
     *
     * @var mixed
     * @since 1.0.0
     */
    protected $brand_id;

    /**
     * Create brand returns 201 and persists.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_create_brand_returns_201_and_persists(): void
    {
        $response = $this->request('POST', 'brands', [
            'name' => 'Acme Corp',
            'slug' => 'acme-corp',
            'description' => 'Premium brand',
            'website_url' => 'https://acme.example',
            'is_active' => true,
        ]);

        $payload = $this->assert_api_success($response, 201);
        $this->assertArrayHasKey('id', $payload['data']);
        $this->assertEquals('Acme Corp', $payload['data']['name']);
        $this->assertEquals('acme-corp', $payload['data']['slug']);
        $this->assertEquals('https://acme.example', $payload['data']['website_url']);
        $this->assertTrue($payload['data']['is_active']);

        $this->brand_id = $payload['data']['id'];
    }

    /**
     * Show brand returns resource.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_show_brand_returns_resource(): void
    {
        $this->brand_id = $this->create_brand()['id'];

        $response = $this->request('GET', 'brands/' . $this->brand_id);
        $payload = $this->assert_api_success($response);

        $this->assertEquals($this->brand_id, $payload['data']['id']);
        $this->assertEquals('Test Brand', $payload['data']['name']);
    }

    /**
     * Update brand changes fields.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_update_brand_changes_fields(): void
    {
        $this->brand_id = $this->create_brand()['id'];

        $response = $this->request('PUT', 'brands/' . $this->brand_id, [
            'id' => $this->brand_id,
            'name' => 'Updated Brand',
            'slug' => 'updated-brand',
            'description' => 'Updated description',
            'website_url' => 'https://updated.example',
            'is_active' => false,
        ]);

        $payload = $this->assert_api_success($response);
        $this->assertEquals('Updated Brand', $payload['data']['name']);
        $this->assertEquals('updated-brand', $payload['data']['slug']);
        $this->assertEquals('https://updated.example', $payload['data']['website_url']);
        $this->assertFalse($payload['data']['is_active']);
    }

    /**
     * Delete brand removes record.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_delete_brand_removes_record(): void
    {
        $this->brand_id = $this->create_brand()['id'];

        $response = $this->request('DELETE', 'brands/' . $this->brand_id);
        $payload = $this->assert_api_success($response);

        $this->assertTrue($payload['data']);
    }

    /**
     * Show deleted brand returns 404.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_show_deleted_brand_returns_404(): void
    {
        $this->brand_id = $this->create_brand()['id'];
        $this->request('DELETE', 'brands/' . $this->brand_id);

        $response = $this->request('GET', 'brands/' . $this->brand_id);
        $this->assert_api_error($response, 404);
    }

    /**
     * Create brand validation fails without name.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_create_brand_validation_fails_without_name(): void
    {
        $response = $this->request('POST', 'brands', [
            'slug' => 'no-name-brand',
        ]);

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

        $response = $this->request('GET', 'brands');
        $this->assert_api_error($response, 401);
    }

    /**
     * List brands returns paginated results.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_list_brands_returns_paginated_results(): void
    {
        $this->create_brand(['name' => 'Brand Alpha', 'slug' => 'brand-alpha']);
        $this->create_brand(['name' => 'Brand Beta', 'slug' => 'brand-beta']);

        $response = $this->request('GET', 'brands', [
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
     * Bulk action on brands.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_bulk_action_on_brands(): void
    {
        $first = $this->create_brand(['name' => 'Bulk One', 'slug' => 'bulk-one']);
        $second = $this->create_brand(['name' => 'Bulk Two', 'slug' => 'bulk-two']);

        $response = $this->request('POST', 'brands/bulk', [
            'action' => BulkActions::DELETE,
            'ids' => [$first['id'], $second['id']],
        ]);

        $payload = $this->assert_api_success($response);
        $this->assertTrue($payload['data']);

        $check = $this->request('GET', 'brands/' . $first['id']);
        $this->assert_api_error($check, 404);
    }

    /**
     * List brands sorted by name ascending.
     *
     * @return void
     */
    public function test_list_brands_sorts_by_name(): void
    {
        $this->create_brand(['name' => 'Zeta Sort', 'slug' => 'zeta-sort']);
        $this->create_brand(['name' => 'Alpha Sort', 'slug' => 'alpha-sort']);

        $names = $this->sorted_brand_field('name', 'name', 'asc');

        $this->assertSame(array_values(array_unique($names)), $names);
        $this->assertSame($names, $this->sorted_ascending_copy($names));
    }

    /**
     * Brands can be sorted by their product count, which is a query alias
     * rather than a stored column.
     *
     * @return void
     */
    public function test_list_brands_sorts_by_product_count(): void
    {
        $empty = $this->create_brand(['name' => 'Countless', 'slug' => 'countless-brand']);
        $stocked = $this->create_brand(['name' => 'Stocked', 'slug' => 'stocked-brand']);

        $this->request('POST', 'products', $this->product_payload([
            'title' => 'Counted Product',
            'brand_id' => $stocked['id'],
        ]));

        $descending = $this->sorted_brand_field('count', 'id', 'desc', [$empty['id'], $stocked['id']]);
        $ascending = $this->sorted_brand_field('count', 'id', 'asc', [$empty['id'], $stocked['id']]);

        $this->assertSame([$stocked['id'], $empty['id']], $descending);
        $this->assertSame([$empty['id'], $stocked['id']], $ascending);
    }

    /**
     * An unrecognised sort field falls back to the default order.
     *
     * @return void
     */
    public function test_list_brands_ignores_an_unrecognised_sort_field(): void
    {
        $this->create_brand(['name' => 'Fallback One', 'slug' => 'fallback-one']);

        $response = $this->request('GET', 'brands', [
            'sort_by' => 'definitely_not_a_column',
            'sort_order' => 'asc',
            'limit' => 10,
        ]);

        $payload = $this->assert_api_success($response);
        $this->assertNotEmpty($payload['data']['results']);
    }

    /**
     * A malformed sort direction is rejected without failing the request.
     *
     * @return void
     */
    public function test_list_brands_ignores_a_malformed_sort_direction(): void
    {
        $this->create_brand(['name' => 'Direction One', 'slug' => 'direction-one']);

        $response = $this->request('GET', 'brands', [
            'sort_by' => 'name',
            'sort_order' => 'sideways',
            'limit' => 10,
        ]);

        $payload = $this->assert_api_success($response);
        $this->assertNotEmpty($payload['data']['results']);
    }

    /**
     * Request the brand list sorted, returning one field per row.
     *
     * @param string $sort_by Sort field.
     * @param string $field Field to collect.
     * @param string $sort_order Sort direction.
     * @param array $only Restrict the result to these brand ids.
     *
     * @return array
     */
    protected function sorted_brand_field(string $sort_by, string $field, string $sort_order, array $only = []): array
    {
        $response = $this->request('GET', 'brands', [
            'sort_by' => $sort_by,
            'sort_order' => $sort_order,
            'limit' => 100,
        ]);

        $payload = $this->assert_api_success($response);

        $values = [];

        foreach ($payload['data']['results'] as $row) {
            if ($only && !in_array($row['id'], $only, false)) {
                continue;
            }

            $values[] = $row[$field];
        }

        return $values;
    }

    /**
     * @param array $values Values.
     * @return array
     */
    protected function sorted_ascending_copy(array $values): array
    {
        sort($values, SORT_STRING);

        return $values;
    }

    /**
     * Create brand.
     * @param array $overrides Overrides.
     *
     * @return array
     * @since 1.0.0
     */
    protected function create_brand(array $overrides = []): array
    {
        $response = $this->request('POST', 'brands', array_merge([
            'name' => 'Test Brand',
            'slug' => 'test-brand-' . wp_generate_password(6, false),
            'description' => 'Test description',
        ], $overrides));

        $payload = $this->assert_api_success($response, 201);

        return $payload['data'];
    }
}
