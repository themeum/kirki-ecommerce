<?php

/**
 * Register all shortcode.
 *
 * @package Kirki\Ecommerce\App\Shortcodes
 * @author Themeum <support@themeum.com>
 * @link https://themeum.com
 * @since 1.0.0
 */

namespace Kirki\Ecommerce\App\Shortcodes;

defined('ABSPATH') || exit;

use Kirki\Ecommerce\App\Shortcodes\MiniCartShortcode;
use function Kirki\Ecommerce\Framework\app;

/**
 * Registers the plugin's shortcodes by resolving each shortcode class from the container.
 *
 * @since 1.0.0
 */
class ShortcodeRegister
{
    /**
     * Fully qualified class names of the shortcodes to register.
     *
     * @var array<int, string>
     */
    protected $shortcodes;

    /**
     * Set the shortcode class list and register the shortcodes.
     *
     * @since 1.0.0
     */
    public function __construct()
    {
        $this->shortcodes = [
            MiniCartShortcode::class,
            CurrencySwitcherShortcode::class,
        ];

        $this->register();
    }

    /**
     * Get the class names of the shortcodes to register.
     *
     * @since 1.0.0
     *
     * @return array<int, string> Fully qualified shortcode class names.
     */
    public function get_shortcodes(): array
    {
        return $this->shortcodes;
    }

    /**
     * Register all shortcodes by instantiating each shortcode class through the container.
     *
     * @since 1.0.0
     *
     * @return void
     */
    public function register()
    {
        foreach ($this->get_shortcodes() as $shortcode) {
            app()->make($shortcode);
        }
    }
}
