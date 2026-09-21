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

/**
 * REST controller for managing tags.
 *
 * @since 1.0.0
 */
class TagController
{
    /** @var TagService */
    protected $service;

    /**
     * Create the controller with its tag service.
     *
     * @since 1.0.0
     *
     * @param TagService $service
     */
    public function __construct(TagService $service)
    {
        $this->service = $service;
    }

    /**
     * List tags, paginated by the request filters.
     *
     * When the requested limit equals Pagination::ALL, every match is returned as a single page.
     *
     * @since 1.0.0
     *
     * @param Request $request
     * @return \Kirki\Ecommerce\Framework\Http\JsonResponse Paginated tags with a success message.
     */
    public function get(Request $request)
    {
        $params = ListFilterDTO::from_array($request->all());

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

    /**
     * Create a tag from the validated request.
     *
     * @since 1.0.0
     *
     * @param TagCreateRequest $request
     * @return \Kirki\Ecommerce\Framework\Http\JsonResponse The created tag with a 201 status.
     */
    public function create(TagCreateRequest $request)
    {
        $payload = CreateTagDTO::from_request($request);

        $tag = $this->service->create($payload);

        return response()->json([
            'data' => TagResource::make($tag),
            'message' => __('Tag created', 'kirki-ecommerce'),
        ], Response::CREATED);
    }

    /**
     * Return a single tag by the route ID.
     *
     * @since 1.0.0
     *
     * @param Request $request
     * @return \Kirki\Ecommerce\Framework\Http\JsonResponse The tag resource.
     */
    public function show(Request $request)
    {
        $tag = $this->service->find($request->int('id'));

        return response()->json([
            'data' => TagResource::make($tag),
            'message' => __('Tag retrieved successfully.', 'kirki-ecommerce'),
        ]);
    }

    /**
     * Update a tag from the validated request.
     *
     * @since 1.0.0
     *
     * @param TagUpdateRequest $request
     * @return \Kirki\Ecommerce\Framework\Http\JsonResponse The updated tag.
     */
    public function update(TagUpdateRequest $request)
    {
        $payload = UpdateTagDTO::from_request($request);

        $tag = $this->service->update($payload);

        return response()->json([
            'data' => TagResource::make($tag),
            'message' => __('Tag updated', 'kirki-ecommerce'),
        ]);
    }

    /**
     * Delete a single tag by the route ID.
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
            'message' => __('Tag deleted', 'kirki-ecommerce'),
        ]);
    }

    /**
     * Run a bulk action on tags.
     *
     * Supports deleting the given IDs or deleting every tag matching the list filters. Any other action gets a 400 response.
     *
     * @since 1.0.0
     *
     * @param BulkActionRequest $request
     * @return \Kirki\Ecommerce\Framework\Http\JsonResponse The result message, or a 400 response for an unsupported action.
     */
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
                    'message' => __('Tag deleted', 'kirki-ecommerce'),
                ]);
            case BulkActions::DELETE_ALL:
                $result = $this->service->delete_all($params);
                return response()->json([
                    'data' => $result,
                    'message' => __('All tags deleted', 'kirki-ecommerce'),
                ]);
            default:
                return response()->json([
                    'errors' => [],
                    'message' => __('No action performed.', 'kirki-ecommerce'),
                ], Response::BAD_REQUEST);
        }
    }
}
