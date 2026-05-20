<?php

namespace Kirki\Ecommerce\App\Models;

use Kirki\Ecommerce\Database\Query\Model;

class Address extends Model
{
    protected $table = 'kirki_ecommerce_addresses';

    protected $primary_key = 'id';

    protected $casts = [
        'id' => 'integer',
        'customer_id' => 'integer',
    ];

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
        'type'
    ];

    public function customer()
    {
        return $this->belongs_to(Customer::class, 'customer_id', 'id');
    }
}
