<?php

namespace Kirki\Ecommerce\App\OpenApi\Schemas\Generated;

use OpenApi\Annotations as OA;

/**
 * Auto-generated OpenAPI schema for Kirki\\Ecommerce\\App\\DTO\\Variant\\UpdateVariantDTO.
 *
 * @OA\Schema(
 *     schema="UpdateVariantDTO",
 *     type="object",
 *     @OA\Property(property="id", type="integer"),
 *     @OA\Property(property="media", type="integer", nullable=true),
 *     @OA\Property(property="attribute_values", type="array", @OA\Items(type="integer")),
 *     @OA\Property(property="sku", type="string", nullable=true),
 *     @OA\Property(property="barcode", type="string", nullable=true),
 *     @OA\Property(property="price", type="integer", nullable=true),
 *     @OA\Property(property="show_unit_price", type="boolean", nullable=true),
 *     @OA\Property(property="base_unit", type="string", nullable=true),
 *     @OA\Property(property="base_unit_amount", type="integer", nullable=true),
 *     @OA\Property(property="total_unit", type="string", nullable=true),
 *     @OA\Property(property="total_unit_amount", type="integer", nullable=true),
 *     @OA\Property(property="sale_price", type="integer", nullable=true),
 *     @OA\Property(property="cost_of_goods", type="integer", nullable=true),
 *     @OA\Property(property="weight", type="number", nullable=true),
 *     @OA\Property(property="weight_unit", type="string", nullable=true),
 *     @OA\Property(property="charge_taxes", type="boolean", nullable=true),
 *     @OA\Property(property="allow_back_order", type="boolean", nullable=true),
 *     @OA\Property(property="track_inventory", type="boolean", nullable=true),
 *     @OA\Property(property="available_quantity", type="integer", nullable=true),
 *     @OA\Property(property="in_stock", type="boolean", nullable=true),
 *     @OA\Property(property="committed_quantity", type="integer", nullable=true),
 *     @OA\Property(property="has_limit_per_order", type="boolean", nullable=true),
 *     @OA\Property(property="max_per_order", type="integer", nullable=true),
 *     @OA\Property(property="tax_profile_id", type="integer", nullable=true),
 *     @OA\Property(property="shipping_profile_id", type="integer", nullable=true),
 *     @OA\Property(property="shipping_box_id", type="integer", nullable=true),
 *     @OA\Property(property="is_visible", type="boolean", nullable=true),
 *     @OA\Property(property="is_physical_product", type="boolean", nullable=true),
 *     @OA\Property(property="is_default", type="boolean", nullable=true),
 *     @OA\Property(property="product_id", type="integer", nullable=true)
 * )
 *
 * @since 1.0.0
 */
class UpdateVariantDTO
{
}
