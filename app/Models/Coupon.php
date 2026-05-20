<?php

namespace Kirki\Ecommerce\App\Models;

use Kirki\Ecommerce\Database\Query\Model;
use Kirki\Ecommerce\Supports\Arr;

class Coupon extends Model
{
    protected $table = 'kirki_ecommerce_coupons';
    protected $primary_key = 'id';

    protected $casts = [
        'id' => 'integer',
        'has_end_date' => 'boolean',
        'first_time_buyer_only' => 'boolean',
        'exclude_customers' => 'boolean',
        'has_usage_limit' => 'boolean',
        'usage_limit' => 'integer',
        'has_customer_limit' => 'boolean',
        'customer_limit' => 'integer',
        'current_usage_count' => 'integer',
        'is_active' => 'boolean',
        'discount_amount_fixed' => 'integer',
        'discount_amount_percentage' => 'float',
        'spend_condition_value' => 'integer',
        'reward_quantity' => 'integer',
        'reward_value' => 'integer',
        'start_date' => 'date',
        'end_date' => 'date',
        'target_countries' => 'json',
        'created_by' => 'integer',
        'updated_by' => 'integer',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    protected $fillable = [
        'method',
        'title',
        'code',
        'discount_type',
        'discount_target',
        'discount_value_type',
        'discount_amount_fixed',
        'discount_amount_percentage',
        'eligible_item_type',
        'spend_condition_type',
        'spend_condition_value',
        'reward_quantity',
        'reward_value',
        'start_date',
        'start_time',
        'has_end_date',
        'end_date',
        'end_time',
        'target_countries',
        'first_time_buyer_only',
        'customer_eligibility',
        'exclude_customers',
        'has_usage_limit',
        'usage_limit',
        'has_customer_limit',
        'customer_limit',
        'current_usage_count',
        'is_active',
        'created_by',
        'updated_by',
    ];

    public function set_target_countries_attribute($value)
    {
        return !empty($value) && is_array($value) ? Arr::json_encode($value) : null;
    }

    public function categories()
    {
        return $this->belongs_to_many(Category::class, 'kirki_ecommerce_coupon_categories', 'coupon_id', 'category_id');
    }

    public function products()
    {
        return $this->belongs_to_many(Product::class, 'kirki_ecommerce_coupon_products', 'coupon_id', 'product_id');
    }

    public function customers()
    {
        return $this->belongs_to_many(Customer::class, 'kirki_ecommerce_coupon_customers', 'coupon_id', 'customer_id');
    }

    public function usage()
    {
        return $this->has_many(CouponUsage::class, 'coupon_id', 'id');
    }
}
