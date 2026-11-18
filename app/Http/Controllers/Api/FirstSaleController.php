<?php

namespace Kirki\Ecommerce\App\Http\Controllers\Api;

defined('ABSPATH') || exit;

use Kirki\Ecommerce\App\Services\FirstSaleService;
use Kirki\Ecommerce\Framework\Http\Request;

use function Kirki\Ecommerce\Framework\response;

/**
 * Serves the Home page's first-sale card and celebration state.
 *
 * @since 1.0.2
 */
class FirstSaleController
{
    /** @var FirstSaleService */
    protected $service;

    /**
     * Create the controller with the first-sale service.
     *
     * @since 1.0.2
     *
     * @param FirstSaleService $service
     */
    public function __construct(FirstSaleService $service)
    {
        $this->service = $service;
    }

    /**
     * Get the card state for the current user.
     *
     * @since 1.0.2
     *
     * @param Request $request
     * @return \Kirki\Ecommerce\Framework\Http\JsonResponse
     */
    public function show(Request $request)
    {
        return response()->json([
            'data' => $this->service->get_state((int) $request->user_id()),
            'message' => __('First sale retrieved successfully.', 'kirki-ecommerce'),
        ]);
    }

    /**
     * Record that the current user was celebrated.
     *
     * @since 1.0.2
     *
     * @param Request $request
     * @return \Kirki\Ecommerce\Framework\Http\JsonResponse
     */
    public function celebrated(Request $request)
    {
        return response()->json([
            'data' => $this->service->celebrate((int) $request->user_id()),
            'message' => __('First sale celebration recorded.', 'kirki-ecommerce'),
        ]);
    }

    /**
     * Close the card for the current user.
     *
     * @since 1.0.2
     *
     * @param Request $request
     * @return \Kirki\Ecommerce\Framework\Http\JsonResponse
     */
    public function dismiss(Request $request)
    {
        return response()->json([
            'data' => $this->service->dismiss((int) $request->user_id()),
            'message' => __('First sale card closed.', 'kirki-ecommerce'),
        ]);
    }

    /**
     * Hide the card for every admin after a click on "Fulfill order".
     *
     * @since 1.0.2
     *
     * @param Request $request
     * @return \Kirki\Ecommerce\Framework\Http\JsonResponse
     */
    public function fulfill(Request $request)
    {
        return response()->json([
            'data' => $this->service->fulfill((int) $request->user_id()),
            'message' => __('First sale card completed.', 'kirki-ecommerce'),
        ]);
    }
}
