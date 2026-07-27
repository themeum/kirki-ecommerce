<?php

namespace Kirki\Ecommerce\App\OpenApi\Schemas\Generated;

use OpenApi\Annotations as OA;

/**
 * Auto-generated OpenAPI schema for Kirki\\Ecommerce\\App\\DTO\\Calculation\\CalculationItemDTO.
 *
 * @OA\Schema(
 *     schema="CalculationItemDTO",
 *     type="object",
 *     @OA\Property(property="id", type="integer"),
 *     @OA\Property(property="variant_id", type="integer"),
 *     @OA\Property(property="product_id", type="integer"),
 *     @OA\Property(property="quantity", type="integer"),
 *     @OA\Property(property="unit_price", type="integer"),
 *     @OA\Property(property="weight", type="integer"),
 *     @OA\Property(property="shipping_profile_id", type="integer"),
 *     @OA\Property(property="tax_profile_id", type="integer", nullable=true),
 *     @OA\Property(property="product_categories", type="array", @OA\Items(type="string")),
 *     @OA\Property(property="meta", type="array", @OA\Items(type="string")),
 *     @OA\Property(property="subtotal", type="integer"),
 *     @OA\Property(property="tax_rate", type="integer"),
 *     @OA\Property(property="tax_amount", type="integer"),
 *     @OA\Property(property="tax_breakdown", type="array", @OA\Items(type="string")),
 *     @OA\Property(property="discount_amount", type="integer"),
 *     @OA\Property(property="total", type="integer")
 * )
 *
 * @since 1.0.0
 */
class CalculationItemDTO
{
}
