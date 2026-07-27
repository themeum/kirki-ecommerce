<?php

namespace Kirki\Ecommerce\App\OpenApi\Schemas\Generated;

use OpenApi\Annotations as OA;

/**
 * Auto-generated OpenAPI schema for Kirki\\Ecommerce\\App\\DTO\\Customer\\UpdateCustomerDTO.
 *
 * @OA\Schema(
 *     schema="UpdateCustomerDTO",
 *     type="object",
 *     @OA\Property(property="id", type="integer"),
 *     @OA\Property(property="first_name", type="string"),
 *     @OA\Property(property="last_name", type="string", nullable=true),
 *     @OA\Property(property="photo", type="integer", nullable=true),
 *     @OA\Property(property="email", type="string"),
 *     @OA\Property(property="phone", type="string", nullable=true),
 *     @OA\Property(property="accepts_marketing", type="boolean"),
 *     @OA\Property(property="is_billing_same_as_shipping", type="boolean"),
 *     @OA\Property(property="notes", type="string", nullable=true),
 *     @OA\Property(property="tags", type="array", @OA\Items(type="string")),
 *     @OA\Property(property="language", type="string", nullable=true)
 * )
 *
 * @since 1.0.0
 */
class UpdateCustomerDTO
{
}
