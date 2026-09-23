<?php

namespace Kirki\Ecommerce\App\Models;

use Kirki\Ecommerce\Framework\Database\Query\Model;

/**
 * Model for a row in the WordPress core terms table.
 *
 * @since 1.0.0
 */
class Term extends Model
{
    /** @inheritDoc */
    protected $table = 'terms';

    /** @inheritDoc */
    protected $primary_key = 'term_id';

    /** @inheritDoc */
    protected $casts = [
        'term_id' => 'integer',
    ];

    /** @inheritDoc */
    protected $fillable = [
        'term_id',
        'name',
        'slug',
    ];

    /**
     * Define the term meta rows of this term.
     *
     * @since 1.0.0
     *
     * @return \Kirki\Ecommerce\Framework\Database\Query\Relations\HasMany
     */
    public function meta()
    {
        return $this->has_many(TermMeta::class, 'term_id', 'term_id');
    }
}
