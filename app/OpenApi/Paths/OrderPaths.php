<?php

namespace Kirki\Ecommerce\App\OpenApi\Paths;

use OpenApi\Annotations as OA;

/**
 * OpenAPI path definitions.
 *
 * @OA\Get(
 *     path="/orders",
 *     tags={"Orders"},
 *     summary="List orders",
 *     operationId="Order_get",
 *     security={{"wpCookieAuth": {}}},
 *     @OA\Parameter(name="search", in="query", @OA\Schema(type="string")),
 *     @OA\Parameter(name="page", in="query", @OA\Schema(type="integer", default=1)),
 *     @OA\Parameter(name="limit", in="query", @OA\Schema(type="integer", default=10)),
 *     @OA\Parameter(name="sort_by", in="query", @OA\Schema(type="string", default="id")),
 *     @OA\Parameter(name="sort_order", in="query", @OA\Schema(type="string", enum={"asc","desc"}, default="desc")),
 *     @OA\Response(
 *         response=200,
 *         description="Paginated orders",
 *         @OA\JsonContent(
 *             type="object",
 *             @OA\Property(
 *                 property="data",
 *                 type="object",
 *                 @OA\Property(property="results", type="array", @OA\Items(ref="#/components/schemas/OrderListResource")),
 *                 @OA\Property(property="total", type="integer"),
 *                 @OA\Property(property="count", type="integer"),
 *                 @OA\Property(property="per_page", type="integer"),
 *                 @OA\Property(property="current_page", type="integer"),
 *                 @OA\Property(property="last_page", type="integer"),
 *                 @OA\Property(property="has_more_pages", type="boolean")
 *             ),
 *             @OA\Property(property="message", type="string")
 *         )
 *     )
 * )
 *
 * @OA\Get(
 *     path="/orders/{id}",
 *     tags={"Orders"},
 *     summary="Get an order",
 *     operationId="Order_show",
 *     security={{"wpCookieAuth": {}}},
 *     @OA\Parameter(name="id", in="path", required=true, @OA\Schema(type="integer")),
 *     @OA\Response(response=200, description="Order detail", @OA\JsonContent(type="object", @OA\Property(property="data", ref="#/components/schemas/OrderResource"), @OA\Property(property="message", type="string")))
 * )
 *
 * @OA\Post(
 *     path="/orders",
 *     tags={"Orders"},
 *     summary="Create an order",
 *     operationId="Order_store",
 *     security={{"wpCookieAuth": {}}},
 *     @OA\RequestBody(required=true, @OA\JsonContent(ref="#/components/schemas/CreateOrderPayloadDTO")),
 *     @OA\Response(response=201, description="Created", @OA\JsonContent(type="object", @OA\Property(property="data", ref="#/components/schemas/OrderResource"), @OA\Property(property="message", type="string"))),
 *     @OA\Response(response=422, description="Validation error", @OA\JsonContent(ref="#/components/schemas/ErrorResponse"))
 * )
 *
 * @OA\Put(
 *     path="/orders/{id}",
 *     tags={"Orders"},
 *     summary="Update an order",
 *     operationId="Order_update",
 *     security={{"wpCookieAuth": {}}},
 *     @OA\Parameter(name="id", in="path", required=true, @OA\Schema(type="integer")),
 *     @OA\RequestBody(required=true, @OA\JsonContent(ref="#/components/schemas/UpdateOrderPayloadDTO")),
 *     @OA\Response(response=200, description="Updated", @OA\JsonContent(type="object", @OA\Property(property="data", ref="#/components/schemas/OrderResource"), @OA\Property(property="message", type="string")))
 * )
 *
 * @OA\Delete(
 *     path="/orders/{id}",
 *     tags={"Orders"},
 *     summary="Delete an order",
 *     operationId="Order_delete",
 *     security={{"wpCookieAuth": {}}},
 *     @OA\Parameter(name="id", in="path", required=true, @OA\Schema(type="integer")),
 *     @OA\Response(response=200, description="Deleted", @OA\JsonContent(type="object", @OA\Property(property="data"), @OA\Property(property="message", type="string")))
 * )
 *
 * @OA\Post(
 *     path="/orders/bulk",
 *     tags={"Orders"},
 *     summary="Bulk actions for orders",
 *     operationId="Order_bulk_actions",
 *     security={{"wpCookieAuth": {}}},
 *     @OA\RequestBody(required=true, @OA\JsonContent(ref="#/components/schemas/BulkActionRequest")),
 *     @OA\Response(response=200, description="Bulk action result", @OA\JsonContent(type="object", @OA\Property(property="data"), @OA\Property(property="message", type="string")))
 * )
 *
 * @OA\Post(
 *     path="/orders/{order_id}/refunds",
 *     tags={"Orders"},
 *     summary="Create a refund",
 *     operationId="Order_create_refund",
 *     security={{"wpCookieAuth": {}}},
 *     @OA\Parameter(name="order_id", in="path", required=true, @OA\Schema(type="integer")),
 *     @OA\RequestBody(required=true, @OA\JsonContent(ref="#/components/schemas/CreateRefundPayloadDTO")),
 *     @OA\Response(response=201, description="Refund created", @OA\JsonContent(type="object", @OA\Property(property="data"), @OA\Property(property="message", type="string")))
 * )
 *
 * @OA\Put(
 *     path="/orders/{order_id}/refunds/{id}",
 *     tags={"Orders"},
 *     summary="Update a refund",
 *     operationId="Order_update_refund",
 *     security={{"wpCookieAuth": {}}},
 *     @OA\Parameter(name="order_id", in="path", required=true, @OA\Schema(type="integer")),
 *     @OA\Parameter(name="id", in="path", required=true, @OA\Schema(type="integer")),
 *     @OA\RequestBody(required=true, @OA\JsonContent(ref="#/components/schemas/UpdateRefundPayloadDTO")),
 *     @OA\Response(response=200, description="Refund updated", @OA\JsonContent(type="object", @OA\Property(property="data"), @OA\Property(property="message", type="string")))
 * )
 *
 * @OA\Delete(
 *     path="/orders/{order_id}/refunds/{id}",
 *     tags={"Orders"},
 *     summary="Delete a refund",
 *     operationId="Order_delete_refund",
 *     security={{"wpCookieAuth": {}}},
 *     @OA\Parameter(name="order_id", in="path", required=true, @OA\Schema(type="integer")),
 *     @OA\Parameter(name="id", in="path", required=true, @OA\Schema(type="integer")),
 *     @OA\Response(response=200, description="Refund deleted", @OA\JsonContent(type="object", @OA\Property(property="data"), @OA\Property(property="message", type="string")))
 * )
 *
 * @since 1.0.0
 */
class OrderPaths
{
}
