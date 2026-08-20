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

use Kirki\Ecommerce\App\Actions\Account\UpdateAccountAddressesAction;
use Kirki\Ecommerce\App\Actions\Account\UpdateAccountProfileAction;
use Kirki\Ecommerce\App\DTO\Account\UpdateAddressPayloadDTO;
use Kirki\Ecommerce\App\DTO\Account\UpdateProfilePayloadDTO;
use Kirki\Ecommerce\App\Http\Requests\Account\AddressUpdateRequest;
use Kirki\Ecommerce\App\Http\Requests\Account\PasswordChangeRequest;
use Kirki\Ecommerce\App\Http\Requests\Account\ProfileUpdateRequest;
use Kirki\Ecommerce\App\Resources\Customer\CustomerResource;
use Kirki\Ecommerce\App\Services\UserService;
use Kirki\Ecommerce\App\Resources\Order\OrderResource;
use Kirki\Ecommerce\App\Services\OrderService;
use Kirki\Ecommerce\App\Supports\Utils;
use Kirki\Ecommerce\Framework\Http\Request;
use Kirki\Ecommerce\Framework\Http\Response;
use Kirki\Ecommerce\Framework\Route;

use function Kirki\Ecommerce\App\customer;
use function Kirki\Ecommerce\Framework\include_view;
use function Kirki\Ecommerce\Framework\redirect;
use function Kirki\Ecommerce\Framework\response;
use function Kirki\Ecommerce\Framework\view;
use function Kirki\Ecommerce\Framework\user;

class AccountController
{
    public function update_profile(ProfileUpdateRequest $request, UpdateAccountProfileAction $action)
    {
        $profile_payload = UpdateProfilePayloadDTO::from_array($request->sanitized());
        $profile_payload->user_id = user()->get_id();

        $customer = $action->execute($profile_payload);

        return response()->json([
            'data' => CustomerResource::make($customer),
            'message' => __('Profile updated successfully.', 'kirki-ecommerce'),
        ]);
    }

    public function change_password(PasswordChangeRequest $request, UserService $user_service)
    {
        $validated = $request->validated();

        $user_service->update_password(user()->get_id(), $validated['current_password'], $validated['new_password']);

        return response()->json([
            'data' => true,
            'message' => __('Password changed successfully.', 'kirki-ecommerce'),
        ]);
    }

    public function update_addresses(AddressUpdateRequest $request, UpdateAccountAddressesAction $action)
    {
        $address_payload = UpdateAddressPayloadDTO::from_array($request->sanitized());
        $address_payload->user_id = user()->get_id();

        $customer = $action->execute($address_payload);

        return response()->json([
            'data' => CustomerResource::make($customer),
            'message' => __('Address updated successfully.', 'kirki-ecommerce'),
        ]);
    }

      
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
     * @param OrderService $order_service   Order service.
     *
     * @return Response response.
     */
    public function dashboard(Request $request, OrderService $order_service)
    {
        $customer = customer();
        $user = wp_get_current_user();

        $order_data = $order_service->get_current_customer_orders(['limit' => 3]);

        $data = [
            'customer'  => $customer,
            'user'      => $user,
            'orders'    => $order_data['orders'],
        ];

        return view('site.account', $data)->layout(false);
    }

    /**
     * Orders html.
     *
     * @since 1.0.0
     *
     * @param Request $request Request.
     *
     * @return Response JSON response.
     */
    public function orders_html(Request $request, OrderService $order_service)
    {
        $page = $request->int('page', 1);

        $filters = [
            'page' => $page ,
            'limit' => $this->list_limit
        ];

        $order_data = $order_service->get_current_customer_orders($filters);

        ob_start();
        $orders = $order_data['orders']['results'] ?? [];
        foreach ($orders as $order) {
            include_view('site.account.orders.row', ['order' => $order]);
        }

        $order_data['orders']['results'] = ob_get_clean();

        return response()->json([
            'data' => $order_data['orders'],
            'message' => __('Orders fetched successfully', 'kirki-ecommerce')
        ]);
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
    public function order_details(Request $request, OrderService $order_service)
    {

        $order = $order_service->find_order_by_uuid($request->uuid);
        if (!$order) {
            return redirect(Route::site_url('account.orders'));
        }

        $order_resource = $order ? OrderResource::make($order) : null;

        return view('site.account.order-details', ['order' => $order_resource])->layout(false);
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
        $billing_address = $customer ? $customer->get_billing_address() : null;
        $shipping_address = $customer ? $customer->get_shipping_address() : null;
        $countries = Utils::get_countries();

        $data = [
            'customer'         => $customer,
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
