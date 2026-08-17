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
 * Shortcode register class
 *
 * @since 1.0.0
 */
class ShortcodeRegister
{
    /**
     * Array of shortcode class names
     *
     * @var array<int, string>
     */
    protected $shortcodes;

    /**
     * Constructor
     *
     * @since 1.0.0
     *
     * @return void
     */
    public function __construct()
    {
        $this->shortcodes = [
            MiniCartShortcode::class,
        ];

        $this->register();
    }

    /**
     * Get all shortcodes.
     *
     * @since 1.0.0
     *
     * @return array<int, string>
     */
    public function get_shortcodes(): array
    {
        return $this->shortcodes;
    }

    /**
     * Register all shortcodes.
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
