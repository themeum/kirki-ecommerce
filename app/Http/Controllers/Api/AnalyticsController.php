<?php

namespace Kirki\Ecommerce\App\Http\Controllers\Api;

defined('ABSPATH') || exit;

use Kirki\Ecommerce\App\Http\Requests\Analytics\AnalyticsMetricRequest;
use Kirki\Ecommerce\App\Http\Requests\Analytics\AnalyticsRegionsRequest;
use Kirki\Ecommerce\App\Services\AnalyticsQueryService;
use Kirki\Ecommerce\Framework\Http\Response;

use function Kirki\Ecommerce\Framework\response;

/**
 * Serves the Analytics page.
 *
 * @since 1.0.0
 */
class AnalyticsController
{
    /** @var AnalyticsQueryService */
    protected $query_service;

    /**
     * Create the controller with the analytics query service.
     *
     * @since 1.0.0
     *
     * @param AnalyticsQueryService $query_service Service that answers the page.
     */
    public function __construct(AnalyticsQueryService $query_service)
    {
        $this->query_service = $query_service;
    }

    /**
     * Get the metrics of one key, with the page meta.
     *
     * @since 1.0.0
     *
     * @param AnalyticsMetricRequest $request
     * @return \Kirki\Ecommerce\Framework\Http\JsonResponse The metrics, or a 404 for an unknown key.
     */
    public function metric(AnalyticsMetricRequest $request)
    {
        $key = $request->string('key');

        if (!in_array($key, AnalyticsQueryService::METRIC_KEYS, true)) {
            return response()->json([
                'message' => __('Unknown analytics metric.', 'kirki-ecommerce'),
            ], Response::NOT_FOUND);
        }

        return response()->json([
            'data' => $this->query_service->get_metric($key, $request->all()),
            'message' => __('Analytics metric retrieved successfully.', 'kirki-ecommerce'),
        ]);
    }

    /**
     * Get the top regions of one country.
     *
     * @since 1.0.0
     *
     * @param AnalyticsRegionsRequest $request
     * @return \Kirki\Ecommerce\Framework\Http\JsonResponse
     */
    public function regions(AnalyticsRegionsRequest $request)
    {
        return response()->json([
            'data' => $this->query_service->get_regions($request->all()),
            'message' => __('Analytics regions retrieved successfully.', 'kirki-ecommerce'),
        ]);
    }
}
