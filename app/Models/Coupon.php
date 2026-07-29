<?php

namespace Kirki\Ecommerce\App\Models;

use Kirki\Ecommerce\App\Constants\Coupon\CouponStatus;
use Kirki\Ecommerce\Framework\Database\Query\Model;
use Kirki\Ecommerce\Framework\Database\Query\QueryBuilder;
use Kirki\Ecommerce\Framework\Supports\Arr;
use Kirki\Ecommerce\Framework\Supports\Facades\Date;

class Coupon extends Model
{
    protected $table = 'kirki_ecommerce_coupons';
    protected $primary_key = 'id';

    protected $casts = [
        'id' => 'integer',
        'has_end_datetime' => 'boolean',
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
        'start_datetime' => 'datetime',
        'end_datetime' => 'datetime',
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
        'start_datetime',
        'has_end_datetime',
        'end_datetime',
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

    // TODO: we need to make get_status_attribute later when accessor is available for custom attribute which is not available in fillable
    public function get_status()
    {
        if (!$this->is_active) {
            return CouponStatus::INACTIVE;
        }

        $now = Date::now();

        if ($this->start_datetime && $now->lt($this->start_datetime)) {
            return CouponStatus::SCHEDULED;
        }

        if ($this->has_end_datetime && $this->end_datetime && $now->gt($this->end_datetime)) {
            return CouponStatus::EXPIRED;
        }

        return CouponStatus::ACTIVE;
    }

    /**
     * @param array|null $value
     */
    public function set_target_countries_attribute($value)
    {
        $this->attributes['target_countries'] = !empty($value) && is_array($value) ? Arr::json_encode($value) : null;
    }

    public function set_start_datetime_attribute(?string $value)
    {
        $this->attributes['start_datetime'] = $this->to_utc($value);
    }

    public function set_end_datetime_attribute(?string $value)
    {
        $this->attributes['end_datetime'] = $this->to_utc($value);
    }

    /**
     * Parse a datetime value and normalize it to GMT.
     *
     * @param string|null $value ATOM string (with offset) or a plain GMT datetime string.
     *
     * @return \Kirki\Ecommerce\Framework\Contracts\SomoyInterface|null
     */
    protected function to_utc($value)
    {
        if (empty($value)) {
            return null;
        }

        return Date::parse($value)->set_timezone('UTC');
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

    /**
     * @param QueryBuilder $query
     * @param string $status
     */
    public function scope_apply_status_filter(QueryBuilder $query, $status)
    {
        if (empty($status)) {
            return $query;
        }

        $now = Date::now()->to_date_time_string();

        switch ($status) {
            case CouponStatus::ACTIVE:
                return $query->where('is_active', 1)
                    ->where(function (QueryBuilder $query) use ($now) {
                        $query->where_null('start_datetime')
                            ->or_where('start_datetime', '<=', $now);
                    })
                    ->where(function (QueryBuilder $query) use ($now) {
                        $query->where('has_end_datetime', 0)
                            ->or_where_null('end_datetime')
                            ->or_where('end_datetime', '>=', $now);
                    });
            case CouponStatus::EXPIRED:
                return $query->where('is_active', 1)
                    ->where('has_end_datetime', 1)
                    ->where('end_datetime', '<', $now);
            case CouponStatus::SCHEDULED:
                return $query->where('is_active', 1)
                    ->where('start_datetime', '>', $now);
            case CouponStatus::INACTIVE:
                return $query->where('is_active', 0);
        }
    }
}
