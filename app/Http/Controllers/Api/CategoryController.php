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

/**
 * REST controller for managing categories.
 *
 * @since 1.0.0
 */
class CategoryController
{
    /** @var CategoryService */
    protected $service;

    /**
     * Create the controller with its category service.
     *
     * @since 1.0.0
     *
     * @param CategoryService $service
     */
    public function __construct(CategoryService $service)
    {
        $this->service = $service;
    }

    /**
     * List categories, paginated by the request filters.
     *
     * When the requested limit equals Pagination::ALL, every match is returned as a single page.
     *
     * @since 1.0.0
     *
     * @param Request $request
     * @return \Kirki\Ecommerce\Framework\Http\JsonResponse Paginated categories with a success message.
     */
    public function get(Request $request)
    {
        $params = ListFilterDTO::from_array($request->all());

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

    /**
     * Create a category from the validated request.
     *
     * @since 1.0.0
     *
     * @param CategoryCreateRequest $request
     * @return \Kirki\Ecommerce\Framework\Http\JsonResponse The created category with a 201 status.
     */
    public function create(CategoryCreateRequest $request)
    {
        $payload = CreateCategoryDTO::from_request($request);

        $category = $this->service->create($payload);

        return response()->json([
            'data' => CategoryResource::make($category),
            'message' => __('Category created', 'kirki-ecommerce'),
        ], Response::CREATED);
    }

    /**
     * Return a single category by the route ID.
     *
     * @since 1.0.0
     *
     * @param Request $request
     * @return \Kirki\Ecommerce\Framework\Http\JsonResponse The category resource.
     */
    public function show(Request $request)
    {
        $category = $this->service->find($request->int('id'));

        return response()->json([
            'data' => CategoryResource::make($category),
            'message' => __('Category retrieved successfully.', 'kirki-ecommerce'),
        ]);
    }

    /**
     * Update a category from the validated request.
     *
     * @since 1.0.0
     *
     * @param CategoryUpdateRequest $request
     * @return \Kirki\Ecommerce\Framework\Http\JsonResponse The updated category.
     */
    public function update(CategoryUpdateRequest $request)
    {
        $payload = UpdateCategoryDTO::from_request($request);

        $category = $this->service->update($payload);

        return response()->json([
            'data' => CategoryResource::make($category),
            'message' => __('Category updated', 'kirki-ecommerce'),
        ]);
    }

    /**
     * Delete a single category by the route ID.
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
            'message' => __('Category deleted', 'kirki-ecommerce'),
        ]);
    }

    /**
     * Run a bulk action on categories.
     *
     * Supports deleting the given IDs or deleting every category matching the list filters. Any other action gets a 400 response.
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
                    'message' => __('Category deleted', 'kirki-ecommerce'),
                ]);
            case BulkActions::DELETE_ALL:
                $params = ListFilterDTO::from_array($request->all());
                $result = $this->service->delete_all($params);
                return response()->json([
                    'data' => $result,
                    'message' => __('All categories deleted', 'kirki-ecommerce'),
                ]);
            default:
                return response()->json([
                    'errors' => [],
                    'message' => __('No action performed.', 'kirki-ecommerce'),
                ], Response::BAD_REQUEST);
        }
    }
}
