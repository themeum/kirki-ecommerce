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

use Kirki\Ecommerce\App\Constants\Product\ProductStatus;
use Kirki\Ecommerce\App\Http\Requests\Site\ShopPageFilterRequest;
use Kirki\Ecommerce\App\Models\Brand;
use Kirki\Ecommerce\App\Models\Category;
use Kirki\Ecommerce\App\Models\Product;
use Kirki\Ecommerce\App\Payment\Facades\Payment;
use Kirki\Ecommerce\App\Resources\Cart\CartResource;
use Kirki\Ecommerce\App\Resources\Order\OrderResource;
use Kirki\Ecommerce\App\Services\ProductService;
use Kirki\Ecommerce\App\Resources\Product\ProductResource;
use Kirki\Ecommerce\App\Resources\Site\Shop\ShopProductResource;
use Kirki\Ecommerce\Framework\Collections\Collection;
use Kirki\Ecommerce\Framework\Database\Query\Paginator;
use Kirki\Ecommerce\App\Services\CartService;
use Kirki\Ecommerce\App\Services\OrderService;
use Kirki\Ecommerce\App\Supports\Url;
use Kirki\Ecommerce\App\Supports\Utils;
use Kirki\Ecommerce\Framework\Http\Request;

use function Kirki\Ecommerce\App\customer;
use function Kirki\Ecommerce\Framework\view;

/**
 * Class SiteController
 *
 * @since 1.0.0
 */
class SiteController
{
    /** @var ProductService */
    protected $product_service;

    /**
     * Constructor
     *
     * @since 1.0.0
     *
     * @param ProductService $product_service product service.
     */
    public function __construct(ProductService $product_service)
    {
        $this->product_service = $product_service;
    }

    /**
     * Shop page
     *
     * @since 1.0.0
     *
     * @param ShopPageFilterRequest $request request.
     *
     * @return string Template path.
     */
    public function shop_page(ShopPageFilterRequest $request)
    {
        $sanitized_input = $request->sanitized();
        $shop_page_data = $this->product_service->shop_page_data($sanitized_input);

        $raw_paginator = $shop_page_data['products'];
        $resource_items = new Collection(ShopProductResource::collection($raw_paginator->items()->all()));
        $products      = new Paginator(
            $resource_items,
            $raw_paginator->total(),
            $raw_paginator->get_per_page(),
            $raw_paginator->get_current_page()
        );

        $data = [
            'filters'    => $shop_page_data['filters'],
            'products'   => $products,
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
        $slug = $request->string('slug', '');

        $query = Product::with([
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
        ])->where('slug', $slug);

        $has_valid_preview_nonce = $request->bool('preview', false)
            && (
                $request->has('preview_nonce')
                && $this->product_service->verify_product_preview_nonce($slug, $request->string('preview_nonce', ''))
            );

        if (!$has_valid_preview_nonce) {
            $query->where('status', ProductStatus::PUBLISHED);
        }

        $product = $query->first();
        if (! $product) {
            return view('site.shop.not-found')->layout(false);
        }

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
    public function cart_page(Request $request, CartService $cart_service)
    {
        $cart = $cart_service->get_current_cart();
        $calculate_tax = false;
        $cart_resource = CartResource::make($cart, $calculate_tax);

        return view('site.cart', ['cart' => $cart_resource])->layout(false);
    }

    /**
     * Checkout page
     *
     * @since 1.0.0
     *
     * @param Request $request  request.
     * @param CartService $cart_service cart service.
     * @param OrderService $order_service order service.
     *
     * @return string Template path.
     */
    public function checkout_page(
        Request $request,
        CartService $cart_service,
        OrderService $order_service
    ) {
        $status = $request->get('order');

        if (in_array($status, ['success', 'failed'], true)) {
            $order_resource = null;

            if ($uuid = $request->get('uuid')) {
                $order = $order_service->find_order_by_uuid($uuid);
                $order_resource = $order ? OrderResource::make($order) : null;
            }

            if (! $order_resource) {
                wp_safe_redirect(home_url());
                exit;
            }

            return view("site.order-{$status}", [
                'order' => $order_resource,
            ])->layout(false);
        }

        $cart = $cart_service->get_current_cart();

        if (! $cart || empty($cart->items) || $cart->items->is_empty()) {
            wp_safe_redirect(Url::get_cart_url());
            exit;
        }

        $customer = customer();
        $payment_gateways = Payment::get_available_providers();
        $cart = CartResource::make($cart);

        $data = [
            'customer'         => $customer,
            'payment_gateways' => $payment_gateways,
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
