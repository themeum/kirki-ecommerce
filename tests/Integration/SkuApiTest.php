<?php

namespace Kirki\Ecommerce\Tests\Integration;

use Kirki\Ecommerce\App\Models\Variant;
use Kirki\Ecommerce\Tests\Support\CreatesTestProducts;
use Kirki\Ecommerce\Tests\Support\RestTestCase;

class SkuApiTest extends RestTestCase
{
    use CreatesTestProducts;

    /**
     * Prepare state before each test.
     *
     * @return void
     */
    protected function setUp(): void
    {
        parent::setUp();
        $this->seed_base_currency();

        // Table state carries across tests in a class (the harness only rebuilds
        // it in setUpBeforeClass), and the sequence is read straight off stored SKUs.
        Variant::query()->delete();
    }

    /**
     * Store a product whose single variant holds a SKU with no numeric tail,
     * so the fixture itself never raises the sequence.
     *
     * @param string $title
     * @return array
     */
    protected function store_product(string $title): array
    {
        return $this->create_product([
            'title' => $title,
            'variants' => [
                [
                    'base_price' => 29.99,
                    'sku' => 'SEED-' . wp_generate_password(6, false) . '-XYZ',
                    'available_quantity' => 100,
                    'in_stock' => true,
                    'is_default' => true,
                    'attribute_values' => [],
                ],
            ],
        ]);
    }

    /**
     * Generating for a saved variant reads the sources off the stored records.
     *
     * @return void
     */
    public function test_generate_for_saved_variant_uses_its_product(): void
    {
        $product = $this->store_product('Blue Cotton Shirt');
        $variant_id = $this->default_variant_id($product);

        $response = $this->request('POST', 'variants/generate-sku', [
            'variant_id' => $variant_id,
        ]);

        $payload = $this->assert_api_success($response);
        $this->assertSame('BLU-001', $payload['data']['sku']);
    }

    /**
     * Generating for an unsaved draft uses the submitted identifiers.
     *
     * @return void
     */
    public function test_generate_for_draft_resolves_brand_and_category(): void
    {
        $brand_id = $this->create_brand('Nike');
        $category_id = $this->create_category('Apparel');

        $response = $this->request('POST', 'variants/generate-sku', [
            'title' => 'Blue Cotton Shirt',
            'brand_id' => $brand_id,
            'category_ids' => [$category_id],
        ]);

        $payload = $this->assert_api_success($response);
        $this->assertSame('BLU-NIK-APP-001', $payload['data']['sku']);
    }

    /**
     * Only the first submitted category reaches the SKU.
     *
     * @return void
     */
    public function test_generate_for_draft_uses_only_the_first_category(): void
    {
        $first = $this->create_category('Apparel');
        $second = $this->create_category('Outerwear');

        $response = $this->request('POST', 'variants/generate-sku', [
            'title' => 'Blue Cotton Shirt',
            'category_ids' => [$first, $second],
        ]);

        $payload = $this->assert_api_success($response);
        $this->assertSame('BLU-APP-001', $payload['data']['sku']);
    }

    /**
     * Generation leaves the variant's stored SKU alone.
     *
     * @return void
     */
    public function test_generate_does_not_persist_the_sku(): void
    {
        $product = $this->store_product('Blue Cotton Shirt');
        $variant_id = $this->default_variant_id($product);
        $stored_sku = Variant::query()->where('id', $variant_id)->first()->sku;

        $this->request('POST', 'variants/generate-sku', ['variant_id' => $variant_id]);

        $this->assertSame($stored_sku, Variant::query()->where('id', $variant_id)->first()->sku);
    }

    /**
     * Repeat calls hand out the same number until one is actually saved.
     *
     * @return void
     */
    public function test_repeat_calls_do_not_consume_numbers(): void
    {
        $first = $this->request('POST', 'variants/generate-sku', ['title' => 'Blue Cotton Shirt']);
        $second = $this->request('POST', 'variants/generate-sku', ['title' => 'Green Wool Hat']);

        $this->assertSame('BLU-001', $this->assert_api_success($first)['data']['sku']);
        $this->assertSame('GRE-001', $this->assert_api_success($second)['data']['sku']);
    }

    /**
     * A collision with an existing SKU is resolved by taking the next number.
     *
     * @return void
     */
    public function test_collision_with_existing_sku_is_resolved(): void
    {
        $this->create_product([
            'title' => 'Collision Product',
            'variants' => [
                [
                    'base_price' => 10.00,
                    'sku' => 'COL-001',
                    'available_quantity' => 1,
                    'in_stock' => true,
                    'is_default' => true,
                    'attribute_values' => [],
                ],
            ],
        ]);

        $response = $this->request('POST', 'variants/generate-sku', [
            'title' => 'Collision Product',
        ]);

        $payload = $this->assert_api_success($response);
        $this->assertSame('COL-002', $payload['data']['sku']);
    }

