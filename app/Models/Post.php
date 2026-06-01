<?php

namespace Kirki\Ecommerce\App\Models;

use Kirki\Ecommerce\Database\Query\Model;

class Post extends Model
{
    protected $table = 'posts';
    protected $primary_key = 'ID';

    protected $casts = ['ID' => 'integer'];

    public function meta()
    {
        return $this->has_many(PostMeta::class, 'post_id', 'meta_id');
    }

    public function taxonomies()
    {
        return $this->belongs_to_many(TermTaxonomy::class, 'term_relationships', 'object_id', 'term_taxonomy_id');
    }

    public function categories()
    {
        return $this->taxonomies()->where('taxonomy', 'category');
    }

    public function tags()
    {
        return $this->taxonomies()->where('taxonomy', 'post_tag');
    }
}
