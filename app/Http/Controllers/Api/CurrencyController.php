<?php

namespace Kirki\Ecommerce\App\Http\Controllers\Api;

use Kirki\Ecommerce\App\Http\Requests\BulkActionRequest;
use Kirki\Ecommerce\App\Http\Requests\Currency\CurrencyCreateRequest;
use Kirki\Ecommerce\App\Http\Requests\Currency\CurrencyUpdateRequest;
use Kirki\Ecommerce\App\Resources\Currency\AvailableCurrencyListResource;
use Kirki\Ecommerce\App\Resources\Currency\CurrencyResource;
use Kirki\Ecommerce\App\Services\CurrencyService;
use Kirki\Ecommerce\App\Constants\BulkActions;
use Kirki\Ecommerce\App\Constants\Pagination;
use Kirki\Ecommerce\Framework\Contracts\Request;
use Kirki\Ecommerce\App\DTO\Currency\CreateCurrencyDTO;
use Kirki\Ecommerce\App\DTO\Currency\UpdateCurrencyDTO;
use Kirki\Ecommerce\App\DTO\ListFilterDTO;
use Kirki\Ecommerce\Framework\Http\Response;
use Kirki\Ecommerce\Framework\Database\Query\Paginator;
use Exception;

use function Kirki\Ecommerce\Framework\response;

/**
 * REST controller for managing the store currencies.
 *
 * @since 1.0.0
 */
class CurrencyController
{
    /** @var CurrencyService */
    protected $service;

    /**
     * Create the controller with the currency service.
     *
     * @since 1.0.0
     *
     * @param CurrencyService $service
     */
    public function __construct(CurrencyService $service)
    {
        $this->service = $service;
    }

    /**
     * List the currencies from the bundled catalog that can be added to the store.
     *
     * @since 1.0.0
     *
     * @param Request $request
     * @return \Kirki\Ecommerce\Framework\Http\JsonResponse Available currency collection with a success message.
     */
    public function list(Request $request)
    {
        $data = $this->service->list();

        return response()->json([
            'data' => AvailableCurrencyListResource::collection($data),
            'message' => __('Currencies retrieved successfully.', 'kirki-ecommerce'),
        ]);
    }

    /**
     * List the store currencies, paginated by the request filters.
     *
     * When the requested limit equals Pagination::ALL, every match is returned as a single page.
     *
     * @since 1.0.0
     *
     * @param Request $request
     * @return \Kirki\Ecommerce\Framework\Http\JsonResponse Paginated currencies with a success message.
     */
    public function get(Request $request)
    {
        $params = ListFilterDTO::from_array($request->all());

        if ((int) $params->limit === Pagination::ALL) {
            $data = $this->service->all($params);

            return response()->json([
                'data' => CurrencyResource::paginated(new Paginator($data, $data->count(), $data->count(), 1)),
                'message' => __('Currencies retrieved successfully.', 'kirki-ecommerce'),
            ]);
        }

        $data = $this->service->paginated($params);

        return response()->json([
            'data' => CurrencyResource::paginated($data),
            'message' => __('Currencys retrieved successfully.', 'kirki-ecommerce'),
        ]);
    }

    /**
     * Add the currencies listed in the request `items` to the store.
     *
     * @since 1.0.0
     *
     * @param CurrencyCreateRequest $request
     * @return \Kirki\Ecommerce\Framework\Http\JsonResponse An empty `data` array with a 201 status.
     */
    public function create(CurrencyCreateRequest $request)
    {
        $items = $request->input('items') ?? [];
        $currencies = CreateCurrencyDTO::from_list($items);
        $currencies = $this->service->insert($currencies);

        return response()->json([
            'data' => [],
            'message' => __('Currencies added', 'kirki-ecommerce'),
        ], Response::CREATED);
    }

    /**
     * Return a single currency by the route ID.
     *
     * @since 1.0.0
     *
     * @param Request $request
     * @return \Kirki\Ecommerce\Framework\Http\JsonResponse The currency resource.
     */
    public function show(Request $request)
    {
        $currency = $this->service->find($request->int('id'));

        return response()->json([
            'data' => CurrencyResource::make($currency),
            'message' => __('Currency retrieved successfully.', 'kirki-ecommerce'),
        ]);
    }

    /**
     * Update each currency listed in the request `items`, collecting per-item failures.
     *
     * Responds with 422 when every item failed and reports the failure count when only some did.
     *
     * @since 1.0.0
     *
     * @param CurrencyUpdateRequest $request
     * @return \Kirki\Ecommerce\Framework\Http\JsonResponse The updated currencies, plus any error messages, with a 201 status; or a 422 response when none could be updated.
     */
    public function update(CurrencyUpdateRequest $request)
    {
        $items = $request->input('items') ?? [];
        $currencies = [];
        $errors = [];
        $total_count = count($items);
        $error_count = 0;

        foreach ($items as $item) {
            try {
                $payload = UpdateCurrencyDTO::from_array($item);
                $currencies[] = $this->service->update($payload);
            } catch (Exception $e) {
                $error_count++;
                $errors[] = $e->getMessage();
            }
        }

        if ($error_count === $total_count && $total_count > 0) {
            return response()->json([
                'errors' => $errors,
                'message' => __('None of the currencies could be updated.', 'kirki-ecommerce'),
            ], Response::UNPROCESSABLE_ENTITY);
        }

        if ($error_count > 0) {
            return response()->json([
                'data' => CurrencyResource::collection($currencies),
                'errors' => $errors,
                /* translators: %1$s: number of currencies updated, %2$s: number of errors */
                'message' => sprintf(__('Updated %1$s currencies, %2$s failed', 'kirki-ecommerce'), $total_count - $error_count, $error_count),
            ], Response::CREATED);
        }

        return response()->json([
            'data' => CurrencyResource::collection($currencies),
            'message' => __('Currencies updated', 'kirki-ecommerce'),
        ], Response::CREATED);
    }

    /**
     * Remove a single currency by the route ID.
     *
     * @since 1.0.0
     *
     * @param Request $request
     * @return \Kirki\Ecommerce\Framework\Http\JsonResponse Success response carrying the removal result.
     */
    public function delete(Request $request)
    {
        $result = $this->service->delete($request->int('id'));

        return response()->json([
            'data' => $result,
            'message' => __('Currency removed', 'kirki-ecommerce'),
        ]);
    }

    /**
     * Run a bulk action on currencies.
     *
     * Supports removing the given IDs or removing every currency matching the list filters. Any other action gets a 400 response.
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
                    'message' => __('Currency removed', 'kirki-ecommerce'),
                ]);
            case BulkActions::DELETE_ALL:
                $params = ListFilterDTO::from_array($request->all());
                $result = $this->service->delete_all($params);
                return response()->json([
                    'data' => $result,
                    'message' => __('All currencies removed', 'kirki-ecommerce'),
                ]);
            default:
                return response()->json([
                    'errors' => [],
                    'message' => __('No action performed.', 'kirki-ecommerce'),
                ], Response::BAD_REQUEST);
        }
    }
}
