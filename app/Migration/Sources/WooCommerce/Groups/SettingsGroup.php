<?php

namespace Kirki\Ecommerce\App\Migration\Sources\WooCommerce\Groups;

defined('ABSPATH') || exit;

use Kirki\Ecommerce\App\Constants\OptionKeys;
use Kirki\Ecommerce\App\Migration\Core\RecordLedger;
use Kirki\Ecommerce\App\Migration\Sources\WooCommerce\Mappers\ShippingZoneMapper;
use Kirki\Ecommerce\App\Migration\Sources\WooCommerce\Mappers\TaxRateMapper;
use Kirki\Ecommerce\App\Migration\Sources\WooCommerce\Readers\SettingsReader;
use Kirki\Ecommerce\App\Migration\Sources\WooCommerce\WooCommerceDatabase;
use Kirki\Ecommerce\App\Models\Currency;
use Kirki\Ecommerce\App\Models\Order;
use Kirki\Ecommerce\App\Models\Product;
use Kirki\Ecommerce\App\Services\CurrencyService;
use Kirki\Ecommerce\App\Supports\Facades\Settings;

use function Kirki\Ecommerce\Framework\app;

/**
 * Migrates the WooCommerce store settings, tax rates and shipping zones.
 *
 * It runs before the groups that hold prices, because prices are converted in the store currency.
 * It never replaces a setting the merchant has already filled in: empty Kirki settings are filled,
 * and a setting that differs is kept and reported. Payment gateway credentials are not read.
 *
 * @since 1.0.0
 */
