<?php

namespace Kirki\Ecommerce\App\Http\Controllers\Api;

use Kirki\Ecommerce\App\Http\Requests\BulkActionRequest;
use Kirki\Ecommerce\App\Http\Requests\ShippingBox\ShippingBoxCreateRequest;
use Kirki\Ecommerce\App\Http\Requests\ShippingBox\ShippingBoxUpdateRequest;
use Kirki\Ecommerce\App\Resources\ShippingBoxResource;
use Kirki\Ecommerce\App\Services\ShippingBoxService;
use Kirki\Ecommerce\App\Constants\BulkActions;
use Kirki\Ecommerce\App\Constants\Pagination;
use Kirki\Ecommerce\Framework\Contracts\Request;
use Kirki\Ecommerce\App\DTO\ListFilterDTO;
use Kirki\Ecommerce\App\DTO\ShippingBox\CreateShippingBoxDTO;
use Kirki\Ecommerce\App\DTO\ShippingBox\UpdateShippingBoxDTO;
use Kirki\Ecommerce\Framework\Http\Response;
use Kirki\Ecommerce\Framework\Database\Query\Paginator;

use function Kirki\Ecommerce\Framework\response;

class ShippingBoxController
{
    protected $service;

    public function __construct(ShippingBoxService $service)
    {
        $this->service = $service;
    }

    public function get(Request $request)
    {
        $params = ListFilterDTO::from_array($request->all());
        $params->sort_by = $request->whitelisted('sort_by', 'id', ['id', 'name', 'width', 'height', 'length', 'is_default', 'created_at', 'updated_at']);

        if ((int) $params->limit === Pagination::ALL) {
            $data = $this->service->all($params);

            return response()->json([
                'data' => ShippingBoxResource::paginated(new Paginator($data, $data->count(), $data->count(), 1)),
                'message' => __('Shipping boxes retrieved successfully.', 'kirki-ecommerce'),
            ]);
        }

        $data = $this->service->paginated($params);

        return response()->json([
            'data' => ShippingBoxResource::paginated($data),
            'message' => __('Shipping boxes retrieved successfully.', 'kirki-ecommerce'),
        ]);
    }

    public function create(ShippingBoxCreateRequest $request)
    {
        $payload = CreateShippingBoxDTO::from_request($request);

        $shipping_box = $this->service->create($payload);

        return response()->json([
            'data' => ShippingBoxResource::make($shipping_box),
            'message' => __('Shipping box created successfully.', 'kirki-ecommerce'),
        ], Response::CREATED);
    }

    public function show(Request $request)
    {
        $shipping_box = $this->service->find($request->int('id'));

        return response()->json([
            'data' => ShippingBoxResource::make($shipping_box),
            'message' => __('Shipping box retrieved successfully.', 'kirki-ecommerce'),
        ]);
    }

    public function update(ShippingBoxUpdateRequest $request)
    {
        $payload = UpdateShippingBoxDTO::from_request($request);

        $shipping_box = $this->service->update($payload);

        return response()->json([
            'data' => ShippingBoxResource::make($shipping_box),
            'message' => __('Shipping box updated successfully.', 'kirki-ecommerce'),
        ]);
    }

    public function delete(Request $request)
    {
        $result = $this->service->delete($request->int('id'));

        return response()->json([
            'data' => $result,
            'message' => __('Shipping box deleted successfully.', 'kirki-ecommerce'),
        ]);
    }

    public function bulk_actions(BulkActionRequest $request)
    {
        $validated = $request->all();

        $action = $validated['action'];
        $ids = $validated['ids'] ?? [];

        switch ($action) {
            case BulkActions::DELETE:
                $result = $this->service->bulk_delete($ids);
                return response()->json([
                    'data' => $result,
                    'message' => __('Shipping boxes deleted successfully.', 'kirki-ecommerce'),
                ]);
            case BulkActions::DELETE_ALL:
                $params = ListFilterDTO::from_array($request->all());
                $result = $this->service->delete_all($params);
                return response()->json([
                    'data' => $result,
                    'message' => __('All shipping boxes deleted successfully.', 'kirki-ecommerce'),
                ]);
            default:
                return response()->json([
                    'errors' => [],
                    'message' => __('No action performed.', 'kirki-ecommerce'),
                ], Response::BAD_REQUEST);
        }
    }
}
