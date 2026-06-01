<?php

namespace Kirki\Ecommerce\App\Models;

use Kirki\Ecommerce\Database\Query\Model;

class TermTaxonomy extends Model
{
    protected $table = 'term_taxonomy';

    protected $primary_key = 'term_taxonomy_id';

    protected $casts = [
        'term_taxonomy_id' => 'integer',
        'term_id' => 'integer',
        'parent' => 'integer',
        'count' => 'integer',
    ];

    protected $fillable = [
        'term_id',
        'taxonomy',
        'description',
        'parent',
        'count',
    ];

    public function term()
    {
        return $this->belongs_to(Term::class, 'term_id', 'term_id');
    }
}
