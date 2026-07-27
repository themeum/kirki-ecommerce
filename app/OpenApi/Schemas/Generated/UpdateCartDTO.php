<?php

namespace Kirki\Ecommerce\App\OpenApi\Schemas\Generated;

use OpenApi\Annotations as OA;

/**
 * Auto-generated OpenAPI schema for Kirki\\Ecommerce\\App\\DTO\\Cart\\UpdateCartDTO.
 *
 * @OA\Schema(
 *     schema="UpdateCartDTO",
 *     type="object",
 *     @OA\Property(property="shipping_address", type="array", nullable=true, @OA\Items(type="string")),
 *     @OA\Property(property="billing_address", type="array", nullable=true, @OA\Items(type="string")),
 *     @OA\Property(property="shipping_method", type="string"),
 *     @OA\Property(property="coupon_code", type="string", nullable=true),
 *     @OA\Property(property="customer_notes", type="string", nullable=true),
 *     @OA\Property(property="customer_id", type="integer", nullable=true),
 *     @OA\Property(property="token", type="string", nullable=true)
 * )
 *
 * @since 1.0.0
 */
class UpdateCartDTO
{
}
