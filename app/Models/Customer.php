<?php

namespace Kirki\Ecommerce\App\Models;

use Kirki\Ecommerce\App\Traits\HasDateRangeFilter;
use Kirki\Ecommerce\Framework\Database\Query\Model;

class Customer extends Model
{
    use HasDateRangeFilter;

    protected $table = 'kirki_ecommerce_customers';

    protected $primary_key = 'id';

    protected $casts = [
        'id' => 'integer',
        'user_id' => 'integer',
        'accepts_marketing' => 'boolean',
        'tags' => 'json'
    ];

    protected $fillable = [
        'user_id',
        'first_name',
        'last_name',
        'photo',
        'email',
        'phone',
        'accepts_marketing',
        'notes',
        'tags',
        'created_by',
        'updated_by',
    ];

    public function addresses()
    {
        return $this->has_many(Address::class, 'customer_id', 'id');
    }

    public function billing_address()
    {
        return $this->has_one(Address::class, 'customer_id', 'id')->where('is_default_billing', true);
    }

    public function shipping_address()
    {
        return $this->has_one(Address::class, 'customer_id', 'id')->where('is_default_shipping', true);
    }

    public function orders()
    {
        return $this->has_many(Order::class, 'customer_id', 'id');
    }
}
