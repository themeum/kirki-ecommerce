<?php

namespace Kirki\Ecommerce\App\OpenApi\Paths;

use OpenApi\Annotations as OA;

/**
 * OpenAPI path definitions.
 *
 * @OA\Get(
 *     path="/attributes/{attribute_id}/values",
 *     tags={"Catalog"},
 *     summary="List attribute values",
 *     operationId="AttributeValue_get",
 *     security={{"wpCookieAuth": {}}},
 *     @OA\Parameter(name="attribute_id", in="path", required=true, @OA\Schema(type="integer")),
 *     @OA\Parameter(name="search", in="query", @OA\Schema(type="string")),
 *     @OA\Parameter(name="page", in="query", @OA\Schema(type="integer", default=1)),
 *     @OA\Parameter(name="limit", in="query", @OA\Schema(type="integer", default=10)),
 *     @OA\Response(response=200, description="Paginated list", @OA\JsonContent(ref="#/components/schemas/PaginatedResponse")),
 *     @OA\Response(response=401, description="Unauthorized", @OA\JsonContent(ref="#/components/schemas/ErrorResponse"))
 * )
 *
 * @OA\Get(
 *     path="/attributes/{attribute_id}/values/{id}",
 *     tags={"Catalog"},
 *     summary="Get an attribute value",
 *     operationId="AttributeValue_show",
 *     security={{"wpCookieAuth": {}}},
 *     @OA\Parameter(name="attribute_id", in="path", required=true, @OA\Schema(type="integer")),
 *     @OA\Parameter(name="id", in="path", required=true, @OA\Schema(type="integer")),
 *     @OA\Response(
 *         response=200,
 *         description="Single record",
 *         @OA\JsonContent(
 *             type="object",
 *             @OA\Property(property="data", ref="#/components/schemas/AttributeValueResource"),
 *             @OA\Property(property="message", type="string")
 *         )
 *     )
 * )
 *
 * @OA\Post(
 *     path="/attributes/{attribute_id}/values",
 *     tags={"Catalog"},
 *     summary="Create an attribute value",
 *     operationId="AttributeValue_create",
 *     security={{"wpCookieAuth": {}}},
 *     @OA\Parameter(name="attribute_id", in="path", required=true, @OA\Schema(type="integer")),
 *     @OA\RequestBody(required=true, @OA\JsonContent(ref="#/components/schemas/CreateAttributeValueDTO")),
 *     @OA\Response(response=201, description="Created", @OA\JsonContent(type="object", @OA\Property(property="data", ref="#/components/schemas/AttributeValueResource"), @OA\Property(property="message", type="string"))),
 *     @OA\Response(response=422, description="Validation error", @OA\JsonContent(ref="#/components/schemas/ErrorResponse"))
 * )
 *
 * @OA\Put(
 *     path="/attributes/{attribute_id}/values/{id}",
 *     tags={"Catalog"},
 *     summary="Update an attribute value",
 *     operationId="AttributeValue_update",
 *     security={{"wpCookieAuth": {}}},
 *     @OA\Parameter(name="attribute_id", in="path", required=true, @OA\Schema(type="integer")),
 *     @OA\Parameter(name="id", in="path", required=true, @OA\Schema(type="integer")),
 *     @OA\RequestBody(required=true, @OA\JsonContent(ref="#/components/schemas/UpdateAttributeValueDTO")),
 *     @OA\Response(response=200, description="Updated", @OA\JsonContent(type="object", @OA\Property(property="data", ref="#/components/schemas/AttributeValueResource"), @OA\Property(property="message", type="string")))
 * )
 *
 * @OA\Delete(
 *     path="/attributes/{attribute_id}/values/{id}",
 *     tags={"Catalog"},
 *     summary="Delete an attribute value",
 *     operationId="AttributeValue_delete",
 *     security={{"wpCookieAuth": {}}},
 *     @OA\Parameter(name="attribute_id", in="path", required=true, @OA\Schema(type="integer")),
 *     @OA\Parameter(name="id", in="path", required=true, @OA\Schema(type="integer")),
 *     @OA\Response(response=200, description="Deleted", @OA\JsonContent(type="object", @OA\Property(property="data"), @OA\Property(property="message", type="string")))
 * )
 *
 * @OA\Post(
 *     path="/attributes/{attribute_id}/values/bulk",
 *     tags={"Catalog"},
 *     summary="Bulk actions for attribute values",
 *     operationId="AttributeValue_bulk_actions",
 *     security={{"wpCookieAuth": {}}},
 *     @OA\Parameter(name="attribute_id", in="path", required=true, @OA\Schema(type="integer")),
 *     @OA\RequestBody(required=true, @OA\JsonContent(ref="#/components/schemas/BulkActionRequest")),
 *     @OA\Response(response=200, description="Bulk action result", @OA\JsonContent(type="object", @OA\Property(property="data"), @OA\Property(property="message", type="string")))
 * )
 *
 * @since 1.0.0
 */
class AttributeValuePaths
{
}
