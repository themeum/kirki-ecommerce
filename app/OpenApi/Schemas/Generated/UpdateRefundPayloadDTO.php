<?php

namespace Kirki\Ecommerce\App\OpenApi\Schemas\Generated;

use OpenApi\Annotations as OA;

/**
 * Auto-generated OpenAPI schema for Kirki\\Ecommerce\\App\\DTO\\Refund\\UpdateRefundPayloadDTO.
 *
 * @OA\Schema(
 *     schema="UpdateRefundPayloadDTO",
 *     type="object",
 *     @OA\Property(property="id", type="integer"),
 *     @OA\Property(property="order_id", type="integer"),
 *     @OA\Property(property="status", type="string"),
 *     @OA\Property(property="reason", type="string", nullable=true),
 *     @OA\Property(property="refund_id", type="string", nullable=true),
 *     @OA\Property(property="updated_by", type="integer", nullable=true)
 * )
 *
 * @since 1.0.0
 */
class UpdateRefundPayloadDTO
{
}
