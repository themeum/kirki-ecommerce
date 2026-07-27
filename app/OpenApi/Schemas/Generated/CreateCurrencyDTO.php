<?php

namespace Kirki\Ecommerce\App\OpenApi\Schemas\Generated;

use OpenApi\Annotations as OA;

/**
 * Auto-generated OpenAPI schema for Kirki\\Ecommerce\\App\\DTO\\Currency\\CreateCurrencyDTO.
 *
 * @OA\Schema(
 *     schema="CreateCurrencyDTO",
 *     type="object",
 *     @OA\Property(property="code", type="string", nullable=true),
 *     @OA\Property(property="name", type="string"),
 *     @OA\Property(property="symbol", type="string", nullable=true),
 *     @OA\Property(property="exchange_rate", type="number", nullable=true),
 *     @OA\Property(property="is_base", type="string", nullable=true),
 *     @OA\Property(property="is_active", type="string")
 * )
 *
 * @since 1.0.0
 */
class CreateCurrencyDTO
{
}
