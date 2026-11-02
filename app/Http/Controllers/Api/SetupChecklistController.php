<?php

namespace Kirki\Ecommerce\App\Http\Controllers\Api;

defined('ABSPATH') || exit;

use Kirki\Ecommerce\App\Services\SetupChecklistService;
use Kirki\Ecommerce\Framework\Contracts\Request;
use Kirki\Ecommerce\Framework\Http\Response;

use function Kirki\Ecommerce\Framework\response;

/**
 * Serves the Home page's store setup checklist.
 *
 * @since 1.0.0
 */
class SetupChecklistController
{
    /** @var SetupChecklistService */
    protected $service;

    /**
     * Create the controller with the setup checklist service.
     *
     * @since 1.0.0
     *
     * @param SetupChecklistService $service
     */
    public function __construct(SetupChecklistService $service)
    {
        $this->service = $service;
    }

    /**
     * Get the checklist steps, recording any that are now met.
     *
     * @since 1.0.0
     *
     * @param Request $request
     * @return \Kirki\Ecommerce\Framework\Http\JsonResponse The steps in display order.
     */
    public function index(Request $request)
    {
        return response()->json([
            'data' => ['steps' => $this->service->get_state()],
            'message' => __('Setup checklist retrieved successfully.', 'kirki-ecommerce'),
        ]);
    }

    /**
     * Record a preconfigured step as confirmed by the merchant.
     *
     * @since 1.0.0
     *
     * @param Request $request
     * @return \Kirki\Ecommerce\Framework\Http\JsonResponse The steps in display order, or a 422 for a step that is not confirmable.
     */
    public function complete(Request $request)
    {
        $step = $request->string('step');

        if (!SetupChecklistService::is_confirmable($step)) {
            return response()->json([
                'message' => __('This setup step cannot be completed manually.', 'kirki-ecommerce'),
            ], Response::UNPROCESSABLE_ENTITY);
        }

        return response()->json([
            'data' => ['steps' => $this->service->complete($step)],
            'message' => __('Setup step completed.', 'kirki-ecommerce'),
        ]);
    }
}
