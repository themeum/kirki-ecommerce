<?php

namespace Kirki\Ecommerce\App\Services;

defined('ABSPATH') || exit;

use Kirki\Ecommerce\App\Facades\Money;
use Kirki\Ecommerce\App\Supports\CountryData;

use function Kirki\Ecommerce\Framework\include_view;

/**
 * Renders the storefront currency switcher for the active currencies.
 *
 * @since 1.0.0
 */
class CurrencySwitcherService
{
    /** @var CurrencyService */
    protected $currency_service;

    /**
     * Loaded countries data, null until first needed.
     *
     * @var array|null
     */
    protected $countries = null;

    /**
     * Cache for currency code to flag mapping.
     *
     * @var array<string, string>
     */
    protected $currency_flags = [];

    /**
     * Set up the switcher with the currency service.
     *
     * @since 1.0.0
     *
     * @param CurrencyService $currency_service Source of the active currencies.
     */
    public function __construct(CurrencyService $currency_service)
    {
        $this->currency_service = $currency_service;
    }

    /**
     * Render the currency switcher markup.
     *
     * @since 1.0.0
     *
     * @param array<string, mixed> $attributes Display attributes, such as class and align.
     * @return string The switcher HTML, or an empty string when at most one currency is active.
     */
    public function get_currency_switcher_html($attributes)
    {
        $attributes = wp_parse_args(
            $attributes,
            [
                'class' => '',
                'align' => 'auto',
            ]
        );

        $currencies = $this->currency_service->get_active_currencies();

        if ($currencies->count() <= 1) {
            return '';
        }

        $current_code     = Money::resolve_display_currency();
        $current_currency = null;

        foreach ($currencies as $currency) {
            if (strtoupper($currency->code) === strtoupper($current_code)) {
                $current_currency = $currency;
                break;
            }
        }

        if (! $current_currency) {
            $current_currency = $currencies[0] ?? null;
        }

        $current_code   = $current_currency ? $current_currency->code : $current_code;
        $current_symbol = $current_currency ? $current_currency->symbol : '$';
        $current_flag   = $this->get_currency_flag($current_code);

        ob_start();

        // Build items JSON for the dropdown component
        $items = [];
        foreach ($currencies as $currency) {
            $items[] = [
                'value'    => $currency->code,
                'code'     => $currency->code,
                'symbol'   => $currency->symbol ?? '',
                'label'    => ! empty($currency->name) ? $currency->name : $currency->code,
                'sublabel' => '(' . $currency->code . ' ' . $currency->symbol . ')',
                'flag'     => $this->get_currency_flag($currency->code),
            ];
        }

        $items_json    = wp_json_encode($items);
        $selected_json = wp_json_encode($current_code);

        include_view(
            'site.shortcodes.currency-switcher',
            [
                'items_json'     => $items_json,
                'selected_json'  => $selected_json,
                'attributes'     => $attributes,
                'current_code'   => $current_code,
                'current_symbol' => $current_symbol,
                'current_flag'   => $current_flag,
            ]
        );

        return ob_get_clean();
    }

    /**
     * Get the flag emoji for a currency code.
     *
     * @since 1.0.0
     *
     * @param string $currency_code Currency code.
     * @return string Flag emoji, or an empty string when none matches.
     */
    protected function get_currency_flag(string $currency_code): string
    {
        $code = strtoupper($currency_code);

        if (isset($this->currency_flags[$code])) {
            return $this->currency_flags[$code];
        }

        if ($code === 'EUR') {
            return $this->currency_flags[$code] = '🇪🇺';
        }

        if ($this->countries === null) {
            $this->countries = CountryData::index();
        }

        $alpha2 = substr($code, 0, 2);

        // Match country code directly if it uses this currency (e.g. US -> USD, GB -> GBP, CA -> CAD)
        foreach ($this->countries as $country) {
            if (
                isset($country['code'], $country['currency'])
                && strtoupper($country['code']) === $alpha2
                && strtoupper($country['currency']) === $code
            ) {
                return $this->currency_flags[$code] = $country['flag'] ?? '';
            }
        }

        // Match country code directly (e.g. US)
        foreach ($this->countries as $country) {
            if (isset($country['code']) && strtoupper($country['code']) === $alpha2) {
                return $this->currency_flags[$code] = $country['flag'] ?? '';
            }
        }

        // Fallback: match any country using this currency
        foreach ($this->countries as $country) {
            if (isset($country['currency']) && strtoupper($country['currency']) === $code) {
                return $this->currency_flags[$code] = $country['flag'] ?? '';
            }
        }

        return $this->currency_flags[$code] = '';
    }
}
