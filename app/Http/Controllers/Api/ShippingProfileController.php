<?php

namespace Kirki\Ecommerce\App\Http\Controllers\Api;

use Kirki\Ecommerce\App\Http\Requests\BulkActionRequest;
use Kirki\Ecommerce\App\Http\Requests\ShippingProfile\ShippingProfileCreateRequest;
use Kirki\Ecommerce\App\Http\Requests\ShippingProfile\ShippingProfileUpdateRequest;
use Kirki\Ecommerce\App\Resources\ShippingProfileResource;
use Kirki\Ecommerce\App\Services\ShippingProfileService;
use Kirki\Ecommerce\App\Constants\BulkActions;
use Kirki\Ecommerce\App\Constants\Pagination;
use Kirki\Ecommerce\Framework\Contracts\Request;
use Kirki\Ecommerce\App\DTO\ListFilterDTO;
use Kirki\Ecommerce\App\DTO\ShippingProfile\CreateShippingProfileDTO;
use Kirki\Ecommerce\App\DTO\ShippingProfile\UpdateShippingProfileDTO;
use Kirki\Ecommerce\Framework\Http\Response;
use Kirki\Ecommerce\Framework\Database\Query\Paginator;

use function Kirki\Ecommerce\Framework\response;

class ShippingProfileController
{
    protected $service;

    public function __construct(ShippingProfileService $service)
    {
        $this->service = $service;
    }

    public function get(Request $request)
    {
        $params = ListFilterDTO::from_array($request->all());
        $params->sort_by = $request->whitelisted('sort_by', 'id', ['id', 'name', 'created_at', 'updated_at']);

        if ((int) $params->limit === Pagination::ALL) {
            $data = $this->service->all($params);

            return response()->json([
                'data' => ShippingProfileResource::paginated(new Paginator($data, $data->count(), $data->count(), 1)),
                'message' => __('Shipping profiles retrieved successfully.', 'kirki-ecommerce'),
            ]);
        }

        $data = $this->service->paginated($params);

        return response()->json([
            'data' => ShippingProfileResource::paginated($data),
            'message' => __('Shipping profiles retrieved successfully.', 'kirki-ecommerce'),
        ]);
    }

    public function create(ShippingProfileCreateRequest $request)
    {
        $payload = CreateShippingProfileDTO::from_request($request);

        $shipping_profile = $this->service->create($payload);

        return response()->json([
            'data' => ShippingProfileResource::make($shipping_profile),
            'message' => __('Shipping profile created successfully.', 'kirki-ecommerce'),
        ], Response::CREATED);
    }

    public function show(Request $request)
    {
        $shipping_profile = $this->service->find($request->int('id'));

        return response()->json([
            'data' => ShippingProfileResource::make($shipping_profile),
            'message' => __('Shipping profile retrieved successfully.', 'kirki-ecommerce'),
        ]);
    }

    public function update(ShippingProfileUpdateRequest $request)
    {
        $payload = UpdateShippingProfileDTO::from_request($request);

        $shipping_profile = $this->service->update($payload);

        return response()->json([
            'data' => ShippingProfileResource::make($shipping_profile),
            'message' => __('Shipping profile updated successfully.', 'kirki-ecommerce'),
        ]);
    }

    public function delete(Request $request)
    {
        $result = $this->service->delete($request->int('id'));

        return response()->json([
            'data' => $result,
            'message' => __('Shipping profile deleted successfully.', 'kirki-ecommerce'),
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
                    'message' => __('Shipping profiles deleted successfully.', 'kirki-ecommerce'),
                ]);
            case BulkActions::DELETE_ALL:
                $params = ListFilterDTO::from_array($request->all());
                $result = $this->service->delete_all($params);
                return response()->json([
                    'data' => $result,
                    'message' => __('All shipping profiles deleted successfully.', 'kirki-ecommerce'),
                ]);
            default:
                return response()->json([
                    'errors' => [],
                    'message' => __('No action performed.', 'kirki-ecommerce'),
                ], Response::BAD_REQUEST);
        }
    }
}
