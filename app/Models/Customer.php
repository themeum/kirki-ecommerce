<?php

namespace Kirki\Ecommerce\App\Models;

use Kirki\Ecommerce\App\Constants\AddressType;
use Kirki\Ecommerce\Database\Query\Model;
use Kirki\Ecommerce\Supports\Arr;

class Customer extends Model
{
    protected $table = 'kirki_ecommerce_customers';

    protected $primary_key = 'id';

    protected $casts = [
        'id' => 'integer',
        'user_id' => 'integer',
        'accepts_marketing' => 'boolean',
        'is_billing_same_as_shipping' => 'boolean',
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
        'is_billing_same_as_shipping',
        'notes',
        'tags',
        'created_by',
        'updated_by',
    ];

    public function set_tags_attribute($value)
    {
        return !empty($value) && is_array($value) ? Arr::json_encode($value) : null;
    }

    public function addresses()
    {
        return $this->has_many(Address::class, 'customer_id', 'id');
    }

    public function billing_address()
    {
        return $this->has_one(Address::class, 'customer_id', 'id')->where('type', AddressType::BILLING);
    }

    public function shipping_address()
    {
        return $this->has_one(Address::class, 'customer_id', 'id')->where('type', AddressType::SHIPPING);
    }

    public function orders()
    {
        return $this->has_many(Order::class, 'customer_id', 'id');
    }
}
