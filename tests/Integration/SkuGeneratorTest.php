<?php

namespace Kirki\Ecommerce\Tests\Integration;

use Kirki\Ecommerce\App\Models\Variant;
use Kirki\Ecommerce\App\Supports\SkuGenerator;
use Kirki\Ecommerce\Tests\Support\CreatesTestProducts;
use Kirki\Ecommerce\Tests\Support\RestTestCase;

class SkuGeneratorTest extends RestTestCase
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
     * @param array $overrides
     * @return string
     */
    protected function generate(array $overrides = []): string
    {
        return SkuGenerator::generate(array_merge([
            'title' => null,
            'attribute_values' => [],
            'brand' => null,
            'category' => null,
        ], $overrides));
    }

    /**
     * Store a product whose single variant holds the given SKU.
     *
     * @param string $title
     * @param string $sku
     * @return array
     */
    protected function store_variant_with_sku(string $title, string $sku): array
    {
        return $this->create_product([
            'title' => $title,
            'variants' => [
                [
                    'base_price' => 10.00,
                    'sku' => $sku,
                    'available_quantity' => 1,
                    'in_stock' => true,
                    'is_default' => true,
                    'attribute_values' => [],
                ],
            ],
        ]);
    }

    public function test_composes_every_segment_in_order(): void
    {
        $sku = $this->generate([
            'title' => 'Blue Cotton Shirt',
            'attribute_values' => ['Red', 'Small'],
            'brand' => 'Nike',
            'category' => 'Apparel',
        ]);

        $this->assertSame('BLU-RED-SMA-NIK-APP-001', $sku);
    }

    public function test_attribute_values_keep_their_assigned_order(): void
    {
        $sku = $this->generate(['attribute_values' => ['Small', 'Red']]);

        $this->assertSame('SMA-RED-001', $sku);
    }

    public function test_punctuation_is_discarded_before_counting(): void
    {
        $this->assertSame('TSH-001', $this->generate(['title' => 'T-Shirt']));
    }

    public function test_digits_are_retained(): void
    {
        $this->assertSame('4KT-001', $this->generate(['title' => '4K TV']));
    }

    public function test_accented_characters_are_transliterated(): void
    {
        $this->assertSame('CAF-001', $this->generate(['title' => 'Café Latte']));
    }

    public function test_source_shorter_than_three_characters_is_taken_whole(): void
    {
        $this->assertSame('XL-001', $this->generate(['attribute_values' => ['XL']]));
    }

    public function test_missing_brand_is_omitted_with_its_separator(): void
    {
        $sku = $this->generate([
            'title' => 'Blue Cotton Shirt',
            'attribute_values' => ['Red'],
            'category' => 'Apparel',
        ]);

        $this->assertSame('BLU-RED-APP-001', $sku);
    }

    public function test_missing_category_is_omitted(): void
    {
        $sku = $this->generate([
            'title' => 'Blue Cotton Shirt',
            'brand' => 'Nike',
        ]);

        $this->assertSame('BLU-NIK-001', $sku);
    }

    public function test_variant_without_attribute_values_carries_no_attribute_segments(): void
    {
        $this->assertSame('BLU-001', $this->generate(['title' => 'Blue Cotton Shirt']));
    }

    public function test_source_normalizing_to_nothing_leaves_only_the_sequence(): void
    {
        $this->assertSame('001', $this->generate(['title' => 'শার্ট']));
    }

    public function test_sibling_variants_differ_in_their_attribute_segments(): void
    {
        $red = $this->generate([
            'title' => 'Blue Cotton Shirt',
            'attribute_values' => ['Red', 'Small'],
        ]);
        $blue = $this->generate([
            'title' => 'Blue Cotton Shirt',
            'attribute_values' => ['Blue', 'Large'],
        ]);

        $this->assertSame('BLU-RED-SMA-001', $red);
        $this->assertSame('BLU-BLU-LAR-001', $blue);
    }

    public function test_generating_without_saving_does_not_consume_the_number(): void
    {
        $this->assertSame('BLU-001', $this->generate(['title' => 'Blue Cotton Shirt']));
        $this->assertSame('BLU-001', $this->generate(['title' => 'Blue Cotton Shirt']));
        $this->assertSame('GRE-001', $this->generate(['title' => 'Green Wool Hat']));
    }

    public function test_sequence_continues_across_products(): void
    {
        for ($sequence = 1; $sequence <= 9; $sequence++) {
            $this->store_variant_with_sku(
                'First Product ' . $sequence,
                'FIR-' . str_pad((string) $sequence, 3, '0', STR_PAD_LEFT)
            );
        }

        $this->assertSame('SEC-010', $this->generate(['title' => 'Second Product']));
    }

    public function test_deleting_a_variant_releases_its_number(): void
    {
        $product = $this->store_variant_with_sku('Blue Cotton Shirt', 'BLU-001');
        $variant_id = $this->default_variant_id($product);

        $this->assertSame('BLU-002', $this->generate(['title' => 'Blue Cotton Shirt']));

        Variant::query()->where('id', $variant_id)->delete();

        $this->assertSame('BLU-001', $this->generate(['title' => 'Blue Cotton Shirt']));
    }

    public function test_generated_sku_does_not_duplicate_an_existing_one(): void
    {
        $this->store_variant_with_sku('Collision Product', 'COL-001');

        $this->assertSame('COL-002', $this->generate(['title' => 'Collision Product']));
    }

    public function test_sequence_widens_beyond_three_digits(): void
    {
        $this->store_variant_with_sku('Any Product', 'ANY-999');

        $this->assertSame('BLU-1000', $this->generate(['title' => 'Blue Cotton Shirt']));
    }

    public function test_sku_without_a_numeric_tail_does_not_raise_the_sequence(): void
    {
        $this->store_variant_with_sku('Legacy Product', 'SKU-ABC-WXYZ');

        $this->assertSame('BLU-001', $this->generate(['title' => 'Blue Cotton Shirt']));
    }

    public function test_generate_many_numbers_entries_consecutively(): void
    {
        $skus = SkuGenerator::generate_many([
            ['title' => 'Blue Cotton Shirt'],
            ['title' => 'Green Wool Hat'],
            ['title' => 'Red Silk Tie'],
        ]);

        $this->assertSame(['BLU-001', 'GRE-002', 'RED-003'], $skus);
    }

    public function test_generate_many_keeps_the_keys_it_was_given(): void
    {
        $skus = SkuGenerator::generate_many([
            41 => ['title' => 'Blue Cotton Shirt'],
            7 => ['title' => 'Green Wool Hat'],
        ]);

        $this->assertSame([41 => 'BLU-001', 7 => 'GRE-002'], $skus);
    }

    public function test_generate_many_starts_above_the_highest_stored_number(): void
    {
        $this->store_variant_with_sku('Any Product', 'ANY-009');

        $skus = SkuGenerator::generate_many([
            ['title' => 'Blue Cotton Shirt'],
            ['title' => 'Green Wool Hat'],
        ]);

        $this->assertSame(['BLU-010', 'GRE-011'], $skus);
    }

    public function test_generate_many_applies_every_segment_rule_per_entry(): void
    {
        $skus = SkuGenerator::generate_many([
            [
                'title' => 'Blue Cotton Shirt',
                'attribute_values' => ['Red', 'Small'],
                'brand' => 'Nike',
                'category' => 'Apparel',
            ],
            [
                'title' => 'Blue Cotton Shirt',
                'attribute_values' => ['Blue', 'Large'],
                'brand' => 'Nike',
                'category' => 'Apparel',
            ],
        ]);

        $this->assertSame(['BLU-RED-SMA-NIK-APP-001', 'BLU-BLU-LAR-NIK-APP-002'], $skus);
    }

    public function test_generate_many_without_entries_returns_nothing(): void
    {
        $this->assertSame([], SkuGenerator::generate_many([]));
    }
}
