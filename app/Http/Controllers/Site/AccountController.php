<?php

/**
 * Manage Customer Account
 *
 * @package Kirki\Ecommerce\App\Http\Controllers\Site
 * @author Themeum <support@themeum.com>
 * @link https://themeum.com
 * @since 1.0.0
 */

namespace Kirki\Ecommerce\App\Http\Controllers\Site;

use Kirki\Ecommerce\App\DTO\Order\OrderListFilterDTO;
use Kirki\Ecommerce\App\Resources\Order\OrderListResource;
use Kirki\Ecommerce\App\Resources\Order\OrderResource;
use Kirki\Ecommerce\App\Services\OrderService;
use Kirki\Ecommerce\App\Supports\Utils;
use Kirki\Ecommerce\Framework\Http\Request;
use Kirki\Ecommerce\Framework\Http\Response;
use Kirki\Ecommerce\Framework\Route;

use function Kirki\Ecommerce\App\customer;
use function Kirki\Ecommerce\Framework\redirect;
use function Kirki\Ecommerce\Framework\view;

/**
 * Class AccountController
 *
 * @since 1.0.0
 */
class AccountController
{
    /**
     * Account pages.
     *
     * @since 1.0.0
     *
     * @var array
     */
    private $pages = [];

    /**
     * Constructor.
     *
     * @since 1.0.0
     */
    public function __construct()
    {
        $this->pages = Utils::get_account_pages();
    }

    /**
     * Dashboard page.
     *
     * @since 1.0.0
     *
     * @param Request $request Request.
     * @param OrderService $order_service   Order service.
     *
     * @return Response response.
     */
    public function dashboard(Request $request, OrderService $order_service)
    {
        $customer = customer();
        $user = wp_get_current_user();

        $dto = new OrderListFilterDTO();
        $dto->customer_id = $customer->get_customer_id();
        $dto->limit = 3;

        $orders = OrderListResource::paginated($order_service->paginated_orders($dto));

        $data = [
            'customer'  => $customer,
            'user'      => $user,
            'pages'     => $this->pages,
            'orders'    => $orders,
        ];

        return view('site.account', $data)->layout(false);
    }

    /**
     * Orders page.
     *
     * @since 1.0.0
     *
     * @param Request $request Request.
     *
     * @return Response response.
     */
    public function orders(Request $request)
    {
        return view('site.account.orders', ['pages' => $this->pages])->layout(false);
    }

    /**
     * Order details page.
     *
     * @since 1.0.0
     *
     * @param Request $request Request.
     * @param OrderService $order_service order service.
     *
     * @return Response response.
     */
    public function order_details(Request $request, OrderService $order_service)
    {

        $order = $order_service->find_order_by_uuid($request->uuid);
        if (!$order) {
            return redirect(Route::site_url('account.orders'));
        }

        $order_resource = $order ? OrderResource::make($order) : null;

        return view('site.account.order-details', ['pages' => $this->pages, 'order' => $order_resource])->layout(false);
    }

    /**
     * Addresses page.
     *
     * @since 1.0.0
     *
     * @param Request $request Request.
     *
     * @return Response response.
     */
    public function addresses(Request $request)
    {
        $customer = customer();
        $user = wp_get_current_user();
        $billing_address = $customer ? $customer->get_billing_address() : null;
        $shipping_address = $customer ? $customer->get_shipping_address() : null;
        $countries = Utils::get_countries();

        $data = [
            'customer'         => $customer,
            'user'             => $user,
            'billing_address'  => $billing_address,
            'shipping_address' => $shipping_address,
            'countries'        => $countries,
            'pages'            => $this->pages,
        ];

        return view('site.account.addresses', $data)->layout(false);
    }

    /**
     * Account details page.
     *
     * @since 1.0.0
     *
     * @param Request $request Request.
     *
     * @return Response response.
     */
    public function account_details(Request $request)
    {
        $customer = customer();
        $user = wp_get_current_user();

        $data = [
            'customer' => $customer,
            'user'     => $user,
            'pages'    => $this->pages,
        ];

        return view('site.account.account-details', $data)->layout(false);
    }
}
