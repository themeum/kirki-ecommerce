<?php

namespace Kirki\Ecommerce\Tests\Integration;

use Kirki\Ecommerce\App\Models\Variant;
use Kirki\Ecommerce\App\Services\VariantService;
use Kirki\Ecommerce\Tests\Support\CreatesTestProducts;
use Kirki\Ecommerce\Tests\Support\RestTestCase;

use function Kirki\Ecommerce\Framework\app;

class VariantDefaultTest extends RestTestCase
{
    use CreatesTestProducts;

    /**
     * Get the IDs of the default variants of a product.
     *
     * @param int $product_id Product ID.
     * @return int[]
     * @since 1.0.0
     */
    protected function default_variant_ids(int $product_id): array
    {
        return array_map('intval', Variant::where('product_id', $product_id)->where('is_default', true)->order_by('id')->pluck('id')->all());
    }

    public function test_marking_a_variant_default_clears_the_others(): void
    {
        $product = $this->create_two_variant_product();
        $second_id = (int) $product['variants'][1]['id'];

        app(VariantService::class)->partial_update($second_id, ['is_default' => true]);

        $this->assertEquals([$second_id], $this->default_variant_ids($product['id']));
    }

    public function test_bulk_update_marking_a_variant_default_clears_the_others(): void
    {
        $product = $this->create_two_variant_product();
        $second_id = (int) $product['variants'][1]['id'];

        $this->assert_api_success($this->request('PUT', 'variants/bulk', [
            'variants' => [['id' => $second_id, 'is_default' => true]],
        ]));

        $this->assertEquals([$second_id], $this->default_variant_ids($product['id']));
    }

    public function test_unsetting_the_only_default_keeps_a_default(): void
    {
        $product = $this->create_two_variant_product();

        app(VariantService::class)->partial_update((int) $product['variants'][0]['id'], ['is_default' => false]);

        $this->assertCount(1, $this->default_variant_ids($product['id']));
    }

    public function test_updating_an_unrelated_field_leaves_the_default_alone(): void
    {
        $product = $this->create_two_variant_product();
        $first_id = (int) $product['variants'][0]['id'];

        app(VariantService::class)->partial_update((int) $product['variants'][1]['id'], ['available_quantity' => 3]);

        $this->assertEquals([$first_id], $this->default_variant_ids($product['id']));
    }

    public function test_deleting_the_default_variant_promotes_another(): void
    {
        $product = $this->create_two_variant_product();
        $second_id = (int) $product['variants'][1]['id'];

        app(VariantService::class)->delete((int) $product['variants'][0]['id']);

        $this->assertEquals([$second_id], $this->default_variant_ids($product['id']));
    }

    public function test_bulk_deleting_the_default_variant_promotes_another(): void
    {
        $product = $this->create_two_variant_product();
        $second_id = (int) $product['variants'][1]['id'];

        app(VariantService::class)->bulk_delete([(int) $product['variants'][0]['id']]);

        $this->assertEquals([$second_id], $this->default_variant_ids($product['id']));
    }

    public function test_deleting_a_non_default_variant_keeps_the_default(): void
    {
        $product = $this->create_two_variant_product();
        $first_id = (int) $product['variants'][0]['id'];

        app(VariantService::class)->delete((int) $product['variants'][1]['id']);

        $this->assertEquals([$first_id], $this->default_variant_ids($product['id']));
    }
}
