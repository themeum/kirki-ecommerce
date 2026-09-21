<?php

namespace Kirki\Ecommerce\App\Models;

use Kirki\Ecommerce\Framework\Database\Query\Model;

/**
 * Model for a row in the WordPress core postmeta table.
 *
 * @since 1.0.0
 */
class PostMeta extends Model
{
    /** @inheritDoc */
    protected $table = 'postmeta';
    /** @inheritDoc */
    protected $primary_key = 'meta_id';

    /**
     * Define the post this meta row belongs to.
     *
     * @since 1.0.0
     *
     * @return \Kirki\Ecommerce\Framework\Database\Query\Relations\BelongsTo
     */
    public function post()
    {
        return $this->belongs_to(Post::class, 'post_id', 'ID');
    }
}
