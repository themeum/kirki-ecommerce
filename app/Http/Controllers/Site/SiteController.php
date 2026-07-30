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

use Kirki\Ecommerce\App\DTO\Product\ProductListFilterDTO;
use Kirki\Ecommerce\App\Helpers\TemplateHelper;
use Kirki\Ecommerce\App\Models\Brand;
use Kirki\Ecommerce\App\Models\Category;
use Kirki\Ecommerce\App\Services\ProductService;
use Kirki\Ecommerce\App\Wordpress\SiteRoute;
use Kirki\Ecommerce\Framework\Sanitizer;

use function Kirki\Ecommerce\Framework\app;

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

        $rules = [
            'search' => Sanitizer::TEXT,
            'category_ids' => Sanitizer::ARRAY,
            'brand_ids' => Sanitizer::ARRAY,
            'attribute_value_ids' => Sanitizer::ARRAY,
            'min_price' => Sanitizer::INT,
            'max_price' => Sanitizer::INT,
            'sort_by' => Sanitizer::TEXT,
            'current_page' => Sanitizer::INT,
        ];

        $sanitizer = Sanitizer::make($_GET, $rules);
        $sanitized_input = $sanitizer->get_sanitized_data();
        $sanitized_params = ProductListFilterDTO::from_array($sanitized_input);

        // $sanitized_params->limit = 1;
        $sanitized_params->page = intval($sanitized_input['current_page'] ?? 1);
        $sanitized_params->sort_order = null;

        $productService = app(ProductService::class);
        $products = $productService->paginated($sanitized_params);

        $data = (object) [
            'products' => $products,
            'categories' => Category::all(),
            'brands' => Brand::all(),
            'filters' => $sanitized_params,
        ];

        SiteRoute::set_route_data('data', $data);
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

    /**
     * Account page
     *
     * @since 1.0.0
     *
     * @param array $params  Route parameters.
     * @param array $template Template name.
     *
     * @return string Template path.
     */
    public function account_page($params, $template)
    {
        return TemplateHelper::get_template('account');
    }

    /**
     * Design system page
     * 
     * @TODO:: Will be removed later
     *
     * @since 1.0.0
     *
     * @param array $params  Route parameters.
     * @param array $template Template name.
     *
     * @return string Template path.
     */
    public function design_system_page($params, $template)
    {
        return TemplateHelper::get_template('design-system');
    }
}
