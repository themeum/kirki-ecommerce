<?php

namespace Kirki\Ecommerce\App\Migration\Sources\WooCommerce\Groups;

defined('ABSPATH') || exit;

use Kirki\Ecommerce\App\Constants\CurrencyPosition;
use Kirki\Ecommerce\App\Constants\OptionKeys;
use Kirki\Ecommerce\App\Constants\SellingLocationType;
use Kirki\Ecommerce\App\Migration\Core\RecordLedger;
use Kirki\Ecommerce\App\Migration\Sources\WooCommerce\Mappers\ShippingZoneMapper;
use Kirki\Ecommerce\App\Migration\Sources\WooCommerce\Mappers\TaxRateMapper;
use Kirki\Ecommerce\App\Migration\Sources\WooCommerce\Readers\SettingsReader;
use Kirki\Ecommerce\App\Migration\Sources\WooCommerce\WooCommerceDatabase;
use Kirki\Ecommerce\App\Supports\CountryData;
use Kirki\Ecommerce\App\Supports\Facades\Settings;

/**
 * Migrates the WooCommerce units, product, checkout, store, price format and email options, tax rates and shipping zones.
 *
 * The currency, store address and tax switches are set by the onboarding wizard, so this group does not read them.
 * A WooCommerce value always replaces the Kirki value. A setting that WooCommerce does not have keeps its Kirki value.
 * Tax rates and shipping zones replace the whole Kirki list when WooCommerce has any. Payment gateway credentials are
 * not read.
 *
 * @since 1.0.0
 */
class SettingsGroup extends WooCommerceGroup
{
    /** WooCommerce weight unit names, keyed to the Kirki unit. */
    protected const WEIGHT_UNITS = ['kg' => 'kg', 'g' => 'g', 'lbs' => 'lb', 'oz' => 'oz'];

    /** WooCommerce dimension unit names, keyed to the Kirki unit. */
    protected const DIMENSION_UNITS = ['m' => 'm', 'cm' => 'cm', 'mm' => 'mm', 'in' => 'in'];

    /** @var SettingsReader */
    protected $reader;

    /**
     * Create the group.
     *
     * @since 1.0.0
     *
     * @param WooCommerceDatabase $database The WooCommerce database reader.
     */
    public function __construct(WooCommerceDatabase $database)
    {
        parent::__construct($database);

        $this->reader = new SettingsReader($database);
    }

    /**
     * @inheritDoc
     *
     * @since 1.0.0
     */
    public function id()
    {
        return 'settings';
    }

    /**
     * @inheritDoc
     *
     * @since 1.0.0
     */
    public function label()
    {
        return __('Settings', 'kirki-ecommerce');
    }

    /**
     * @inheritDoc
     *
     * @since 1.0.0
     */
    public function description()
    {
        return __('Units, product, checkout, store, email and price options, tax rates and shipping zones.', 'kirki-ecommerce');
    }

    /**
     * @inheritDoc
     *
     * @since 1.0.0
     */
    public function count()
    {
        return 1 + $this->database->count_tax_rates() + $this->database->count_shipping_zones() + ($this->database->has_rest_of_world_methods() ? 1 : 0);
    }

    /**
     * @inheritDoc
     *
     * @since 1.0.0
     */
    protected function entity()
    {
        return 'setting';
    }

    /**
     * @inheritDoc
     *
     * @since 1.0.0
     */
    protected function fetch(int $cursor, int $limit)
    {
        return $this->reader->items($cursor, $limit);
    }

    /**
     * @inheritDoc
     *
     * @since 1.0.0
     */
    protected function map(array $row, RecordLedger $ledger)
    {
        return $row;
    }

    /**
     * Apply one settings item.
     *
     * @since 1.0.0
     *
     * @inheritDoc
     */
    protected function persist($mapped, array $row, RecordLedger $ledger)
    {
        switch ($mapped['kind']) {
            case 'tax_rate':
                return $this->save_tax_rate($mapped);
            case 'shipping_zone':
                return $this->save_shipping_zone($mapped);
        }

        $this->save_store($mapped);
        $this->save_general($mapped);
        $this->save_checkout_fields($mapped);
        $this->save_price_format($mapped);
        $this->save_emails($mapped);
        $this->clear_lists();

        return SettingsReader::STORE;
    }

