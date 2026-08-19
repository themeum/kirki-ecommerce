<?php

namespace Kirki\Ecommerce\App\Http\Controllers\Site;

use Kirki\Ecommerce\App\Actions\Account\UpdateAccountAddressesAction;
use Kirki\Ecommerce\App\Actions\Account\UpdateAccountProfileAction;
use Kirki\Ecommerce\App\DTO\Account\UpdateProfileDTO;
use Kirki\Ecommerce\App\Http\Requests\Account\AddressUpdateRequest;
use Kirki\Ecommerce\App\Http\Requests\Account\PasswordChangeRequest;
use Kirki\Ecommerce\App\Http\Requests\Account\ProfileUpdateRequest;
use Kirki\Ecommerce\App\Resources\Customer\CustomerResource;
use Kirki\Ecommerce\App\Services\UserService;

use function Kirki\Ecommerce\Framework\response;
use function Kirki\Ecommerce\Framework\user;

class AccountController
{
    public function update_profile(ProfileUpdateRequest $request, UpdateAccountProfileAction $action)
    {
        $profile_payload = UpdateProfileDTO::from_array($request->sanitized());
        $customer = $action->execute(user()->get_id(), $profile_payload, $request->display_name);

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
        $customer = $action->execute(
            user()->get_id(),
            $request->type,
            $request->sanitized(),
            $request->is_billing_same_as_shipping ?? false
        );

        return response()->json([
            'data' => CustomerResource::make($customer),
            'message' => __('Address updated successfully.', 'kirki-ecommerce'),
        ]);
    }
}
