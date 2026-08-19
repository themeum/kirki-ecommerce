<?php

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

use function Kirki\Ecommerce\Framework\response;
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
}