    /**
     * Set the product and checkout options that Kirki has a matching setting for.
     *
     * @since 1.0.0
     *
     * @param array<string, mixed> $store The store settings item.
     * @return void
     */
    protected function save_store(array $store)
    {
        $this->save_unit('weight_unit', $store['weight_unit'], static::WEIGHT_UNITS, __('weight unit', 'kirki-ecommerce'));
        $this->save_unit('dimension_unit', $store['dimension_unit'], static::DIMENSION_UNITS, __('dimension unit', 'kirki-ecommerce'));
        $this->save_option(OptionKeys::PRODUCT_SETTINGS, 'is_enabled_reviews', $store['reviews']);
        $this->save_option(OptionKeys::PRODUCT_SETTINGS, 'is_enabled_star_ratings', $store['ratings']);
        $this->save_option(OptionKeys::PRODUCT_SETTINGS, 'low_stock_threshold', $store['low_stock_amount']);
        $this->save_option(OptionKeys::CHECKOUT_SETTINGS, 'is_allowed_guest_checkout', $store['guest_checkout']);
        $this->save_option(OptionKeys::CHECKOUT_SETTINGS, 'has_apply_coupon_code', $store['coupons']);

        $this->save_option(OptionKeys::TAX_SETTINGS, 'is_enabled_display_inclusive_taxed_price', $store['tax_display_shop'] === null ? null : $store['tax_display_shop'] === 'incl');

        if ($store['signup_at_checkout']) {
            $this->note(__('WooCommerce lets customers create an account at checkout. Kirki has no matching setting, so it was not migrated.', 'kirki-ecommerce'));
        }
    }

    /**
     * Set the store email and the selling countries.
     *
     * @since 1.0.0
     *
     * @param array<string, mixed> $store The store settings item.
     * @return void
     */
    protected function save_general(array $store)
    {
        $this->save_option(OptionKeys::GENERAL_SETTINGS, 'store_email', $store['store_email']);

        $types = ['all' => SellingLocationType::ALL_COUNTRIES, 'specific' => SellingLocationType::SELECTED_COUNTRIES, 'all_except' => SellingLocationType::EXCLUDED_COUNTRIES];

        if (!isset($types[$store['selling_mode']])) {
            return;
        }

        $countries = array_values(array_filter($store['selling_countries'], static function ($code) {
            return CountryData::find_index_entry($code) !== null;
        }));

        if (count($countries) < count($store['selling_countries'])) {
            $this->note(__('Some selling countries of WooCommerce are not in Kirki and were left out.', 'kirki-ecommerce'));
        }

        if ($store['selling_mode'] !== 'all' && empty($countries)) {
            return;
        }

        Settings::get(OptionKeys::GENERAL_SETTINGS)->refresh()->set(['selling_location_type' => $types[$store['selling_mode']], 'selling_countries' => $countries], false);
    }

    /**
     * Set whether the phone and company fields are required at checkout.
     *
     * @since 1.0.0
     *
     * @param array<string, mixed> $store The store settings item.
     * @return void
     */
    protected function save_checkout_fields(array $store)
    {
        $settings = Settings::get(OptionKeys::CHECKOUT_SETTINGS)->refresh();
        $configuration = (array) ($settings->to_array()['checkout_configuration'] ?? []);

        foreach (['phone_field' => 'phone_number_validation', 'company_field' => 'company_name_validation'] as $source => $field) {
            if (in_array($store[$source], ['required', 'optional'], true)) {
                $configuration[$field] = $store[$source];
            } elseif ($store[$source] !== null) {
                $this->note(sprintf(
                    /* translators: %s: checkout field */
                    __('The checkout field "%s" is hidden in WooCommerce. Kirki cannot hide it, so the Kirki value was kept.', 'kirki-ecommerce'),
                    str_replace('_validation', '', $field)
                ));
            }
        }

        $settings->set(['checkout_configuration' => $configuration], false);
    }

    /**
     * Set the price position and the thousand and decimal separators.
     *
     * @since 1.0.0
     *
     * @param array<string, mixed> $store The store settings item.
     * @return void
     */
    protected function save_price_format(array $store)
    {
        $positions = ['left' => CurrencyPosition::BEFORE, 'left_space' => CurrencyPosition::BEFORE, 'right' => CurrencyPosition::AFTER, 'right_space' => CurrencyPosition::AFTER];
        $separators = ['.' => '.', ',' => ',', ' ' => 'space'];
        $this->save_option(OptionKeys::CURRENCY_SETTINGS, 'currency_position', $positions[$store['price_position']] ?? null);

        foreach (['thousand_separator' => __('thousand separator', 'kirki-ecommerce'), 'decimal_separator' => __('decimal separator', 'kirki-ecommerce')] as $field => $label) {
            if ($store[$field] !== null && !isset($separators[$store[$field]])) {
                $this->note(sprintf(
                    /* translators: %s: option name */
                    __('The %s of WooCommerce is not supported by Kirki eCommerce and was not migrated.', 'kirki-ecommerce'),
                    $label
                ));
            }

            $this->save_option(OptionKeys::CURRENCY_SETTINGS, $field, $separators[$store[$field]] ?? null);
        }
    }

