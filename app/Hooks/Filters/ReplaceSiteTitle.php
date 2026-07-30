<?php

/**
 * Replace site title with seo title
 *
 * @package Kirki\Ecommerce\App\Hooks\Filters
 * @author Themeum <support@themeum.com>
 * @link https://themeum.com
 * @since 1.0.0
 */

namespace Kirki\Ecommerce\App\Hooks\Filters;

use Kirki\Ecommerce\Framework\Route;
use Kirki\Ecommerce\Framework\Wordpress\BaseHook;
use Kirki\Ecommerce\Framework\Wordpress\Constants\HookTypes;

use function Kirki\Ecommerce\Framework\view_data;

class ReplaceSiteTitle extends BaseHook
{
    public function get_name(): string
    {
        //@TODO: need to add this to Hooks constants.
        return 'pre_get_document_title';
    }

    public function get_type(): string
    {
        return HookTypes::FILTER;
    }

    public function handle(...$args)
    {
        $title = $args[0];

        if (! Route::is('shop.single')) {
            return $title;
        }

        $product = view_data();
        if (!count($product)) {
            return $title;
        }

        if (!empty($product['seo_title'])) {
            $title = $product['seo_title'];
        } else {
            if (!empty($product['title'])) {
                $title = $product['title'] . ' - ' . get_bloginfo('name');
            }
        }

        return $title;
    }
}
