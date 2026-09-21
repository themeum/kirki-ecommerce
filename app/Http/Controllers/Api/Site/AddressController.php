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
 * REST controller for the logged-in customer's own address book.
 *
 * @since 1.0.0
 */
class AddressController
{
    /** @var AddressService */
    protected $address_service;
    /** @var CustomerService */
    protected $customer_service;

    /**
     * Create the controller with the address and customer services.
     *
     * @since 1.0.0
     *
     * @param AddressService  $address_service
     * @param CustomerService $customer_service
     */
    public function __construct(AddressService $address_service, CustomerService $customer_service)
    {
        $this->address_service = $address_service;
        $this->customer_service = $customer_service;
    }

    /**
     * List the logged-in customer's addresses.
     *
     * @since 1.0.0
     *
     * @param Request $request
     * @return \Kirki\Ecommerce\Framework\Http\JsonResponse Address collection, empty when the user has no customer record.
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
     * Show a single address belonging to the logged-in customer.
     *
     * @since 1.0.0
     *
     * @param Request $request
     * @return \Kirki\Ecommerce\Framework\Http\JsonResponse The address resource.
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
     * Create a new address for the logged-in customer.
     *
     * @since 1.0.0
     *
     * @param AddressCreateRequest       $request
     * @param CreateAccountAddressAction $action
     * @return \Kirki\Ecommerce\Framework\Http\JsonResponse The created address with a 201 status.
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
     * Update an address belonging to the logged-in customer.
     *
     * @since 1.0.0
     *
     * @param AddressUpdateRequest $request
     * @return \Kirki\Ecommerce\Framework\Http\JsonResponse The updated address.
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
     * Delete an address belonging to the logged-in customer.
     *
     * @since 1.0.0
     *
     * @param Request $request
     * @return \Kirki\Ecommerce\Framework\Http\JsonResponse Success response with `data` set to true.
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
     * Mark an address as the logged-in customer's default address for one purpose (shipping or billing).
     *
     * @since 1.0.0
     *
     * @param SetDefaultAddressRequest $request
     * @return \Kirki\Ecommerce\Framework\Http\JsonResponse The updated address.
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
     * Resolve the logged-in user's Customer record, or fail as not found.
     *
     * Account address endpoints never create a Customer implicitly, except when
     * creating the first address (see CreateAccountAddressAction).
     *
     * @since 1.0.0
     *
     * @return Customer
     * @throws NotFoundException When the user has no customer record.
     */
    protected function resolve_customer_or_fail()
    {
        $customer = $this->customer_service->find_by_user_id(user()->get_id());

        if (empty($customer)) {
            throw new NotFoundException(__('Address not found.', 'kirki-ecommerce'), Response::NOT_FOUND); // phpcs:ignore WordPress.Security.EscapeOutput.ExceptionNotEscaped -- Caught centrally in Route.php; ApiExceptionHandler puts the message into a JSON response (HTML-escaping would corrupt it) and SiteExceptionHandler already calls esc_html() once before wp_die().
        }

        return $customer;
    }
}
