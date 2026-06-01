<?php

namespace Kirki\Ecommerce\App\Models;

use Kirki\Ecommerce\Database\Query\Model;

class TermMeta extends Model
{
    protected $table = 'termmeta';

    protected $primary_key = 'meta_id';

    protected $casts = [
        'meta_id' => 'integer',
        'term_id' => 'integer',
    ];

    protected $fillable = [
        'meta_id',
        'term_id',
        'meta_key',
        'meta_value',
    ];
}
