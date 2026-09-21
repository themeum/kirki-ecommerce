<?php

namespace Kirki\Ecommerce\App\Models;

use Kirki\Ecommerce\App\Traits\HasDateRangeFilter;
use Kirki\Ecommerce\Framework\Database\Query\Model;

/**
 * Model for a store customer, optionally linked to a WordPress user.
 *
 * @since 1.0.0
 */
class Customer extends Model
{
    use HasDateRangeFilter;

    /** @inheritDoc */
    protected $table = 'kirki_ecommerce_customers';

    /** @inheritDoc */
    protected $primary_key = 'id';

    /** @inheritDoc */
    protected $casts = [
        'id' => 'integer',
        'user_id' => 'integer',
        'accepts_marketing' => 'boolean',
        'tags' => 'json'
    ];

    /** @inheritDoc */
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

    /**
     * Define all saved addresses of this customer.
     *
     * @since 1.0.0
     *
     * @return \Kirki\Ecommerce\Framework\Database\Query\Relations\HasMany
     */
    public function addresses()
    {
        return $this->has_many(Address::class, 'customer_id', 'id');
    }

    /**
     * Define the customer's default billing address.
     *
     * @since 1.0.0
     *
     * @return \Kirki\Ecommerce\Framework\Database\Query\Relations\HasOne
     */
    public function billing_address()
    {
        return $this->has_one(Address::class, 'customer_id', 'id')->where('is_default_billing', true);
    }

    /**
     * Define the customer's default shipping address.
     *
     * @since 1.0.0
     *
     * @return \Kirki\Ecommerce\Framework\Database\Query\Relations\HasOne
     */
    public function shipping_address()
    {
        return $this->has_one(Address::class, 'customer_id', 'id')->where('is_default_shipping', true);
    }

    /**
     * Define the orders placed by this customer.
     *
     * @since 1.0.0
     *
     * @return \Kirki\Ecommerce\Framework\Database\Query\Relations\HasMany
     */
    public function orders()
    {
        return $this->has_many(Order::class, 'customer_id', 'id');
    }
}
