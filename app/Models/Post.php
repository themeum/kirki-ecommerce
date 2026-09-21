<?php

namespace Kirki\Ecommerce\App\Models;

use Kirki\Ecommerce\Framework\Database\Query\Model;

/**
 * Model for a row in the WordPress core posts table, including attachments used as product media.
 *
 * @since 1.0.0
 */
class Post extends Model
{
    /** @inheritDoc */
    protected $table = 'posts';
    /** @inheritDoc */
    protected $primary_key = 'ID';

    /** @inheritDoc */
    protected $casts = ['ID' => 'integer'];

    /**
     * Define the post meta rows of this post.
     *
     * @since 1.0.0
     *
     * @return \Kirki\Ecommerce\Framework\Database\Query\Relations\HasMany
     */
    public function meta()
    {
        return $this->has_many(PostMeta::class, 'post_id', 'ID');
    }

    /**
     * Define the term taxonomies assigned to this post.
     *
     * @since 1.0.0
     *
     * @return \Kirki\Ecommerce\Framework\Database\Query\Relations\BelongsToMany
     */
    public function taxonomies()
    {
        return $this->belongs_to_many(TermTaxonomy::class, 'term_relationships', 'object_id', 'term_taxonomy_id');
    }

    /**
     * Define the core categories assigned to this post.
     *
     * @since 1.0.0
     *
     * @return \Kirki\Ecommerce\Framework\Database\Query\Relations\BelongsToMany
     */
    public function categories()
    {
        return $this->taxonomies()->where('taxonomy', 'category');
    }

    /**
     * Define the core tags assigned to this post.
     *
     * @since 1.0.0
     *
     * @return \Kirki\Ecommerce\Framework\Database\Query\Relations\BelongsToMany
     */
    public function tags()
    {
        return $this->taxonomies()->where('taxonomy', 'post_tag');
    }
}
