<?php

namespace Kirki\Ecommerce\Tests\Support;

use Kirki\Ecommerce\App\Constants\Product\ProductStatus;

trait CreatesTestProducts
{
    use SeedsTestCurrency;

    /**
     * Create a product via the API.
     *
     * @param array $overrides Product attribute overrides.
     *
     * @return array
     * @since 1.0.0
     */
    protected function create_product(array $overrides = []): array
    {
        $response = $this->request('POST', 'products', $this->product_payload($overrides));
        $payload = $this->assert_api_success($response, 201);

        return $payload['data'];
    }

    /**
     * Build a default product request payload.
     *
     * @param array $overrides Product attribute overrides.
     *
     * @return array
     * @since 1.0.0
     */
    protected function product_payload(array $overrides = []): array
    {
        // Prices are stored and formatted in the base currency, so one must exist.
        $this->seed_base_currency();

        $payload = [
            'title' => 'Test Product',
            'status' => ProductStatus::PUBLISHED,
            'has_variants' => false,
            'variants' => [
                [
                    'base_price' => 29.99,
                    'sku' => 'SKU-' . wp_generate_password(6, false),
                    'available_quantity' => 100,
                    'in_stock' => true,
                    'is_default' => true,
                    'attribute_values' => [],
                ],
            ],
        ];

        return array_merge($payload, $overrides);
    }

    /**
     * Create a published product with two variants. The first is the default one.
     *
     * @param array $overrides Product attribute overrides.
     * @return array The product response data.
     * @since 1.0.0
     */
    protected function create_two_variant_product(array $overrides = []): array
    {
        $attribute = $this->request('POST', 'attributes', [
            'name' => 'Size ' . wp_generate_password(6, false),
            'slug' => 'size-' . strtolower(wp_generate_password(6, false)),
            'type' => 'list',
        ]);
        $attribute_id = $this->assert_api_success($attribute, 201)['data']['id'];

        $value_ids = [];

        foreach (['Small', 'Large'] as $value) {
            $created = $this->request('POST', 'attributes/' . $attribute_id . '/values', [
                'attribute_id' => $attribute_id,
                'value' => $value . ' ' . wp_generate_password(4, false),
            ]);
            $value_ids[] = $this->assert_api_success($created, 201)['data']['id'];
        }

        return $this->create_product(array_merge([
            'title' => 'Two Variant Product ' . wp_generate_password(4, false),
            'has_variants' => true,
            'attributes' => [
                ['id' => $attribute_id, 'values' => $value_ids],
            ],
            'variants' => [
                [
                    'base_price' => 10,
                    'sku' => 'SKU-' . wp_generate_password(6, false),
                    'available_quantity' => 10,
                    'in_stock' => true,
                    'is_default' => true,
                    'attribute_values' => [$value_ids[0]],
                ],
                [
                    'base_price' => 20,
                    'sku' => 'SKU-' . wp_generate_password(6, false),
                    'available_quantity' => 10,
                    'in_stock' => true,
                    'is_default' => false,
                    'attribute_values' => [$value_ids[1]],
                ],
            ],
        ], $overrides));
    }

    /**
     * Create a category via the API and return its identifier.
     *
     * @param string|null $name Category name.
     *
     * @return int
     * @since 1.0.0
     */
    protected function create_category(string $name = null): int
    {
        $suffix = wp_generate_password(6, false);
        $response = $this->request('POST', 'categories', [
            'name' => $name ?? 'Filter Category ' . $suffix,
            'slug' => 'filter-category-' . strtolower($suffix),
        ]);

        return (int) $this->assert_api_success($response, 201)['data']['id'];
    }

    /**
     * Create a collection via the API and return its identifier.
     *
     * @param string|null $name Collection name.
     *
     * @return int
     * @since 1.0.0
     */
    protected function create_collection(string $name = null): int
    {
        $suffix = wp_generate_password(6, false);
        $response = $this->request('POST', 'collections', [
            'title' => $name ?? 'Filter Collection ' . $suffix,
            'slug' => 'filter-collection-' . strtolower($suffix),
        ]);

        return (int) $this->assert_api_success($response, 201)['data']['id'];
    }

    /**
     * Create a brand via the API and return its identifier.
     *
     * @param string|null $name Brand name.
     *
     * @return int
     * @since 1.0.0
     */
    protected function create_brand(string $name = null): int
    {
        $suffix = wp_generate_password(6, false);
        $response = $this->request('POST', 'brands', [
            'name' => $name ?? 'Filter Brand ' . $suffix,
            'slug' => 'filter-brand-' . strtolower($suffix),
        ]);

        return (int) $this->assert_api_success($response, 201)['data']['id'];
    }

    /**
     * Collect the product titles from a list response payload.
     *
     * @param array $payload API response payload.
     *
     * @return array
     * @since 1.0.0
     */
    protected function listed_titles(array $payload): array
    {
        return array_column($payload['data']['results'], 'title');
    }

    /**
     * Return the first variant identifier from a product payload.
     *
     * @param array $product Product response data.
     *
     * @return int
     * @since 1.0.0
     */
    protected function default_variant_id(array $product): int
    {
        return (int) $product['variants'][0]['id'];
    }

    /**
     * Build variant payloads for product update requests.
     *
     * @param array $product   Product response data.
     * @param array $overrides Variant attribute overrides.
     *
     * @return array
     * @since 1.0.0
     */
    protected function variants_for_update(array $product, array $overrides = []): array
    {
        $variants = [];

        foreach ($product['variants'] as $index => $variant) {
            $variants[] = array_merge([
                'id' => $variant['id'],
                'base_price' => $variant['base_price'],
                'sku' => $variant['sku'] ?? null,
                'available_quantity' => $variant['available_quantity'] ?? 100,
                'in_stock' => $variant['in_stock'] ?? true,
                // Echoing these back is mandatory: omitting attribute_values
                // detaches every pivot row, and the matrix requires exactly
                // one default.
                'attribute_values' => $variant['attribute_values'] ?? [],
                'is_default' => $variant['is_default'] ?? ($index === 0),
            ], $overrides);
        }

        return $variants;
    }
}
