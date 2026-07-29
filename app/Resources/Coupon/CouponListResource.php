<?php

namespace Kirki\Ecommerce\App\Resources\Coupon;

use Kirki\Ecommerce\App\Constants\Coupon\CouponMethod;
use Kirki\Ecommerce\App\Constants\Coupon\DiscountType;
use Kirki\Ecommerce\App\Constants\Coupon\DiscountValueType;
use Kirki\Ecommerce\Framework\Resource;

class CouponListResource extends Resource
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
            'discount_amount' => $this->discount_value_type === DiscountValueType::FIXED ? $this->discount_amount_fixed : $this->discount_amount_percentage,
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
            'has_usage_limit' => $this->has_usage_limit,
            'usage_limit' => $this->usage_limit,
            'current_usage_count' => $this->current_usage_count,
            'is_active' => $this->is_active,
            'status' => $this->get_status(),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
