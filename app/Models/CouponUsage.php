<?php

namespace Kirki\Ecommerce\App\Models;

use Kirki\Ecommerce\Database\Query\Model;

class CouponUsage extends Model
{
    protected $table = 'kirki_ecommerce_coupon_usage';
    protected $primary_key = 'id';

    protected $casts = [
        'id' => 'integer',
        'coupon_id' => 'integer',
        'order_id' => 'integer',
        'customer_id' => 'integer',
    ];

    protected $fillable = [
        'coupon_id',
        'order_id',
        'customer_id',
    ];

    public function coupon()
    {
        return $this->belongs_to(Coupon::class);
    }

    public function customer()
    {
        return $this->belongs_to(Customer::class);
    }
}
