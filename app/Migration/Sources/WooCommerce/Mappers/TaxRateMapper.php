<?php

namespace Kirki\Ecommerce\App\Migration\Sources\WooCommerce\Mappers;

defined('ABSPATH') || exit;

use Kirki\Ecommerce\App\Migration\Core\SkipItemException;
use Kirki\Ecommerce\App\Supports\CountryData;

/**
 * Adds one WooCommerce tax rate to the list of Kirki tax regions.
 *
 * Only a standard-class rate for a whole country is migrated. A rate for a state or another tax
 * class is skipped, because Kirki names states by its own ids and keeps other tax classes as rules,
 * and a rate that is kept wider than it was would charge the wrong tax. Several rates of a country
 * are added together, as WooCommerce adds the rates that apply to one price. Regions that the merchant
 * already made in Kirki are not changed.
 *
 * @since 1.0.0
 */
class TaxRateMapper
{
    public const SOURCE = 'woocommerce';

    /**
     * Add a tax rate to the regions.
     *
     * @since 1.0.0
     *
     * @param array<int, array<string, mixed>> $regions The stored tax regions.
     * @param array<string, mixed>             $rate    The tax rate item from the reader.
     * @return array{regions: array<int, array<string, mixed>>, position: int, note: string|null}
     * @throws SkipItemException When the rate cannot be kept exactly.
     */
    public function apply(array $regions, array $rate)
    {
        $this->check($rate);

        $country = CountryData::find_index_entry($rate['country']);

        if ($country === null) {
            throw new SkipItemException(esc_html(sprintf(
                /* translators: %s: country code */
                __('The country "%s" is not known to Kirki.', 'kirki-ecommerce'),
                $rate['country']
            )));
        }

        $product_rate = (float) $rate['rate'];
        $shipping_rate = $rate['applies_to_shipping'] ? $product_rate : 0.0;

        foreach ($regions as $index => $region) {
            if (strtoupper((string) ($region['code'] ?? '')) !== $rate['country']) {
                continue;
            }

            if (($region['source'] ?? null) !== static::SOURCE) {
                throw new SkipItemException(esc_html(sprintf(
                    /* translators: %s: country name */
                    __('%s already has a tax region in Kirki, which is not changed.', 'kirki-ecommerce'),
                    $country['name']
                )));
            }

            $regions[$index]['central_product_tax'] = (float) ($region['central_product_tax'] ?? 0) + $product_rate;
            $regions[$index]['central_shipping_tax'] = (float) ($region['central_shipping_tax'] ?? 0) + $shipping_rate;

            return [
                'regions' => $regions,
                'position' => $index + 1,
                'note' => sprintf(
                    /* translators: %s: country name */
                    __('Several tax rates for %s were added together into one rate.', 'kirki-ecommerce'),
                    $country['name']
                ),
            ];
        }

        $regions[] = [
            'code' => $rate['country'],
            'name' => (string) $country['name'],
            'flag' => $country['flag'] ?? null,
            'type' => 'general',
            'is_enabled' => true,
            'is_central_tax_enabled' => true,
            'central_product_tax' => $product_rate,
            'central_shipping_tax' => $shipping_rate,
            'rules' => [],
            'source' => static::SOURCE,
        ];

        return ['regions' => $regions, 'position' => count($regions), 'note' => null];
    }

    /**
     * Skip a rate that cannot be migrated exactly.
     *
     * @since 1.0.0
     *
     * @param array<string, mixed> $rate The tax rate item.
     * @return void
     * @throws SkipItemException When the rate is for a state, another class, all countries or is not a number.
     */
    protected function check(array $rate)
    {
        if ($rate['class'] !== '') {
            throw new SkipItemException(esc_html__('Only the standard tax class is migrated.', 'kirki-ecommerce'));
        }

        if ($rate['country'] === '') {
            throw new SkipItemException(esc_html__('A rate for all countries is not migrated.', 'kirki-ecommerce'));
        }

        if ($rate['state'] !== '' && $rate['state'] !== '*') {
            throw new SkipItemException(esc_html__('A rate for a state is not migrated. Kirki names states by its own ids.', 'kirki-ecommerce'));
        }

        if (!is_numeric($rate['rate'])) {
            throw new SkipItemException(esc_html__('The tax rate is not a number.', 'kirki-ecommerce'));
        }
    }
}
