<?php

namespace Kirki\Ecommerce\App\Models;

use Kirki\Ecommerce\Database\Query\Model;

class TaxProfile extends Model
{
    protected $table = 'kirki_ecommerce_tax_profiles';

    protected $primary_key = 'id';

    protected $casts = [
        'id' => 'integer',
    ];

    protected $fillable = [
        'name',
    ];
}
