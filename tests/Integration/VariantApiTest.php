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
