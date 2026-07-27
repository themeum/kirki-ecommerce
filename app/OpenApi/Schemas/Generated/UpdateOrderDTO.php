<?php

namespace Kirki\Ecommerce\App\OpenApi\Schemas\Generated;

use OpenApi\Annotations as OA;

/**
 * Auto-generated OpenAPI schema for Kirki\\Ecommerce\\App\\DTO\\Order\\UpdateOrderDTO.
 *
 * @OA\Schema(
 *     schema="UpdateOrderDTO",
 *     type="object",
 *     @OA\Property(property="id", type="integer"),
 *     @OA\Property(property="uuid", type="string"),
 *     @OA\Property(property="order_number", type="string"),
 *     @OA\Property(property="customer_id", type="integer"),
 *     @OA\Property(property="order_status", type="string"),
 *     @OA\Property(property="is_manual", type="boolean"),
 *     @OA\Property(property="currency_code", type="string"),
 *     @OA\Property(property="base_currency_code", type="string"),
 *     @OA\Property(property="exchange_rate", type="number"),
 *     @OA\Property(property="subtotal", type="integer"),
 *     @OA\Property(property="subtotal_base", type="integer"),
 *     @OA\Property(property="shipping_total", type="integer"),
 *     @OA\Property(property="shipping_total_base", type="integer"),
 *     @OA\Property(property="discount_total", type="integer"),
 *     @OA\Property(property="discount_total_base", type="integer"),
 *     @OA\Property(property="discount_details", type="array", @OA\Items(type="string")),
 *     @OA\Property(property="tax_total", type="integer"),
 *     @OA\Property(property="tax_total_base", type="integer"),
 *     @OA\Property(property="total", type="integer"),
 *     @OA\Property(property="total_base", type="integer"),
 *     @OA\Property(property="items_count", type="integer"),
 *     @OA\Property(property="payment_status", type="string"),
 *     @OA\Property(property="payment_method", type="string"),
 *     @OA\Property(property="shipping_method", type="string"),
 *     @OA\Property(property="shipping_first_name", type="string"),
 *     @OA\Property(property="shipping_last_name", type="string"),
 *     @OA\Property(property="shipping_address_line1", type="string"),
 *     @OA\Property(property="shipping_address_line2", type="string"),
 *     @OA\Property(property="shipping_city", type="string"),
 *     @OA\Property(property="shipping_state", type="string"),
 *     @OA\Property(property="shipping_country", type="string"),
 *     @OA\Property(property="shipping_postal_code", type="string"),
 *     @OA\Property(property="shipping_phone", type="string"),
 *     @OA\Property(property="shipping_email", type="string"),
 *     @OA\Property(property="billing_first_name", type="string"),
 *     @OA\Property(property="billing_last_name", type="string"),
 *     @OA\Property(property="billing_address_line1", type="string"),
 *     @OA\Property(property="billing_address_line2", type="string"),
 *     @OA\Property(property="billing_city", type="string"),
 *     @OA\Property(property="billing_state", type="string"),
 *     @OA\Property(property="billing_country", type="string"),
 *     @OA\Property(property="billing_postal_code", type="string"),
 *     @OA\Property(property="billing_phone", type="string"),
 *     @OA\Property(property="billing_email", type="string"),
 *     @OA\Property(property="customer_notes", type="string", nullable=true),
 *     @OA\Property(property="items", type="array", @OA\Items(ref="#/components/schemas/CreateOrderItemDTO")),
 *     @OA\Property(property="billing_company", type="string", nullable=true),
 *     @OA\Property(property="customer_email", type="string", nullable=true),
 *     @OA\Property(property="customer_phone", type="string", nullable=true)
 * )
 *
 * @since 1.0.0
 */
class UpdateOrderDTO
{
}
