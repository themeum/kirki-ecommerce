<?php

namespace Kirki\Ecommerce\App\OpenApi\Paths;

use OpenApi\Annotations as OA;

/**
 * OpenAPI path definitions.
 *
 * @OA\Get(
 *     path="/variants",
 *     tags={"Catalog"},
 *     summary="List variants",
 *     operationId="Variant_get",
 *     security={{"wpCookieAuth": {}}},
 *     @OA\Parameter(name="search", in="query", @OA\Schema(type="string")),
 *     @OA\Parameter(name="page", in="query", @OA\Schema(type="integer", default=1)),
 *     @OA\Parameter(name="limit", in="query", @OA\Schema(type="integer", default=10)),
 *     @OA\Response(response=200, description="Variant list", @OA\JsonContent(ref="#/components/schemas/PaginatedResponse"))
 * )
 *
 * @OA\Get(
 *     path="/variants/bulk/{ids}",
 *     tags={"Catalog"},
 *     summary="Get variants by IDs",
 *     operationId="Variant_get_by_ids",
 *     security={{"wpCookieAuth": {}}},
 *     @OA\Parameter(name="ids", in="path", required=true, description="Comma-separated variant IDs", @OA\Schema(type="string")),
 *     @OA\Response(
 *         response=200,
 *         description="Variants",
 *         @OA\JsonContent(
 *             type="object",
 *             @OA\Property(property="data", type="array", @OA\Items(ref="#/components/schemas/VariantResource")),
 *             @OA\Property(property="message", type="string")
 *         )
 *     )
 * )
 *
 * @OA\Put(
 *     path="/variants/bulk",
 *     tags={"Catalog"},
 *     summary="Bulk update variants",
 *     operationId="Variant_bulk_update",
 *     security={{"wpCookieAuth": {}}},
 *     @OA\RequestBody(required=true, @OA\JsonContent(type="object")),
 *     @OA\Response(response=200, description="Updated", @OA\JsonContent(type="object", @OA\Property(property="data"), @OA\Property(property="message", type="string")))
 * )
 *
 * @since 1.0.0
 */
class VariantPaths
{
}
