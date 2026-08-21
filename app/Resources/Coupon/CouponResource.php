<?php

namespace Kirki\Ecommerce\App\Resources\Coupon;

use Kirki\Ecommerce\App\Constants\Coupon\CouponMethod;
use Kirki\Ecommerce\App\Constants\Coupon\CustomerExcludeEligibility;
use Kirki\Ecommerce\App\Constants\Coupon\CustomerIncludeEligibility;
use Kirki\Ecommerce\App\Constants\Coupon\DiscountType;
use Kirki\Ecommerce\App\Constants\Coupon\DiscountValueType;
use Kirki\Ecommerce\App\Constants\Coupon\TargetCountryType;
use Kirki\Ecommerce\App\Resources\CategoryResource;
use Kirki\Ecommerce\App\Resources\Customer\CustomerInfoResource;
use Kirki\Ecommerce\App\Resources\Product\ProductListWithVariantsResource;
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
        $is_fixed_discount = $this->discount_value_type === DiscountValueType::FIXED;
        $display_currency = Money::resolve_display_currency();

        return [
            'id' => $this->id,
            'method' => $this->method ?? CouponMethod::CODE,
            'title' => $this->title,
            'code' => $this->code,
            'discount_type' => $this->discount_type ?? DiscountType::AMOUNT_OFF,
            'discount_target' => $this->discount_target,
            'discount_value_type' => $this->discount_value_type,
            'base_discount_amount' => $is_fixed_discount ? Money::prepare_amount_from_minor($this->base_discount_amount_fixed) : $this->discount_amount_percentage,
            'base_discount_amount_money_object' => $is_fixed_discount ? Money::prepare_amount_object_from_minor($this->base_discount_amount_fixed) : null,
            'display_discount_amount' => $is_fixed_discount ? Money::prepare_amount_from_minor($this->base_discount_amount_fixed, null, $display_currency) : $this->discount_amount_percentage,
            'display_discount_amount_money_object' => $is_fixed_discount ? Money::prepare_amount_object_from_minor($this->base_discount_amount_fixed, null, $display_currency) : null,
            'eligible_item_type' => $this->eligible_item_type,
            'spend_condition_type' => $this->spend_condition_type,
            'spend_condition_value' => $this->spend_condition_value,
            'reward_quantity' => $this->reward_quantity,
            'reward_value' => $this->reward_value,
            'start_datetime' => $this->start_datetime,
            'has_end_datetime' => filter_var($this->has_end_datetime, FILTER_VALIDATE_BOOLEAN),
            'end_datetime' => $this->end_datetime,
            'target_country_type' => $this->target_country_type ?? TargetCountryType::ALL_COUNTRIES,
            'target_countries' => $this->target_countries,
            'first_time_buyer_only' => filter_var($this->first_time_buyer_only, FILTER_VALIDATE_BOOLEAN),
            'customer_include_eligibility' => $this->customer_include_eligibility ?? CustomerIncludeEligibility::EVERYONE,
            'customer_exclude_eligibility' => $this->customer_exclude_eligibility ?? CustomerExcludeEligibility::NONE,
            'has_usage_limit' => filter_var($this->has_usage_limit, FILTER_VALIDATE_BOOLEAN),
            'usage_limit' => $this->usage_limit,
            'has_customer_limit' => filter_var($this->has_customer_limit, FILTER_VALIDATE_BOOLEAN),
            'customer_limit' => $this->customer_limit,
            'current_usage_count' => $this->current_usage_count ?? 0,
            'is_active' => filter_var($this->is_active, FILTER_VALIDATE_BOOLEAN),
            'status' => $this->get_status(),
            'categories' => !empty($this->categories) ? CategoryResource::collection($this->categories) : [],
            'products' => !empty($this->products) ? ProductListWithVariantsResource::collection($this->products) : [],
            'customers' => !empty($this->customers) ? CustomerInfoResource::collection($this->customers->reject(fn($customer) => !empty($customer->pivot['is_excluded']))) : [],
            'excluded_customers' => !empty($this->customers) ? CustomerInfoResource::collection($this->customers->filter(fn($customer) => !empty($customer->pivot['is_excluded']))) : [],
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
