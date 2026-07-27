<?php

namespace Kirki\Ecommerce\App\OpenApi\Schemas\Generated;

use OpenApi\Annotations as OA;

/**
 * Auto-generated OpenAPI schema for Kirki\\Ecommerce\\App\\Resources\\Order\\OrderResource.
 *
 * @OA\Schema(
 *     schema="OrderResource",
 *     type="object",
 *     @OA\Property(property="id", type="integer"),
 *     @OA\Property(property="uuid", type="integer"),
 *     @OA\Property(property="order_number", type="string", nullable=true),
 *     @OA\Property(property="customer_id", type="integer"),
 *     @OA\Property(property="status", type="string", nullable=true),
 *     @OA\Property(property="currency_code", type="string", nullable=true),
 *     @OA\Property(property="totals", type="string", nullable=true),
 *     @OA\Property(property="subtotal", type="string", nullable=true),
 *     @OA\Property(property="shipping", type="string", nullable=true),
 *     @OA\Property(property="discount", type="string", nullable=true),
 *     @OA\Property(property="tax", type="string", nullable=true),
 *     @OA\Property(property="total", type="integer"),
 *     @OA\Property(property="items_count", type="integer"),
 *     @OA\Property(property="items", type="string", nullable=true),
 *     @OA\Property(property="product_name", type="string", nullable=true),
 *     @OA\Property(property="variant_name", type="string", nullable=true),
 *     @OA\Property(property="quantity", type="string", nullable=true),
 *     @OA\Property(property="price", type="string", nullable=true),
 *     @OA\Property(property="tax_rate", type="string", nullable=true),
 *     @OA\Property(property="tax_total", type="string", nullable=true),
 *     @OA\Property(property="tax_breakdown", type="string", nullable=true),
 *     @OA\Property(property="sku", type="string", nullable=true),
 *     @OA\Property(property="image", type="string", nullable=true),
 *     @OA\Property(property="shipping_address", type="string", nullable=true),
 *     @OA\Property(property="first_name", type="string", nullable=true),
 *     @OA\Property(property="last_name", type="string", nullable=true),
 *     @OA\Property(property="line1", type="string", nullable=true),
 *     @OA\Property(property="line2", type="string", nullable=true),
 *     @OA\Property(property="city", type="string", nullable=true),
 *     @OA\Property(property="state", type="string", nullable=true),
 *     @OA\Property(property="country", type="string", nullable=true),
 *     @OA\Property(property="postal_code", type="string", nullable=true),
 *     @OA\Property(property="phone", type="string", nullable=true),
 *     @OA\Property(property="email", type="string", nullable=true),
 *     @OA\Property(property="billing_address", type="string", nullable=true),
 *     @OA\Property(property="payment_method", type="string", nullable=true),
 *     @OA\Property(property="payment_status", type="string", nullable=true),
 *     @OA\Property(property="shipping_method", type="string", nullable=true),
 *     @OA\Property(property="customer_notes", type="string", nullable=true),
 *     @OA\Property(property="refunds", type="string", nullable=true),
 *     @OA\Property(property="amount", type="string", nullable=true),
 *     @OA\Property(property="reason", type="string", nullable=true),
 *     @OA\Property(property="transaction_id", type="integer"),
 *     @OA\Property(property="created_at", type="string", nullable=true),
 *     @OA\Property(property="created_by", type="string", nullable=true)
 * )
 *
 * @since 1.0.0
 */
class OrderResource
{
}
