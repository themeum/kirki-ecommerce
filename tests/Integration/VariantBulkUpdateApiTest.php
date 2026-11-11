<?php

namespace Kirki\Ecommerce\Tests\Integration;

use Kirki\Ecommerce\App\Models\Variant;
use Kirki\Ecommerce\Tests\Support\CreatesTestProducts;
use Kirki\Ecommerce\Tests\Support\RestTestCase;

class VariantBulkUpdateApiTest extends RestTestCase
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
     * A missing variant id returns the "could not be updated" error naming it
     * and leaves the other variants unchanged.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_bulk_update_changes_nothing_when_a_variant_id_does_not_exist(): void
    {
        $first_variant_id = $this->default_variant_id($this->create_product());
        $failing_variant_id = (int) Variant::query()->max('id') + 1000;

        $first_price_before = (int) Variant::find($first_variant_id)->base_price;

        $response = $this->request('PUT', 'variants/bulk', [
            'variants' => [
                [
                    'id' => $first_variant_id,
                    'base_price' => 12.50,
                ],
                [
                    'id' => $failing_variant_id,
                    'base_price' => 15.00,
                ],
            ],
        ]);

        $data = $this->normalize_response_data($response->get_data());

        $this->assertSame(404, $response->get_status());
        $this->assertArrayHasKey('message', $data);
        $this->assertStringContainsString(
            'Variant with id ' . $failing_variant_id . ' could not be updated.',
            $data['message']
        );
        $this->assertSame($first_price_before, (int) Variant::find($first_variant_id)->base_price);
    }

    /**
     * A bulk update where every variant can be updated keeps all changes.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_bulk_update_commits_every_variant_when_all_succeed(): void
    {
        $first_variant_id = $this->default_variant_id($this->create_product());
        $second_variant_id = $this->default_variant_id($this->create_product());

        $response = $this->request('PUT', 'variants/bulk', [
            'variants' => [
                [
                    'id' => $first_variant_id,
                    'base_price' => 12.50,
                ],
                [
                    'id' => $second_variant_id,
                    'base_price' => 15.00,
                ],
            ],
        ]);

        $this->assert_api_success($response);
        $this->assertSame(1250, (int) Variant::find($first_variant_id)->base_price);
        $this->assertSame(1500, (int) Variant::find($second_variant_id)->base_price);
    }
}
