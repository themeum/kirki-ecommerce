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
use Kirki\Ecommerce\App\Services\CustomerService;
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

    public function get(Request $request)
    {
        $params = ListFilterDTO::from_array($request->all());
        $params->sort_by = $request->get_whitelisted('sort_by', 'id', ['id', 'user_id', 'first_name', 'last_name', 'email', 'phone', 'created_by', 'updated_by', 'created_at', 'updated_at']);

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
        $shipping_address_payload = CreateAddressDTO::from_array($validated['shipping_address'] ?? []);
        $billing_address_payload = CreateAddressDTO::from_array($validated['billing_address'] ?? []);

        $customer = $create_customer_action->execute($customer_payload, $shipping_address_payload, $billing_address_payload);

        return response()->json([
            'data' => CustomerResource::make($customer),
            'message' => __('Customer created successfully.', 'kirki-ecommerce'),
        ], Response::CREATED);
    }

    public function show(Request $request)
    {
        $customer = $this->service->find($request->get_int('id'));

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
            'message' => __('Customer updated successfully.', 'kirki-ecommerce'),
        ]);
    }

    public function delete(Request $request)
    {
        $result = $this->service->delete($request->get_int('id'));

        return response()->json([
            'data' => $result,
            'message' => __('Customer deleted successfully.', 'kirki-ecommerce'),
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
                    'message' => __('Customer deleted successfully.', 'kirki-ecommerce'),
                ]);
            case BulkActions::DELETE_ALL:
                $params = ListFilterDTO::from_array($request->all());
                $result = $this->service->delete_all($params);
                return response()->json([
                    'data' => $result,
                    'message' => __('All customers deleted successfully.', 'kirki-ecommerce'),
                ]);
            default:
                return response()->json([
                    'errors' => [],
                    'message' => __('No action performed.', 'kirki-ecommerce'),
                ], Response::BAD_REQUEST);
        }
    }
}
