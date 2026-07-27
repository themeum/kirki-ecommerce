<?php

namespace Kirki\Ecommerce\App\OpenApi\Paths;

use OpenApi\Annotations as OA;

/**
 * OpenAPI path definitions.
 *
 * @OA\Get(
 *     path="/payment-gateways/installable",
 *     tags={"Payments"},
 *     summary="List installable payment gateways",
 *     operationId="PaymentGateway_all",
 *     security={{"wpCookieAuth": {}}},
 *     @OA\Response(
 *         response=200,
 *         description="Installable gateways",
 *         @OA\JsonContent(
 *             type="object",
 *             @OA\Property(property="data", type="array", @OA\Items(ref="#/components/schemas/InstallablePaymentGatewayListResource")),
 *             @OA\Property(property="message", type="string")
 *         )
 *     )
 * )
 *
 * @OA\Post(
 *     path="/payment-gateways/install",
 *     tags={"Payments"},
 *     summary="Install a payment gateway",
 *     operationId="PaymentGateway_install",
 *     security={{"wpCookieAuth": {}}},
 *     @OA\RequestBody(required=true, @OA\JsonContent(type="object", required={"id"}, @OA\Property(property="id", type="string"))),
 *     @OA\Response(response=200, description="Installed", @OA\JsonContent(type="object", @OA\Property(property="data"), @OA\Property(property="message", type="string")))
 * )
 *
 * @OA\Get(
 *     path="/payment-gateways",
 *     tags={"Payments"},
 *     summary="List installed payment gateways",
 *     operationId="PaymentGateway_get",
 *     security={{"wpCookieAuth": {}}},
 *     @OA\Response(
 *         response=200,
 *         description="Installed gateways",
 *         @OA\JsonContent(
 *             type="object",
 *             @OA\Property(property="data", type="array", @OA\Items(ref="#/components/schemas/PaymentGatewayListResource")),
 *             @OA\Property(property="message", type="string")
 *         )
 *     )
 * )
 *
 * @OA\Get(
 *     path="/payment-gateways/{id}",
 *     tags={"Payments"},
 *     summary="Get a payment gateway",
 *     operationId="PaymentGateway_show",
 *     security={{"wpCookieAuth": {}}},
 *     @OA\Parameter(name="id", in="path", required=true, @OA\Schema(type="string")),
 *     @OA\Response(response=200, description="Gateway detail", @OA\JsonContent(type="object", @OA\Property(property="data", ref="#/components/schemas/PaymentGatewayResource"), @OA\Property(property="message", type="string")))
 * )
 *
 * @OA\Put(
 *     path="/payment-gateways/{id}",
 *     tags={"Payments"},
 *     summary="Update a payment gateway",
 *     operationId="PaymentGateway_update",
 *     security={{"wpCookieAuth": {}}},
 *     @OA\Parameter(name="id", in="path", required=true, @OA\Schema(type="string")),
 *     @OA\RequestBody(required=true, @OA\JsonContent(type="object")),
 *     @OA\Response(response=200, description="Updated", @OA\JsonContent(type="object", @OA\Property(property="data", ref="#/components/schemas/PaymentGatewayResource"), @OA\Property(property="message", type="string")))
 * )
 *
 * @OA\Patch(
 *     path="/payment-gateways/{id}",
 *     tags={"Payments"},
 *     summary="Enable or disable a payment gateway",
 *     operationId="PaymentGateway_set_enabled",
 *     security={{"wpCookieAuth": {}}},
 *     @OA\Parameter(name="id", in="path", required=true, @OA\Schema(type="string")),
 *     @OA\RequestBody(required=true, @OA\JsonContent(type="object", required={"enabled"}, @OA\Property(property="enabled", type="boolean"))),
 *     @OA\Response(response=200, description="Updated", @OA\JsonContent(type="object", @OA\Property(property="data"), @OA\Property(property="message", type="string")))
 * )
 *
 * @since 1.0.0
 */
class PaymentGatewayPaths
{
}
