<?php

/**
 * Manage the authenticated customer's own address book.
 *
 * @package Kirki\Ecommerce\App\Http\Controllers\Api\Site
 * @author Themeum <support@themeum.com>
 * @link https://themeum.com
 * @since 1.0.0
 */

namespace Kirki\Ecommerce\App\Http\Controllers\Api\Site;

use Kirki\Ecommerce\App\Actions\Account\CreateAccountAddressAction;
use Kirki\Ecommerce\App\DTO\Address\CreateAddressDTO;
use Kirki\Ecommerce\App\DTO\Address\UpdateAddressDTO;
use Kirki\Ecommerce\App\Http\Requests\Account\AddressCreateRequest;
use Kirki\Ecommerce\App\Http\Requests\Account\AddressUpdateRequest;
use Kirki\Ecommerce\App\Http\Requests\Account\SetDefaultAddressRequest;
use Kirki\Ecommerce\App\Models\Customer;
use Kirki\Ecommerce\App\Resources\Address\AddressResource;
use Kirki\Ecommerce\App\Services\AddressService;
use Kirki\Ecommerce\App\Services\CustomerService;
use Kirki\Ecommerce\Framework\Exceptions\NotFoundException;
use Kirki\Ecommerce\Framework\Http\Request;
use Kirki\Ecommerce\Framework\Http\Response;

use function Kirki\Ecommerce\Framework\response;
use function Kirki\Ecommerce\Framework\user;

/**
 * Class AddressController
 *
 * @since 1.0.0
 */
class AddressController
{
    protected $address_service;
    protected $customer_service;

    public function __construct(AddressService $address_service, CustomerService $customer_service)
    {
        $this->address_service = $address_service;
        $this->customer_service = $customer_service;
    }

    /**
     * List the authenticated customer's addresses.
     *
     * @param Request $request Request.
     *
     * @return Response response.
     */
    public function index(Request $request)
    {
        $customer = $this->customer_service->find_by_user_id(user()->get_id());
        $addresses = empty($customer) ? [] : $this->address_service->all_for_customer($customer->id);

        return response()->json([
            'data' => AddressResource::collection($addresses),
            'message' => __('Addresses retrieved successfully.', 'kirki-ecommerce'),
        ]);
    }

    /**
     * Show a single address belonging to the authenticated customer.
     *
     * @param Request $request Request.
     *
     * @return Response response.
     */
    public function show(Request $request)
    {
        $customer = $this->resolve_customer_or_fail();
        $address = $this->address_service->find_for_customer($request->int('id'), $customer->id);

        return response()->json([
            'data' => AddressResource::make($address),
            'message' => __('Address retrieved successfully.', 'kirki-ecommerce'),
        ]);
    }

    /**
     * Create a new address for the authenticated customer.
     *
     * @param AddressCreateRequest $request Request.
     * @param CreateAccountAddressAction $action Action.
     *
     * @return Response response.
     */
    public function store(AddressCreateRequest $request, CreateAccountAddressAction $action)
    {
        $payload = CreateAddressDTO::from_request($request);

        $address = $action->execute($payload, user()->get_id());

        return response()->json([
            'data' => AddressResource::make($address),
            'message' => __('Address created successfully.', 'kirki-ecommerce'),
        ], Response::CREATED);
    }

    /**
     * Update an address belonging to the authenticated customer.
     *
     * @param AddressUpdateRequest $request Request.
     *
     * @return Response response.
     */
    public function update(AddressUpdateRequest $request)
    {
        $customer = $this->resolve_customer_or_fail();

        $this->address_service->find_for_customer($request->int('id'), $customer->id);

        $payload = UpdateAddressDTO::from_request($request);
        $payload->id = $request->int('id');
        $payload->customer_id = $customer->id;

        $address = $this->address_service->update($payload);

        return response()->json([
            'data' => AddressResource::make($address),
            'message' => __('Address updated successfully.', 'kirki-ecommerce'),
        ]);
    }

    /**
     * Delete an address belonging to the authenticated customer.
     *
     * @param Request $request Request.
     *
     * @return Response response.
     */
    public function destroy(Request $request)
    {
        $customer = $this->resolve_customer_or_fail();

        $this->address_service->find_for_customer($request->int('id'), $customer->id);
        $this->address_service->delete($request->int('id'));

        return response()->json([
            'data' => true,
            'message' => __('Address deleted successfully.', 'kirki-ecommerce'),
        ]);
    }

    /**
     * Mark an address as the authenticated customer's default address for
     * one purpose (shipping or billing).
     *
     * @param SetDefaultAddressRequest $request Request.
     *
     * @return Response response.
     */
    public function set_default(SetDefaultAddressRequest $request)
    {
        $customer = $this->resolve_customer_or_fail();

        $this->address_service->find_for_customer($request->int('id'), $customer->id);

        $address = $this->address_service->set_default(
            $request->int('id'),
            $request->string('purpose')
        );

        return response()->json([
            'data' => AddressResource::make($address),
            'message' => __('Default address updated successfully.', 'kirki-ecommerce'),
        ]);
    }

    /**
     * Resolve the authenticated user's Customer record, or fail as not
     * found - account address endpoints never create a Customer implicitly
     * except when creating the first address (see CreateAccountAddressAction).
     *
     * @return Customer
     * @throws NotFoundException
     */
    protected function resolve_customer_or_fail()
    {
        $customer = $this->customer_service->find_by_user_id(user()->get_id());

        if (empty($customer)) {
            throw new NotFoundException(__('Address not found.', 'kirki-ecommerce'), Response::NOT_FOUND);
        }

        return $customer;
    }
}
