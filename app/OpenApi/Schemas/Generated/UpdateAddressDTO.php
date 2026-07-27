<?php

namespace Kirki\Ecommerce\App\OpenApi\Schemas\Generated;

use OpenApi\Annotations as OA;

/**
 * Auto-generated OpenAPI schema for Kirki\\Ecommerce\\App\\DTO\\Address\\UpdateAddressDTO.
 *
 * @OA\Schema(
 *     schema="UpdateAddressDTO",
 *     type="object",
 *     @OA\Property(property="id", type="integer"),
 *     @OA\Property(property="customer_id", type="integer"),
 *     @OA\Property(property="first_name", type="string"),
 *     @OA\Property(property="last_name", type="string", nullable=true),
 *     @OA\Property(property="address_line1", type="string"),
 *     @OA\Property(property="address_line2", type="string", nullable=true),
 *     @OA\Property(property="city", type="string"),
 *     @OA\Property(property="state", type="string"),
 *     @OA\Property(property="country", type="string"),
 *     @OA\Property(property="postal_code", type="string"),
 *     @OA\Property(property="email", type="string"),
 *     @OA\Property(property="phone", type="string", nullable=true),
 *     @OA\Property(property="type", type="string")
 * )
 *
 * @since 1.0.0
 */
class UpdateAddressDTO
{
}
