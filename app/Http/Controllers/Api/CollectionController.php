<?php

namespace Kirki\Ecommerce\App\Http\Controllers\Api;

use Kirki\Ecommerce\App\Actions\Collection\CreateCollectionAction;
use Kirki\Ecommerce\App\Actions\Collection\UpdateCollectionAction;
use Kirki\Ecommerce\App\Http\Requests\BulkActionRequest;
use Kirki\Ecommerce\App\Http\Requests\Collection\CollectionCreateRequest;
use Kirki\Ecommerce\App\Http\Requests\Collection\CollectionUpdateRequest;
use Kirki\Ecommerce\App\Resources\Collection\CollectionListResource;
use Kirki\Ecommerce\App\Resources\Collection\CollectionResource;
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

/**
 * REST controller for managing collections.
 *
 * @since 1.0.0
 */
class CollectionController
{
    /** @var CollectionService */
    protected $service;

    /**
     * Create the controller with its collection service.
     *
     * @since 1.0.0
     *
     * @param CollectionService $service
     */
    public function __construct(CollectionService $service)
    {
        $this->service = $service;
    }

    /**
     * List collections, paginated by the request filters.
     *
     * When the requested limit equals Pagination::ALL, every match is returned as a single page.
     *
     * @since 1.0.0
     *
     * @param Request $request
     * @return \Kirki\Ecommerce\Framework\Http\JsonResponse Paginated collections with a success message.
     */
    public function get(Request $request)
    {
        $params = ListFilterDTO::from_array($request->all());

        if ((int) $params->limit === Pagination::ALL) {
            $data = $this->service->all($params);

            return response()->json([
                'data' => CollectionListResource::paginated(new Paginator($data, $data->count(), $data->count(), 1)),
                'message' => __('Collections retrieved successfully.', 'kirki-ecommerce'),
            ]);
        }

        $data = $this->service->paginated($params);

        return response()->json([
            'data' => CollectionListResource::paginated($data),
            'message' => __('Collections retrieved successfully.', 'kirki-ecommerce'),
        ]);
    }

    /**
     * Create a collection from the validated request.
     *
     * @since 1.0.0
     *
     * @param CollectionCreateRequest $request
     * @param CreateCollectionAction $action
     * @return \Kirki\Ecommerce\Framework\Http\JsonResponse The created collection with a 201 status.
     */
    public function create(CollectionCreateRequest $request, CreateCollectionAction $action)
    {
        $collection = $action->execute(CreateCollectionDTO::from_request($request));

        return response()->json([
            'data' => CollectionResource::make($collection),
            'message' => __('Collection created', 'kirki-ecommerce'),
        ], Response::CREATED);
    }

    /**
     * Return a single collection by the route ID.
     *
     * @since 1.0.0
     *
     * @param Request $request
     * @return \Kirki\Ecommerce\Framework\Http\JsonResponse The collection resource.
     */
    public function show(Request $request)
    {
        $collection = $this->service->find($request->int('id'));

        return response()->json([
            'data' => CollectionResource::make($collection),
            'message' => __('Collection retrieved successfully.', 'kirki-ecommerce'),
        ]);
    }

    /**
     * Update a collection from the validated request.
     *
     * @since 1.0.0
     *
     * @param CollectionUpdateRequest $request
     * @param UpdateCollectionAction $action
     * @return \Kirki\Ecommerce\Framework\Http\JsonResponse The updated collection.
     */
    public function update(CollectionUpdateRequest $request, UpdateCollectionAction $action)
    {
        $collection = $action->execute(UpdateCollectionDTO::from_request($request));

        return response()->json([
            'data' => CollectionResource::make($collection),
            'message' => __('Collection updated', 'kirki-ecommerce'),
        ]);
    }

    /**
     * Delete a single collection by the route ID.
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
            'message' => __('Collection deleted', 'kirki-ecommerce'),
        ]);
    }

    /**
     * Run a bulk action on collections.
     *
     * Supports deleting the given IDs or deleting every collection matching the list filters. Any other action gets a 400 response.
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
                    'message' => __('Collection deleted', 'kirki-ecommerce'),
                ]);
            case BulkActions::DELETE_ALL:
                $params = ListFilterDTO::from_array($request->all());
                $result = $this->service->delete_all($params);
                return response()->json([
                    'data' => $result,
                    'message' => __('All collections deleted', 'kirki-ecommerce'),
                ]);
            default:
                return response()->json([
                    'errors' => [],
                    'message' => __('No action performed.', 'kirki-ecommerce'),
                ], Response::BAD_REQUEST);
        }
    }
}
