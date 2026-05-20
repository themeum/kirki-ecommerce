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
}
