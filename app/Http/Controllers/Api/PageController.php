<?php

namespace Kirki\Ecommerce\App\Http\Controllers\Api;

use Kirki\Ecommerce\App\DTO\PageFilterDTO;
use Kirki\Ecommerce\App\Resources\Page\PageResource;
use Kirki\Ecommerce\App\Services\PageService;
use Kirki\Ecommerce\App\Supports\Utils;
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
        $filters = PageFilterDTO::from_array($request->all());

        $data = $this->service->get($filters);

        return response()->json([
            'data' => PageResource::collection($data),
            'message' => __('Pages retrieved successfully.', 'kirki-ecommerce'),
        ]);
    }

    public function run_fix(Request $request)
    {
        Utils::generate_site_pages();

        return response()->json([
            'message' => __('Pages generated successfully.', 'kirki-ecommerce'),
        ]);
    }
}
