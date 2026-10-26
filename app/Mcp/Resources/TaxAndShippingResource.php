<?php

namespace Kirki\Ecommerce\App\Mcp\Resources;

defined('ABSPATH') || exit;

use Kirki\Ecommerce\Ahamed\FrameworkMcp\Request;
use Kirki\Ecommerce\Ahamed\FrameworkMcp\Response;
use Kirki\Ecommerce\App\Constants\OptionKeys;
use Kirki\Ecommerce\App\Facades\Money;
use Kirki\Ecommerce\App\Supports\Facades\Settings;

/**
 * The tax settings, the tax regions and the shipping zones with their methods.
 *
 * @since 1.0.0
 */
class TaxAndShippingResource extends StoreResource
{
    /** @var string */
    protected $title = 'Tax and shipping';

    /** @var string */
    protected $description = 'Whether tax is calculated, whether prices include tax, whether shipping is taxed, the tax regions with their rates, and the shipping zones with their regions and methods. Amounts are in the base currency.';

    /** @var string */
    protected $uri = 'kecom://store/tax-and-shipping';

    /**
     * Read the tax and shipping settings.
     *
     * @since 1.0.0
     *
     * @param Request $request The read, which carries no arguments.
     *
     * @return Response
     */
    public function handle(Request $request)
    {
        $tax = Settings::get(OptionKeys::TAX_SETTINGS);

        return Response::structured([
            'is_tax_calculation_enabled' => (bool) Settings::get(OptionKeys::GENERAL_SETTINGS . '.is_tax_calculation_enabled', false),
            'is_tax_inclusive_price' => (bool) $tax->get('is_tax_inclusive_price', false),
            'is_shipping_tax_enabled' => (bool) $tax->get('is_shipping_tax_enabled', false),
            'tax_regions' => $this->tax_regions((array) $tax->get('tax_regions', [])),
            'shipping_zones' => $this->shipping_zones((array) Settings::get(OptionKeys::SHIPPING_SETTINGS . '.shipping_zones', [])),
        ]);
    }

    /**
     * Get the tax regions with their countries, states and rates.
     *
     * @since 1.0.0
     *
     * @param array<int, mixed> $regions Stored tax regions.
     *
     * @return array<int, array<string, mixed>>
     */
    protected function tax_regions(array $regions)
    {
        $rows = [];

        foreach ($regions as $region) {
            if (!is_array($region)) {
                continue;
            }

            $rows[] = [
                'code' => $region['code'] ?? null,
                'name' => $region['name'] ?? null,
                'type' => $region['type'] ?? null,
                'is_enabled' => !empty($region['is_enabled']),
                'is_central_tax_enabled' => !empty($region['is_central_tax_enabled']),
                'central_product_tax_rate' => $region['central_product_tax'] ?? null,
                'central_shipping_tax_rate' => $region['central_shipping_tax'] ?? null,
                'countries' => array_map(function ($country) {
                    return [
                        'code' => $country['code'] ?? null,
                        'name' => $country['name'] ?? null,
                        'rate' => $country['rate'] ?? null,
                    ];
                }, array_values(array_filter((array) ($region['countries'] ?? []), 'is_array'))),
                'states' => array_map(function ($state) {
                    return [
                        'id' => $state['id'] ?? null,
                        'name' => $state['name'] ?? null,
                        'product_tax_rate' => $state['product_tax_rate'] ?? null,
                        'shipping_tax_rate' => $state['shipping_tax_rate'] ?? null,
                    ];
                }, array_values(array_filter((array) ($region['states'] ?? []), 'is_array'))),
            ];
        }

        return $rows;
    }

    /**
     * Get the shipping zones with their regions and methods.
     *
     * @since 1.0.0
     *
     * @param array<int, mixed> $zones Stored shipping zones.
     *
     * @return array<int, array<string, mixed>>
     */
    protected function shipping_zones(array $zones)
    {
        $rows = [];

        foreach ($zones as $zone) {
            if (!is_array($zone)) {
                continue;
            }

            $rows[] = [
                'title' => $zone['title'] ?? null,
                'is_enabled' => !empty($zone['is_enabled']),
                'regions' => array_map(function ($region) {
                    return [
                        'country' => $region['country'] ?? null,
                        'states' => array_values((array) ($region['states'] ?? [])),
                    ];
                }, array_values(array_filter((array) ($zone['regions'] ?? []), 'is_array'))),
                'methods' => array_map(function ($method) {
                    return [
                        'name' => $method['name'] ?? null,
                        'type' => $method['type'] ?? null,
                        'is_enabled' => !empty($method['is_enabled']),
                        'base_amount' => $this->amount($method['base_amount'] ?? null),
                        'is_free_shipping_enabled' => !empty($method['is_free_shipping_enabled']),
                        'base_free_shipping_min_amount' => $this->amount($method['base_free_shipping_min_amount'] ?? null),
                    ];
                }, array_values(array_filter((array) ($zone['shipping_methods'] ?? []), 'is_array'))),
            ];
        }

        return $rows;
    }

    /**
     * Turn a stored amount in minor units of the base currency into the money shape.
     *
     * @since 1.0.0
     *
     * @param mixed $minor Stored amount in minor units.
     *
     * @return array<string, mixed>|null Null when there is no amount.
     */
    protected function amount($minor)
    {
        if ($minor === null || $minor === '') {
            return null;
        }

        return $this->money_value(Money::to_dto((int) $minor));
    }
}
