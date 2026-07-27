<?php

namespace Kirki\Ecommerce\App\OpenApi\Schemas\Generated;

use OpenApi\Annotations as OA;

/**
 * Auto-generated OpenAPI schema for Kirki\\Ecommerce\\App\\DTO\\Product\\ProductListFilterDTO.
 *
 * @OA\Schema(
 *     schema="ProductListFilterDTO",
 *     type="object",
 *     @OA\Property(property="status", type="string", nullable=true),
 *     @OA\Property(property="category_ids", type="array", nullable=true, @OA\Items(type="integer")),
 *     @OA\Property(property="brand_id", type="integer", nullable=true),
 *     @OA\Property(property="collection_id", type="string", nullable=true),
 *     @OA\Property(property="inventory_type", type="string", nullable=true),
 *     @OA\Property(property="search", type="string", nullable=true),
 *     @OA\Property(property="page", type="integer"),
 *     @OA\Property(property="limit", type="integer"),
 *     @OA\Property(property="sort_by", type="string"),
 *     @OA\Property(property="sort_order", type="string")
 * )
 *
 * @since 1.0.0
 */
class ProductListFilterDTO
{
}
