<?php

namespace Kirki\Ecommerce\App\OpenApi\Paths;

use OpenApi\Annotations as OA;

/**
 * OpenAPI path definitions.
 *
 * @OA\Post(
 *     path="/payment/webhook/{gateway_id}",
 *     tags={"Webhooks"},
 *     summary="Handle a payment gateway webhook",
 *     operationId="Webhook_handle",
 *     @OA\Parameter(name="gateway_id", in="path", required=true, @OA\Schema(type="string")),
 *     @OA\RequestBody(required=true, @OA\JsonContent(type="object")),
 *     @OA\Response(response=200, description="Webhook processed", @OA\JsonContent(type="object")),
 *     @OA\Response(response=400, description="Bad request", @OA\JsonContent(ref="#/components/schemas/ErrorResponse"))
 * )
 *
 * @since 1.0.0
 */
class WebhookPaths
{
}
