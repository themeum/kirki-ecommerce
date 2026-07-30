<?php

namespace Kirki\Ecommerce\App\Http\Requests\Coupon;

use Kirki\Ecommerce\App\Constants\Coupon\CouponMethod;
use Kirki\Ecommerce\App\Constants\Coupon\CustomerEligibility;
use Kirki\Ecommerce\App\Constants\Coupon\DiscountType;
use Kirki\Ecommerce\App\Constants\Coupon\DiscountTarget;
use Kirki\Ecommerce\App\Constants\Coupon\DiscountValueType;
use Kirki\Ecommerce\App\Constants\Coupon\EligibleItemType;
use Kirki\Ecommerce\App\Constants\Coupon\SpendConditionType;
use Kirki\Ecommerce\App\Facades\Money;
use Kirki\Ecommerce\App\Models\Coupon;
use Kirki\Ecommerce\Framework\Sanitizer;
use Kirki\Ecommerce\Framework\Http\Request;
use Kirki\Ecommerce\Framework\Supports\Somoy;

class CouponCreateRequest extends Request
{
    protected function prepare_for_validation()
    {
        $discount_amount = $this->input('discount_amount');

        if ($this->get('discount_value_type') === DiscountValueType::FIXED && !empty($discount_amount)) {
            $this->merge(['discount_amount' => Money::to_minor($discount_amount)]);
        }
    }

    public function rules()
    {
        return [
            'method' => 'required|string|in:' . implode(',', CouponMethod::get_constant_values()),
            'title' => 'required|string|max:255',
            'code' => 'required_if:method,' . CouponMethod::CODE . '|string|max:100|unique:' . Coupon::get_table_name() . ',code|nullable',
            'discount_type' => 'required|string|in:' . implode(',', DiscountType::get_constant_values()),
            'discount_target' => 'required_if:discount_type,' . DiscountType::AMOUNT_OFF . '|string|in:' . implode(',', DiscountTarget::get_constant_values()) . '|nullable',
            'discount_value_type' => 'required_if:discount_type,' . DiscountType::AMOUNT_OFF . '|string|in:' . implode(',', DiscountValueType::get_constant_values()) . '|nullable',
            'discount_amount' => 'required_if:discount_type,' . DiscountType::AMOUNT_OFF . '|number|nullable',
            'eligible_item_type' => 'string|in:' . implode(',', EligibleItemType::get_constant_values()) . '|nullable',
            'spend_condition_type' => 'string|in:' . implode(',', SpendConditionType::get_constant_values()) . '|nullable',
            'spend_condition_value' => 'integer|nullable',
            'reward_quantity' => 'integer|nullable',
            'reward_value' => 'integer|nullable',
            'start_datetime' => 'date|format:' . Somoy::ATOM . '|nullable',
            'has_end_datetime' => 'boolean|nullable',
            'end_datetime' => 'required_if:has_end_datetime,true|date|format:' . Somoy::ATOM,
            'target_countries' => 'array|nullable',
            'first_time_buyer_only' => 'boolean|nullable',
            'customer_eligibility' => 'string|in:' . implode(',', CustomerEligibility::get_constant_values()) . '|nullable',
            'exclude_customers' => 'boolean|nullable',
            'has_usage_limit' => 'boolean|nullable',
            'usage_limit' => 'required_if:has_usage_limit,true|integer',
            'has_customer_limit' => 'boolean|nullable',
            'customer_limit' => 'required_if:has_customer_limit,true|integer',
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
            'method' => Sanitizer::TEXT,
            'title' => Sanitizer::TEXT,
            'code' => Sanitizer::TEXT,
            'discount_type' => Sanitizer::TEXT,
            'discount_target' => Sanitizer::TEXT,
            'discount_value_type' => Sanitizer::TEXT,
            'discount_amount' => $this->get('discount_value_type') === DiscountValueType::FIXED ? Sanitizer::INT : Sanitizer::FLOAT,
            'eligible_item_type' => Sanitizer::TEXT,
            'spend_condition_type' => Sanitizer::TEXT,
            'spend_condition_value' => Sanitizer::INT,
            'reward_quantity' => Sanitizer::INT,
            'reward_value' => Sanitizer::INT,
            'start_datetime' => Sanitizer::TEXT,
            'has_end_datetime' => Sanitizer::BOOL,
            'end_datetime' => Sanitizer::TEXT,
            'target_countries' => Sanitizer::ARRAY,
            'first_time_buyer_only' => Sanitizer::BOOL,
            'customer_eligibility' => Sanitizer::TEXT,
            'exclude_customers' => Sanitizer::BOOL,
            'has_usage_limit' => Sanitizer::BOOL,
            'usage_limit' => Sanitizer::INT,
            'has_customer_limit' => Sanitizer::BOOL,
            'customer_limit' => Sanitizer::INT,
            'is_active' => Sanitizer::BOOL,
            'category_ids' => Sanitizer::ARRAY,
            'category_ids.*' => Sanitizer::INT,
            'product_ids' => Sanitizer::ARRAY,
            'product_ids.*' => Sanitizer::INT,
            'customer_ids' => Sanitizer::ARRAY,
            'customer_ids.*' => Sanitizer::INT,
            'reward_product_ids' => Sanitizer::ARRAY,
            'reward_product_ids.*' => Sanitizer::INT,
        ];
    }
}
