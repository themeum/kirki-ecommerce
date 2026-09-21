<?php

namespace Kirki\Ecommerce\App\Http\Controllers\Api;

use Kirki\Ecommerce\App\Actions\Customer\CreateCustomerAction;
use Kirki\Ecommerce\App\Actions\Customer\UpdateCustomerAction;
use Kirki\Ecommerce\App\Http\Requests\BulkActionRequest;
use Kirki\Ecommerce\App\Http\Requests\Customer\CustomerCreateRequest;
use Kirki\Ecommerce\App\Http\Requests\Customer\CustomerUpdateRequest;
use Kirki\Ecommerce\App\Resources\Customer\CustomerListResource;
use Kirki\Ecommerce\App\Resources\Customer\CustomerResource;
use Kirki\Ecommerce\App\Constants\BulkActions;
use Kirki\Ecommerce\App\Constants\Pagination;
use Kirki\Ecommerce\Framework\Contracts\Request;
use Kirki\Ecommerce\App\DTO\ListFilterDTO;
use Kirki\Ecommerce\Framework\Database\Query\Paginator;
use Kirki\Ecommerce\Framework\Http\Response;
use Kirki\Ecommerce\App\DTO\Customer\CustomerListFilterDTO;
use Kirki\Ecommerce\App\Http\Requests\Customer\CustomerListRequest;
use Kirki\Ecommerce\App\Services\CustomerService;
use Kirki\Ecommerce\App\Constants\AddressType;
use Kirki\Ecommerce\App\DTO\Address\CreateAddressDTO;
use Kirki\Ecommerce\App\DTO\Address\UpdateAddressDTO;
use Kirki\Ecommerce\App\DTO\Customer\CreateCustomerDTO;
use Kirki\Ecommerce\App\DTO\Customer\UpdateCustomerDTO;

use function Kirki\Ecommerce\Framework\response;

/**
 * REST controller for managing customers.
 *
 * @since 1.0.0
 */
class CustomerController
{
    /** @var CustomerService */
    protected $service;

    /**
     * Create the controller with the customer service.
     *
     * @since 1.0.0
     *
     * @param CustomerService $service
     */
    public function __construct(CustomerService $service)
    {
        $this->service = $service;
    }

    /**
     * List the countries and cities customers ship to, optionally narrowed by the `country` parameter.
     *
     * @since 1.0.0
     *
     * @param Request $request
     * @return \Kirki\Ecommerce\Framework\Http\JsonResponse The locations with a success message.
     */
    public function locations(Request $request)
    {
        $country = $request->get('country');

        return response()->json([
            'data' => $this->service->list_locations(empty($country) ? null : $country),
            'message' => __('Customer locations retrieved successfully.', 'kirki-ecommerce'),
        ]);
    }

    /**
     * List customers, paginated by the request filters.
     *
     * When the requested limit equals Pagination::ALL, every match is returned as a single page.
     *
     * @since 1.0.0
     *
     * @param CustomerListRequest $request
     * @return \Kirki\Ecommerce\Framework\Http\JsonResponse Paginated customers with a success message.
     */
    public function get(CustomerListRequest $request)
    {
        $params = CustomerListFilterDTO::from_array($request->all());

        if ((int) $params->limit === Pagination::ALL) {
            $data = $this->service->all($params);

            return response()->json([
                'data' => CustomerListResource::paginated(new Paginator($data, $data->count(), $data->count(), 1)),
                'message' => __('Customer retrieved successfully.', 'kirki-ecommerce'),
            ]);
        }

        $data = $this->service->paginated($params);

        return response()->json([
            'data' => CustomerListResource::paginated($data),
            'message' => __('Customer retrieved successfully.', 'kirki-ecommerce'),
        ]);
    }

    /**
     * Create a customer, with optional shipping and billing addresses, from the validated request.
     *
     * @since 1.0.0
     *
     * @param CustomerCreateRequest $request
     * @param CreateCustomerAction  $create_customer_action
     * @return \Kirki\Ecommerce\Framework\Http\JsonResponse The created customer with a 201 status.
     */
    public function create(CustomerCreateRequest $request, CreateCustomerAction $create_customer_action)
    {
        $validated = $request->validated();

        $customer_payload = CreateCustomerDTO::from_array($validated);
        $customer_payload->addresses = $this->prepare_customer_addresses($validated);

        $customer = $create_customer_action->execute($customer_payload);

        return response()->json([
            'data' => CustomerResource::make($customer),
            'message' => __('Customer created', 'kirki-ecommerce'),
        ], Response::CREATED);
    }

