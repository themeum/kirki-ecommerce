<?php

namespace Kirki\Ecommerce\App\Http\Controllers\Api;

use Kirki\Ecommerce\App\Http\Requests\AttributeValue\AttributeValueCreateRequest;
use Kirki\Ecommerce\App\Http\Requests\AttributeValue\AttributeValueUpdateRequest;
use Kirki\Ecommerce\App\Http\Requests\BulkActionRequest;
use Kirki\Ecommerce\App\Resources\AttributeValueResource;
use Kirki\Ecommerce\App\Services\AttributeValueService;
use Kirki\Ecommerce\App\Constants\BulkActions;
use Kirki\Ecommerce\Framework\Contracts\Request;
use Kirki\Ecommerce\App\DTO\AttributeValue\CreateAttributeValueDTO;
use Kirki\Ecommerce\App\DTO\AttributeValue\UpdateAttributeValueDTO;
use Kirki\Ecommerce\App\DTO\ListFilterDTO;
use Kirki\Ecommerce\Framework\Http\Response;

use function Kirki\Ecommerce\Framework\response;

class AttributeValueController
{
    protected $service;

    public function __construct(AttributeValueService $service)
    {
        $this->service = $service;
    }

    public function get(Request $request)
    {
        $params = ListFilterDTO::from_array($request->all());
        $params->sort_by = $request->get_whitelisted('sort_by', 'id', ['id', 'attribute_id', 'value', 'color', 'created_at', 'updated_at']);

        $data = $this->service->all($request->get_int('attribute_id'), $params);

        return response()->json([
            'data' => AttributeValueResource::collection($data),
            'message' => __('Attribute values retrieved successfully.', 'kirki-ecommerce'),
        ]);
    }

    public function create(AttributeValueCreateRequest $request)
    {
        $payload = CreateAttributeValueDTO::from_request($request);

        $attribute_value = $this->service->create($payload);

        return response()->json([
            'data' => AttributeValueResource::make($attribute_value),
            'message' => __('Attribute value created successfully.', 'kirki-ecommerce'),
        ], Response::CREATED);
    }

    public function show(Request $request)
    {
        $attribute_value = $this->service->find($request->get_int('id'));

        return response()->json([
            'data' => AttributeValueResource::make($attribute_value),
            'message' => __('Attribute value retrieved successfully.', 'kirki-ecommerce'),
        ]);
    }

    public function update(AttributeValueUpdateRequest $request)
    {
        $payload = UpdateAttributeValueDTO::from_request($request);

        $attribute_value = $this->service->update($payload);

        return response()->json([
            'data' => AttributeValueResource::make($attribute_value),
            'message' => __('Attribute value updated successfully.', 'kirki-ecommerce'),
        ]);
    }

    public function delete(Request $request)
    {
        $result = $this->service->delete($request->get_int('id'));

        return response()->json([
            'data' => $result,
            'message' => __('Attribute value deleted successfully.', 'kirki-ecommerce'),
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
                    'message' => __('Attribute values deleted successfully.', 'kirki-ecommerce'),
                ]);
            case BulkActions::DELETE_ALL:
                $params = ListFilterDTO::from_array($request->all());
                $result = $this->service->delete_all($params);
                return response()->json([
                    'data' => $result,
                    'message' => __('All attribute values deleted successfully.', 'kirki-ecommerce'),
                ]);
            default:
                return response()->json([
                    'errors' => [],
                    'message' => __('No action performed.', 'kirki-ecommerce'),
                ], Response::BAD_REQUEST);
        }
    }
}
