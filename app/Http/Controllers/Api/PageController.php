<?php

namespace Kirki\Ecommerce\App\Http\Controllers\Api;

use Kirki\Ecommerce\App\DTO\PageFilterDTO;
use Kirki\Ecommerce\App\Resources\Page\PageResource;
use Kirki\Ecommerce\App\Services\PageService;
use Kirki\Ecommerce\App\Supports\Utils;
use Kirki\Ecommerce\Framework\Contracts\Request;

use function Kirki\Ecommerce\Framework\response;

/**
 * REST controller for the store's required site pages.
 *
 * @since 1.0.0
 */
class PageController
{
    /** @var PageService */
    protected $service;

    /**
     * Create the controller with the page service.
     *
     * @since 1.0.0
     *
     * @param PageService $service
     */
    public function __construct(PageService $service)
    {
        $this->service = $service;
    }

    /**
     * List the store pages matching the request filters.
     *
     * @since 1.0.0
     *
     * @param Request $request
     * @return \Kirki\Ecommerce\Framework\Http\JsonResponse Page collection with a success message.
     */
    public function get(Request $request)
    {
        $filters = PageFilterDTO::from_array($request->all());

        $data = $this->service->get($filters);

        return response()->json([
            'data' => PageResource::collection($data),
            'message' => __('Pages retrieved successfully.', 'kirki-ecommerce'),
        ]);
    }

    /**
     * Generate any missing store pages.
     *
     * @since 1.0.0
     *
     * @param Request $request
     * @return \Kirki\Ecommerce\Framework\Http\JsonResponse Success message.
     */
    public function run_fix(Request $request)
    {
        Utils::generate_site_pages();

        return response()->json([
            'message' => __('Store pages generated', 'kirki-ecommerce'),
        ]);
    }
}
