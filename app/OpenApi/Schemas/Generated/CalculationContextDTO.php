<?php

namespace Kirki\Ecommerce\App\OpenApi\Schemas\Generated;

use OpenApi\Annotations as OA;

/**
 * Auto-generated OpenAPI schema for Kirki\\Ecommerce\\App\\DTO\\Calculation\\CalculationContextDTO.
 *
 * @OA\Schema(
 *     schema="CalculationContextDTO",
 *     type="object",
 *     @OA\Property(property="cart_id", type="integer", nullable=true),
 *     @OA\Property(property="items", type="array", @OA\Items(ref="#/components/schemas/CalculationItemDTO")),
 *     @OA\Property(property="shipping_address", type="array", @OA\Items(type="string")),
 *     @OA\Property(property="customer_id", type="integer"),
 *     @OA\Property(property="coupon", type="string", nullable=true),
 *     @OA\Property(property="shipping_method_id", type="integer"),
 *     @OA\Property(property="customer_order_count", type="integer")
 * )
 *
 * @since 1.0.0
 */
class CalculationContextDTO
{
}
