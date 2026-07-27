<?php

namespace Kirki\Ecommerce\App\OpenApi\Schemas\Generated;

use OpenApi\Annotations as OA;

/**
 * Auto-generated OpenAPI schema for Kirki\\Ecommerce\\App\\DTO\\Order\\CreateOrderPayloadDTO.
 *
 * @OA\Schema(
 *     schema="CreateOrderPayloadDTO",
 *     type="object",
 *     @OA\Property(property="customer_id", type="integer", nullable=true),
 *     @OA\Property(property="items", type="string"),
 *     @OA\Property(property="currency_code", type="string"),
 *     @OA\Property(property="payment_method", type="string"),
 *     @OA\Property(property="coupon_code", type="string", nullable=true),
 *     @OA\Property(property="shipping_method", type="string", nullable=true),
 *     @OA\Property(property="shipping_first_name", type="string", nullable=true),
 *     @OA\Property(property="shipping_last_name", type="string", nullable=true),
 *     @OA\Property(property="shipping_address_line1", type="string", nullable=true),
 *     @OA\Property(property="shipping_address_line2", type="string", nullable=true),
 *     @OA\Property(property="shipping_city", type="string", nullable=true),
 *     @OA\Property(property="shipping_state", type="string", nullable=true),
 *     @OA\Property(property="shipping_postcode", type="string", nullable=true),
 *     @OA\Property(property="shipping_country", type="string", nullable=true),
 *     @OA\Property(property="shipping_phone", type="string", nullable=true),
 *     @OA\Property(property="shipping_email", type="string", nullable=true),
 *     @OA\Property(property="shipping_company", type="string", nullable=true),
 *     @OA\Property(property="billing_first_name", type="string", nullable=true),
 *     @OA\Property(property="billing_last_name", type="string", nullable=true),
 *     @OA\Property(property="billing_address_line1", type="string", nullable=true),
 *     @OA\Property(property="billing_address_line2", type="string", nullable=true),
 *     @OA\Property(property="billing_city", type="string", nullable=true),
 *     @OA\Property(property="billing_state", type="string", nullable=true),
 *     @OA\Property(property="billing_postcode", type="string", nullable=true),
 *     @OA\Property(property="billing_country", type="string", nullable=true),
 *     @OA\Property(property="billing_phone", type="string", nullable=true),
 *     @OA\Property(property="billing_email", type="string", nullable=true),
 *     @OA\Property(property="billing_company", type="string", nullable=true),
 *     @OA\Property(property="customer_email", type="string", nullable=true),
 *     @OA\Property(property="customer_phone", type="string", nullable=true),
 *     @OA\Property(property="customer_notes", type="string", nullable=true),
 *     @OA\Property(property="ip_address", type="string", nullable=true),
 *     @OA\Property(property="user_agent", type="string", nullable=true),
 *     @OA\Property(property="created_by", type="integer", nullable=true),
 *     @OA\Property(property="is_manual", type="integer", nullable=true)
 * )
 *
 * @since 1.0.0
 */
class CreateOrderPayloadDTO
{
}
