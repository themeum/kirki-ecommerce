<?php

/**
 * Add WP Head Meta Data
 *
 * @package Kirki\Ecommerce\App\Hooks\Actions
 * @author Themeum <support@themeum.com>
 * @link https://themeum.com
 * @since 1.0.0
 */

namespace Kirki\Ecommerce\App\Hooks\Actions;

use Kirki\Ecommerce\Framework\Route;
use Kirki\Ecommerce\Framework\Wordpress\BaseHook;
use Kirki\Ecommerce\Framework\Wordpress\Constants\HookTypes;

use function Kirki\Ecommerce\Framework\view_data;

class AddWpHeadMeta extends BaseHook
{
    public function get_name(): string
    {
        // @TODO: need to add this in constants
        return 'wp_head';
    }

    public function get_type(): string
    {
        return HookTypes::ACTION;
    }

    public function get_priority(): int
    {
        return 10;
    }

    public function handle(...$args)
    {
        if (! Route::is('shop.single')) {
            return;
        }

        $product = view_data();

        if (!count($product)) {
            return;
        }

        $seo_tags = $product['seo_keywords'] ?? [];
        $seo_description = $product['seo_description'] ?? '';
        $og_title = $product['og_title'] ?? '';
        $og_description = $product['og_description'] ?? '';
        $og_image = $product['og_image'] ?? '';

        if (!empty($seo_description)) {
            echo '<meta name="description" content="' . esc_attr($seo_description) . '">';
        }

        if (count($seo_tags)) {
            echo '<meta name="keywords" content="' . esc_attr(implode(', ', $seo_tags)) . '">';
        }

        if (!empty($og_title)) {
            echo '<meta property="og:title" content="' . esc_attr($og_title) . '">';
        }

        if (!empty($og_description)) {
            echo '<meta property="og:description" content="' . esc_attr($og_description) . '">';
        }

        if (!empty($og_image)) {
            echo '<meta property="og:image" content="' . esc_attr($og_image) . '">';
        }
    }
}
