<?php

namespace Kirki\Ecommerce\App\Models;

use Kirki\Ecommerce\Framework\Database\Query\Model;

/**
 * Model for a customer's saved shipping or billing address.
 *
 * @since 1.0.0
 */
class Address extends Model
{
    /** @inheritDoc */
    protected $table = 'kirki_ecommerce_addresses';

    /** @inheritDoc */
    protected $primary_key = 'id';

    /** @inheritDoc */
    protected $casts = [
        'id' => 'integer',
        'customer_id' => 'integer',
        'is_default_shipping' => 'boolean',
        'is_default_billing' => 'boolean',
    ];

    /** @inheritDoc */
    protected $fillable = [
        'customer_id',
        'first_name',
        'last_name',
        'address_line1',
        'address_line2',
        'city',
        'state',
        'country',
        'postal_code',
        'phone',
        'email',
        'type',
        'label',
        'is_default_shipping',
        'is_default_billing'
    ];

    /**
     * Define the customer this address belongs to.
     *
     * @since 1.0.0
     *
     * @return \Kirki\Ecommerce\Framework\Database\Query\Relations\BelongsTo
     */
    public function customer()
    {
        return $this->belongs_to(Customer::class, 'customer_id', 'id');
    }
}
