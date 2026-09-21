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
use Kirki\Ecommerce\App\Resources\Site\Shop\ShopProductResource;
use Kirki\Ecommerce\App\Services\ProductService;
use Kirki\Ecommerce\App\Supports\Template;
use Kirki\Ecommerce\Framework\Http\Response;

use function Kirki\Ecommerce\Framework\include_view;
use function Kirki\Ecommerce\Framework\response;

/**
 * REST controller serving storefront data for the shop page.
 *
 * @since 1.0.0
 */
class SiteController
{
    /**
     * List shop products, with their filters and pagination, as JSON or rendered HTML.
     *
     * With `format=html` the product list and pagination are rendered through the shop views instead of returned as data.
     *
     * @since 1.0.0
     *
     * @param ShopPageFilterRequest $request
     * @param ProductService        $product_service
     * @return \Kirki\Ecommerce\Framework\Http\JsonResponse Items, pagination and available filters.
     */
    public function products(ShopPageFilterRequest $request, ProductService $product_service)
    {
        $format = $request->string('format', 'json');
        $sanitized_input = $request->sanitized();

        $data       = $product_service->shop_page_data($sanitized_input);
        $paginator  = $data['products'];
        $products   = ShopProductResource::collection($paginator->items()->all());
        $filters    = $data['filters'];

        if ($format === 'html') {
            ob_start();
            include_view('site.shop.parts.list', ['products' => $products]);
            $products_html = ob_get_clean();

            ob_start();
            Template::render_pagination($paginator);
            $pagination_html = ob_get_clean();

            $data = [
                'items'   => $products_html,
                'pagination' => $pagination_html,
                'filters'    => $filters,
            ];
        } else {
            $pagination = $paginator->to_array();
            unset($pagination['results']);

            $data = [
                'items'   => $products,
                'pagination' => $pagination,
                'filters'    => $filters,
            ];
        }

        return response()->json([
            'data' => $data,
            'message' => __('Product retrieved successfully.', 'kirki-ecommerce'),
        ]);
    }
}
