<?php

namespace Kirki\Ecommerce\App\OpenApi\Schemas\Generated;

use OpenApi\Annotations as OA;

/**
 * Auto-generated OpenAPI schema for Kirki\\Ecommerce\\App\\DTO\\Coupon\\UpdateCouponDTO.
 *
 * @OA\Schema(
 *     schema="UpdateCouponDTO",
 *     type="object",
 *     @OA\Property(property="id", type="integer"),
 *     @OA\Property(property="method", type="string"),
 *     @OA\Property(property="title", type="string"),
 *     @OA\Property(property="code", type="string", nullable=true),
 *     @OA\Property(property="discount_type", type="string"),
 *     @OA\Property(property="discount_target", type="string", nullable=true),
 *     @OA\Property(property="discount_value_type", type="string", nullable=true),
 *     @OA\Property(property="discount_amount", type="integer", nullable=true),
 *     @OA\Property(property="eligible_item_type", type="string", nullable=true),
 *     @OA\Property(property="spend_condition_type", type="string", nullable=true),
 *     @OA\Property(property="spend_condition_value", type="integer", nullable=true),
 *     @OA\Property(property="reward_quantity", type="integer", nullable=true),
 *     @OA\Property(property="reward_value", type="integer", nullable=true),
 *     @OA\Property(property="start_date", type="string"),
 *     @OA\Property(property="start_time", type="string", nullable=true),
 *     @OA\Property(property="has_end_date", type="boolean"),
 *     @OA\Property(property="end_date", type="string", nullable=true),
 *     @OA\Property(property="end_time", type="string", nullable=true),
 *     @OA\Property(property="target_countries", type="string", nullable=true),
 *     @OA\Property(property="first_time_buyer_only", type="boolean"),
 *     @OA\Property(property="customer_eligibility", type="string"),
 *     @OA\Property(property="exclude_customers", type="boolean"),
 *     @OA\Property(property="has_usage_limit", type="boolean"),
 *     @OA\Property(property="usage_limit", type="integer", nullable=true),
 *     @OA\Property(property="has_customer_limit", type="boolean"),
 *     @OA\Property(property="customer_limit", type="integer", nullable=true),
 *     @OA\Property(property="is_active", type="boolean"),
 *     @OA\Property(property="category_ids", type="array", @OA\Items(type="string")),
 *     @OA\Property(property="product_ids", type="array", @OA\Items(type="string")),
 *     @OA\Property(property="customer_ids", type="array", @OA\Items(type="string")),
 *     @OA\Property(property="reward_product_ids", type="array", @OA\Items(type="string"))
 * )
 *
 * @since 1.0.0
 */
class UpdateCouponDTO
{
}
