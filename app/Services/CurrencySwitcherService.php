<?php

namespace Kirki\Ecommerce\App\Services;

defined('ABSPATH') || exit;

use Kirki\Ecommerce\App\Facades\Money;

use function Kirki\Ecommerce\Framework\include_view;

/**
 * Class CurrencySwitcherService
 *
 * @since 1.0.0
 */
class CurrencySwitcherService
{
    /**
     * @var CurrencyService
     */
    protected $currency_service;

    /**
     * Constructor
     *
     * @since 1.0.0
     *
     * @param CurrencyService $currency_service
     */
    public function __construct(CurrencyService $currency_service)
    {
        $this->currency_service = $currency_service;
    }

    /**
     * Get currency switcher html
     *
     * @since 1.0.0
     *
     * @param array $attributes attributes.
     *
     * @return string currency switcher html.
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

        if (empty($currencies)) {
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

        ob_start();
        ?>
        <?php
        // Build items JSON for the dropdown component
        $items = [];
        foreach ($currencies as $currency) {
            $items[] = [
                'value'    => $currency->code,
                'label'    => ! empty($currency->name) ? $currency->name : $currency->code,
                'sublabel' => '(' . $currency->code . ' ' . $currency->symbol . ')',
            ];
        }
        $items_json    = esc_attr(wp_json_encode($items));
        $selected_json = esc_attr(wp_json_encode($current_code));

        include_view(
            'site.shortcodes.currency-switcher',
            ['item_json' => $items_json, 'selected_json' => $selected_json, 'attributes' => $attributes, 'current_code' => $current_code]
        );

        return ob_get_clean();
    }
}
