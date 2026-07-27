<?php

namespace Kirki\Ecommerce\App\OpenApi\Schemas\Generated;

use OpenApi\Annotations as OA;

/**
 * Auto-generated OpenAPI schema for Kirki\\Ecommerce\\App\\Resources\\PaymentGateway\\PaymentGatewayResource.
 *
 * @OA\Schema(
 *     schema="PaymentGatewayResource",
 *     type="object",
 *     @OA\Property(property="id", type="integer"),
 *     @OA\Property(property="name", type="string", nullable=true),
 *     @OA\Property(property="icon", type="string", nullable=true),
 *     @OA\Property(property="is_enabled", type="boolean"),
 *     @OA\Property(property="is_manual", type="boolean"),
 *     @OA\Property(property="description", type="string", nullable=true),
 *     @OA\Property(property="settings", type="string", nullable=true),
 *     @OA\Property(property="fields", type="string", nullable=true),
 *     @OA\Property(property="webhook_url", type="string", nullable=true),
 *     @OA\Property(property="webhook_events", type="string", nullable=true)
 * )
 *
 * @since 1.0.0
 */
class PaymentGatewayResource
{
}
