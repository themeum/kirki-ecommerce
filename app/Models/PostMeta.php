<?php

namespace Kirki\Ecommerce\App\Models;

use Kirki\Ecommerce\Framework\Database\Query\Model;

class PostMeta extends Model
{
    protected $table = 'postmeta';
    protected $primary_key = 'meta_id';

    public function post()
    {
        return $this->belongs_to(Post::class, 'post_id', 'ID');
    }
}
