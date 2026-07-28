<?php

/**
 * Site Controller
 *
 * @package Kirki\Ecommerce\App\Http\Controllers\Site
 * @author Themeum <support@themeum.com>
 * @link https://themeum.com
 * @since 1.0.0
 */

namespace Kirki\Ecommerce\App\Http\Controllers\Site;

use Kirki\Ecommerce\App\Helpers\TemplateHelper;
use Kirki\Ecommerce\App\Models\Product;
use Kirki\Ecommerce\Wordpress\SiteRoute;

/**
 * Class SiteController
 *
 * @since 1.0.0
 */
class SiteController
{
    /**
     * Shop page
     *
     * @since 1.0.0
     *
     * @param array $params  Route parameters.
     * @param array $template Template name.
     *
     * @return string Template path.
     */
    public function shop_page($params, $template)
    {
        $products = Product::where('status', 'published')->limit(10)->get();
        SiteRoute::set_route_data('products', $products);
        return TemplateHelper::get_template('shop');
    }

    /**
     * Shop single page
     *
     * @since 1.0.0
     *
     * @param array $params  Route parameters.
     * @param array $template Template name.
     *
     * @return string Template path.
     */
    public function shop_single_page($params, $template)
    {
        return TemplateHelper::get_template('shop.single');
    }

    /**
     * Cart page
     *
     * @since 1.0.0
     *
     * @param array $params  Route parameters.
     * @param array $template Template name.
     *
     * @return string Template path.
     */
    public function cart_page($params, $template)
    {
        return TemplateHelper::get_template('cart');
    }

    /**
     * Checkout page
     *
     * @since 1.0.0
     *
     * @param array $params  Route parameters.
     * @param array $template Template name.
     *
     * @return string Template path.
     */
    public function checkout_page($params, $template)
    {
        return TemplateHelper::get_template('checkout');
    }
}
