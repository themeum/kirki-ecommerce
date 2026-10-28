<?php

namespace Kirki\Ecommerce\Tests\Integration;

use Kirki\Ecommerce\App\Models\Variant;
use Kirki\Ecommerce\Tests\Support\CreatesTestProducts;
use Kirki\Ecommerce\Tests\Support\RestTestCase;

class VariantPerOrderLimitApiTest extends RestTestCase
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
     * Create a one-variant product whose variant carries the given limit fields.
     *
     * @param array $limit Limit fields to merge into the variant payload.
     *
     * @return array Product response data.
     * @since 1.0.0
     */
    protected function create_product_with_limit(array $limit): array
    {
        $payload = $this->product_payload();
        $payload['variants'][0] = array_merge($payload['variants'][0], $limit);

        return $this->create_product($payload);
    }

    /**
     * Get the stored variant row.
     *
     * @param int $variant_id Variant ID.
     *
     * @return Variant
     * @since 1.0.0
     */
    protected function stored_variant(int $variant_id): Variant
    {
        return Variant::find($variant_id);
    }

    /**
     * Create stores 1 when the limit is on and no maximum is given.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_create_with_limit_on_and_no_maximum_stores_one(): void
    {
        $product = $this->create_product_with_limit(['has_limit_per_order' => true]);

        $variant = $this->stored_variant($this->default_variant_id($product));
        $this->assertTrue((bool) $variant->has_limit_per_order);
        $this->assertSame(1, (int) $variant->max_per_order);
    }

    /**
     * Create stores 1 when the limit is on and the maximum is null.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_create_with_limit_on_and_null_maximum_stores_one(): void
    {
        $product = $this->create_product_with_limit(['has_limit_per_order' => true, 'max_per_order' => null]);

        $this->assertSame(1, (int) $this->stored_variant($this->default_variant_id($product))->max_per_order);
    }

    /**
     * Create keeps a maximum the merchant gave.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_create_with_limit_on_keeps_given_maximum(): void
    {
        $product = $this->create_product_with_limit(['has_limit_per_order' => true, 'max_per_order' => 5]);

        $this->assertSame(5, (int) $this->stored_variant($this->default_variant_id($product))->max_per_order);
    }

    /**
     * Create leaves the maximum empty when the limit is off.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_create_with_limit_off_keeps_maximum_empty(): void
    {
        $product = $this->create_product_with_limit(['has_limit_per_order' => false, 'max_per_order' => null]);

        $variant = $this->stored_variant($this->default_variant_id($product));
        $this->assertFalse((bool) $variant->has_limit_per_order);
        $this->assertNull($variant->max_per_order);
    }

    /**
     * Product update stores 1 when the limit is turned on with a null maximum.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_product_update_with_limit_on_and_null_maximum_stores_one(): void
    {
        $product = $this->create_product();

        $response = $this->request('PUT', 'products/' . $product['id'], $this->product_payload([
            'id' => $product['id'],
            'variants' => $this->variants_for_update($product, ['has_limit_per_order' => true, 'max_per_order' => null]),
        ]));
        $this->assert_api_success($response);

        $this->assertSame(1, (int) $this->stored_variant($this->default_variant_id($product))->max_per_order);
    }

    /**
     * Product update keeps a stored maximum when the limit is turned off.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_product_update_with_limit_off_keeps_stored_maximum(): void
    {
        $product = $this->create_product_with_limit(['has_limit_per_order' => true, 'max_per_order' => 3]);

        $response = $this->request('PUT', 'products/' . $product['id'], $this->product_payload([
            'id' => $product['id'],
            'variants' => $this->variants_for_update($product, ['has_limit_per_order' => false, 'max_per_order' => 3]),
        ]));
        $this->assert_api_success($response);

        $variant = $this->stored_variant($this->default_variant_id($product));
        $this->assertFalse((bool) $variant->has_limit_per_order);
        $this->assertSame(3, (int) $variant->max_per_order);
    }

    /**
     * A partial update that only turns the limit on stores 1 over an empty maximum.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_partial_update_turning_limit_on_over_empty_maximum_stores_one(): void
    {
        $product = $this->create_product();
        $variant_id = $this->default_variant_id($product);

        $response = $this->request('PUT', 'variants/' . $variant_id, [
            'id' => $variant_id,
            'has_limit_per_order' => true,
        ]);
        $this->assert_api_success($response);

        $this->assertSame(1, (int) $this->stored_variant($variant_id)->max_per_order);
    }

    /**
     * A partial update that only turns the limit on keeps the stored maximum.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_partial_update_turning_limit_on_over_stored_maximum_keeps_it(): void
    {
        $product = $this->create_product_with_limit(['has_limit_per_order' => false, 'max_per_order' => 5]);
        $variant_id = $this->default_variant_id($product);

        $response = $this->request('PUT', 'variants/' . $variant_id, [
            'id' => $variant_id,
            'has_limit_per_order' => true,
        ]);
        $this->assert_api_success($response);

        $this->assertSame(5, (int) $this->stored_variant($variant_id)->max_per_order);
    }

    /**
     * A partial update that only turns the limit off keeps the stored maximum.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_partial_update_turning_limit_off_keeps_stored_maximum(): void
    {
        $product = $this->create_product_with_limit(['has_limit_per_order' => true, 'max_per_order' => 3]);
        $variant_id = $this->default_variant_id($product);

        $response = $this->request('PUT', 'variants/' . $variant_id, [
            'id' => $variant_id,
            'has_limit_per_order' => false,
        ]);
        $this->assert_api_success($response);

        $variant = $this->stored_variant($variant_id);
        $this->assertFalse((bool) $variant->has_limit_per_order);
        $this->assertSame(3, (int) $variant->max_per_order);
    }

    /**
     * Bulk update stores 1 when the limit is on and the maximum is null.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_bulk_update_with_limit_on_and_null_maximum_stores_one(): void
    {
        $product = $this->create_product();
        $variant_id = $this->default_variant_id($product);

        $response = $this->request('PUT', 'variants/bulk', [
            'variants' => [
                ['id' => $variant_id, 'has_limit_per_order' => true, 'max_per_order' => null],
            ],
        ]);
        $this->assert_api_success($response);

        $this->assertSame(1, (int) $this->stored_variant($variant_id)->max_per_order);
    }

    /**
     * The model raises a zero maximum to 1 when the limit is on.
     *
     * Validation rejects 0 at the API, so this guards the other save paths (seeders, code).
     *
     * @return void
     * @since 1.0.0
     */
    public function test_model_save_raises_zero_maximum_to_one_when_limit_is_on(): void
    {
        $product = $this->create_product();
        $variant_id = $this->default_variant_id($product);

        $this->stored_variant($variant_id)->update(['has_limit_per_order' => true, 'max_per_order' => 0]);

        $this->assertSame(1, (int) $this->stored_variant($variant_id)->max_per_order);
    }

    /**
     * The model leaves a zero maximum alone when the limit is off.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_model_save_keeps_maximum_when_limit_is_off(): void
    {
        $product = $this->create_product();
        $variant_id = $this->default_variant_id($product);

        $this->stored_variant($variant_id)->update(['has_limit_per_order' => false, 'max_per_order' => 0]);

        $this->assertSame(0, (int) $this->stored_variant($variant_id)->max_per_order);
    }

    /**
     * A duplicated product keeps the limit and a usable maximum.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_duplicate_product_keeps_limit_with_usable_maximum(): void
    {
        $product = $this->create_product_with_limit(['has_limit_per_order' => true]);

        $response = $this->request('POST', 'products/' . $product['id'] . '/duplicate');
        $copy = $this->assert_api_success($response, 201)['data'];

        $variant = $this->stored_variant($this->default_variant_id($copy));
        $this->assertTrue((bool) $variant->has_limit_per_order);
        $this->assertSame(1, (int) $variant->max_per_order);
    }

    /**
     * Product create rejects a maximum below 1.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_product_create_rejects_maximum_below_one(): void
    {
        foreach ([0, -2] as $maximum) {
            $payload = $this->product_payload();
            $payload['variants'][0] = array_merge($payload['variants'][0], ['has_limit_per_order' => true, 'max_per_order' => $maximum]);

            $this->assert_validation_error($this->request('POST', 'products', $payload));
        }
    }

    /**
     * Product update rejects a maximum below 1 and accepts an empty one.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_product_update_rejects_maximum_below_one(): void
    {
        $product = $this->create_product();

        foreach ([0, -2] as $maximum) {
            $response = $this->request('PUT', 'products/' . $product['id'], $this->product_payload([
                'id' => $product['id'],
                'variants' => $this->variants_for_update($product, ['has_limit_per_order' => false, 'max_per_order' => $maximum]),
            ]));

            $this->assert_validation_error($response);
        }

        $response = $this->request('PUT', 'products/' . $product['id'], $this->product_payload([
            'id' => $product['id'],
            'variants' => $this->variants_for_update($product, ['has_limit_per_order' => false, 'max_per_order' => null]),
        ]));
        $this->assert_api_success($response);
    }

    /**
     * Single variant update rejects a maximum below 1 and accepts an empty one.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_variant_update_rejects_maximum_below_one(): void
    {
        $product = $this->create_product();
        $variant_id = $this->default_variant_id($product);

        foreach ([0, -2] as $maximum) {
            $response = $this->request('PUT', 'variants/' . $variant_id, ['id' => $variant_id, 'max_per_order' => $maximum]);

            $this->assert_validation_error($response);
        }

        $response = $this->request('PUT', 'variants/' . $variant_id, ['id' => $variant_id, 'has_limit_per_order' => false, 'max_per_order' => null]);
        $this->assert_api_success($response);
    }

    /**
     * Bulk variant update rejects a maximum below 1 and accepts an empty one.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_bulk_update_rejects_maximum_below_one(): void
    {
        $product = $this->create_product();
        $variant_id = $this->default_variant_id($product);

        foreach ([0, -2] as $maximum) {
            $response = $this->request('PUT', 'variants/bulk', [
                'variants' => [['id' => $variant_id, 'has_limit_per_order' => false, 'max_per_order' => $maximum]],
            ]);

            $this->assert_validation_error($response);
        }

        $response = $this->request('PUT', 'variants/bulk', [
            'variants' => [['id' => $variant_id, 'has_limit_per_order' => false, 'max_per_order' => null]],
        ]);
        $this->assert_api_success($response);
    }
}
