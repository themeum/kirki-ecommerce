<?php

namespace Kirki\Ecommerce\App\Migration\Sources\WooCommerce\Mappers;

defined('ABSPATH') || exit;

use Kirki\Ecommerce\App\Constants\ShippingMethodTypes;
use Kirki\Ecommerce\App\Facades\Money;
use Kirki\Ecommerce\App\Migration\Core\SkipItemException;
use Kirki\Ecommerce\App\Supports\CountryData;

/**
 * Maps one WooCommerce shipping zone to a Kirki shipping zone.
 *
 * Whole-country locations are kept, with every state of the country selected. A state, continent or postcode location is left out, because it
 * cannot be named exactly in Kirki, and a zone that is left with no country is skipped so that it does
 * not ship to a wider area. Flat rate, free shipping and local pickup methods are kept.
 *
 * @since 1.0.0
 */
class ShippingZoneMapper
{
    /**
     * Map a zone.
     *
     * @since 1.0.0
     *
     * @param array<string, mixed> $zone The zone item from the reader.
     * @return array{zone: array<string, mixed>, notes: string[]}
     * @throws SkipItemException When the zone has no whole-country location.
     */
    public function map(array $zone)
    {
        $notes = [];
        $regions = $this->regions($zone, $notes);

        if (empty($regions)) {
            throw new SkipItemException(esc_html__('The zone has no whole-country location. State, continent and postcode locations are not migrated.', 'kirki-ecommerce'));
        }

        return [
            'zone' => [
                'id' => wp_generate_uuid4(),
                'title' => sanitize_text_field($zone['name']),
                'is_enabled' => true,
                'regions' => $regions,
                'shipping_methods' => $this->methods($zone, $notes),
            ],
            'notes' => $notes,
        ];
    }

    /**
     * Collect the whole-country locations as regions.
     *
     * @since 1.0.0
     *
     * @param array<string, mixed> $zone  The zone item.
     * @param string[]             $notes Notes, extended in place.
     * @return array<int, array{country: string, states: array}>
     */
    protected function regions(array $zone, array &$notes)
    {
        $regions = [];
        $left_out = 0;

        foreach ($zone['locations'] as $location) {
            $code = strtoupper($location['code']);

            if ($location['type'] === 'country' && CountryData::find_index_entry($code) !== null) {
                $regions[] = ['country' => $code, 'states' => CountryData::state_ids($code)];
                continue;
            }

            $left_out++;
        }

        if ($left_out > 0 && !empty($regions)) {
            $notes[] = sprintf(
                /* translators: 1: zone name, 2: number of locations */
                _n('Zone "%1$s": %2$d location was left out because it is not a whole country.', 'Zone "%1$s": %2$d locations were left out because they are not whole countries.', $left_out, 'kirki-ecommerce'),
                $zone['name'],
                $left_out
            );
        }

        return $regions;
    }

    /**
     * Map the methods of a zone.
     *
     * @since 1.0.0
     *
     * @param array<string, mixed> $zone  The zone item.
     * @param string[]             $notes Notes, extended in place.
     * @return array<int, array<string, mixed>>
     */
    protected function methods(array $zone, array &$notes)
    {
        $methods = [];

        foreach ($zone['methods'] as $method) {
            $settings = $method['settings'];
            $type = $method['method_id'];

            if (!in_array($type, ['flat_rate', 'free_shipping', 'local_pickup'], true)) {
                $notes[] = sprintf(
                    /* translators: 1: zone name, 2: shipping method */
                    __('Zone "%1$s": the shipping method "%2$s" is not supported and was left out.', 'kirki-ecommerce'),
                    $zone['name'],
                    $type
                );
                continue;
            }

            $methods[] = [
                'id' => wp_generate_uuid4(),
                'type' => $type === 'local_pickup' ? ShippingMethodTypes::LOCAL_PICKUP : ShippingMethodTypes::FLAT_RATE,
                'name' => sanitize_text_field($settings['title'] ?? $this->default_title($type)),
                'description' => '',
                'base_amount' => $this->base_amount($type, $settings, $zone['name'], $notes),
                'is_taxable' => ($settings['tax_status'] ?? 'taxable') === 'taxable',
                'is_enabled' => (bool) $method['is_enabled'],
                'shipping_rules' => [],
            ];
        }

        return $methods;
    }

    /**
     * Get the price of a method in minor units. A price that is a formula is not migrated.
     *
     * @since 1.0.0
     *
     * @param string               $type     The WooCommerce method id.
     * @param array<string, mixed> $settings The method settings.
     * @param string               $zone     The zone name, for notes.
     * @param string[]             $notes    Notes, extended in place.
     * @return int
     */
    protected function base_amount(string $type, array $settings, string $zone, array &$notes)
    {
        if ($type === 'free_shipping') {
            return 0;
        }

        $cost = trim((string) ($settings['cost'] ?? ''));

        if ($cost === '') {
            return 0;
        }

        if (!is_numeric($cost)) {
            $notes[] = sprintf(
                /* translators: 1: zone name, 2: the cost formula */
                __('Zone "%1$s": the cost "%2$s" is a formula and was saved as 0.', 'kirki-ecommerce'),
                $zone,
                $cost
            );

            return 0;
        }

        return Money::to_minor($cost);
    }

    /**
     * Get a name for a method that has no title.
     *
     * @since 1.0.0
     *
     * @param string $type The WooCommerce method id.
     * @return string
     */
    protected function default_title(string $type)
    {
        $titles = [
            'flat_rate' => __('Flat rate', 'kirki-ecommerce'),
            'free_shipping' => __('Free shipping', 'kirki-ecommerce'),
            'local_pickup' => __('Local pickup', 'kirki-ecommerce'),
        ];

        return $titles[$type];
    }
}
