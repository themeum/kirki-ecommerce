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

class CustomerController
{
    protected $service;

    public function __construct(CustomerService $service)
    {
        $this->service = $service;
    }

    public function locations(Request $request)
    {
        $country = $request->get('country');

        return response()->json([
            'data' => $this->service->list_locations(empty($country) ? null : $country),
            'message' => __('Customer locations retrieved successfully.', 'kirki-ecommerce'),
        ]);
    }

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
     * Build the addresses to create the customer with from the optional
     * shipping_address/billing_address request blocks - either may be
     * omitted entirely.
     *
     * @param array $validated
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

    public function show(Request $request)
    {
        $customer = $this->service->find($request->int('id'));

        return response()->json([
            'data' => CustomerResource::make($customer),
            'message' => __('Customer retrieved successfully.', 'kirki-ecommerce'),
        ]);
    }

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

    public function delete(Request $request)
    {
        $result = $this->service->delete($request->int('id'));

        return response()->json([
            'data' => $result,
            'message' => __('Customer deleted', 'kirki-ecommerce'),
        ]);
    }

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
