<?php

namespace Kirki\Ecommerce\App\Http\Controllers\Site;

use Kirki\Ecommerce\App\DTO\Product\ProductListFilterDTO;
use Kirki\Ecommerce\App\Http\Requests\Product\ProductListRequest;
use Kirki\Ecommerce\App\Resources\Product\ProductListResource;
use Kirki\Ecommerce\App\Services\ProductService;

use function Kirki\Ecommerce\Framework\response;

class ProductController
{
    /**
     * @var ProductService
     */
    protected $service;

    public function __construct(ProductService $product_service)
    {
        $this->service = $product_service;
    }

    public function index(ProductListRequest $request)
    {
        $params = ProductListFilterDTO::from_array($request->all());
        $params->sort_by = $request->get_whitelisted('sort_by', 'id', ['id', 'title', 'status', 'created_by', 'updated_by', 'created_at', 'updated_at']);

        $products = $this->service->all($params);
        $products = ProductListResource::collection($products);

        return response()->json([
            'data' => $products,
            'message' => __('Product retrieved successfully.', 'kirki-ecommerce'),
        ]);
    }
}
