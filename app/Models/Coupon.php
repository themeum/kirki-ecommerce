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

    // TODO: we need to make get_status_attribute later when accessor is available for custom attribute which is not available in fillable
    public function get_status()
    {
        if (!$this->is_active) {
            return CouponStatus::INACTIVE;
        }

        $now = Date::now();

        if ($this->start_date) {
            $start = $this->start_date->copy();

            if (!empty($this->start_time)) {
                $start = $start->set_time_from_time_string($this->start_time);
            }

            if ($now->lt($start)) {
                return CouponStatus::SCHEDULED;
            }
        }

        if ($this->has_end_date && !empty($this->end_date)) {
            $end = $this->end_date->copy();

            $end = !empty($this->end_time)
                ? $end->set_time_from_time_string($this->end_time)
                : $end->end_of_day();

            if ($now->gt($end)) {
                return CouponStatus::EXPIRED;
            }
        }

        return CouponStatus::ACTIVE;
    }

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

    /**
     * @param QueryBuilder $query
     * @param string $status
     */
    public function scope_apply_status_filter(QueryBuilder $query, $status)
    {
        if (empty($status)) {
            return $query;
        }

        $now = Date::now();
        $date = $now->to_date_string();
        $time = $now->to_time_string();

        switch ($status) {
            case CouponStatus::ACTIVE:
                // When the coupon is active and is not expired or scheduled
                return $query->where('is_active', 1)
                    ->where(function (QueryBuilder $query) use ($date, $time) {
                        $query->where_null('start_date')
                            ->or_where('start_date', '<', $date)
                            ->or_where(function (QueryBuilder $query) use ($date, $time) {
                                $query->where('start_date', $date)
                                    ->where(function (QueryBuilder $query) use ($time) {
                                        $query->where_null('start_time')
                                            ->or_where('start_time', '<=', $time);
                                    });
                            });
                    })
                    ->where(function (QueryBuilder $query) use ($date, $time) {
                        $query->where('has_end_date', 0)
                            ->or_where_null('end_date')
                            ->or_where('end_date', '>', $date)
                            ->or_where(function (QueryBuilder $query) use ($date, $time) {
                                $query->where('end_date', $date)
                                    ->where(function (QueryBuilder $query) use ($time) {
                                        $query->where_null('end_time')
                                            ->or_where('end_time', '>=', $time);
                                    });
                            });
                    });
            case CouponStatus::EXPIRED:
                // When the coupon is active and is expired
                return $query->where('is_active', 1)
                    ->where('has_end_date', 1)
                    ->where(function (QueryBuilder $query) use ($date, $time) {
                        $query->where('end_date', '<', $date)
                            ->or_where(function (QueryBuilder $query) use ($date, $time) {
                                $query->where('end_date', $date)
                                    ->where('end_time', '<', $time);
                            });
                    });
            case CouponStatus::SCHEDULED:
                // When the coupon is active and is scheduled
                return $query->where('is_active', 1)
                    ->where(function (QueryBuilder $query) use ($date, $time) {
                        $query->where('start_date', '>', $date)
                            ->or_where(function (QueryBuilder $query) use ($date, $time) {
                                $query->where('start_date', $date)
                                    ->where('start_time', '>', $time);
                            });
                    });
            case CouponStatus::INACTIVE:
                return $query->where('is_active', 0);
            case 'all':
                return $query;
            default:
                return $query->where_raw('1 = 0');
        }
    }
}
