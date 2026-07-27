<?php

namespace Kirki\Ecommerce\App\OpenApi\Schemas\Generated;

use OpenApi\Annotations as OA;

/**
 * Auto-generated OpenAPI schema for Kirki\\Ecommerce\\App\\Resources\\Order\\OrderListResource.
 *
 * @OA\Schema(
 *     schema="OrderListResource",
 *     type="object",
 *     @OA\Property(property="id", type="integer"),
 *     @OA\Property(property="uuid", type="integer"),
 *     @OA\Property(property="order_number", type="string", nullable=true),
 *     @OA\Property(property="customer_id", type="integer"),
 *     @OA\Property(property="quantity", type="string", nullable=true),
 *     @OA\Property(property="total", type="integer"),
 *     @OA\Property(property="status", type="string", nullable=true),
 *     @OA\Property(property="payment_status", type="string", nullable=true),
 *     @OA\Property(property="payment_method", type="string", nullable=true),
 *     @OA\Property(property="created_at", type="string", nullable=true)
 * )
 *
 * @since 1.0.0
 */
class OrderListResource
{
}
