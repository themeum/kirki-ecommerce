<?php

namespace Kirki\Ecommerce\App\Http\Controllers\Api;

use Kirki\Ecommerce\App\Resources\Country\CountryListResource;
use Kirki\Ecommerce\App\Resources\Country\CountryResource;
use Kirki\Ecommerce\App\Services\CountryService;
use Kirki\Ecommerce\Contracts\Request;
use Kirki\Ecommerce\App\DTO\Country\CountryFilterDTO;

use function Kirki\Ecommerce\response;

class CountryController
{
    protected $service;

    public function __construct(CountryService $service)
    {
        $this->service = $service;
    }

    public function get(Request $request)
    {
        $filters = CountryFilterDTO::from_array($request->all());
        $countries = $this->service->all($filters);

        return response()->json([
            'data' => CountryListResource::collection($countries),
            'message' => __('Countries retrieved successfully.', 'kirki-ecommerce'),
        ]);
    }

    public function show(Request $request)
    {
        $country = $this->service->find($request->get('code'));

        return response()->json([
            'data' => CountryResource::make($country),
            'message' => __('Country retrieved successfully.', 'kirki-ecommerce'),
        ]);
    }
}
