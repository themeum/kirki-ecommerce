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
 * Class MiniCartShortcode
 *
 * @since 1.0.0
 *
 * Usage [kecom_mini_cart]
 */
class MiniCartShortcode
{
    /**
     * Name of shortcode
     *
     * @since 1.0.0
     *
     * @var string
     */
    protected $name = 'kecom_mini_cart';

    /**
     * Constructor
     *
     * @since 1.0.0
     *
     * @param MiniCartService $service service.
     *
     * @return void
     */
    public function __construct(MiniCartService $service)
    {
        add_shortcode($this->name, fn($attributes) => $service->get_mimi_cart_html($attributes));
    }
}
