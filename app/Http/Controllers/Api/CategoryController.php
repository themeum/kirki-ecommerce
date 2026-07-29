<?php

namespace Kirki\Ecommerce\App\Http\Controllers\Api;

use Kirki\Ecommerce\App\Http\Requests\BulkActionRequest;
use Kirki\Ecommerce\App\Http\Requests\Category\CategoryCreateRequest;
use Kirki\Ecommerce\App\Http\Requests\Category\CategoryUpdateRequest;
use Kirki\Ecommerce\App\Resources\CategoryResource;
use Kirki\Ecommerce\App\Constants\BulkActions;
use Kirki\Ecommerce\App\Constants\Pagination;
use Kirki\Ecommerce\Framework\Contracts\Request;
use Kirki\Ecommerce\App\DTO\Category\CreateCategoryDTO;
use Kirki\Ecommerce\App\DTO\Category\UpdateCategoryDTO;
use Kirki\Ecommerce\App\DTO\ListFilterDTO;
use Kirki\Ecommerce\Framework\Http\Response;
use Kirki\Ecommerce\App\Services\CategoryService;
use Kirki\Ecommerce\Framework\Database\Query\Paginator;

use function Kirki\Ecommerce\Framework\response;

class CategoryController
{
    protected $service;

    public function __construct(CategoryService $service)
    {
        $this->service = $service;
    }

    public function get(Request $request)
    {
        $params = ListFilterDTO::from_array($request->all());
        $params->sort_by = $request->get_whitelisted('sort_by', 'ordering', ['id', 'name', 'slug', 'parent_id', 'ordering', 'created_by', 'updated_by', 'created_at', 'updated_at']);

        if ((int) $params->limit === Pagination::ALL) {
            $data = $this->service->all($params);

            return response()->json([
                'data' => CategoryResource::paginated(new Paginator($data, $data->count(), $data->count(), 1)),
                'message' => __('Categories retrieved successfully.', 'kirki-ecommerce'),
            ]);
        }

        $data = $this->service->paginated($params);

        return response()->json([
            'data' => CategoryResource::paginated($data),
            'message' => __('Categories retrieved successfully.', 'kirki-ecommerce'),
        ]);
    }

    public function create(CategoryCreateRequest $request)
    {
        $payload = CreateCategoryDTO::from_request($request);

        $category = $this->service->create($payload);

        return response()->json([
            'data' => CategoryResource::make($category),
            'message' => __('Category created successfully.', 'kirki-ecommerce'),
        ], Response::CREATED);
    }

    public function show(Request $request)
    {
        $category = $this->service->find($request->get_int('id'));

        return response()->json([
            'data' => CategoryResource::make($category),
            'message' => __('Category retrieved successfully.', 'kirki-ecommerce'),
        ]);
    }

    public function update(CategoryUpdateRequest $request)
    {
        $payload = UpdateCategoryDTO::from_request($request);

        $category = $this->service->update($payload);

        return response()->json([
            'data' => CategoryResource::make($category),
            'message' => __('Category updated successfully.', 'kirki-ecommerce'),
        ]);
    }

    public function delete(Request $request)
    {
        $result = $this->service->delete($request->get_int('id'));

        return response()->json([
            'data' => $result,
            'message' => __('Category deleted successfully.', 'kirki-ecommerce'),
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
                    'message' => __('Category deleted successfully.', 'kirki-ecommerce'),
                ]);
            case BulkActions::DELETE_ALL:
                $params = ListFilterDTO::from_array($request->all());
                $result = $this->service->delete_all($params);
                return response()->json([
                    'data' => $result,
                    'message' => __('All categories deleted successfully.', 'kirki-ecommerce'),
                ]);
            default:
                return response()->json([
                    'errors' => [],
                    'message' => __('No action performed.', 'kirki-ecommerce'),
                ], Response::BAD_REQUEST);
        }
    }
}
