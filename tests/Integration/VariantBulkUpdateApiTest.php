<?php

namespace Kirki\Ecommerce\Tests\Integration;

use Kirki\Ecommerce\App\Http\Controllers\Api\VariantController;
use Kirki\Ecommerce\App\Models\Variant;
use Kirki\Ecommerce\App\Services\VariantService;
use Kirki\Ecommerce\Framework\Route;
use Kirki\Ecommerce\Tests\Support\CreatesTestProducts;
use Kirki\Ecommerce\Tests\Support\RestTestCase;
use ReflectionProperty;

class VariantBulkUpdateApiTest extends RestTestCase
{
    use CreatesTestProducts;

    /**
     * Controller and service instances the router had cached before the test.
     *
     * @var array
     * @since 1.0.0
     */
    protected $original_route_instances = [];

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
        $this->original_route_instances = $this->route_instances_property()->getValue();
    }

    /**
     * Restore the router's cached instances after each test.
     *
     * @return void
     * @since 1.0.0
     */
    protected function tearDown(): void
    {
        $this->route_instances_property()->setValue(null, $this->original_route_instances);

        parent::tearDown();
    }

    /**
     * A failing later variant rolls back the earlier variant changes and
     * returns the "could not be updated" error naming the failing variant.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_bulk_update_rolls_back_earlier_variants_when_a_later_one_cannot_be_updated(): void
    {
        $first_variant_id = $this->default_variant_id($this->create_product());
        $failing_variant_id = $this->default_variant_id($this->create_product());

        $first_price_before = (int) Variant::find($first_variant_id)->base_price;
        $failing_price_before = (int) Variant::find($failing_variant_id)->base_price;

        $this->route_controller_with_service_failing_for($failing_variant_id);

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
        $this->assertSame($failing_price_before, (int) Variant::find($failing_variant_id)->base_price);
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

    /**
     * Route the bulk update to a controller whose service cannot update one variant.
     *
     * The real update never reports failure, so the router's cached controller
     * is swapped for one that fails the given variant and updates the rest.
     *
     * @param int $failing_variant_id The variant whose update reports failure.
     *
     * @return void
     * @since 1.0.0
     */
    protected function route_controller_with_service_failing_for(int $failing_variant_id): void
    {
        $service = new class ($failing_variant_id) extends VariantService {
            /**
             * The variant whose update reports failure.
             *
             * @var int
             */
            protected $failing_variant_id;

            /**
             * @param int $failing_variant_id The variant whose update reports failure.
             */
            public function __construct(int $failing_variant_id)
            {
                $this->failing_variant_id = $failing_variant_id;
            }

            /**
             * @inheritDoc
             */
            protected function update_variant(int $id, array $data)
            {
                if ($id === $this->failing_variant_id) {
                    return false;
                }

                return parent::update_variant($id, $data);
            }
        };

        $this->route_instances_property()->setValue(null, array_merge(
            $this->original_route_instances,
            [VariantController::class => new VariantController($service)]
        ));
    }

    /**
     * Get the router's static cache of resolved controllers and services.
     *
     * @return ReflectionProperty
     * @since 1.0.0
     */
    protected function route_instances_property(): ReflectionProperty
    {
        $property = new ReflectionProperty(Route::class, 'instances');
        $property->setAccessible(true);

        return $property;
    }
}
