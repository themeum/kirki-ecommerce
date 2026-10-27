<?php

namespace Kirki\Ecommerce\App\Http\Controllers\Api;

defined('ABSPATH') || exit;

use Kirki\Ecommerce\App\Services\DashboardService;
use Kirki\Ecommerce\Framework\Contracts\Request;

use function Kirki\Ecommerce\Framework\response;

/**
 * Serves the Home page's store overview.
 *
 * @since 1.0.0
 */
class DashboardController
{
    /** @var DashboardService */
    protected $service;

    /**
     * Create the controller with the dashboard service.
     *
     * @since 1.0.0
     *
     * @param DashboardService $service
     */
    public function __construct(DashboardService $service)
    {
        $this->service = $service;
    }

    /**
     * Get the sales metrics, the most recent orders and the top selling products.
     *
     * @since 1.0.0
     *
     * @param Request $request
     * @return \Kirki\Ecommerce\Framework\Http\JsonResponse
     */
    public function overview(Request $request)
    {
        return response()->json([
            'data' => $this->service->get_overview(),
            'message' => __('Dashboard overview retrieved successfully.', 'kirki-ecommerce'),
        ]);
    }
}
