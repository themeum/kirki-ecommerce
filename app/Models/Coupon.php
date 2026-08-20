<?php

namespace Kirki\Ecommerce\App\Models;

use Kirki\Ecommerce\App\Constants\Coupon\CouponStatus;
use Kirki\Ecommerce\App\Traits\HasDateRangeFilter;
use Kirki\Ecommerce\Framework\Database\Query\Model;
use Kirki\Ecommerce\Framework\Database\Query\QueryBuilder;
use Kirki\Ecommerce\Framework\Supports\Facades\Date;

use function Kirki\Ecommerce\App\to_utc_datetime_string;

class Coupon extends Model
{
    use HasDateRangeFilter;

    protected $table = 'kirki_ecommerce_coupons';
    protected $primary_key = 'id';

    protected $casts = [
        'id' => 'integer',
        'has_end_datetime' => 'boolean',
        'first_time_buyer_only' => 'boolean',
        'has_usage_limit' => 'boolean',
        'usage_limit' => 'integer',
        'has_customer_limit' => 'boolean',
        'customer_limit' => 'integer',
        'current_usage_count' => 'integer',
        'is_active' => 'boolean',
        'base_discount_amount_fixed' => 'integer',
        'discount_amount_percentage' => 'float',
        'spend_condition_value' => 'integer',
        'reward_quantity' => 'integer',
        'reward_value' => 'integer',
        'start_datetime' => 'datetime',
        'end_datetime' => 'datetime',
        'target_countries' => 'json',
        'combinations' => 'json',
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
        'base_discount_amount_fixed',
        'discount_amount_percentage',
        'eligible_item_type',
        'spend_condition_type',
        'spend_condition_value',
        'reward_quantity',
        'reward_value',
        'start_datetime',
        'has_end_datetime',
        'end_datetime',
        'target_country_type',
        'target_countries',
        'first_time_buyer_only',
        'customer_include_eligibility',
        'customer_exclude_eligibility',
        'has_usage_limit',
        'usage_limit',
        'has_customer_limit',
        'customer_limit',
        'current_usage_count',
        'is_active',
        'combinations',
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

    public function set_start_datetime_attribute(?string $value)
    {
        $this->attributes['start_datetime'] = to_utc_datetime_string($value);
    }

    public function set_end_datetime_attribute(?string $value)
    {
        $this->attributes['end_datetime'] = to_utc_datetime_string($value);
    }

    public function categories()
    {
        return $this->belongs_to_many(Category::class, 'kirki_ecommerce_coupon_categories', 'coupon_id', 'category_id');
    }

    public function products()
    {
        return $this->belongs_to_many(Product::class, 'kirki_ecommerce_coupon_products', 'coupon_id', 'product_id')->with_pivot('is_reward_item');
    }

    public function customers()
    {
        return $this->belongs_to_many(Customer::class, 'kirki_ecommerce_coupon_customers', 'coupon_id', 'customer_id')->with_pivot('is_excluded');
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
