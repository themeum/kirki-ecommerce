<?php

namespace Kirki\Ecommerce\App\OpenApi\Paths;

use OpenApi\Annotations as OA;

/**
 * OpenAPI path definitions.
 *
 * @OA\Get(
 *     path="/cart",
 *     tags={"Cart"},
 *     summary="Get the active cart",
 *     operationId="Cart_get",
 *     security={{"wpCookieAuth": {}}},
 *     @OA\Response(
 *         response=200,
 *         description="Cart",
 *         @OA\JsonContent(
 *             type="object",
 *             @OA\Property(property="data", ref="#/components/schemas/CartResource"),
 *             @OA\Property(property="message", type="string")
 *         )
 *     )
 * )
 *
 * @OA\Post(
 *     path="/cart/items",
 *     tags={"Cart"},
 *     summary="Add an item to the cart",
 *     operationId="Cart_add_item",
 *     security={{"wpCookieAuth": {}}},
 *     @OA\RequestBody(required=true, @OA\JsonContent(ref="#/components/schemas/AddToCartDTO")),
 *     @OA\Response(response=200, description="Updated cart", @OA\JsonContent(type="object", @OA\Property(property="data", ref="#/components/schemas/CartResource"), @OA\Property(property="message", type="string")))
 * )
 *
 * @OA\Put(
 *     path="/cart/items/{id}",
 *     tags={"Cart"},
 *     summary="Update a cart item",
 *     operationId="Cart_update_item",
 *     security={{"wpCookieAuth": {}}},
 *     @OA\Parameter(name="id", in="path", required=true, @OA\Schema(type="integer")),
 *     @OA\RequestBody(required=true, @OA\JsonContent(ref="#/components/schemas/UpdateCartItemDTO")),
 *     @OA\Response(response=200, description="Updated cart", @OA\JsonContent(type="object", @OA\Property(property="data", ref="#/components/schemas/CartResource"), @OA\Property(property="message", type="string")))
 * )
 *
 * @OA\Delete(
 *     path="/cart/items/{id}",
 *     tags={"Cart"},
 *     summary="Remove a cart item",
 *     operationId="Cart_remove_item",
 *     security={{"wpCookieAuth": {}}},
 *     @OA\Parameter(name="id", in="path", required=true, @OA\Schema(type="integer")),
 *     @OA\Response(response=200, description="Updated cart", @OA\JsonContent(type="object", @OA\Property(property="data", ref="#/components/schemas/CartResource"), @OA\Property(property="message", type="string")))
 * )
 *
 * @OA\Delete(
 *     path="/cart",
 *     tags={"Cart"},
 *     summary="Empty the cart",
 *     operationId="Cart_empty_cart",
 *     security={{"wpCookieAuth": {}}},
 *     @OA\Response(response=200, description="Emptied cart", @OA\JsonContent(type="object", @OA\Property(property="data", ref="#/components/schemas/CartResource"), @OA\Property(property="message", type="string")))
 * )
 *
 * @OA\Put(
 *     path="/cart",
 *     tags={"Cart"},
 *     summary="Update cart details",
 *     operationId="Cart_update",
 *     security={{"wpCookieAuth": {}}},
 *     @OA\RequestBody(required=true, @OA\JsonContent(ref="#/components/schemas/UpdateCartDTO")),
 *     @OA\Response(response=200, description="Updated cart", @OA\JsonContent(type="object", @OA\Property(property="data", ref="#/components/schemas/CartResource"), @OA\Property(property="message", type="string")))
 * )
 *
 * @OA\Post(
 *     path="/cart/coupon",
 *     tags={"Cart"},
 *     summary="Apply a coupon to the cart",
 *     operationId="Cart_apply_coupon",
 *     security={{"wpCookieAuth": {}}},
 *     @OA\RequestBody(required=true, @OA\JsonContent(type="object", required={"code"}, @OA\Property(property="code", type="string"))),
 *     @OA\Response(response=200, description="Updated cart", @OA\JsonContent(type="object", @OA\Property(property="data", ref="#/components/schemas/CartResource"), @OA\Property(property="message", type="string")))
 * )
 *
 * @OA\Delete(
 *     path="/cart/coupon",
 *     tags={"Cart"},
 *     summary="Remove the coupon from the cart",
 *     operationId="Cart_remove_coupon",
 *     security={{"wpCookieAuth": {}}},
 *     @OA\Response(response=200, description="Updated cart", @OA\JsonContent(type="object", @OA\Property(property="data", ref="#/components/schemas/CartResource"), @OA\Property(property="message", type="string")))
 * )
 *
 * @since 1.0.0
 */
class CartPaths
{
}
