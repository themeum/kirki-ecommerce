<?php

namespace Kirki\Ecommerce\App\Migration\Sources\WooCommerce\Readers;

defined('ABSPATH') || exit;

use Kirki\Ecommerce\App\Migration\Sources\WooCommerce\WooCommerceDatabase;
use Kirki\Ecommerce\Framework\Supports\Facades\DB;

/**
 * Reads the WooCommerce store settings, tax rates and shipping zones as one list of items.
 *
 * Each item has a number that grows through the list, so a chunk can continue after the last number:
 * the store settings are 1, a tax rate is 10,000,000 plus its id, and a shipping zone is 20,000,000 plus its id.
 *
 * @since 1.0.0
 */
class SettingsReader
{
    public const STORE = 1;
    public const TAX_OFFSET = 10000000;
    public const ZONE_OFFSET = 20000000;

    /** @var WooCommerceDatabase */
    protected $database;

    /**
     * Create the reader.
     *
     * @since 1.0.0
     *
     * @param WooCommerceDatabase $database Read access to the WooCommerce tables.
     */
    public function __construct(WooCommerceDatabase $database)
    {
        $this->database = $database;
    }

    /**
     * Read the next items after a number.
     *
     * @since 1.0.0
     *
     * @param int $cursor The number of the last item already processed.
     * @param int $limit  The most items to return.
     * @return array<int, array<string, mixed>>
     */
    public function items(int $cursor, int $limit)
    {
        $items = [];

        if ($cursor < static::STORE) {
            $items[] = $this->store();
        }

        if (count($items) < $limit && $cursor < static::ZONE_OFFSET) {
            $after = $cursor >= static::TAX_OFFSET ? $cursor - static::TAX_OFFSET : 0;
            $items = array_merge($items, $this->tax_rates($after, $limit - count($items)));
        }

        if (count($items) < $limit) {
            $after = $cursor >= static::ZONE_OFFSET ? $cursor - static::ZONE_OFFSET : 0;
            $items = array_merge($items, $this->zones($after, $limit - count($items)));
        }

        return $items;
    }

    /**
     * Read the store settings that Kirki has a matching setting for.
     *
     * @since 1.0.0
     *
     * @return array<string, mixed>
     */
    protected function store()
    {
        $default = (string) get_option('woocommerce_default_country', '');
        $parts = explode(':', $default);

        return [
            'id' => static::STORE,
            'kind' => 'store',
            'currency' => strtoupper((string) get_option('woocommerce_currency', '')),
            'address_line_1' => (string) get_option('woocommerce_store_address', ''),
            'address_line_2' => (string) get_option('woocommerce_store_address_2', ''),
            'city' => (string) get_option('woocommerce_store_city', ''),
            'postal_code' => (string) get_option('woocommerce_store_postcode', ''),
            'country' => strtoupper($parts[0]),
            'has_state' => isset($parts[1]) && $parts[1] !== '',
            'calc_taxes' => get_option('woocommerce_calc_taxes') === 'yes',
            'prices_include_tax' => get_option('woocommerce_prices_include_tax') === 'yes',
        ];
    }

    /**
     * Read tax rates after a rate id.
     *
     * @since 1.0.0
     *
     * @param int $after The id of the last tax rate already processed.
     * @param int $limit The most rates to return.
     * @return array<int, array<string, mixed>>
     */
    protected function tax_rates(int $after, int $limit)
    {
        if (!$this->database->has_table('woocommerce_tax_rates')) {
            return [];
        }

        $items = [];

        foreach (DB::table('woocommerce_tax_rates')->where('tax_rate_id', '>', $after)->order_by('tax_rate_id')->limit($limit)->get() as $row) {
            $row = (array) $row;
            $items[] = [
                'id' => static::TAX_OFFSET + (int) $row['tax_rate_id'],
                'kind' => 'tax_rate',
                'country' => strtoupper((string) $row['tax_rate_country']),
                'state' => (string) $row['tax_rate_state'],
                'rate' => (string) $row['tax_rate'],
                'name' => (string) $row['tax_rate_name'],
                'class' => (string) $row['tax_rate_class'],
                'applies_to_shipping' => (int) $row['tax_rate_shipping'] === 1,
            ];
        }

        return $items;
    }

    /**
     * Read shipping zones after a zone id, with their locations and methods.
     *
     * @since 1.0.0
     *
     * @param int $after The id of the last zone already processed.
     * @param int $limit The most zones to return.
     * @return array<int, array<string, mixed>>
     */
    protected function zones(int $after, int $limit)
    {
        if (!$this->database->has_table('woocommerce_shipping_zones')) {
            return [];
        }

        $items = [];

        foreach (DB::table('woocommerce_shipping_zones')->where('zone_id', '>', $after)->order_by('zone_id')->limit($limit)->get() as $row) {
            $row = (array) $row;
            $zone_id = (int) $row['zone_id'];
            $items[] = [
                'id' => static::ZONE_OFFSET + $zone_id,
                'kind' => 'shipping_zone',
                'name' => (string) $row['zone_name'],
                'locations' => $this->zone_locations($zone_id),
                'methods' => $this->zone_methods($zone_id),
            ];
        }

        return $items;
    }

    /**
     * Read the locations of a zone.
     *
     * @since 1.0.0
     *
     * @param int $zone_id The zone id.
     * @return array<int, array{code: string, type: string}>
     */
    protected function zone_locations(int $zone_id)
    {
        if (!$this->database->has_table('woocommerce_shipping_zone_locations')) {
            return [];
        }

        $locations = [];

        foreach (DB::table('woocommerce_shipping_zone_locations')->where('zone_id', $zone_id)->order_by('location_id')->get() as $row) {
            $row = (array) $row;
            $locations[] = ['code' => (string) $row['location_code'], 'type' => (string) $row['location_type']];
        }

        return $locations;
    }

    /**
     * Read the methods of a zone with their saved settings.
     *
     * @since 1.0.0
     *
     * @param int $zone_id The zone id.
     * @return array<int, array<string, mixed>>
     */
    protected function zone_methods(int $zone_id)
    {
        if (!$this->database->has_table('woocommerce_shipping_zone_methods')) {
            return [];
        }

        $methods = [];

        foreach (DB::table('woocommerce_shipping_zone_methods')->where('zone_id', $zone_id)->order_by('method_order')->get() as $row) {
            $row = (array) $row;
            $settings = get_option('woocommerce_' . $row['method_id'] . '_' . $row['instance_id'] . '_settings', []);

            $methods[] = [
                'method_id' => (string) $row['method_id'],
                'is_enabled' => (int) $row['is_enabled'] === 1,
                'settings' => is_array($settings) ? $settings : [],
            ];
        }

        return $methods;
    }
}
