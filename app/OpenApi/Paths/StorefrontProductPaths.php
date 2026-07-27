<?php

namespace Kirki\Ecommerce\App\OpenApi\Paths;

use OpenApi\Annotations as OA;

/**
 * OpenAPI path definitions.
 *
 * @OA\Get(
 *     path="/items",
 *     tags={"Storefront"},
 *     summary="List storefront products",
 *     operationId="SiteProduct_index",
 *     @OA\Parameter(name="search", in="query", @OA\Schema(type="string")),
 *     @OA\Parameter(name="page", in="query", @OA\Schema(type="integer", default=1)),
 *     @OA\Parameter(name="limit", in="query", @OA\Schema(type="integer", default=10)),
 *     @OA\Response(response=200, description="Storefront product list", @OA\JsonContent(type="object", @OA\Property(property="data"), @OA\Property(property="message", type="string")))
 * )
 *
 * @since 1.0.0
 */
class StorefrontProductPaths
{
}
