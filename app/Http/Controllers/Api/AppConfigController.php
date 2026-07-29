<?php

namespace Kirki\Ecommerce\App\Http\Controllers\Api;

use Kirki\Ecommerce\Framework\Contracts\Request;
use Kirki\Ecommerce\App\Services\AppConfigService;

use function Kirki\Ecommerce\Framework\migrator;
use function Kirki\Ecommerce\Framework\response;

class AppConfigController
{
    protected $service = null;

    public function __construct(AppConfigService $service)
    {
        $this->service = $service;
    }

    public function get(Request $request)
    {
        return response()->json([
            'data' => $this->service->get_app_config(),
        ]);
    }
}
