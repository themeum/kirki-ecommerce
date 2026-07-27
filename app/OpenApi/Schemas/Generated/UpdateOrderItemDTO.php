<?php

namespace Kirki\Ecommerce\App\OpenApi\Schemas\Generated;

use OpenApi\Annotations as OA;

/**
 * Auto-generated OpenAPI schema for Kirki\\Ecommerce\\App\\DTO\\Order\\UpdateOrderItemDTO.
 *
 * @OA\Schema(
 *     schema="UpdateOrderItemDTO",
 *     type="object",
 *     @OA\Property(property="id", type="integer"),
 *     @OA\Property(property="order_id", type="integer"),
 *     @OA\Property(property="product_id", type="integer"),
 *     @OA\Property(property="variant_id", type="integer"),
 *     @OA\Property(property="product_name", type="string"),
 *     @OA\Property(property="variant_name", type="string", nullable=true),
 *     @OA\Property(property="sku", type="string", nullable=true),
 *     @OA\Property(property="barcode", type="string", nullable=true),
 *     @OA\Property(property="product_image", type="object"),
 *     @OA\Property(property="price", type="number"),
 *     @OA\Property(property="price_base", type="number"),
 *     @OA\Property(property="quantity", type="integer"),
 *     @OA\Property(property="subtotal", type="number"),
 *     @OA\Property(property="subtotal_base", type="number"),
 *     @OA\Property(property="discount_amount", type="number"),
 *     @OA\Property(property="discount_amount_base", type="number"),
 *     @OA\Property(property="tax_total", type="number"),
 *     @OA\Property(property="tax_total_base", type="number"),
 *     @OA\Property(property="tax_rate", type="number"),
 *     @OA\Property(property="tax_breakdown", type="array", @OA\Items(type="string")),
 *     @OA\Property(property="total", type="number"),
 *     @OA\Property(property="total_base", type="number"),
 *     @OA\Property(property="is_physical_product", type="boolean"),
 *     @OA\Property(property="weight", type="number"),
 *     @OA\Property(property="weight_unit", type="string"),
 *     @OA\Property(property="product_data", type="string")
 * )
 *
 * @since 1.0.0
 */
class UpdateOrderItemDTO
{
}
