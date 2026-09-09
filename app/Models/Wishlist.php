<?php

namespace Kirki\Ecommerce\App\Models;

use Kirki\Ecommerce\Framework\Database\Query\Model;

class Wishlist extends Model
{
    protected $table = 'kirki_ecommerce_wishlist';
    protected $primary_key = 'id';

    protected $fillable = [
        'user_id',
        'variant_id',
    ];

    protected $casts = [
        'id' => 'integer',
        'user_id' => 'integer',
        'variant_id' => 'integer',
    ];

    public function variant()
    {
        return $this->belongs_to(Variant::class, 'variant_id', 'id');
    }
}
