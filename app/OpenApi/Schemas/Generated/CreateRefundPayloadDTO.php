<?php

namespace Kirki\Ecommerce\App\OpenApi\Schemas\Generated;

use OpenApi\Annotations as OA;

/**
 * Auto-generated OpenAPI schema for Kirki\\Ecommerce\\App\\DTO\\Refund\\CreateRefundPayloadDTO.
 *
 * @OA\Schema(
 *     schema="CreateRefundPayloadDTO",
 *     type="object",
 *     @OA\Property(property="order_id", type="integer"),
 *     @OA\Property(property="amount", type="number"),
 *     @OA\Property(property="reason", type="string", nullable=true),
 *     @OA\Property(property="created_by", type="integer")
 * )
 *
 * @since 1.0.0
 */
class CreateRefundPayloadDTO
{
}
