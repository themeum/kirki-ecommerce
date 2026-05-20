<?php

namespace Kirki\Ecommerce\App\Http\Controllers\Api;

use Kirki\Ecommerce\App\Http\Requests\Attribute\AttributeCreateRequest;
use Kirki\Ecommerce\App\Http\Requests\Attribute\AttributeUpdateRequest;
use Kirki\Ecommerce\App\Http\Requests\BulkActionRequest;
use Kirki\Ecommerce\App\Resources\AttributeResource;
use Kirki\Ecommerce\App\Constants\BulkActions;
use Kirki\Ecommerce\App\Constants\Pagination;
use Kirki\Ecommerce\Contracts\Request;
use Kirki\Ecommerce\App\DTO\Attribute\AttributeListFilterDTO;
use Kirki\Ecommerce\App\DTO\Attribute\CreateAttributeDTO;
use Kirki\Ecommerce\App\DTO\Attribute\UpdateAttributeDTO;
use Kirki\Ecommerce\Http\Response;
use Kirki\Ecommerce\App\Services\AttributeService;
use Kirki\Ecommerce\Database\Query\Paginator;

use function Kirki\Ecommerce\response;

class AttributeController
{
    protected $service;

    public function __construct(AttributeService $service)
    {
        $this->service = $service;
    }

    public function get(Request $request)
    {
        $params = AttributeListFilterDTO::from_array($request->all());
        $params->sort_by = $request->get_whitelisted('sort_by', 'id', ['id', 'name', 'slug', 'type', 'created_by', 'updated_by', 'created_at', 'updated_at']);

        if ((int) $params->limit === Pagination::ALL) {
            $data = $this->service->all($params);

            return response()->json([
                'data' => AttributeResource::paginated(new Paginator($data, $data->count(), $data->count(), 1)),
                'message' => __('Attributes retrieved successfully.', 'kirki-ecommerce'),
            ]);
        }

        $data = $this->service->paginated($params);

        return response()->json([
            'data' => AttributeResource::paginated($data),
            'message' => __('Attributes retrieved successfully.', 'kirki-ecommerce'),
        ]);
    }

    public function create(AttributeCreateRequest $request)
    {
        $attribute = $this->service->create(CreateAttributeDTO::from_request($request));

        return response()->json([
            'data' => AttributeResource::make($attribute),
            'message' => __('Attribute created successfully.', 'kirki-ecommerce'),
        ], Response::CREATED);
    }

    public function show(Request $request)
    {
        $attribute = $this->service->find($request->get_int('id'));

        return response()->json([
            'data' => AttributeResource::make($attribute),
            'message' => __('Attribute retrieved successfully.', 'kirki-ecommerce'),
        ]);
    }

    public function update(AttributeUpdateRequest $request)
    {
        $attribute = $this->service->update(UpdateAttributeDTO::from_request($request));

        return response()->json([
            'data' => AttributeResource::make($attribute),
            'message' => __('Attribute updated successfully.', 'kirki-ecommerce'),
        ]);
    }

    public function delete(Request $request)
    {
        $result = $this->service->delete($request->get_int('id'));

        return response()->json([
            'data' => $result,
            'message' => __('Attribute deleted successfully.', 'kirki-ecommerce'),
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
                    'message' => __('Attribute deleted successfully.', 'kirki-ecommerce'),
                ]);
            case BulkActions::DELETE_ALL:
                $params = AttributeListFilterDTO::from_array($request->all());
                $result = $this->service->delete_all($params);
                return response()->json([
                    'data' => $result,
                    'message' => __('All attributes deleted successfully.', 'kirki-ecommerce'),
                ]);
            default:
                return response()->json([
                    'errors' => [],
                    'message' => __('No action performed.', 'kirki-ecommerce'),
                ], Response::BAD_REQUEST);
        }
    }
}