    /**
     * Build the customer's initial addresses from the optional shipping and billing request blocks.
     *
     * Either block may be omitted. Each provided block becomes a home address flagged as the default for its kind.
     *
     * @since 1.0.0
     *
     * @param array<string, mixed> $validated Validated create request data.
     * @return CreateAddressDTO[]
     */
    protected function prepare_customer_addresses(array $validated)
    {
        $addresses = [];

        if (!empty($validated['shipping_address'])) {
            $shipping_address = CreateAddressDTO::from_array($validated['shipping_address']);
            $shipping_address->type = AddressType::HOME;
            $shipping_address->is_default_shipping = true;

            $addresses[] = $shipping_address;
        }

        if (!empty($validated['billing_address'])) {
            $billing_address = CreateAddressDTO::from_array($validated['billing_address']);
            $billing_address->type = AddressType::HOME;
            $billing_address->is_default_billing = true;

            $addresses[] = $billing_address;
        }

        return $addresses;
    }

    /**
     * Return a single customer by the route ID.
     *
     * @since 1.0.0
     *
     * @param Request $request
     * @return \Kirki\Ecommerce\Framework\Http\JsonResponse The customer resource.
     */
    public function show(Request $request)
    {
        $customer = $this->service->find($request->int('id'));

        return response()->json([
            'data' => CustomerResource::make($customer),
            'message' => __('Customer retrieved successfully.', 'kirki-ecommerce'),
        ]);
    }

    /**
     * Update a customer and their default shipping and billing addresses from the validated request.
     *
     * @since 1.0.0
     *
     * @param CustomerUpdateRequest $request
     * @param UpdateCustomerAction  $update_customer_action
     * @return \Kirki\Ecommerce\Framework\Http\JsonResponse The updated customer.
     */
    public function update(CustomerUpdateRequest $request, UpdateCustomerAction $update_customer_action)
    {
        $validated = $request->validated();

        $customer_payload = UpdateCustomerDTO::from_array($validated);
        $shipping_address_payload = UpdateAddressDTO::from_array($validated['shipping_address'] ?? []);
        $billing_address_payload = UpdateAddressDTO::from_array($validated['billing_address'] ?? []);

        $customer = $update_customer_action->execute($customer_payload, $shipping_address_payload, $billing_address_payload);

        return response()->json([
            'data' => CustomerResource::make($customer),
            'message' => __('Customer updated', 'kirki-ecommerce'),
        ]);
    }

    /**
     * Delete a single customer by the route ID.
     *
     * @since 1.0.0
     *
     * @param Request $request
     * @return \Kirki\Ecommerce\Framework\Http\JsonResponse Success response carrying the deletion result.
     */
    public function delete(Request $request)
    {
        $result = $this->service->delete($request->int('id'));

        return response()->json([
            'data' => $result,
            'message' => __('Customer deleted', 'kirki-ecommerce'),
        ]);
    }

    /**
     * Run a bulk action on customers.
     *
     * Supports deleting the given IDs or deleting every customer matching the list filters. Any other action gets a 400 response.
     *
     * @since 1.0.0
     *
     * @param BulkActionRequest $request
     * @return \Kirki\Ecommerce\Framework\Http\JsonResponse The result message, or a 400 response for an unsupported action.
     */
    public function bulk_actions(BulkActionRequest $request)
    {
        $validated = $request->validated();

        $action = $validated['action'];
        $ids = $validated['ids'] ?? [];

        switch ($action) {
            case BulkActions::DELETE:
                $result = $this->service->bulk_delete($ids);
                return response()->json([
                    'data' => $result,
                    'message' => __('Customer deleted', 'kirki-ecommerce'),
                ]);
            case BulkActions::DELETE_ALL:
                $params = ListFilterDTO::from_array($request->all());
                $result = $this->service->delete_all($params);
                return response()->json([
                    'data' => $result,
                    'message' => __('All customers deleted', 'kirki-ecommerce'),
                ]);
            default:
                return response()->json([
                    'errors' => [],
                    'message' => __('No action performed.', 'kirki-ecommerce'),
                ], Response::BAD_REQUEST);
        }
    }
}
