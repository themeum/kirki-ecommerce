<?php

namespace Kirki\Ecommerce\App\OpenApi\Schemas\Generated;

use OpenApi\Annotations as OA;

/**
 * Auto-generated OpenAPI schema for Kirki\\Ecommerce\\App\\Resources\\Customer\\CustomerResource.
 *
 * @OA\Schema(
 *     schema="CustomerResource",
 *     type="object",
 *     @OA\Property(property="id", type="integer"),
 *     @OA\Property(property="user_id", type="integer"),
 *     @OA\Property(property="first_name", type="string", nullable=true),
 *     @OA\Property(property="last_name", type="string", nullable=true),
 *     @OA\Property(property="email", type="string", nullable=true),
 *     @OA\Property(property="phone", type="string", nullable=true),
 *     @OA\Property(property="photo", type="string", nullable=true),
 *     @OA\Property(property="shipping_address", type="string", nullable=true),
 *     @OA\Property(property="is_billing_same_as_shipping", type="boolean"),
 *     @OA\Property(property="billing_address", type="string", nullable=true),
 *     @OA\Property(property="tags", type="string", nullable=true),
 *     @OA\Property(property="created_at", type="string", nullable=true),
 *     @OA\Property(property="updated_at", type="string", nullable=true)
 * )
 *
 * @since 1.0.0
 */
class CustomerResource
{
}
