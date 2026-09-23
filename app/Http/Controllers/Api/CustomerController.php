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
use Kirki\Ecommerce\Framework\Sanitizer;

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
     * Check whether an email is still available for a customer.
     *
     * @since 1.0.0
     *
     * @param Request $request Carries `email` and an optional `id` to exclude from the check.
     * @return \Kirki\Ecommerce\Framework\Http\JsonResponse
     */
    public function check_email(Request $request)
    {
        $email = (string) $request->get('email', '', Sanitizer::EMAIL);
        $id = $request->int('id', null);

        if ($email === '') {
            return response()->json([
                'data' => false,
                'message' => __('The Email has already been taken.', 'kirki-ecommerce'),
            ]);
        }

        $is_available = $this->service->is_email_available($email, $id);

        return response()->json([
            'data' => $is_available,
            'message' => $is_available
                ? __('Email is available.', 'kirki-ecommerce')
                : __('The Email has already been taken.', 'kirki-ecommerce'),
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
        $validated['addresses'] = array_map(function ($address) {
            return CreateAddressDTO::from_array($address);
        }, $validated['addresses'] ?? []);

        $customer_payload = CreateCustomerDTO::from_array($validated);

        $customer = $create_customer_action->execute($customer_payload);

        return response()->json([
            'data' => CustomerResource::make($customer),
            'message' => __('Customer created', 'kirki-ecommerce'),
        ], Response::CREATED);
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
        $address_payloads = array_map(function ($address) {
            return UpdateAddressDTO::from_array($address);
        }, $validated['addresses'] ?? []);

        $customer = $update_customer_action->execute($customer_payload, $address_payloads);

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
                $params = CustomerListFilterDTO::from_array($request->all());
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
