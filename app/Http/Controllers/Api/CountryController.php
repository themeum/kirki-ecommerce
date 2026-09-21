<?php

namespace Kirki\Ecommerce\App\Http\Controllers\Api;

use Kirki\Ecommerce\App\Resources\Country\CountryListResource;
use Kirki\Ecommerce\App\Resources\Country\CountryResource;
use Kirki\Ecommerce\App\Services\CountryService;
use Kirki\Ecommerce\Framework\Contracts\Request;
use Kirki\Ecommerce\App\DTO\Country\CountryFilterDTO;

use function Kirki\Ecommerce\Framework\response;

/**
 * REST controller exposing the list of countries and their states.
 *
 * @since 1.0.0
 */
class CountryController
{
    /** @var CountryService */
    protected $service;

    /**
     * Create the controller with the country service.
     *
     * @since 1.0.0
     *
     * @param CountryService $service
     */
    public function __construct(CountryService $service)
    {
        $this->service = $service;
    }

    /**
     * List countries matching the request filters.
     *
     * @since 1.0.0
     *
     * @param Request $request
     * @return \Kirki\Ecommerce\Framework\Http\JsonResponse Country collection with a success message.
     */
    public function get(Request $request)
    {
        $filters = CountryFilterDTO::from_array($request->all());
        $countries = $this->service->all($filters);

        return response()->json([
            'data' => CountryListResource::collection($countries),
            'message' => __('Countries retrieved successfully.', 'kirki-ecommerce'),
        ]);
    }

    /**
     * Return a single country by its `code` request parameter.
     *
     * @since 1.0.0
     *
     * @param Request $request
     * @return \Kirki\Ecommerce\Framework\Http\JsonResponse The country resource.
     */
    public function show(Request $request)
    {
        $country = $this->service->find($request->get('code'));

        return response()->json([
            'data' => CountryResource::make($country),
            'message' => __('Country retrieved successfully.', 'kirki-ecommerce'),
        ]);
    }
}
