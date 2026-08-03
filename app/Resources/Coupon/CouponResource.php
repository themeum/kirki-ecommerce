<?php

namespace Kirki\Ecommerce\App\Resources\Coupon;

use Kirki\Ecommerce\App\Constants\Coupon\CouponMethod;
use Kirki\Ecommerce\App\Constants\Coupon\CustomerEligibility;
use Kirki\Ecommerce\App\Constants\Coupon\DiscountType;
use Kirki\Ecommerce\App\Constants\Coupon\DiscountValueType;
use Kirki\Ecommerce\Framework\Resource;
use Kirki\Ecommerce\App\Facades\Money;

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
            'method' => $this->method ?? CouponMethod::CODE,
            'title' => $this->title,
            'code' => $this->code,
            'discount_type' => $this->discount_type ?? DiscountType::AMOUNT_OFF,
            'discount_target' => $this->discount_target,
            'discount_value_type' => $this->discount_value_type,
            'discount_amount' => $this->discount_value_type === DiscountValueType::FIXED ? $this->prepare_amount($this->discount_amount_fixed) : $this->discount_amount_percentage,
            'eligible_item_type' => $this->eligible_item_type,
            'spend_condition_type' => $this->spend_condition_type,
            'spend_condition_value' => $this->spend_condition_value,
            'reward_quantity' => $this->reward_quantity,
            'reward_value' => $this->reward_value,
            'start_datetime' => $this->start_datetime,
            'has_end_datetime' => filter_var($this->has_end_datetime, FILTER_VALIDATE_BOOLEAN),
            'end_datetime' => $this->end_datetime,
            'target_countries' => $this->target_countries,
            'first_time_buyer_only' => filter_var($this->first_time_buyer_only, FILTER_VALIDATE_BOOLEAN),
            'customer_eligibility' => $this->customer_eligibility ?? CustomerEligibility::ALL,
            'exclude_customers' => $this->exclude_customers,
            'has_usage_limit' => filter_var($this->has_usage_limit, FILTER_VALIDATE_BOOLEAN),
            'usage_limit' => $this->usage_limit,
            'has_customer_limit' => filter_var($this->has_customer_limit, FILTER_VALIDATE_BOOLEAN),
            'customer_limit' => $this->customer_limit,
            'current_usage_count' => $this->current_usage_count ?? 0,
            'is_active' => filter_var($this->is_active, FILTER_VALIDATE_BOOLEAN),
            'status' => $this->get_status(),
            'categories' => !empty($this->categories) ? $this->categories->pluck('id')->all() : [],
            'products' => !empty($this->products) ? $this->products->pluck('id')->all() : [],
            'customers' => !empty($this->customers) ? $this->customers->pluck('id')->all() : [],
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }

    protected function prepare_amount($amount)
    {
        return Money::from_minor($amount)->getAmount()->toFloat();
    }
}