class SettingsGroup extends WooCommerceGroup
{
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
        return __('Store currency, store address, tax rates and shipping zones.', 'kirki-ecommerce');
    }

    /**
     * @inheritDoc
     *
     * @since 1.0.0
     */
    public function count()
    {
        return 1 + $this->database->count_tax_rates() + $this->database->count_shipping_zones();
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

        $this->previous_value = $this->snapshot();
        $this->save_store($mapped);

        return SettingsReader::STORE;
    }

    /**
     * Fill the currency, the store address and the tax switches that Kirki has not set yet.
     *
     * @since 1.0.0
     *
     * @param array<string, mixed> $store The store settings item.
     * @return void
     */
    protected function save_store(array $store)
    {
        $this->save_currency($store['currency']);
        $this->save_address($store);
        $this->save_tax_switches($store);
    }

    /**
     * Use the WooCommerce currency as the store currency, when no product or order depends on the current one.
     *
     * @since 1.0.0
     *
     * @param string $code The WooCommerce currency code.
     * @return void
     */
    protected function save_currency(string $code)
    {
        if ($code === '') {
            return;
        }

        $service = app(CurrencyService::class);
        $current = Currency::base()->first();

        if ($current && strtoupper($current->code) === $code) {
            return;
        }

        if ($current && (Product::query()->count() > 0 || Order::query()->count() > 0)) {
            $this->note(sprintf(
                /* translators: 1: WooCommerce currency, 2: Kirki currency */
                __('The store currency stays %2$s, because Kirki already has products or orders. WooCommerce uses %1$s, so prices are saved as numbers without exchange.', 'kirki-ecommerce'),
                $code,
                $current->code
            ));

            return;
        }

        $service->ensure_base($code);

        $this->note(sprintf(
            /* translators: 1: Kirki currency, 2: WooCommerce currency */
            __('The store currency was changed from %1$s to %2$s to match WooCommerce.', 'kirki-ecommerce'),
            $current ? $current->code : '-',
            $code
        ));
    }

    /**
     * Fill the empty parts of the store address. The state is not migrated, because Kirki names states by its own ids.
     *
     * @since 1.0.0
     *
     * @param array<string, mixed> $store The store settings item.
     * @return void
     */
    protected function save_address(array $store)
    {
        $settings = Settings::get(OptionKeys::GENERAL_SETTINGS)->refresh();
        $address = (array) ($settings->to_array()['store_address'] ?? []);
        $changed = false;

        foreach (['address_line_1', 'address_line_2', 'city', 'postal_code', 'country'] as $field) {
            if (empty($address[$field]) && $store[$field] !== '') {
                $address[$field] = $store[$field];
                $changed = true;
            } elseif (!empty($address[$field]) && $store[$field] !== '' && strtolower((string) $address[$field]) !== strtolower($store[$field])) {
                $this->note(sprintf(
                    /* translators: %s: address field */
                    __('The store address field "%s" is already set in Kirki and was kept.', 'kirki-ecommerce'),
                    $field
                ));
            }
        }

        if (!empty($store['has_state'])) {
            $this->note(__('The state of the store address was not migrated, because Kirki names states by its own ids.', 'kirki-ecommerce'));
        }

        if ($changed) {
            $settings->set(['store_address' => $address], false);
        }
    }

    /**
     * Turn tax calculation on when WooCommerce uses it and Kirki does not, together with its price mode.
     *
     * @since 1.0.0
     *
     * @param array<string, mixed> $store The store settings item.
     * @return void
     */
    protected function save_tax_switches(array $store)
    {
        if (!$store['calc_taxes']) {
            return;
        }

        $general = Settings::get(OptionKeys::GENERAL_SETTINGS)->refresh();
        $tax = Settings::get(OptionKeys::TAX_SETTINGS)->refresh();

        if (empty($general->to_array()['is_tax_calculation_enabled'])) {
            $general->set(['is_tax_calculation_enabled' => true], false);
            $tax->set(['is_tax_inclusive_price' => (bool) $store['prices_include_tax']], false);
            $this->note(__('Tax calculation was turned on to match WooCommerce.', 'kirki-ecommerce'));

            return;
        }

        if ((bool) ($tax->to_array()['is_tax_inclusive_price'] ?? false) !== (bool) $store['prices_include_tax']) {
            $this->note(__('Kirki and WooCommerce differ on whether prices include tax. The Kirki setting was kept.', 'kirki-ecommerce'));
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

    /**
     * @inheritDoc
     *
     * @since 1.0.0
     */
    public function revert_record(string $entity, int $kirki_ecommerce_id, $previous_value = null)
    {
        if (!is_array($previous_value)) {
            return true;
        }

        Settings::get(OptionKeys::GENERAL_SETTINGS)->refresh()->set($previous_value['general'], false);
        Settings::get(OptionKeys::TAX_SETTINGS)->refresh()->set($previous_value['tax'], false);
        Settings::get(OptionKeys::SHIPPING_SETTINGS)->refresh()->set($previous_value['shipping'], false);
        $this->restore_currency($previous_value['currency']);

        return true;
    }

    /**
     * Read the Kirki settings that this group can change, so that a revert can put them back.
     *
     * @since 1.0.0
     *
     * @return array<string, mixed>
     */
    protected function snapshot()
    {
        $general = Settings::get(OptionKeys::GENERAL_SETTINGS)->refresh()->to_array();
        $tax = Settings::get(OptionKeys::TAX_SETTINGS)->refresh()->to_array();
        $shipping = Settings::get(OptionKeys::SHIPPING_SETTINGS)->refresh()->to_array();
        $currency = Currency::base()->first();

        return [
            'general' => [
                'store_address' => $general['store_address'] ?? [],
                'is_tax_calculation_enabled' => $general['is_tax_calculation_enabled'] ?? false,
            ],
            'tax' => [
                'is_tax_inclusive_price' => $tax['is_tax_inclusive_price'] ?? false,
                'tax_regions' => $tax['tax_regions'] ?? [],
            ],
            'shipping' => ['shipping_zones' => $shipping['shipping_zones'] ?? []],
            'currency' => $currency ? $currency->code : null,
        ];
    }

    /**
     * Put the previous store currency back, when no product or order depends on the current one.
     *
     * @since 1.0.0
     *
     * @param string|null $code The previous currency code.
     * @return void
     */
    protected function restore_currency($code)
    {
        $current = Currency::base()->first();

        if ($code === null || ($current && $current->code === $code)) {
            return;
        }

        if (Product::query()->count() === 0 && Order::query()->count() === 0) {
            app(CurrencyService::class)->ensure_base($code);
        }
    }
}
