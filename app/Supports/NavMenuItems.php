<?php

namespace Kirki\Ecommerce\App\Supports;

defined('ABSPATH') || exit;

/**
 * Describes the storefront shortcodes that can be added to a navigation menu as custom links.
 *
 * @since 1.0.0
 */
class NavMenuItems
{
    /**
     * Get the menu items, each with a label, link, CSS class and the shortcode it renders.
     *
     * @since 1.0.0
     *
     * @return array<int, array<string, string>>
     */
    public static function get_items()
    {
        return [
            [
                'label'     => __('Currency Switcher', 'kirki-ecommerce'),
                'url'       => '#kecom-currency-switcher',
                'class'     => 'kecom-currency-switcher-menu-item',
                'shortcode' => '[kecom_currency_switcher]',
            ],
            [
                'label'     => __('Mini Cart', 'kirki-ecommerce'),
                'url'       => '#kecom-mini-cart',
                'class'     => 'kecom-mini-cart-menu-item',
                'shortcode' => '[kecom_mini_cart]',
            ],
        ];
    }

    /**
     * Get the shortcode a menu link renders in place of its normal output.
     *
     * @since 1.0.0
     *
     * @param string $url The menu item link.
     * @return string The shortcode, or an empty string when the link is not one of the items.
     */
    public static function get_shortcode_for_url(string $url)
    {
        foreach (static::get_items() as $item) {
            if ($item['url'] === $url) {
                return $item['shortcode'];
            }
        }

        return '';
    }
}
