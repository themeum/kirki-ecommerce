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

use Kirki\Ecommerce\App\Constants\ConsentLocations;
use Kirki\Ecommerce\App\Constants\Product\ProductStatus;
use Kirki\Ecommerce\App\Http\Requests\Site\ShopPageFilterRequest;
use Kirki\Ecommerce\App\Models\Brand;
use Kirki\Ecommerce\App\Models\Category;
use Kirki\Ecommerce\App\Models\Product;
use Kirki\Ecommerce\App\Payment\Facades\Payment;
use Kirki\Ecommerce\App\Resources\Order\OrderResource;
use Kirki\Ecommerce\App\Resources\Site\Order\OrderResource as SiteOrderResource;
use Kirki\Ecommerce\App\Services\ProductService;
use Kirki\Ecommerce\App\Resources\Product\ProductResource;
use Kirki\Ecommerce\App\Resources\Site\Cart\CartResource as SiteCartResource;
use Kirki\Ecommerce\App\Resources\Site\Order\OrderActivityResource;
use Kirki\Ecommerce\App\Resources\Site\Shop\ShopProductResource;
use Kirki\Ecommerce\App\Services\AddressService;
use Kirki\Ecommerce\Framework\Collections\Collection;
use Kirki\Ecommerce\Framework\Database\Query\Paginator;
use Kirki\Ecommerce\App\Services\CartService;
use Kirki\Ecommerce\App\Services\LegalConsentService;
use Kirki\Ecommerce\App\Services\OrderActivityService;
use Kirki\Ecommerce\App\Services\OrderService;
use Kirki\Ecommerce\App\Supports\Url;
use Kirki\Ecommerce\App\Supports\Utils;
use Kirki\Ecommerce\Framework\Http\Request;

use function Kirki\Ecommerce\App\customer;
use function Kirki\Ecommerce\Framework\app;
use function Kirki\Ecommerce\Framework\redirect;
use function Kirki\Ecommerce\Framework\view;

/**
 * Serves the storefront pages: shop, single product, cart, checkout, account, and order tracking.
 *
 * @since 1.0.0
 */
class SiteController
{
    /** @var ProductService */
    protected $product_service;

    /**
     * Store the product service.
     *
     * @since 1.0.0
     *
     * @param ProductService $product_service Product service.
     */
    public function __construct(ProductService $product_service)
    {
        $this->product_service = $product_service;
    }

    /**
     * Render the shop page with the filtered, paginated product list, categories and brands.
     *
     * @since 1.0.0
     *
     * @param ShopPageFilterRequest $request Validated shop filter request.
     * @return \Kirki\Ecommerce\Framework\View\View Shop view.
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
     * Render a single product page, looked up by the slug route parameter.
     *
     * Only published products are shown, unless the request carries a valid preview nonce.
     * Renders the not-found view when no product matches.
     *
     * @since 1.0.0
     *
     * @param Request $request Current request.
     * @return \Kirki\Ecommerce\Framework\View\View Single product view, or the not-found view.
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
     * Render the cart page for the current cart, without calculating tax.
     *
     * @since 1.0.0
     *
     * @param Request     $request      Current request.
     * @param CartService $cart_service Cart service.
     * @return \Kirki\Ecommerce\Framework\View\View Cart view.
     */
    public function cart_page(Request $request, CartService $cart_service)
    {
        $cart = $cart_service->get_current_cart();
        $calculate_tax = false;
        $cart_resource = SiteCartResource::make($cart, $calculate_tax);

        return view('site.cart', ['cart' => $cart_resource])->layout(false);
    }

    /**
     * Render the checkout page, or the order success or failed page when the order query argument says so.
     *
     * Redirects to the home page and exits when the finished order cannot be found, and to the
     * cart page and exits when the cart is empty.
     *
     * @since 1.0.0
     *
     * @param Request        $request         Current request.
     * @param CartService    $cart_service    Cart service.
     * @param OrderService   $order_service   Order service.
     * @param AddressService $address_service Address service.
     * @return \Kirki\Ecommerce\Framework\View\View Checkout, order success or order failed view.
     */
    public function checkout_page(
        Request $request,
        CartService $cart_service,
        OrderService $order_service,
        AddressService $address_service
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
        $customer_id      = $customer ? $customer->get_customer_id() : null;
        $addresses        = $customer_id ? $address_service->all_for_customer($customer_id) : [];
        $payment_gateways = Payment::get_available_providers();
        $cart = SiteCartResource::make($cart);

        if (!empty($cart['invalid_item_ids'])) {
            wp_safe_redirect(Url::get_cart_url());
            exit;
        }

        $data = [
            'customer'         => $customer,
            'addresses'        => $addresses,
            'payment_gateways' => $payment_gateways,
            'countries'        => Utils::get_countries(),
            'cart'             => $cart,
            'consents'         => app(LegalConsentService::class)->get_renderable(ConsentLocations::CHECKOUT),
        ];

        return view('site.checkout', $data)->layout(false);
    }

    /**
     * Render the account page.
     *
     * @since 1.0.0
     *
     * @param Request $request Current request.
     * @return \Kirki\Ecommerce\Framework\View\View Account view.
     */
    public function account_page(Request $request)
    {
        return view('site.account')->layout(false);
    }

    /**
     * Render the design system page.
     *
     * @TODO:: Will be removed later
     *
     * @since 1.0.0
     *
     * @param Request $request Current request.
     * @return \Kirki\Ecommerce\Framework\View\View Design system view.
     */
    public function design_system_page(Request $request)
    {
        return view('site.design-system');
    }

    /**
     * Render the order tracking page for the order UUID in the request, with its activity timeline.
     *
     * Renders the page with an error message when the UUID is missing or matches no order.
     *
     * @since 1.0.0
     *
     * @param Request              $request               Current request.
     * @param OrderService         $order_service         Order service.
     * @param OrderActivityService $order_activity_service Order activity service.
     * @return \Kirki\Ecommerce\Framework\View\View Order tracking view.
     */
    public function order_tracking_page(Request $request, OrderService $order_service, OrderActivityService $order_activity_service)
    {
        $order_uuid = $request->string('uuid', '');

        if (empty($order_uuid)) {
            return view('site.order-tracking', ['errors' => [__('Invalid order ID or order not found', 'kirki-ecommerce')]])->layout(false);
        }

        $order = $order_service->find_order_by_uuid($order_uuid);
        if (! $order) {
            return view('site.order-tracking', ['errors' => [__('Invalid order ID or order not found', 'kirki-ecommerce')]])->layout(false);
        }

        $order_resource = SiteOrderResource::make($order);

        $activities = $order_activity_service->get_order_activity($order->id);

        $activities_resource = OrderActivityResource::collection($activities);

        return view('site.order-tracking', ['order' => $order_resource, 'activities' => $activities_resource])->layout(false);
    }
}