    /**
     * Saving a variant with an empty SKU does not generate one.
     *
     * @return void
     */
    public function test_saving_with_an_empty_sku_generates_nothing(): void
    {
        $product = $this->create_product([
            'title' => 'Blue Cotton Shirt',
            'variants' => [
                [
                    'base_price' => 29.99,
                    'sku' => null,
                    'available_quantity' => 1,
                    'in_stock' => true,
                    'is_default' => true,
                    'attribute_values' => [],
                ],
            ],
        ]);

        $variant_id = $this->default_variant_id($product);

        $this->assertNull(Variant::query()->where('id', $variant_id)->first()->sku);
    }

    /**
     * A variant id that does not exist returns 404.
     *
     * @return void
     */
    public function test_generate_for_missing_variant_returns_404(): void
    {
        $response = $this->request('POST', 'variants/generate-sku', ['variant_id' => 999999]);

        $this->assert_api_error($response, 404);
    }

    /**
     * The batch endpoint numbers each variant consecutively in one pass.
     *
     * @return void
     */
    public function test_generate_skus_numbers_each_variant_consecutively(): void
    {
        $first = $this->default_variant_id($this->store_product('Blue Cotton Shirt'));
        $second = $this->default_variant_id($this->store_product('Green Wool Hat'));
        $third = $this->default_variant_id($this->store_product('Red Silk Tie'));

        $response = $this->request('POST', 'variants/generate-skus', [
            'variant_ids' => [$first, $second, $third],
        ]);

        $payload = $this->assert_api_success($response);

        $this->assertSame([
            ['variant_id' => $first, 'sku' => 'BLU-001'],
            ['variant_id' => $second, 'sku' => 'GRE-002'],
            ['variant_id' => $third, 'sku' => 'RED-003'],
        ], $payload['data']);
    }

    /**
     * Results follow the order the ids were submitted in, not table order.
     *
     * @return void
     */
    public function test_generate_skus_follows_the_submitted_order(): void
    {
        $first = $this->default_variant_id($this->store_product('Blue Cotton Shirt'));
        $second = $this->default_variant_id($this->store_product('Green Wool Hat'));

        $response = $this->request('POST', 'variants/generate-skus', [
            'variant_ids' => [$second, $first],
        ]);

        $payload = $this->assert_api_success($response);

        $this->assertSame([
            ['variant_id' => $second, 'sku' => 'GRE-001'],
            ['variant_id' => $first, 'sku' => 'BLU-002'],
        ], $payload['data']);
    }

    /**
     * A stale id costs the merchant nothing but its own row.
     *
     * @return void
     */
    public function test_generate_skus_skips_unknown_variant_ids(): void
    {
        $variant_id = $this->default_variant_id($this->store_product('Blue Cotton Shirt'));

        $response = $this->request('POST', 'variants/generate-skus', [
            'variant_ids' => [999999, $variant_id],
        ]);

        $payload = $this->assert_api_success($response);

        $this->assertSame([
            ['variant_id' => $variant_id, 'sku' => 'BLU-001'],
        ], $payload['data']);
    }

    /**
     * The batch endpoint writes nothing, same as the single one.
     *
     * @return void
     */
    public function test_generate_skus_does_not_persist(): void
    {
        $variant_id = $this->default_variant_id($this->store_product('Blue Cotton Shirt'));
        $stored_sku = Variant::query()->where('id', $variant_id)->first()->sku;

        $this->request('POST', 'variants/generate-skus', ['variant_ids' => [$variant_id]]);

        $this->assertSame($stored_sku, Variant::query()->where('id', $variant_id)->first()->sku);
    }

    /**
     * Repeat batches hand out the same numbers until one is saved.
     *
     * @return void
     */
    public function test_repeat_batches_do_not_consume_numbers(): void
    {
        $first = $this->default_variant_id($this->store_product('Blue Cotton Shirt'));
        $second = $this->default_variant_id($this->store_product('Green Wool Hat'));

        $one = $this->request('POST', 'variants/generate-skus', ['variant_ids' => [$first, $second]]);
        $two = $this->request('POST', 'variants/generate-skus', ['variant_ids' => [$first, $second]]);

        $this->assertSame(
            $this->assert_api_success($one)['data'],
            $this->assert_api_success($two)['data']
        );
    }

    /**
     * An empty id list is rejected rather than answered with nothing.
     *
     * @return void
     */
    public function test_generate_skus_requires_variant_ids(): void
    {
        $response = $this->request('POST', 'variants/generate-skus', ['variant_ids' => []]);

        $this->assert_api_error($response, 422);
    }

    /**
     * Unauthenticated request returns 401.
     *
     * @return void
     */
    public function test_unauthenticated_request_returns_401(): void
    {
        $this->logout();

        $response = $this->request('POST', 'variants/generate-sku', ['title' => 'Blue Cotton Shirt']);

        $this->assert_api_error($response, 401);
    }
}
