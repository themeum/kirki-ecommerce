<?php

/**
 * Currency Switcher Shortcode
 *
 * @package Kirki\Ecommerce\App\Shortcodes
 * @author Themeum <support@themeum.com>
 * @link https://themeum.com
 * @since 1.0.0
 */

namespace Kirki\Ecommerce\App\Shortcodes;

defined('ABSPATH') || exit;

use Kirki\Ecommerce\App\Services\CurrencySwitcherService;

/**
 * Registers the [kecom_currency_switcher] shortcode, which renders the currency switcher.
 *
 * @since 1.0.0
 */
class CurrencySwitcherShortcode
{
    /**
     * Shortcode tag.
     *
     * @var string
     */
    protected $name = 'kecom_currency_switcher';

    /**
     * Register the shortcode, rendering its output through the currency switcher service.
     *
     * @since 1.0.0
     *
     * @param CurrencySwitcherService $service Currency switcher service.
     */
    public function __construct(CurrencySwitcherService $service)
    {
        add_shortcode($this->name, fn($attributes) => $service->get_currency_switcher_html($attributes));
    }
}
