<?php

namespace Kirki\Ecommerce\App\Services;

use Exception;
use Kirki\Ecommerce\App\Setup\CouponSeeder;
use Kirki\Ecommerce\App\Setup\Presets\PresetContext;
use Kirki\Ecommerce\App\Setup\Presets\PresetRepository;
use Kirki\Ecommerce\App\Setup\ProductSeeder;
use Kirki\Ecommerce\Framework\Http\Response;

use function Kirki\Ecommerce\Framework\app;
use function Kirki\Ecommerce\Framework\throw_if;

defined('ABSPATH') || exit;

/**
 * Loads the sample products of the store's industry and the starter coupon.
 *
 * @since 1.0.0
 */
class SampleDataImporter
{
    /**
     * Import the sample data.
     *
     * The sample data and its attribute definitions are read from the preset
     * location. Products that the store already has (matched by SKU) are
     * skipped, so a load that was cut off can run again.
     *
     * @since 1.0.0
     *
     * @return void
     * @throws Exception When the sample products or the presets cannot be read.
     */
    public function import()
    {
        $presets = app()->make(PresetRepository::class);
        $catalog = $presets->get_products(PresetContext::from_settings()->industry);
        $common = $presets->get_common();

        throw_if(
            $catalog === null || empty($common),
            __('The sample data could not be downloaded. Please try again later.', 'kirki-ecommerce'),
            Exception::class,
            Response::SERVICE_UNAVAILABLE
        );

        $attributes = $this->merge_attributes($common['attributes'] ?? [], $presets->get_industry($catalog['set'])['attributes'] ?? []);

        app()->make(ProductSeeder::class)->run($catalog, $attributes);
        app()->make(CouponSeeder::class)->run();
    }

    /**
     * Merge attribute definitions by slug.
     *
     * The first definition of a slug gives its name and type; the values of
     * every definition with that slug are kept. An industry can so add colors
     * to the common Color attribute.
     *
     * @since 1.0.0
     *
     * @param array<int, array<string, mixed>> ...$lists Attribute definitions, common ones first.
     * @return array<string, array<string, mixed>> Definitions keyed by slug.
     */
    protected function merge_attributes(array ...$lists)
    {
        $merged = [];

        foreach (array_merge(...$lists) as $definition) {
            $slug = $definition['slug'] ?? '';

            if (!isset($merged[$slug])) {
                $merged[$slug] = $definition;
                continue;
            }

            $merged[$slug]['values'] = array_merge($merged[$slug]['values'] ?? [], $definition['values'] ?? []);
        }

        return $merged;
    }
}
