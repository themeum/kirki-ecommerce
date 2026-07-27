<?php

namespace Kirki\Ecommerce\App\OpenApi\Schemas\Generated;

use OpenApi\Annotations as OA;

/**
 * Auto-generated OpenAPI schema for Kirki\\Ecommerce\\App\\DTO\\Order\\OrderListFilterDTO.
 *
 * @OA\Schema(
 *     schema="OrderListFilterDTO",
 *     type="object",
 *     @OA\Property(property="customer_id", type="integer", nullable=true),
 *     @OA\Property(property="start_date", type="string", nullable=true),
 *     @OA\Property(property="end_date", type="string", nullable=true),
 *     @OA\Property(property="status", type="string", nullable=true),
 *     @OA\Property(property="search", type="string", nullable=true),
 *     @OA\Property(property="page", type="integer"),
 *     @OA\Property(property="limit", type="integer"),
 *     @OA\Property(property="sort_by", type="string"),
 *     @OA\Property(property="sort_order", type="string")
 * )
 *
 * @since 1.0.0
 */
class OrderListFilterDTO
{
}
