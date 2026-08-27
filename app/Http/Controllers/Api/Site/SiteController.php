<?php

/**
 * Site Controller for API Endpoints
 *
 * @package Kirki\Ecommerce\App\Http\Controllers\Api\Site
 * @author Themeum <support@themeum.com>
 * @link https://themeum.com
 * @since 1.0.0
 */

namespace Kirki\Ecommerce\App\Http\Controllers\Api\Site;

use Kirki\Ecommerce\App\Http\Requests\Site\ShopPageFilterRequest;
use Kirki\Ecommerce\App\Services\ProductService;
use Kirki\Ecommerce\App\Supports\Template;
use Kirki\Ecommerce\Framework\Http\Response;

use function Kirki\Ecommerce\Framework\include_view;
use function Kirki\Ecommerce\Framework\response;

/**
 * Class SiteController
 *
 * @since 1.0.0
 */
class SiteController
{
    /**
     * Get products as HTML or JSON for shop list.
     *
     * @since 1.0.0
     *
     * @param ShopPageFilterRequest $request request.
     * @param ProductService $product_service service.
     *
     * @return Response JSON response.
     */
    public function products(ShopPageFilterRequest $request, ProductService $product_service)
    {
        $format = $request->string('format', 'json');
        $sanitized_input = $request->sanitized();

        $data = $product_service->shop_page_data($sanitized_input);
        $products = $data['products']->items();
        $filters = $data['filters'];

        if ($format === 'html') {
            ob_start();
            include_view('site.shop.parts.list', ['products' => $products]);
            $products_html = ob_get_clean();

            ob_start();
            Template::render_pagination($data['products']);
            $pagination_html = ob_get_clean();

            $data = [
                'products' => $products_html,
                'pagination' => $pagination_html,
                'filters' => $filters,
            ];
        } else {
            $pagination = $data['products'];
            $pagination = $pagination->to_array();
            unset($pagination['results']);

            $data = [
                'products' => $products,
                'pagination' => $pagination,
                'filters' => $filters,
            ];
        }

        return response()->json([
            'data' => $data,
            'message' => __('Product retrieved successfully.', 'kirki-ecommerce'),
        ]);
    }
}
