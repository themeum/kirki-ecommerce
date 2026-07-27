<?php

namespace Kirki\Ecommerce\App\OpenApi\Schemas\Generated;

use OpenApi\Annotations as OA;

/**
 * Auto-generated OpenAPI schema for Kirki\\Ecommerce\\App\\DTO\\Product\\UpdateProductDTO.
 *
 * @OA\Schema(
 *     schema="UpdateProductDTO",
 *     type="object",
 *     @OA\Property(property="id", type="integer"),
 *     @OA\Property(property="title", type="string"),
 *     @OA\Property(property="slug", type="string", nullable=true),
 *     @OA\Property(property="status", type="string", nullable=true),
 *     @OA\Property(property="ribbon", type="string", nullable=true),
 *     @OA\Property(property="currency_id", type="integer", nullable=true),
 *     @OA\Property(property="brand_id", type="integer", nullable=true),
 *     @OA\Property(property="description", type="string", nullable=true),
 *     @OA\Property(property="additional_info", type="string", nullable=true),
 *     @OA\Property(property="allow_back_order", type="boolean", nullable=true),
 *     @OA\Property(property="seo_title", type="string", nullable=true),
 *     @OA\Property(property="seo_description", type="string", nullable=true),
 *     @OA\Property(property="seo_keywords", type="array", nullable=true, @OA\Items(type="string")),
 *     @OA\Property(property="og_title", type="string", nullable=true),
 *     @OA\Property(property="og_description", type="string", nullable=true),
 *     @OA\Property(property="og_image", type="integer", nullable=true),
 *     @OA\Property(property="schema_id", type="integer", nullable=true),
 *     @OA\Property(property="llm_instructions", type="string", nullable=true),
 *     @OA\Property(property="has_variants", type="boolean", nullable=true),
 *     @OA\Property(property="media", type="array", nullable=true, @OA\Items(type="integer")),
 *     @OA\Property(property="categories", type="array", nullable=true, @OA\Items(type="integer")),
 *     @OA\Property(property="tags", type="array", nullable=true, @OA\Items(type="integer")),
 *     @OA\Property(property="collections", type="array", nullable=true, @OA\Items(type="integer")),
 *     @OA\Property(property="attributes", type="array", nullable=true, @OA\Items(type="integer")),
 *     @OA\Property(property="tax_profile_id", type="integer", nullable=true),
 *     @OA\Property(property="shipping_profile_id", type="integer", nullable=true),
 *     @OA\Property(property="shipping_box_id", type="integer", nullable=true)
 * )
 *
 * @since 1.0.0
 */
class UpdateProductDTO
{
}
