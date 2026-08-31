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

use Kirki\Ecommerce\App\Http\Requests\Account\LoginRequest;
use Kirki\Ecommerce\App\Http\Requests\Account\RegistrationRequest;
use Kirki\Ecommerce\App\Http\Requests\Site\ShopPageFilterRequest;
use Kirki\Ecommerce\App\Models\Brand;
use Kirki\Ecommerce\App\Models\Category;
use Kirki\Ecommerce\App\Models\Product;
use Kirki\Ecommerce\App\Payment\Facades\Payment;
use Kirki\Ecommerce\App\Resources\Cart\CartResource;
use Kirki\Ecommerce\App\Resources\Order\OrderResource;
use Kirki\Ecommerce\App\Services\ProductService;
use Kirki\Ecommerce\App\Resources\Product\ProductResource;
use Kirki\Ecommerce\App\Services\CartService;
use Kirki\Ecommerce\App\Services\OrderService;
use Kirki\Ecommerce\App\Supports\Template;
use Kirki\Ecommerce\App\Supports\Url;
use Kirki\Ecommerce\App\Supports\Utils;
use Kirki\Ecommerce\Framework\Http\Request;
use Kirki\Ecommerce\Framework\Http\Response;
use Kirki\Ecommerce\Framework\Route;

use function Kirki\Ecommerce\Framework\include_view;
use function Kirki\Ecommerce\Framework\response;
use function Kirki\Ecommerce\App\customer;
use function Kirki\Ecommerce\Framework\redirect;
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

        ob_start();
        Template::render_pagination($shop_page_data['products']);
        $pagination_html = ob_get_clean();

        $data = [
            'products_html' => $products_html,
            'pagination_html' => $pagination_html,
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

    /**
     * Login page
     *
     * @since 1.0.0
     *
     * @param Request $request  request.
     *
     * @return string Template path.
     */
    public function login_page(Request $request)
    {
        if (is_user_logged_in()) {
            wp_safe_redirect(Url::get_account_url());
            exit;
        }

        return view('site.login')->layout(false);
    }

    /**
     * Registration page
     *
     * @since 1.0.0
     *
     * @param Request $request  request.
     *
     * @return string Template path.
     */
    public function register_page(Request $request)
    {
        if (! Utils::registration_enabled()) {
            wp_die(
                __('Registration is disabled for now. Please contact the administrator for more information.', 'kirki-ecommerce'),
                __('Registration Disabled', 'kirki-ecommerce'),
                [
                    'response' => 403,
                ]
            );
        }

        if (is_user_logged_in()) {
            wp_safe_redirect(Url::get_account_url());
            exit;
        }

        return view('site.register')->layout(false);
    }
    /**
     * Handle login
     *
     * @since 1.0.0
     *
     * @param LoginRequest $request  request.
     *
     * @return string Template path.
     */
    public function handle_login(LoginRequest $request)
    {
        if (is_user_logged_in()) {
            return redirect(Url::get_account_url());
        }

        $redirect_url = $request->input('redirect') ?? '';

        if (!Utils::is_nonce_verified()) {
            return redirect(Url::get_login_url($redirect_url))
                ->with('errors', [__('Invalid nonce', 'kirki-ecommerce')]);
        }

        $sanitized_input = $request->sanitized();

        $creds = [
            'user_login'    => $sanitized_input['email'],
            'user_password' => $sanitized_input['password'],
            'remember'      => $sanitized_input['remember'] ?? false,
        ];

        $user = wp_signon($creds, is_ssl());

        if (is_wp_error($user)) {
            return redirect(Url::get_login_url($redirect_url))
                ->with('errors', [__('Invalid email or password', 'kirki-ecommerce')]);
        }

        if (!empty($redirect_url)) {
            return redirect($redirect_url);
        }

        return redirect(Url::get_account_url());
    }

    /**
     * Handle registration
     *
     * @since 1.0.0
     *
     * @param RegistrationRequest $request  request.
     *
     * @return string Template path.
     */
    public function handle_registration(RegistrationRequest $request)
    {
        if (is_user_logged_in()) {
            return redirect(Url::get_account_url());
        }

        if (!Utils::is_nonce_verified()) {
            return redirect(Route::site_url('register'))
                ->with('errors', [__('Invalid nonce', 'kirki-ecommerce')]);
        }

        $sanitized_input = $request->sanitized();

        $user = wp_insert_user([
            'user_login' => $sanitized_input['email'],
            'user_email' => $sanitized_input['email'],
            'user_pass' => $sanitized_input['password'],
            'first_name' => $sanitized_input['first_name'],
            'last_name' => $sanitized_input['last_name'],
        ]);

        if (is_wp_error($user)) {
            return redirect(Route::site_url('register'))
                ->with('errors', [$user->get_error_message()]);
        }

        return redirect(Url::get_login_url())
            ->with('success', __('Your account has been created successfully. Please Log In.', 'kirki-ecommerce'));
    }
}
