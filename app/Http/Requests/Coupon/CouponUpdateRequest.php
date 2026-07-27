<?php

namespace Kirki\Ecommerce\App\Http\Requests\Coupon;

use Kirki\Ecommerce\App\Constants\Coupon\CouponMethod;
use Kirki\Ecommerce\App\Constants\Coupon\CustomerEligibility;
use Kirki\Ecommerce\App\Constants\Coupon\DiscountTarget;
use Kirki\Ecommerce\App\Constants\Coupon\DiscountType;
use Kirki\Ecommerce\App\Constants\Coupon\DiscountValueType;
use Kirki\Ecommerce\App\Constants\Coupon\EligibleItemType;
use Kirki\Ecommerce\App\Constants\Coupon\SpendConditionType;
use Kirki\Ecommerce\Framework\Sanitizer;
use Kirki\Ecommerce\Framework\Http\Request;

class CouponUpdateRequest extends Request
{
    public function rules()
    {
        $id = $this->get_int('id');

        return [
            'id' => 'required|integer',
            'method' => 'required|string|in:' . implode(',', CouponMethod::get_constant_values()),
            'title' => 'required|string|max:255',
            'code' => "required_if:method,code|string|max:100|unique:kirki_ecommerce_coupons,code,{$id}|nullable",
            'discount_type' => 'required|string|in:' . implode(',', DiscountType::get_constant_values()),
            'discount_target' => 'required_if:discount_type,' . DiscountType::AMOUNT_OFF . '|string|in:' . implode(',', DiscountTarget::get_constant_values()) . '|nullable',
            'discount_value_type' => 'required_if:discount_type,' . DiscountType::AMOUNT_OFF . '|string|in:' . implode(',', DiscountValueType::get_constant_values()) . '|nullable',
            'discount_amount' => 'required_if:discount_type,' . DiscountType::AMOUNT_OFF . '|integer|nullable',
            'eligible_item_type' => 'string|in:' . implode(',', EligibleItemType::get_constant_values()) . '|nullable',
            'spend_condition_type' => 'string|in:' . implode(',', SpendConditionType::get_constant_values()) . '|nullable',
            'spend_condition_value' => 'integer|nullable',
            'reward_quantity' => 'integer|nullable',
            'reward_value' => 'integer|nullable',
            'start_date' => 'required|date',
            'start_time' => 'string|nullable',
            'has_end_date' => 'boolean|nullable',
            'end_date' => 'required_if:has_end_date,1|date|nullable',
            'end_time' => 'string|nullable',
            'target_countries' => 'array|nullable',
            'first_time_buyer_only' => 'boolean|nullable',
            'customer_eligibility' => 'string|in:' . implode(',', CustomerEligibility::get_constant_values()) . '|nullable',
            'exclude_customers' => 'boolean|nullable',
            'has_usage_limit' => 'boolean|nullable',
            'usage_limit' => 'integer|nullable',
            'has_customer_limit' => 'boolean|nullable',
            'customer_limit' => 'integer|nullable',
            'is_active' => 'boolean|nullable',
            'category_ids' => 'array|nullable',
            'category_ids.*' => 'integer',
            'product_ids' => 'array|nullable',
            'product_ids.*' => 'integer',
            'customer_ids' => 'array|nullable',
            'customer_ids.*' => 'integer',
            'reward_product_ids' => 'array|nullable',
            'reward_product_ids.*' => 'integer',
        ];
    }

    public function filters()
    {
        return [
            'id' => Sanitizer::INT,
            'method' => Sanitizer::TEXT,
            'title' => Sanitizer::TEXT,
            'code' => Sanitizer::TEXT,
            'discount_type' => Sanitizer::TEXT,
            'discount_target' => Sanitizer::TEXT,
            'discount_value_type' => Sanitizer::TEXT,
            'discount_amount' => $this->discount_value_type === DiscountValueType::PERCENTAGE ? Sanitizer::INT : Sanitizer::MONEY,
            'eligible_item_type' => Sanitizer::TEXT,
            'spend_condition_type' => Sanitizer::TEXT,
            'spend_condition_value' => Sanitizer::INT,
            'reward_quantity' => Sanitizer::INT,
            'reward_value' => Sanitizer::INT,
            'start_date' => Sanitizer::TEXT,
            'start_time' => Sanitizer::TEXT,
            'has_end_date' => Sanitizer::BOOL,
            'end_date' => Sanitizer::TEXT,
            'end_time' => Sanitizer::TEXT,
            'target_countries' => Sanitizer::ARRAY ,
            'first_time_buyer_only' => Sanitizer::BOOL,
            'customer_eligibility' => Sanitizer::TEXT,
            'exclude_customers' => Sanitizer::BOOL,
            'has_usage_limit' => Sanitizer::BOOL,
            'usage_limit' => Sanitizer::INT,
            'has_customer_limit' => Sanitizer::BOOL,
            'customer_limit' => Sanitizer::INT,
            'is_active' => Sanitizer::BOOL,
            'category_ids' => Sanitizer::ARRAY ,
            'category_ids.*' => Sanitizer::INT,
            'product_ids' => Sanitizer::ARRAY ,
            'product_ids.*' => Sanitizer::INT,
            'customer_ids' => Sanitizer::ARRAY ,
            'customer_ids.*' => Sanitizer::INT,
            'reward_product_ids' => Sanitizer::ARRAY ,
            'reward_product_ids.*' => Sanitizer::INT,
        ];
    }
}
