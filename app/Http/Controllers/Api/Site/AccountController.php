<?php

/**
 * Manage Customer Account API
 *
 * @package Kirki\Ecommerce\App\Http\Controllers\Api\Site
 * @author Themeum <support@themeum.com>
 * @link https://themeum.com
 * @since 1.0.0
 */

namespace Kirki\Ecommerce\App\Http\Controllers\Api\Site;

use Kirki\Ecommerce\App\Actions\Account\UpdateAccountProfileAction;
use Kirki\Ecommerce\App\DTO\Account\UpdateProfilePayloadDTO;
use Kirki\Ecommerce\App\Http\Requests\Account\PasswordChangeRequest;
use Kirki\Ecommerce\App\Http\Requests\Account\ProfileUpdateRequest;
use Kirki\Ecommerce\App\Resources\Customer\CustomerResource;
use Kirki\Ecommerce\App\Services\UserService;
use Kirki\Ecommerce\App\Services\OrderService;
use Kirki\Ecommerce\Framework\Http\Request;
use Kirki\Ecommerce\Framework\Http\Response;

use function Kirki\Ecommerce\App\customer;
use function Kirki\Ecommerce\Framework\include_view;
use function Kirki\Ecommerce\Framework\response;
use function Kirki\Ecommerce\Framework\user;

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
     * Update profile.
     *
     * @since 1.0.0
     *
     * @param ProfileUpdateRequest $request Request.
     * @param UpdateAccountProfileAction $action Action.
     *
     * @return Response response.
     */
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

    /**
     * Change password.
     *
     * @since 1.0.0
     *
     * @param PasswordChangeRequest $request Request.
     * @param UserService $user_service User service.
     *
     * @return Response response.
     */
    public function change_password(PasswordChangeRequest $request, UserService $user_service)
    {
        $validated = $request->validated();

        $user_service->update_password(user()->get_id(), $validated['current_password'], $validated['new_password']);

        return response()->json([
            'data' => true,
            'message' => __('Password changed successfully.', 'kirki-ecommerce'),
        ]);
    }

    /**
     * Customer orders.
     *
     * @since 1.0.0
     *
     * @param Request $request Request.
     * @param OrderService $order_service Order service.
     *
     * @return Response JSON response.
     */
    public function customer_orders(Request $request, OrderService $order_service)
    {
        $page = $request->int('page', 1);
        $format = $request->string('format', 'json');

        $filters = [
            'page' => $page,
            'limit' => $this->list_limit
        ];

        $order_data = $order_service->get_current_customer_orders($filters);

        if ($format === 'html') {
            ob_start();
            $orders = $order_data['orders']['results'] ?? [];
            foreach ($orders as $order) {
                include_view('site.account.orders.row', ['order' => $order]);
            }

            $order_data['orders']['results'] = ob_get_clean();
        }

        return response()->json([
            'data' => $order_data['orders'],
            'message' => __('Orders fetched successfully', 'kirki-ecommerce')
        ]);
    }

    /**
     * Resend verification email to the current logged-in user.
     *
     * @since 1.0.0
     *
     * @param Request $request Request.
     * @param UserService $user_service User service.
     *
     * @return Response JSON response.
     */
    public function resend_verification_email(Request $request, UserService $user_service)
    {
        $user_id = user()->get_id();

        if (empty($user_id)) {
            return response()->json([
                'message' => __('Unauthorized.', 'kirki-ecommerce'),
            ], Response::UNAUTHORIZED);
        }

        try {
            $user_service->resend_verification_email($user_id);

            return response()->json([
                'data' => true,
                'message' => __('Verification email has been sent to your email address.', 'kirki-ecommerce'),
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'data' => false,
                'message' => $e->getMessage(),
            ], Response::UNPROCESSABLE_ENTITY);
        }
    }
}
