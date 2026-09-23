<?php

namespace Kirki\Ecommerce\App\Http\Controllers\Api;

use Kirki\Ecommerce\Framework\Contracts\Request;
use Kirki\Ecommerce\App\Services\AppConfigService;

use function Kirki\Ecommerce\Framework\migrator;
use function Kirki\Ecommerce\Framework\response;

/**
 * REST controller exposing the application configuration.
 *
 * @since 1.0.0
 */
class AppConfigController
{
    /** @var AppConfigService */
    protected $service = null;

    /**
     * Create the controller with the app config service.
     *
     * @since 1.0.0
     *
     * @param AppConfigService $service
     */
    public function __construct(AppConfigService $service)
    {
        $this->service = $service;
    }

    /**
     * Return the application configuration for the current user.
     *
     * @since 1.0.0
     *
     * @param Request $request
     * @return \Kirki\Ecommerce\Framework\Http\JsonResponse The app config under the `data` key.
     */
    public function get(Request $request)
    {
        return response()->json([
            'data' => $this->service->get_app_config(),
        ]);
    }
}
