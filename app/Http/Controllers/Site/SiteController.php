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
use Kirki\Ecommerce\App\Http\Requests\Site\ShopPageFilterRequest;
use Kirki\Ecommerce\App\Models\Brand;
use Kirki\Ecommerce\App\Models\Category;
use Kirki\Ecommerce\App\Models\Product;
use Kirki\Ecommerce\App\Services\ProductService;
use Kirki\Ecommerce\App\Resources\Product\ProductResource;
use Kirki\Ecommerce\Framework\Http\Request;

use function Kirki\Ecommerce\Framework\app;
use function Kirki\Ecommerce\Framework\view;

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
     * @param Request $request  request.
     * @param ProductService $product_service service.
     *
     * @return string Template path.
     */
    public function shop_page(ShopPageFilterRequest $request, ProductService $product_service)
    {
        $sanitized_input = $request->sanitized();
        $sanitized_params = ProductListFilterDTO::from_array($sanitized_input);

        // $sanitized_params->limit = 1;
        $sanitized_params->page = intval($sanitized_input['current_page'] ?? 1);
        $sanitized_params->sort_order = null;

        $products = $product_service->paginated($sanitized_params);

        $data = [
            'products' => $products,
            'categories' => Category::all(),
            'brands' => Brand::all(),
            'filters' => $sanitized_params,
        ];

        return view('site.shop', $data);
    }

    /**
     * Shop single page
     *
     * @since 1.0.0
     *
     * @param Request $request  request.
     *
     * @return string Template path.
     */
    public function shop_single_page(Request $request)
    {
        $slug = $request->slug ?? '';
        $product = Product::with([
            'brand',
            'currency',
            'categories',
            'tags',
            'collections',
            'attributes',
            'attribute_values',
            'variants.attribute_values',
            'variants.product',
            'media'
        ])->where('slug', $slug)->first();
        $resource = ProductResource::make($product);
        return view('site.shop.single', $resource);
    }

    /**
     * Cart page
     *
     * @since 1.0.0
     *
     * @param Request $request  request.
     *
     * @return string Template path.
     */
    public function cart_page(Request $request)
    {
        return view('site.cart');
    }

    /**
     * Checkout page
     *
     * @since 1.0.0
     *
     * @param Request $request  request.
     *
     * @return string Template path.
     */
    public function checkout_page(Request $request)
    {
        return view('site.checkout');
    }

    /**
     * Account page
     *
     * @since 1.0.0
     *
     * @param Request $request  request.
     *
     * @return string Template path.
     */
    public function account_page(Request $request)
    {
        return view('site.account');
    }
}
