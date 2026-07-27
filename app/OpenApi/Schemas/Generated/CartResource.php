<?php

namespace Kirki\Ecommerce\App\OpenApi\Schemas\Generated;

use OpenApi\Annotations as OA;

/**
 * Auto-generated OpenAPI schema for Kirki\\Ecommerce\\App\\Resources\\Cart\\CartResource.
 *
 * @OA\Schema(
 *     schema="CartResource",
 *     type="object",
 *     @OA\Property(property="id", type="integer"),
 *     @OA\Property(property="customer_id", type="integer"),
 *     @OA\Property(property="cart_token", type="string", nullable=true),
 *     @OA\Property(property="currency", type="string", nullable=true),
 *     @OA\Property(property="code", type="string", nullable=true),
 *     @OA\Property(property="base_code", type="string", nullable=true),
 *     @OA\Property(property="pricing", type="string", nullable=true),
 *     @OA\Property(property="subtotal", type="string", nullable=true),
 *     @OA\Property(property="tax_total", type="string", nullable=true),
 *     @OA\Property(property="discount_details", type="string", nullable=true),
 *     @OA\Property(property="discount_total", type="string", nullable=true),
 *     @OA\Property(property="shipping_subtotal", type="string", nullable=true),
 *     @OA\Property(property="shipping_tax", type="string", nullable=true),
 *     @OA\Property(property="shipping_discount", type="string", nullable=true),
 *     @OA\Property(property="shipping_total", type="string", nullable=true),
 *     @OA\Property(property="total", type="integer"),
 *     @OA\Property(property="items_count", type="integer"),
 *     @OA\Property(property="items", type="string", nullable=true),
 *     @OA\Property(property="shipping_address", type="string", nullable=true),
 *     @OA\Property(property="billing_address", type="string", nullable=true),
 *     @OA\Property(property="available_shipping_methods", type="string", nullable=true),
 *     @OA\Property(property="shipping_method", type="string", nullable=true),
 *     @OA\Property(property="customer_notes", type="string", nullable=true),
 *     @OA\Property(property="ip_address", type="string", nullable=true),
 *     @OA\Property(property="user_agent", type="string", nullable=true),
 *     @OA\Property(property="expires_at", type="string", nullable=true),
 *     @OA\Property(property="created_at", type="string", nullable=true),
 *     @OA\Property(property="updated_at", type="string", nullable=true)
 * )
 *
 * @since 1.0.0
 */
class CartResource
{
}
