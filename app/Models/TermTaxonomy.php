<?php

namespace Kirki\Ecommerce\App\Models;

use Kirki\Ecommerce\Framework\Database\Query\Model;

/**
 * Model for a row in the WordPress core term_taxonomy table.
 *
 * @since 1.0.0
 */
class TermTaxonomy extends Model
{
    /** @inheritDoc */
    protected $table = 'term_taxonomy';

    /** @inheritDoc */
    protected $primary_key = 'term_taxonomy_id';

    /** @inheritDoc */
    protected $casts = [
        'term_taxonomy_id' => 'integer',
        'term_id' => 'integer',
        'parent' => 'integer',
        'count' => 'integer',
    ];

    /** @inheritDoc */
    protected $fillable = [
        'term_id',
        'taxonomy',
        'description',
        'parent',
        'count',
    ];

    /**
     * Define the term this taxonomy entry belongs to.
     *
     * @since 1.0.0
     *
     * @return \Kirki\Ecommerce\Framework\Database\Query\Relations\BelongsTo
     */
    public function term()
    {
        return $this->belongs_to(Term::class, 'term_id', 'term_id');
    }
}
