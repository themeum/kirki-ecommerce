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
use Kirki\Ecommerce\Contracts\Request;
use Kirki\Ecommerce\App\DTO\Currency\CreateCurrencyDTO;
use Kirki\Ecommerce\App\DTO\Currency\UpdateCurrencyDTO;
use Kirki\Ecommerce\App\DTO\ListFilterDTO;
use Kirki\Ecommerce\Http\Response;
use Kirki\Ecommerce\Database\Query\Paginator;
use Exception;

use function Kirki\Ecommerce\response;

class CurrencyController
{
    protected $service;

    public function __construct(CurrencyService $service)
    {
        $this->service = $service;
    }

    public function list(Request $request)
    {
        $data = $this->service->list();

        return response()->json([
            'data' => AvailableCurrencyListResource::collection($data),
            'message' => __('Currencys retrieved successfully.', 'kirki-ecommerce'),
        ]);
    }

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

    public function create(CurrencyCreateRequest $request)
    {
        $items = $request->clean()['items'] ?? [];
        $currencies = CreateCurrencyDTO::from_list($items);
        $currencies = $this->service->insert($currencies);

        return response()->json([
            'data' => [],
            'message' => __('Currencies created successfully.', 'kirki-ecommerce'),
        ], Response::CREATED);
    }

    public function show(Request $request)
    {
        $currency = $this->service->find($request->get_int('id'));

        return response()->json([
            'data' => CurrencyResource::make($currency),
            'message' => __('Currency retrieved successfully.', 'kirki-ecommerce'),
        ]);
    }

    public function update(CurrencyUpdateRequest $request)
    {
        $items = $request->clean()['items'] ?? [];
        $currencies = [];
        $total_count = count($items);
        $error_count = 0;

        foreach ($items as $item) {
            try {
                $payload = UpdateCurrencyDTO::from_array($item);
                $currencies[] = $this->service->update($payload);
            } catch (Exception $e) {
                $error_count++;
            }
        }

        if ($error_count > 0) {
            return response()->json([
                'data' => CurrencyResource::collection($currencies),
                'message' => sprintf(__('Updated %s currencies successfully. %s errors occurred.', 'kirki-ecommerce'), $total_count - $error_count, $error_count),
            ], Response::CREATED);
        }

        return response()->json([
            'data' => CurrencyResource::collection($currencies),
            'message' => __('Currencies updated successfully.', 'kirki-ecommerce'),
        ], Response::CREATED);
    }

    public function delete(Request $request)
    {
        $result = $this->service->delete($request->get_int('id'));

        return response()->json([
            'data' => $result,
            'message' => __('Currency deleted successfully.', 'kirki-ecommerce'),
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
                    'message' => __('Currency deleted successfully.', 'kirki-ecommerce'),
                ]);
            case BulkActions::DELETE_ALL:
                $params = ListFilterDTO::from_array($request->all());
                $result = $this->service->delete_all($params);
                return response()->json([
                    'data' => $result,
                    'message' => __('All currencies deleted successfully.', 'kirki-ecommerce'),
                ]);
            default:
                return response()->json([
                    'errors' => [],
                    'message' => __('No action performed.', 'kirki-ecommerce'),
                ], Response::BAD_REQUEST);
        }
    }
}
