<?php

namespace Kirki\Ecommerce\App\OpenApi\Paths;

use OpenApi\Annotations as OA;

/**
 * OpenAPI path definitions.
 *
 * @OA\Get(
 *     path="/coupons",
 *     tags={"Pricing"},
 *     summary="List Coupon records",
 *     operationId="Coupon_get",
 *     security={{"wpCookieAuth": {}}},
 *     @OA\Parameter(name="search", in="query", @OA\Schema(type="string")),
 *     @OA\Parameter(name="page", in="query", @OA\Schema(type="integer", default=1)),
 *     @OA\Parameter(name="limit", in="query", @OA\Schema(type="integer", default=10)),
 *     @OA\Parameter(name="sort_by", in="query", @OA\Schema(type="string", default="id")),
 *     @OA\Parameter(name="sort_order", in="query", @OA\Schema(type="string", enum={"asc","desc"}, default="desc")),
 *     @OA\Response(
 *         response=200,
 *         description="Paginated list",
 *         @OA\JsonContent(
 *             type="object",
 *             @OA\Property(
 *                 property="data",
 *                 type="object",
 *                 @OA\Property(property="results", type="array", @OA\Items(ref="#/components/schemas/CouponListResource")),
 *                 @OA\Property(property="total", type="integer"),
 *                 @OA\Property(property="count", type="integer"),
 *                 @OA\Property(property="per_page", type="integer"),
 *                 @OA\Property(property="current_page", type="integer"),
 *                 @OA\Property(property="last_page", type="integer"),
 *                 @OA\Property(property="from", type="integer", nullable=true),
 *                 @OA\Property(property="to", type="integer", nullable=true),
 *                 @OA\Property(property="has_more_pages", type="boolean")
 *             ),
 *             @OA\Property(property="message", type="string")
 *         )
 *     ),
 *     @OA\Response(response=401, description="Unauthorized", @OA\JsonContent(ref="#/components/schemas/ErrorResponse"))
 * )
 *
 * @OA\Get(
 *     path="/coupons/{id}",
 *     tags={"Pricing"},
 *     summary="Get a Coupon",
 *     operationId="Coupon_show",
 *     security={{"wpCookieAuth": {}}},
 *     @OA\Parameter(name="id", in="path", required=true, @OA\Schema(type="integer")),
 *     @OA\Response(
 *         response=200,
 *         description="Single record",
 *         @OA\JsonContent(
 *             type="object",
 *             @OA\Property(property="data", ref="#/components/schemas/CouponResource"),
 *             @OA\Property(property="message", type="string")
 *         )
 *     ),
 *     @OA\Response(response=404, description="Not found", @OA\JsonContent(ref="#/components/schemas/ErrorResponse"))
 * )
 *
 * @OA\Post(
 *     path="/coupons",
 *     tags={"Pricing"},
 *     summary="Create a Coupon",
 *     operationId="Coupon_create",
 *     security={{"wpCookieAuth": {}}},
 *     @OA\RequestBody(required=true, @OA\JsonContent(ref="#/components/schemas/CreateCouponDTO")),
 *     @OA\Response(
 *         response=201,
 *         description="Created",
 *         @OA\JsonContent(
 *             type="object",
 *             @OA\Property(property="data", ref="#/components/schemas/CouponResource"),
 *             @OA\Property(property="message", type="string")
 *         )
 *     ),
 *     @OA\Response(response=422, description="Validation error", @OA\JsonContent(ref="#/components/schemas/ErrorResponse"))
 * )
 *
 * @OA\Put(
 *     path="/coupons/{id}",
 *     tags={"Pricing"},
 *     summary="Update a Coupon",
 *     operationId="Coupon_update",
 *     security={{"wpCookieAuth": {}}},
 *     @OA\Parameter(name="id", in="path", required=true, @OA\Schema(type="integer")),
 *     @OA\RequestBody(required=true, @OA\JsonContent(ref="#/components/schemas/UpdateCouponDTO")),
 *     @OA\Response(
 *         response=200,
 *         description="Updated",
 *         @OA\JsonContent(
 *             type="object",
 *             @OA\Property(property="data", ref="#/components/schemas/CouponResource"),
 *             @OA\Property(property="message", type="string")
 *         )
 *     ),
 *     @OA\Response(response=422, description="Validation error", @OA\JsonContent(ref="#/components/schemas/ErrorResponse"))
 * )
 *
 * @OA\Delete(
 *     path="/coupons/{id}",
 *     tags={"Pricing"},
 *     summary="Delete a Coupon",
 *     operationId="Coupon_delete",
 *     security={{"wpCookieAuth": {}}},
 *     @OA\Parameter(name="id", in="path", required=true, @OA\Schema(type="integer")),
 *     @OA\Response(
 *         response=200,
 *         description="Deleted",
 *         @OA\JsonContent(
 *             type="object",
 *             @OA\Property(property="data"),
 *             @OA\Property(property="message", type="string")
 *         )
 *     ),
 *     @OA\Response(response=404, description="Not found", @OA\JsonContent(ref="#/components/schemas/ErrorResponse"))
 * )
 *
 * @OA\Post(
 *     path="/coupons/bulk",
 *     tags={"Pricing"},
 *     summary="Bulk actions for Coupon",
 *     operationId="Coupon_bulk_actions",
 *     security={{"wpCookieAuth": {}}},
 *     @OA\RequestBody(required=true, @OA\JsonContent(ref="#/components/schemas/BulkActionRequest")),
 *     @OA\Response(
 *         response=200,
 *         description="Bulk action result",
 *         @OA\JsonContent(
 *             type="object",
 *             @OA\Property(property="data"),
 *             @OA\Property(property="message", type="string")
 *         )
 *     ),
 *     @OA\Response(response=400, description="Bad request", @OA\JsonContent(ref="#/components/schemas/ErrorResponse")),
 *     @OA\Response(response=422, description="Validation error", @OA\JsonContent(ref="#/components/schemas/ErrorResponse"))
 * )
 *
 * @since 1.0.0
 */
class CouponPaths
{
}
