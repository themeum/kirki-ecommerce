<?php

namespace Kirki\Ecommerce\App\Http\Controllers\Api;

use Kirki\Ecommerce\App\Resources\Page\PageResource;
use Kirki\Ecommerce\App\Services\PageService;
use Kirki\Ecommerce\Framework\Contracts\Request;

use function Kirki\Ecommerce\Framework\response;

class PageController
{
    protected $service;

    public function __construct(PageService $service)
    {
        $this->service = $service;
    }

    public function get(Request $request)
    {
        $data = $this->service->all();

        return response()->json([
            'data' => PageResource::collection($data),
            'message' => __('Pages retrieved successfully.', 'kirki-ecommerce'),
        ]);
    }
}
