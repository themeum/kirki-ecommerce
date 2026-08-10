<?php

namespace Kirki\Ecommerce\App\Http\Controllers\Api;

use Kirki\Ecommerce\App\Http\Requests\BulkActionRequest;
use Kirki\Ecommerce\App\Http\Requests\Collection\CollectionCreateRequest;
use Kirki\Ecommerce\App\Http\Requests\Collection\CollectionUpdateRequest;
use Kirki\Ecommerce\App\Resources\CollectionResource;
use Kirki\Ecommerce\App\Constants\BulkActions;
use Kirki\Ecommerce\App\Constants\Pagination;
use Kirki\Ecommerce\Framework\Contracts\Request;
use Kirki\Ecommerce\App\DTO\Collection\CreateCollectionDTO;
use Kirki\Ecommerce\App\DTO\Collection\UpdateCollectionDTO;
use Kirki\Ecommerce\App\DTO\ListFilterDTO;
use Kirki\Ecommerce\Framework\Http\Response;
use Kirki\Ecommerce\App\Services\CollectionService;
use Kirki\Ecommerce\Framework\Database\Query\Paginator;

use function Kirki\Ecommerce\Framework\response;

class CollectionController
{
    protected $service;

    public function __construct(CollectionService $service)
    {
        $this->service = $service;
    }

    public function get(Request $request)
    {
        $params = ListFilterDTO::from_array($request->all());
        $params->sort_by = $request->whitelisted('sort_by', 'ordering', ['id', 'title', 'slug', 'ordering', 'created_by', 'updated_by', 'created_at', 'updated_at']);

        if ((int) $params->limit === Pagination::ALL) {
            $data = $this->service->all($params);

            return response()->json([
                'data' => CollectionResource::paginated(new Paginator($data, $data->count(), $data->count(), 1)),
                'message' => __('Collections retrieved successfully.', 'kirki-ecommerce'),
            ]);
        }

        $data = $this->service->paginated($params);

        return response()->json([
            'data' => CollectionResource::paginated($data),
            'message' => __('Collections retrieved successfully.', 'kirki-ecommerce'),
        ]);
    }

    public function create(CollectionCreateRequest $request)
    {
        $payload = CreateCollectionDTO::from_request($request);

        $collection = $this->service->create($payload);

        return response()->json([
            'data' => CollectionResource::make($collection),
            'message' => __('Collection created successfully.', 'kirki-ecommerce'),
        ], Response::CREATED);
    }

    public function show(Request $request)
    {
        $collection = $this->service->find($request->int('id'));

        return response()->json([
            'data' => CollectionResource::make($collection),
            'message' => __('Collection retrieved successfully.', 'kirki-ecommerce'),
        ]);
    }

    public function update(CollectionUpdateRequest $request)
    {
        $payload = UpdateCollectionDTO::from_request($request);

        $collection = $this->service->update($payload);

        return response()->json([
            'data' => CollectionResource::make($collection),
            'message' => __('Collection updated successfully.', 'kirki-ecommerce'),
        ]);
    }

    public function delete(Request $request)
    {
        $result = $this->service->delete($request->int('id'));

        return response()->json([
            'data' => $result,
            'message' => __('Collection deleted successfully.', 'kirki-ecommerce'),
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
                    'message' => __('Collection deleted successfully.', 'kirki-ecommerce'),
                ]);
            case BulkActions::DELETE_ALL:
                $params = ListFilterDTO::from_array($request->all());
                $result = $this->service->delete_all($params);
                return response()->json([
                    'data' => $result,
                    'message' => __('All collections deleted successfully.', 'kirki-ecommerce'),
                ]);
            default:
                return response()->json([
                    'errors' => [],
                    'message' => __('No action performed.', 'kirki-ecommerce'),
                ], Response::BAD_REQUEST);
        }
    }
}
