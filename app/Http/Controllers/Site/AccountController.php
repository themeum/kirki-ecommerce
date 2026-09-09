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

use Kirki\Ecommerce\App\Resources\Site\Order\OrderActivityResource;
use Kirki\Ecommerce\App\Resources\Site\Order\OrderResource;
use Kirki\Ecommerce\App\Services\AddressService;
use Kirki\Ecommerce\App\Services\OrderActivityService;
use Kirki\Ecommerce\App\Services\OrderService;
use Kirki\Ecommerce\App\Services\UserService;
use Kirki\Ecommerce\App\Supports\Url;
use Kirki\Ecommerce\App\Supports\Utils;
use Kirki\Ecommerce\Framework\Http\Request;
use Kirki\Ecommerce\Framework\Http\Response;
use Kirki\Ecommerce\Framework\Route;

use function Kirki\Ecommerce\App\customer;
use function Kirki\Ecommerce\Framework\app;
use function Kirki\Ecommerce\Framework\redirect;
use function Kirki\Ecommerce\Framework\user;
use function Kirki\Ecommerce\Framework\view;

/**
 * Class AccountController
 *
 * @since 1.0.0
 */
class AccountController
{
    /**
     * Data list limit.
     *
     * @since 1.0.0
     *
     * @var int
     */
    protected $list_limit = 10;

    /**
     * Dashboard page.
     *
     * @since 1.0.0
     *
     * @param Request $request Request.
     * @param OrderService $order_service Order service.
     *
     * @return Response response.
     */
    public function dashboard(Request $request, OrderService $order_service)
    {
        $customer = customer();
        $user = user();
        $order_data = $order_service->get_current_customer_orders(['limit' => 3]);

        $data = [
            'customer'  => $customer,
            'user'      => $user,
            'orders'    => $order_data['orders'],
        ];

        return view('site.account', $data)->layout(false);
    }

    /**
     * Handle email verification.
     *
     * @since 1.0.0
     *
     * @param Request $request Request.
     *
     * @return mixed
     */
    protected function handle_email_verification($request)
    {
        $user_service = app(UserService::class);
        $token = $request->string('token');
        $user = user();

        if (!empty($token) && !empty($user->get_id())) {
            $verified = $user_service->verify_email_token($user->get_id(), $token);
            $flash_type = 'errors';
            $flash_messsage = [__('The email verification link is invalid or has expired.', 'kirki-ecommerce')];

            if ($verified) {
                $flash_type = 'success';
                $flash_messsage = __('Your email address has been verified successfully. Past orders have been linked to your account.', 'kirki-ecommerce');
            }

            return redirect(Url::get_account_url())->with($flash_type, $flash_messsage);
        }
    }

    /**
     * Handle account actions with template redirect hook.
     *
     * @since 1.0.0
     *
     * @param Request $request Request.
     *
     * @return mixed
     */
    public function action(Request $request)
    {
        $action = $request->string('action');

        if ('email_verify' === $action) {
            return $this->handle_email_verification($request);
        }

        return redirect(Url::get_account_url());
    }


    /**
     * Orders page.
     *
     * @since 1.0.0
     *
     * @param Request $request Request.
     * @param OrderService $order_service order service.
     *
     * @return Response response.
     */
    public function orders(Request $request, OrderService $order_service)
    {
        $order_data = $order_service->get_current_customer_orders(['limit' => $this->list_limit]);

        $data = [
            'orders' => $order_data['orders'],
        ];

        return view('site.account.orders', $data)->layout(false);
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
    public function order_details(Request $request, OrderService $order_service, OrderActivityService $order_activity_service)
    {

        $customer_id = customer()->get_customer_id();
        $order = $order_service->find_order_by_uuid($request->uuid);

        if (!$order || empty($customer_id) || $order->customer_id !== $customer_id) {
            wp_safe_redirect(Route::site_url('account.orders'));
            exit;
        }

        $order_resource = OrderResource::make($order);

        $activities = $order_activity_service->get_order_activity($order->id);

        $activities_resource = OrderActivityResource::collection($activities);


        return view('site.account.order-details', ['order' => $order_resource, 'activities' => $activities_resource])->layout(false);
    }

    /**
     * Addresses page.
     *
     * @since 1.0.0
     *
     * @param Request $request Request.
     * @param AddressService $address_service Address service.
     *
     * @return Response response.
     */
    public function addresses(Request $request, AddressService $address_service)
    {
        $customer         = customer();
        $customer_id      = $customer ? $customer->get_customer_id() : null;
        $addresses        = $customer_id ? $address_service->all_for_customer($customer_id) : [];
        $billing_address  = $customer ? $customer->get_billing_address() : null;
        $shipping_address = $customer ? $customer->get_shipping_address() : null;
        $countries        = Utils::get_countries();

        $data = [
            'customer'         => $customer,
            'addresses'        => $addresses,
            'billing_address'  => $billing_address,
            'shipping_address' => $shipping_address,
            'countries'        => $countries,
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
        ];

        return view('site.account.account-details', $data)->layout(false);
    }
}
