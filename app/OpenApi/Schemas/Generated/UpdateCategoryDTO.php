<?php

namespace Kirki\Ecommerce\App\OpenApi\Schemas\Generated;

use OpenApi\Annotations as OA;

/**
 * Auto-generated OpenAPI schema for Kirki\\Ecommerce\\App\\DTO\\Category\\UpdateCategoryDTO.
 *
 * @OA\Schema(
 *     schema="UpdateCategoryDTO",
 *     type="object",
 *     @OA\Property(property="id", type="integer"),
 *     @OA\Property(property="parent_id", type="integer", nullable=true),
 *     @OA\Property(property="name", type="string"),
 *     @OA\Property(property="slug", type="string", nullable=true),
 *     @OA\Property(property="description", type="string", nullable=true),
 *     @OA\Property(property="image", type="integer", nullable=true),
 *     @OA\Property(property="level", type="integer"),
 *     @OA\Property(property="ordering", type="integer"),
 *     @OA\Property(property="is_active", type="string"),
 *     @OA\Property(property="is_deletable", type="string")
 * )
 *
 * @since 1.0.0
 */
class UpdateCategoryDTO
{
}
