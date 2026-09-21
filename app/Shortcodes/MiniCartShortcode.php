<?php

/**
 * Mini Cart Shortcode
 *
 * @package Kirki\Ecommerce\App\Shortcodes
 * @author Themeum <support@themeum.com>
 * @link https://themeum.com
 * @since 1.0.0
 */

namespace Kirki\Ecommerce\App\Shortcodes;

defined('ABSPATH') || exit;

use Kirki\Ecommerce\App\Services\MiniCartService;

/**
 * Registers the [kecom_mini_cart] shortcode, which renders the mini cart.
 *
 * @since 1.0.0
 */
class MiniCartShortcode
{
    /**
     * Shortcode tag.
     *
     * @var string
     */
    protected $name = 'kecom_mini_cart';

    /**
     * Register the shortcode, rendering its output through the mini cart service.
     *
     * @since 1.0.0
     *
     * @param MiniCartService $service Mini cart service.
     */
    public function __construct(MiniCartService $service)
    {
        add_shortcode($this->name, fn($attributes) => $service->get_mimi_cart_html($attributes));
    }
}
