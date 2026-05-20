<?php

namespace Kirki\Ecommerce\App\Models;

use Kirki\Ecommerce\Database\Query\Model;

class ShippingProfile extends Model
{
    protected $table = 'kirki_ecommerce_shipping_profiles';

    protected $primary_key = 'id';

    protected $casts = [
        'id' => 'integer',
    ];

    protected $fillable = [
        'name',
    ];
}
