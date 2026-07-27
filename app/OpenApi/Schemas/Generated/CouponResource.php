<?php

namespace Kirki\Ecommerce\App\OpenApi\Schemas\Generated;

use OpenApi\Annotations as OA;

/**
 * Auto-generated OpenAPI schema for Kirki\\Ecommerce\\App\\Resources\\Coupon\\CouponResource.
 *
 * @OA\Schema(
 *     schema="CouponResource",
 *     type="object",
 *     @OA\Property(property="id", type="integer"),
 *     @OA\Property(property="method", type="string", nullable=true),
 *     @OA\Property(property="title", type="string", nullable=true),
 *     @OA\Property(property="code", type="string", nullable=true),
 *     @OA\Property(property="discount_type", type="string", nullable=true),
 *     @OA\Property(property="discount_target", type="string", nullable=true),
 *     @OA\Property(property="discount_value_type", type="string", nullable=true),
 *     @OA\Property(property="discount_amount", type="string", nullable=true),
 *     @OA\Property(property="eligible_item_type", type="string", nullable=true),
 *     @OA\Property(property="spend_condition_type", type="string", nullable=true),
 *     @OA\Property(property="spend_condition_value", type="string", nullable=true),
 *     @OA\Property(property="reward_quantity", type="string", nullable=true),
 *     @OA\Property(property="reward_value", type="string", nullable=true),
 *     @OA\Property(property="start_date", type="string", nullable=true),
 *     @OA\Property(property="start_time", type="string", nullable=true),
 *     @OA\Property(property="has_end_date", type="boolean"),
 *     @OA\Property(property="end_date", type="string", nullable=true),
 *     @OA\Property(property="end_time", type="string", nullable=true),
 *     @OA\Property(property="target_countries", type="string", nullable=true),
 *     @OA\Property(property="first_time_buyer_only", type="string", nullable=true),
 *     @OA\Property(property="customer_eligibility", type="string", nullable=true),
 *     @OA\Property(property="exclude_customers", type="string", nullable=true),
 *     @OA\Property(property="has_usage_limit", type="boolean"),
 *     @OA\Property(property="usage_limit", type="string", nullable=true),
 *     @OA\Property(property="has_customer_limit", type="boolean"),
 *     @OA\Property(property="customer_limit", type="string", nullable=true),
 *     @OA\Property(property="current_usage_count", type="integer"),
 *     @OA\Property(property="is_active", type="boolean"),
 *     @OA\Property(property="categories", type="string", nullable=true),
 *     @OA\Property(property="products", type="string", nullable=true),
 *     @OA\Property(property="customers", type="string", nullable=true),
 *     @OA\Property(property="created_at", type="string", nullable=true),
 *     @OA\Property(property="updated_at", type="string", nullable=true)
 * )
 *
 * @since 1.0.0
 */
class CouponResource
{
}
