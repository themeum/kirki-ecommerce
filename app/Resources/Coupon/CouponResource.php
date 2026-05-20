<?php

namespace Kirki\Ecommerce\App\Resources\Coupon;

use Kirki\Ecommerce\App\Constants\Coupon\DiscountValueType;
use Kirki\Ecommerce\Resource;
use Kirki\Ecommerce\Supports\Facades\Money;

class CouponResource extends Resource
{
    /**
     * Convert the coupon resource to an array.
     *
     * @return array The coupon data as an associative array.
     */
    public function to_array()
    {
        return [
            'id' => $this->id,
            'method' => $this->method,
            'title' => $this->title,
            'code' => $this->code,
            'discount_type' => $this->discount_type,
            'discount_target' => $this->discount_target,
            'discount_value_type' => $this->discount_value_type,
            'discount_amount' => $this->discount_value_type === DiscountValueType::FIXED ? $this->prepare_amount($this->discount_amount_fixed) : $this->discount_amount_percentage,
            'eligible_item_type' => $this->eligible_item_type,
            'spend_condition_type' => $this->spend_condition_type,
            'spend_condition_value' => $this->spend_condition_value,
            'reward_quantity' => $this->reward_quantity,
            'reward_value' => $this->reward_value,
            'start_date' => $this->start_date,
            'start_time' => $this->start_time,
            'has_end_date' => $this->has_end_date,
            'end_date' => $this->end_date,
            'end_time' => $this->end_time,
            'target_countries' => $this->target_countries,
            'first_time_buyer_only' => $this->first_time_buyer_only,
            'customer_eligibility' => $this->customer_eligibility,
            'exclude_customers' => $this->exclude_customers,
            'has_usage_limit' => $this->has_usage_limit,
            'usage_limit' => $this->usage_limit,
            'has_customer_limit' => $this->has_customer_limit,
            'customer_limit' => $this->customer_limit,
            'current_usage_count' => $this->current_usage_count,
            'is_active' => $this->is_active,
            'categories' => !empty($this->categories) ? $this->categories->pluck('id')->all() : [],
            'products' => !empty($this->products) ? $this->products->pluck('id')->all() : [],
            'customers' => !empty($this->customers) ? $this->customers->pluck('id')->all() : [],
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }

    protected function prepare_amount($amount)
    {
        return Money::from_minor($amount)->getAmount();
    }
}
