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

use Kirki\Ecommerce\App\Http\Requests\Site\ShopPageFilterRequest;
use Kirki\Ecommerce\App\Models\Brand;
use Kirki\Ecommerce\App\Models\Category;
use Kirki\Ecommerce\App\Models\Product;
use Kirki\Ecommerce\App\Services\ProductService;
use Kirki\Ecommerce\App\Resources\Product\ProductResource;
use Kirki\Ecommerce\App\Services\CartService;
use Kirki\Ecommerce\App\Services\CustomerService;
use Kirki\Ecommerce\App\Services\PaymentGatewayService;
use Kirki\Ecommerce\App\Supports\Utils;
use Kirki\Ecommerce\Framework\Http\Request;

use function Kirki\Ecommerce\App\customer;
use function Kirki\Ecommerce\Framework\include_view;
use function Kirki\Ecommerce\Framework\response;
use function Kirki\Ecommerce\Framework\view;

/**
 * Class SiteController
 *
 * @since 1.0.0
 */
class SiteController
{
    /**
     * Get products HTML
     *
     * @since 1.0.0
     *
     * @param ShopPageFilterRequest $request request.
     * @param ProductService $product_service service.
     *
     * @return Response JSON response.
     */
    public function products_html(ShopPageFilterRequest $request, ProductService $product_service)
    {
        $sanitized_input = $request->sanitized();
        $shop_page_data = $product_service->shop_page_data($sanitized_input);

        $products = $shop_page_data['products']->items();

        ob_start();
        include_view('site.shop.parts.list', ['products' => $products]);
        $products_html = ob_get_clean();

        $data = [
            'products_html' => $products_html,
            'filters' => $shop_page_data['filters'],
        ];

        return response()->json([
            'data' => $data,
            'message' => __('Product retrieved successfully.', 'kirki-ecommerce'),
        ]);
    }

    /**
     * Shop page
     *
     * @since 1.0.0
     *
     * @param ShopPageFilterRequest $request request.
     * @param ProductService $product_service service.
     *
     * @return string Template path.
     */
    public function shop_page(ShopPageFilterRequest $request, ProductService $product_service)
    {
        $sanitized_input = $request->sanitized();
        $shop_page_data = $product_service->shop_page_data($sanitized_input);

        $data = [
            'filters'    => $shop_page_data['filters'],
            'products'   => $shop_page_data['products'],
            'categories' => Category::all(),
            'brands'     => Brand::all(),
        ];

        return view('site.shop', $data)->layout(false);
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
        return view('site.shop.single', $resource)->layout(false);
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
        return view('site.cart')->layout(false);
    }

    /**
     * Checkout page
     *
     * @since 1.0.0
     *
     * @param Request $request  request.
     * @param PaymentGatewayService $payment_gateway_service  payment gateway service.
     *
     * @return string Template path.
     */
    public function checkout_page(
        Request $request,
        PaymentGatewayService $payment_gateway_service,
        CartService $cart_service
    ) {
        $customer = customer();
        $payment_gateways =  $payment_gateway_service->get();
        $cart = $cart_service->get_cart($customer->get_id());


        $data = [
            'customer'         => $customer,
            'payment_gateways' => $payment_gateways->all(),
            'countries'        => Utils::get_countries(),
            'cart'             => $cart,
        ];

        return view('site.checkout', $data)->layout(false);
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
        return view('site.account')->layout(false);
    }

    /**
     * Design system page
     *
     * @TODO:: Will be removed later
     *
     * @since 1.0.0
     *
     * @param Request $request  request.
     *
     * @return string Template path.
     */
    public function design_system_page(Request $request)
    {
        return view('site.design-system');
    }
}
