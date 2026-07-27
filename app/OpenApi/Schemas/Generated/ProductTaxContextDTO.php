<?php

namespace Kirki\Ecommerce\App\OpenApi\Schemas\Generated;

use OpenApi\Annotations as OA;

/**
 * Auto-generated OpenAPI schema for Kirki\\Ecommerce\\App\\DTO\\Tax\\ProductTaxContextDTO.
 *
 * @OA\Schema(
 *     schema="ProductTaxContextDTO",
 *     type="object",
 *     @OA\Property(property="shipping_address", type="array", @OA\Items(type="string")),
 *     @OA\Property(property="billing_address", type="array", @OA\Items(type="string")),
 *     @OA\Property(property="product_price", type="integer"),
 *     @OA\Property(property="product_categories", type="array", nullable=true, @OA\Items(type="string")),
 *     @OA\Property(property="tax_profile", type="string", nullable=true)
 * )
 *
 * @since 1.0.0
 */
class ProductTaxContextDTO
{
}
