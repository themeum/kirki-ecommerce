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

    /**
     * Kirki email paths, keyed to the WooCommerce email id or, with a leading "!", to a stock alert option.
     * The enabled flag of the email is the one that is read.
     */
    protected const EMAILS = [
        'customer_emails.order_notifications.order_on_hold' => 'customer_on_hold_order',
        'customer_emails.order_notifications.order_processing' => 'customer_processing_order',
        'customer_emails.order_notifications.order_completed' => 'customer_completed_order',
        'customer_emails.order_notifications.order_note' => 'customer_note',
        'customer_emails.user_notifications.reset_password' => 'customer_reset_password',
        'customer_emails.user_notifications.new_account' => 'customer_new_account',
        'admin_emails.order_notifications.new_order' => 'new_order',
        'admin_emails.order_notifications.cancelled_order' => 'cancelled_order',
        'admin_emails.order_notifications.payment_failed' => 'failed_order',
        'admin_emails.inventory_notifications.low_stock' => '!woocommerce_notify_low_stock',
        'admin_emails.inventory_notifications.out_of_stock' => '!woocommerce_notify_no_stock',
    ];

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
     * Read the store options that Kirki has a matching setting for. An option that WooCommerce has not saved is null.
     *
     * @since 1.0.0
     *
     * @return array<string, mixed>
     */
    protected function store()
    {
        $low_stock = get_option('woocommerce_notify_low_stock_amount', null);

        return [
            'id' => static::STORE,
            'kind' => 'store',
            'weight_unit' => $this->text('woocommerce_weight_unit'),
            'dimension_unit' => $this->text('woocommerce_dimension_unit'),
            'reviews' => $this->flag('woocommerce_enable_reviews'),
            'ratings' => $this->flag('woocommerce_enable_review_rating'),
            'guest_checkout' => $this->flag('woocommerce_enable_guest_checkout'),
            'coupons' => $this->flag('woocommerce_enable_coupons'),
            'low_stock_amount' => is_numeric($low_stock) && (int) $low_stock > 0 ? (int) $low_stock : null,
            'signup_at_checkout' => get_option('woocommerce_enable_signup_and_login_from_checkout') === 'yes',
            'store_email' => $this->email_address(),
            'selling_mode' => $this->text('woocommerce_allowed_countries'),
            'selling_countries' => $this->countries(),
            'phone_field' => $this->text('woocommerce_checkout_phone_field'),
            'company_field' => $this->text('woocommerce_checkout_company_field'),
            'tax_display_shop' => $this->text('woocommerce_tax_display_shop'),
            'price_position' => $this->text('woocommerce_currency_pos'),
            'thousand_separator' => $this->text('woocommerce_price_thousand_sep'),
            'decimal_separator' => $this->text('woocommerce_price_decimal_sep'),
            'emails' => $this->emails(),
            'email_footer' => $this->text('woocommerce_email_footer_text'),
            'email_colors' => $this->email_colors(),
        ];
    }

    /**
     * Read the sender address of WooCommerce emails.
     *
     * @since 1.0.0
     *
     * @return string|null Null when it is not saved or not a valid email.
     */
    protected function email_address()
    {
        $address = $this->text('woocommerce_email_from_address');

        return $address !== null && is_email($address) ? $address : null;
    }

    /**
     * Read the country codes that the allowed-countries option points to.
     *
     * @since 1.0.0
     *
     * @return string[]
     */
    protected function countries()
    {
        $mode = get_option('woocommerce_allowed_countries', 'all');
        $name = $mode === 'specific' ? 'woocommerce_specific_allowed_countries' : 'woocommerce_all_except_countries';
        $codes = $mode === 'all' ? [] : get_option($name, []);

        return is_array($codes) ? array_values(array_map('strtoupper', array_filter($codes, 'is_string'))) : [];
    }

    /**
     * Read the enabled flag of each WooCommerce email that Kirki has a matching email for.
     *
     * @since 1.0.0
     *
     * @return array<string, bool> Flags keyed by the Kirki email path. An email WooCommerce has not saved is left out.
     */
    protected function emails()
    {
        $flags = [];

        foreach (static::EMAILS as $path => $source) {
            if ($source[0] === '!') {
                $enabled = $this->flag(substr($source, 1));
            } else {
                $saved = get_option('woocommerce_' . $source . '_settings', null);
                $enabled = is_array($saved) && isset($saved['enabled']) ? $saved['enabled'] === 'yes' : null;
            }

            if ($enabled !== null) {
                $flags[$path] = $enabled;
            }
        }

        return $flags;
    }

    /**
     * Read the WooCommerce email colors that are valid hex colors.
     *
     * @since 1.0.0
     *
     * @return array<string, string> Colors keyed by the Kirki template path.
     */
    protected function email_colors()
    {
        $options = [
            'colors.button.background' => 'woocommerce_email_base_color',
            'colors.background.outer_area' => 'woocommerce_email_background_color',
            'colors.background.email_body' => 'woocommerce_email_body_background_color',
            'colors.typography.body' => 'woocommerce_email_text_color',
        ];
        $colors = [];

        foreach ($options as $path => $name) {
            $value = $this->text($name);

            if ($value !== null && preg_match('/^#[0-9a-f]{6}$/i', $value)) {
                $colors[$path] = $value;
            }
        }

        return $colors;
    }

    /**
     * Read a yes/no option.
     *
     * @since 1.0.0
     *
     * @param string $name The option name.
     * @return bool|null Null when the option is not saved.
     */
    protected function flag(string $name)
    {
        $value = get_option($name, null);

        return $value === null ? null : $value === 'yes';
    }

    /**
     * Read a text option.
     *
     * @since 1.0.0
     *
     * @param string $name The option name.
     * @return string|null Null when the option is not saved or empty.
     */
    protected function text(string $name)
    {
        $value = get_option($name, null);

        return is_string($value) && $value !== '' ? $value : null;
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
        $located = $this->database->has_table('woocommerce_tax_rate_locations');

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
                'has_locations' => $located && DB::table('woocommerce_tax_rate_locations')->where('tax_rate_id', (int) $row['tax_rate_id'])->exists(),
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

        if ($after === 0 && $limit > 0 && $this->database->has_rest_of_world_methods()) {
            $items[] = [
                'id' => static::ZONE_OFFSET,
                'kind' => 'shipping_zone',
                'name' => __('Locations not covered by your other zones', 'kirki-ecommerce'),
                'locations' => [],
                'methods' => $this->zone_methods(0),
                'rest_of_world' => true,
            ];
        }

        foreach (DB::table('woocommerce_shipping_zones')->where('zone_id', '>', $after)->order_by('zone_id')->limit($limit - count($items))->get() as $row) {
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
