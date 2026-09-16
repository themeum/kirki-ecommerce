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
 * Class CurrencySwitcherShortcode
 *
 * @since 1.0.0
 *
 * Usage [kecom_currency_switcher]
 */
class CurrencySwitcherShortcode
{
    /**
     * Name of shortcode
     *
     * @since 1.0.0
     *
     * @var string
     */
    protected $name = 'kecom_currency_switcher';

    /**
     * Constructor
     *
     * @since 1.0.0
     *
     * @param CurrencySwitcherService $service service.
     *
     * @return void
     */
    public function __construct(CurrencySwitcherService $service)
    {
        add_shortcode($this->name, fn($attributes) => $service->get_currency_switcher_html($attributes));
    }
}
