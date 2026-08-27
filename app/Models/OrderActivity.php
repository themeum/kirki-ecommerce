<?php

namespace Kirki\Ecommerce\App\Models;

use Kirki\Ecommerce\Framework\Database\Query\Model;

class OrderActivity extends Model
{
    protected $table = 'kirki_ecommerce_order_activities';

    protected $fillable = [
        'order_id',
        'activity_type',
        'description',
        'metadata',
        'created_by',
    ];

    protected $casts = [
        'id' => 'integer',
        'order_id' => 'integer',
        'created_by' => 'integer',
        'metadata' => 'json',
    ];

    public function order()
    {
        return $this->belongs_to(Order::class, 'order_id');
    }
}
