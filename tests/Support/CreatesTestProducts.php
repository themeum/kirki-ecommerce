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
        $payload = [
            'title' => 'Test Product',
            'status' => ProductStatus::PUBLISHED,
            'currency_id' => $this->base_currency_id(),
            'has_variants' => false,
            'variants' => [
                [
                    'price' => 29.99,
                    'sku' => 'SKU-' . wp_generate_password(6, false),
                    'available_quantity' => 100,
                    'in_stock' => true,
                ],
            ],
        ];

        return array_merge($payload, $overrides);
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

        foreach ($product['variants'] as $variant) {
            $variants[] = array_merge([
                'id' => $variant['id'],
                'price' => $variant['price'],
                'sku' => $variant['sku'] ?? null,
                'available_quantity' => $variant['available_quantity'] ?? 100,
                'in_stock' => $variant['in_stock'] ?? true,
            ], $overrides);
        }

        return $variants;
    }
}
