<?php

namespace Kirki\Ecommerce\App\Http\Controllers\Api;

use Kirki\Ecommerce\App\Http\Requests\Brand\BrandCreateRequest;
use Kirki\Ecommerce\App\Http\Requests\Brand\BrandUpdateRequest;
use Kirki\Ecommerce\App\Http\Requests\BulkActionRequest;
use Kirki\Ecommerce\App\Resources\BrandResource;
use Kirki\Ecommerce\App\Constants\BulkActions;
use Kirki\Ecommerce\App\Constants\Pagination;
use Kirki\Ecommerce\Framework\Contracts\Request;
use Kirki\Ecommerce\Framework\Database\Query\Paginator;
use Kirki\Ecommerce\App\DTO\Brand\CreateBrandDTO;
use Kirki\Ecommerce\App\DTO\Brand\UpdateBrandDTO;
use Kirki\Ecommerce\App\DTO\ListFilterDTO;
use Kirki\Ecommerce\Framework\Http\Response;
use Kirki\Ecommerce\App\Services\BrandService;

use function Kirki\Ecommerce\Framework\response;

/**
 * REST controller for managing brands.
 *
 * @since 1.0.0
 */
class BrandController
{
    /** @var BrandService */
    protected $service;

    /**
     * Create the controller with its brand service.
     *
     * @since 1.0.0
     *
     * @param BrandService $service
     */
    public function __construct(BrandService $service)
    {
        $this->service = $service;
    }

    /**
     * List brands, paginated by the request filters.
     *
     * When the requested limit equals Pagination::ALL, every match is returned as a single page.
     *
     * @since 1.0.0
     *
     * @param Request $request
     * @return \Kirki\Ecommerce\Framework\Http\JsonResponse Paginated brands with a success message.
     */
    public function get(Request $request)
    {
        $params = ListFilterDTO::from_array($request->all());

        if ((int) $params->limit === Pagination::ALL) {
            $data = $this->service->all($params);

            return response()->json([
                'data' => BrandResource::paginated(new Paginator($data, $data->count(), $data->count(), 1)),
                'message' => __('Brands retrieved successfully.', 'kirki-ecommerce'),
            ]);
        }

        $data = $this->service->paginated($params);

        return response()->json([
            'data' => BrandResource::paginated($data),
            'message' => __('Brands retrieved successfully.', 'kirki-ecommerce'),
        ]);
    }

    /**
     * Create a brand from the validated request.
     *
     * @since 1.0.0
     *
     * @param BrandCreateRequest $request
     * @return \Kirki\Ecommerce\Framework\Http\JsonResponse The created brand with a 201 status.
     */
    public function create(BrandCreateRequest $request)
    {
        $payload = CreateBrandDTO::from_request($request);

        $brand = $this->service->create($payload);

        return response()->json([
            'data' => BrandResource::make($brand),
            'message' => __('Brand created', 'kirki-ecommerce'),
        ], Response::CREATED);
    }

    /**
     * Return a single brand by the route ID.
     *
     * @since 1.0.0
     *
     * @param Request $request
     * @return \Kirki\Ecommerce\Framework\Http\JsonResponse The brand resource.
     */
    public function show(Request $request)
    {
        $brand = $this->service->find($request->int('id'));

        return response()->json([
            'data' => BrandResource::make($brand),
            'message' => __('Brand retrieved successfully.', 'kirki-ecommerce'),
        ]);
    }

    /**
     * Update a brand from the validated request.
     *
     * @since 1.0.0
     *
     * @param BrandUpdateRequest $request
     * @return \Kirki\Ecommerce\Framework\Http\JsonResponse The updated brand.
     */
    public function update(BrandUpdateRequest $request)
    {
        $payload = UpdateBrandDTO::from_request($request);

        $brand = $this->service->update($payload);

        return response()->json([
            'data' => BrandResource::make($brand),
            'message' => __('Brand updated', 'kirki-ecommerce'),
        ]);
    }

    /**
     * Delete a single brand by the route ID.
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
            'message' => __('Brand deleted', 'kirki-ecommerce'),
        ]);
    }

    /**
     * Run a bulk action on brands.
     *
     * Supports deleting the given IDs or deleting every brand matching the list filters. Any other action gets a 400 response.
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
                    'message' => __('Brand deleted', 'kirki-ecommerce'),
                ]);
            case BulkActions::DELETE_ALL:
                $params = ListFilterDTO::from_array($request->all());
                $result = $this->service->delete_all($params);
                return response()->json([
                    'data' => $result,
                    'message' => __('All brands deleted', 'kirki-ecommerce'),
                ]);
            default:
                return response()->json([
                    'errors' => [],
                    'message' => __('No action performed.', 'kirki-ecommerce'),
                ], Response::BAD_REQUEST);
        }
    }
}
