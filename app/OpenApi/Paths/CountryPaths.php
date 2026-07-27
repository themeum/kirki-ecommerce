<?php

namespace Kirki\Ecommerce\App\OpenApi\Paths;

use OpenApi\Annotations as OA;

/**
 * OpenAPI path definitions.
 *
 * @OA\Get(
 *     path="/countries",
 *     tags={"Shipping"},
 *     summary="List countries",
 *     operationId="Country_get",
 *     security={{"wpCookieAuth": {}}},
 *     @OA\Parameter(name="search", in="query", @OA\Schema(type="string")),
 *     @OA\Response(
 *         response=200,
 *         description="Country list",
 *         @OA\JsonContent(
 *             type="object",
 *             @OA\Property(property="data", type="array", @OA\Items(ref="#/components/schemas/CountryListResource")),
 *             @OA\Property(property="message", type="string")
 *         )
 *     )
 * )
 *
 * @OA\Get(
 *     path="/countries/{code}",
 *     tags={"Shipping"},
 *     summary="Get a country by code",
 *     operationId="Country_show",
 *     security={{"wpCookieAuth": {}}},
 *     @OA\Parameter(name="code", in="path", required=true, @OA\Schema(type="string")),
 *     @OA\Response(
 *         response=200,
 *         description="Country detail",
 *         @OA\JsonContent(
 *             type="object",
 *             @OA\Property(property="data", ref="#/components/schemas/CountryResource"),
 *             @OA\Property(property="message", type="string")
 *         )
 *     )
 * )
 *
 * @since 1.0.0
 */
class CountryPaths
{
}
