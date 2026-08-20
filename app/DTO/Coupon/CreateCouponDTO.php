<?php

namespace Kirki\Ecommerce\App\DTO\Coupon;

use Kirki\Ecommerce\App\Constants\Coupon\CouponMethod;
use Kirki\Ecommerce\App\Constants\Coupon\CustomerExcludeEligibility;
use Kirki\Ecommerce\App\Constants\Coupon\CustomerIncludeEligibility;
use Kirki\Ecommerce\App\Constants\Coupon\TargetCountryType;
use Kirki\Ecommerce\Framework\DTO;

class CreateCouponDTO extends DTO
{
    /** @var string */
    public $method = CouponMethod::CODE;

    /** @var string */
    public $title;

    /** @var string|null */
    public $code;

    /** @var string */
    public $discount_type;

    /** @var string|null */
    public $discount_target;

    /** @var string|null */
    public $discount_value_type;

    /** @var int|null */
    public $discount_amount;

    /** @var string|null */
    public $eligible_item_type;

    /** @var string|null */
    public $spend_condition_type;

    /** @var int|null */
    public $spend_condition_value;

    /** @var int|null */
    public $reward_quantity;

    /** @var int|null */
    public $reward_value;

    /** @var string|null */
    public $start_datetime;

    /** @var bool */
    public $has_end_datetime = false;

    /** @var string|null */
    public $end_datetime;

    /** @var string */
    public $target_country_type = TargetCountryType::ALL_COUNTRIES;

    /** @var array|null */
    public $target_countries;

    /** @var bool */
    public $first_time_buyer_only = false;

    /** @var string */
    public $customer_include_eligibility = CustomerIncludeEligibility::EVERYONE;

    /** @var string */
    public $customer_exclude_eligibility = CustomerExcludeEligibility::NONE;

    /** @var bool */
    public $has_usage_limit = false;

    /** @var int|null */
    public $usage_limit;

    /** @var bool */
    public $has_customer_limit = false;

    /** @var int|null */
    public $customer_limit;

    /** @var bool */
    public $is_active = true;

    /** @var array */
    public $category_ids = [];

    /** @var array */
    public $product_ids = [];

    /** @var array */
    public $customer_ids = [];

    /** @var array */
    public $exclude_customer_ids = [];

    /** @var array */
    public $reward_product_ids = [];

    /** @var array */
    public $combinations = [];
}
