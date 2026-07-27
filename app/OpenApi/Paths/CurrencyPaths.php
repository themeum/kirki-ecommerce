<?php

namespace Kirki\Ecommerce\App\OpenApi\Paths;

use OpenApi\Annotations as OA;

/**
 * OpenAPI path definitions.
 *
 * @OA\Get(
 *     path="/currencies",
 *     tags={"Pricing"},
 *     summary="List currencies",
 *     operationId="Currency_get",
 *     security={{"wpCookieAuth": {}}},
 *     @OA\Parameter(name="search", in="query", @OA\Schema(type="string")),
 *     @OA\Parameter(name="page", in="query", @OA\Schema(type="integer", default=1)),
 *     @OA\Parameter(name="limit", in="query", @OA\Schema(type="integer", default=10)),
 *     @OA\Response(response=200, description="Paginated list", @OA\JsonContent(ref="#/components/schemas/PaginatedResponse"))
 * )
 *
 * @OA\Get(
 *     path="/currencies/list",
 *     tags={"Pricing"},
 *     summary="List available currencies",
 *     operationId="Currency_list",
 *     security={{"wpCookieAuth": {}}},
 *     @OA\Response(
 *         response=200,
 *         description="Available currency list",
 *         @OA\JsonContent(
 *             type="object",
 *             @OA\Property(property="data", type="array", @OA\Items(ref="#/components/schemas/AvailableCurrencyListResource")),
 *             @OA\Property(property="message", type="string")
 *         )
 *     )
 * )
 *
 * @OA\Get(
 *     path="/currencies/{id}",
 *     tags={"Pricing"},
 *     summary="Get a currency",
 *     operationId="Currency_show",
 *     security={{"wpCookieAuth": {}}},
 *     @OA\Parameter(name="id", in="path", required=true, @OA\Schema(type="integer")),
 *     @OA\Response(response=200, description="Single currency", @OA\JsonContent(type="object", @OA\Property(property="data", ref="#/components/schemas/CurrencyResource"), @OA\Property(property="message", type="string")))
 * )
 *
 * @OA\Post(
 *     path="/currencies",
 *     tags={"Pricing"},
 *     summary="Create a currency",
 *     operationId="Currency_create",
 *     security={{"wpCookieAuth": {}}},
 *     @OA\RequestBody(required=true, @OA\JsonContent(ref="#/components/schemas/CreateCurrencyDTO")),
 *     @OA\Response(response=201, description="Created", @OA\JsonContent(type="object", @OA\Property(property="data", ref="#/components/schemas/CurrencyResource"), @OA\Property(property="message", type="string")))
 * )
 *
 * @OA\Put(
 *     path="/currencies",
 *     tags={"Pricing"},
 *     summary="Update currencies",
 *     operationId="Currency_update",
 *     security={{"wpCookieAuth": {}}},
 *     @OA\RequestBody(required=true, @OA\JsonContent(ref="#/components/schemas/UpdateCurrencyDTO")),
 *     @OA\Response(response=200, description="Updated", @OA\JsonContent(type="object", @OA\Property(property="data"), @OA\Property(property="message", type="string")))
 * )
 *
 * @OA\Delete(
 *     path="/currencies/{id}",
 *     tags={"Pricing"},
 *     summary="Delete a currency",
 *     operationId="Currency_delete",
 *     security={{"wpCookieAuth": {}}},
 *     @OA\Parameter(name="id", in="path", required=true, @OA\Schema(type="integer")),
 *     @OA\Response(response=200, description="Deleted", @OA\JsonContent(type="object", @OA\Property(property="data"), @OA\Property(property="message", type="string")))
 * )
 *
 * @OA\Post(
 *     path="/currencies/bulk",
 *     tags={"Pricing"},
 *     summary="Bulk actions for currencies",
 *     operationId="Currency_bulk_actions",
 *     security={{"wpCookieAuth": {}}},
 *     @OA\RequestBody(required=true, @OA\JsonContent(ref="#/components/schemas/BulkActionRequest")),
 *     @OA\Response(response=200, description="Bulk action result", @OA\JsonContent(type="object", @OA\Property(property="data"), @OA\Property(property="message", type="string")))
 * )
 *
 * @since 1.0.0
 */
class CurrencyPaths
{
}
