<?php

namespace Kirki\Ecommerce\Tests\Support;

use Kirki\Ecommerce\App\Constants\OptionKeys;
use Kirki\Ecommerce\App\Constants\ShippingMethodTypes;
use Kirki\Ecommerce\App\Services\ShippingService;

trait SeedsTestShipping
{
    use RefreshesAppSingletons;

    /**
     * Seed default shipping zone and method settings.
     *
     * @return void
     * @since 1.0.0
     */
    protected function seed_shipping_settings(): void
    {
        $response = $this->request('PUT', 'settings', [
            'key' => OptionKeys::SHIPPING_SETTINGS,
            'data' => [
                'shipping_zones' => [
                    [
                        'id' => 'zone-test',
                        'is_enabled' => true,
                        'title' => 'Test Zone',
                        'regions' => [
                            [
                                'country' => 'US',
                                'states' => [],
                            ],
                        ],
                        'shipping_methods' => [
                            [
                                'id' => 'method-0001',
                                'is_enabled' => true,
                                'name' => 'Standard Delivery',
                                'type' => ShippingMethodTypes::FLAT_RATE,
                                'amount' => 10,
                                'is_taxable' => false,
                                'description' => null,
                                'shipping_rules' => [],
                            ],
                        ],
                    ],
                ],
            ],
        ]);

        $this->assert_api_success($response);
        static::forget_singleton(ShippingService::class);
    }
}
