<?php

namespace Kirki\Ecommerce\App\Models;

use Kirki\Ecommerce\Framework\Database\Query\Model;

class Term extends Model
{
    protected $table = 'terms';

    protected $primary_key = 'term_id';

    protected $casts = [
        'term_id' => 'integer',
    ];

    protected $fillable = [
        'term_id',
        'name',
        'slug',
    ];

    public function meta()
    {
        return $this->has_many(TermMeta::class, 'term_id', 'term_id');
    }
}
