<?php

namespace Kirki\Ecommerce\App\OpenApi\Schemas\Generated;

use OpenApi\Annotations as OA;

/**
 * Auto-generated OpenAPI schema for Kirki\\Ecommerce\\App\\DTO\\Calculation\\CalculationResultDTO.
 *
 * @OA\Schema(
 *     schema="CalculationResultDTO",
 *     type="object",
 *     @OA\Property(property="items", type="string"),
 *     @OA\Property(property="subtotal", type="integer"),
 *     @OA\Property(property="discount_total", type="integer"),
 *     @OA\Property(property="discount_details", type="array", nullable=true, @OA\Items(type="string")),
 *     @OA\Property(property="shipping_subtotal", type="integer"),
 *     @OA\Property(property="shipping_discount", type="integer"),
 *     @OA\Property(property="shipping_tax", type="integer"),
 *     @OA\Property(property="shipping_total", type="integer"),
 *     @OA\Property(property="tax_total", type="integer"),
 *     @OA\Property(property="total", type="integer"),
 *     @OA\Property(property="items_count", type="integer")
 * )
 *
 * @since 1.0.0
 */
class CalculationResultDTO
{
}