    /**
     * Set which emails are on, and the email footer and colors.
     *
     * @since 1.0.0
     *
     * @param array<string, mixed> $store The store settings item.
     * @return void
     */
    protected function save_emails(array $store)
    {
        if (empty($store['emails']) && $store['email_footer'] === null && empty($store['email_colors'])) {
            return;
        }

        $settings = Settings::get(OptionKeys::EMAIL_SETTINGS)->refresh();
        $data = $settings->to_array();
        $roots = [];

        foreach ($store['emails'] as $path => $enabled) {
            list($root, $group, $key) = explode('.', $path);
            $data[$root][$group][$key]['is_enabled'] = $enabled;
            $roots[$root] = true;
        }

        foreach ($store['email_colors'] as $path => $color) {
            list($section, $name) = explode('.', substr($path, strlen('colors.')));
            $data['default_template']['colors'][$section][$name] = $color;
            $roots['default_template'] = true;
        }

        if ($store['email_footer'] !== null) {
            $data['default_template']['footer'] = wp_kses_post($store['email_footer']);
            $roots['default_template'] = true;
        }

        foreach (array_keys($roots) as $root) {
            $settings->set([$root => $this->without_shortcodes((array) $data[$root])], false);
        }
    }

    /**
     * Remove the shortcode lists that the email settings add when they are read, so that they are not saved.
     *
     * @since 1.0.0
     *
     * @param array<string, mixed> $root One root of the email settings.
     * @return array<string, mixed>
     */
    protected function without_shortcodes(array $root)
    {
        foreach ($root as $group => $emails) {
            if (!is_array($emails)) {
                continue;
            }

            foreach ($emails as $key => $email) {
                if (is_array($email)) {
                    unset($root[$group][$key]['shortcodes']);
                }
            }
        }

        return $root;
    }

    /**
     * Set a weight or dimension unit, after mapping the WooCommerce name to the Kirki name.
     *
     * @since 1.0.0
     *
     * @param string      $field   The product setting name.
     * @param string|null $woo     The WooCommerce unit.
     * @param string[]    $units   The WooCommerce unit names that Kirki supports, keyed to the Kirki name.
     * @param string      $label   The name of the option, for notes.
     * @return void
     */
    protected function save_unit(string $field, $woo, array $units, string $label)
    {
        if ($woo === null) {
            return;
        }

        if (!isset($units[$woo])) {
            $this->note(sprintf(
                /* translators: 1: option name, 2: WooCommerce unit */
                __('The %1$s "%2$s" of WooCommerce is not supported by Kirki and was not migrated.', 'kirki-ecommerce'),
                $label,
                $woo
            ));

            return;
        }

        $this->save_option(OptionKeys::PRODUCT_SETTINGS, $field, $units[$woo]);
    }

    /**
     * Set one Kirki option to the WooCommerce value. A value that WooCommerce does not have changes nothing.
     *
     * @since 1.0.0
     *
     * @param string $group The Kirki settings group.
     * @param string $field The setting name.
     * @param mixed  $value The WooCommerce value, or null when WooCommerce has none.
     * @return void
     */
    protected function save_option(string $group, string $field, $value)
    {
        if ($value === null) {
            return;
        }

        Settings::get($group)->refresh()->set([$field => $value], false);
    }

    /**
     * Clear the preconfigured tax regions and shipping zones when WooCommerce has its own.
     *
     * @since 1.0.0
     *
     * @return void
     */
    protected function clear_lists()
    {
        if ($this->database->count_tax_rates() > 0) {
            Settings::get(OptionKeys::TAX_SETTINGS)->refresh()->set(['tax_regions' => []], false);
        }

        if ($this->database->count_shipping_zones() > 0) {
            Settings::get(OptionKeys::SHIPPING_SETTINGS)->refresh()->set(['shipping_zones' => []], false);
        }
    }

    /**
     * Add one tax rate to the tax regions.
     *
     * @since 1.0.0
     *
     * @param array<string, mixed> $rate The tax rate item.
     * @return int
     */
    protected function save_tax_rate(array $rate)
    {
        $settings = Settings::get(OptionKeys::TAX_SETTINGS)->refresh();
        $result = (new TaxRateMapper())->apply((array) ($settings->to_array()['tax_regions'] ?? []), $rate);

        $settings->set(['tax_regions' => $result['regions']], false);

        if ($result['note'] !== null) {
            $this->note($result['note']);
        }

        return (int) $result['position'];
    }

    /**
     * Add one shipping zone to the shipping zones.
     *
     * @since 1.0.0
     *
     * @param array<string, mixed> $zone The shipping zone item.
     * @return int
     */
    protected function save_shipping_zone(array $zone)
    {
        $settings = Settings::get(OptionKeys::SHIPPING_SETTINGS)->refresh();
        $zones = (array) ($settings->to_array()['shipping_zones'] ?? []);
        $mapped = (new ShippingZoneMapper())->map($zone);

        foreach ($mapped['notes'] as $note) {
            $this->note($note);
        }

        $zones[] = $mapped['zone'];
        $settings->set(['shipping_zones' => $zones], false);

        return count($zones);
    }
}
