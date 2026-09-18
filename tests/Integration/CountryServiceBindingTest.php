<?php

namespace Kirki\Ecommerce\Tests\Integration;

use Kirki\Ecommerce\App\DTO\Country\CountryFilterDTO;
use Kirki\Ecommerce\App\Services\CountryService;
use WP_UnitTestCase;

use function Kirki\Ecommerce\Framework\app;

/**
 * The singleton binding can only be exercised with the real container, because
 * the Unit bootstrap does not register service providers.
 */
class CountryServiceBindingTest extends WP_UnitTestCase
{
    public function test_country_service_resolves_to_a_shared_instance(): void
    {
        $this->assertSame(
            app()->make(CountryService::class),
            app()->make(CountryService::class)
        );
    }

    public function test_a_group_filtered_read_does_not_leak_into_the_shared_instance(): void
    {
        $service = app()->make(CountryService::class);

        $filtered = $service->all(CountryFilterDTO::from_array(['group' => 'eu']));

        $this->assertSame(range(0, count($filtered) - 1), array_keys($filtered));
        $this->assertNotCount(0, $filtered);

        $this->assertCount(
            250,
            app()->make(CountryService::class)->all(CountryFilterDTO::from_array([])),
            'A filtered read must not narrow the dataset for every later consumer of the shared instance.'
        );
    }
}
