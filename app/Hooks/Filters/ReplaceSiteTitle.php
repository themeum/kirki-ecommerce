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

use Kirki\Ecommerce\App\Wordpress\SiteRoute;
use Kirki\Ecommerce\Framework\Wordpress\BaseHook;
use Kirki\Ecommerce\Framework\Wordpress\Constants\HookTypes;

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
        $product = SiteRoute::route_data('product', []);

        if (!count($product)) {
            return $args[0];
        }

        $seo_title = $product['seo_title'] ?? '';

        if (!empty($seo_title)) {
            return $seo_title;
        }

        return $args[0];
    }
}
