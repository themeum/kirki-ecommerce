<?php

namespace Kirki\Ecommerce\App\Http\Controllers\Api;

use Kirki\Ecommerce\App\Http\Requests\BulkActionRequest;
use Kirki\Ecommerce\App\Http\Requests\Tag\TagCreateRequest;
use Kirki\Ecommerce\App\Http\Requests\Tag\TagUpdateRequest;
use Kirki\Ecommerce\App\Resources\TagResource;
use Kirki\Ecommerce\App\Constants\BulkActions;
use Kirki\Ecommerce\App\Constants\Pagination;
use Kirki\Ecommerce\Framework\Contracts\Request;
use Kirki\Ecommerce\App\DTO\Tag\CreateTagDTO;
use Kirki\Ecommerce\App\DTO\ListFilterDTO;
use Kirki\Ecommerce\App\DTO\Tag\UpdateTagDTO;
use Kirki\Ecommerce\Framework\Http\Response;
use Kirki\Ecommerce\App\Services\TagService;
use Kirki\Ecommerce\Framework\Database\Query\Paginator;

use function Kirki\Ecommerce\Framework\response;

class TagController
{
    protected $service;

    public function __construct(TagService $service)
    {
        $this->service = $service;
    }

    public function get(Request $request)
    {
        $params = ListFilterDTO::from_array($request->all());
        $params->sort_by = $request->whitelisted('sort_by', 'id', ['id', 'name', 'created_by', 'updated_by', 'created_at', 'updated_at']);

        if ((int) $params->limit === Pagination::ALL) {
            $data = $this->service->all($params);

            return response()->json([
                'data' => TagResource::paginated(new Paginator($data, $data->count(), $data->count(), 1)),
                'message' => __('Tags retrieved successfully.', 'kirki-ecommerce'),
            ]);
        }

        $data = $this->service->paginated($params);

        return response()->json([
            'data' => TagResource::paginated($data),
            'message' => __('Tags retrieved successfully.', 'kirki-ecommerce'),
        ]);
    }

    public function create(TagCreateRequest $request)
    {
        $payload = CreateTagDTO::from_request($request);

        $tag = $this->service->create($payload);

        return response()->json([
            'data' => TagResource::make($tag),
            'message' => __('Tag created successfully.', 'kirki-ecommerce'),
        ], Response::CREATED);
    }

    public function show(Request $request)
    {
        $tag = $this->service->find($request->int('id'));

        return response()->json([
            'data' => TagResource::make($tag),
            'message' => __('Tag retrieved successfully.', 'kirki-ecommerce'),
        ]);
    }

    public function update(TagUpdateRequest $request)
    {
        $payload = UpdateTagDTO::from_request($request);

        $tag = $this->service->update($payload);

        return response()->json([
            'data' => TagResource::make($tag),
            'message' => __('Tag updated successfully.', 'kirki-ecommerce'),
        ]);
    }

    public function delete(Request $request)
    {
        $result = $this->service->delete($request->int('id'));

        return response()->json([
            'data' => $result,
            'message' => __('Tag deleted successfully.', 'kirki-ecommerce'),
        ]);
    }

    public function bulk_actions(BulkActionRequest $request)
    {
        $validated = $request->validated();
        $params = ListFilterDTO::from_array($request->all());

        $action = $validated['action'];
        $ids = $validated['ids'] ?? [];

        switch ($action) {
            case BulkActions::DELETE:
                $result = $this->service->bulk_delete($ids);
                return response()->json([
                    'data' => $result,
                    'message' => __('Tag deleted successfully.', 'kirki-ecommerce'),
                ]);
            case BulkActions::DELETE_ALL:
                $result = $this->service->delete_all($params);
                return response()->json([
                    'data' => $result,
                    'message' => __('All tags deleted successfully.', 'kirki-ecommerce'),
                ]);
            default:
                return response()->json([
                    'errors' => [],
                    'message' => __('No action performed.', 'kirki-ecommerce'),
                ], Response::BAD_REQUEST);
        }
    }
}
