<?php

namespace Kirki\Ecommerce\Tests\Support;

use Kirki\Ecommerce\App\Constants\Product\ProductStatus;

trait CreatesTestProducts
{
    use SeedsTestCurrency;

    protected function create_product(array $overrides = []): array
    {
        $response = $this->request('POST', 'products', $this->product_payload($overrides));
        $payload = $this->assert_api_success($response, 201);

        return $payload['data'];
    }

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

    protected function default_variant_id(array $product): int
    {
        return (int) $product['variants'][0]['id'];
    }

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
