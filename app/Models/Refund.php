<?php

namespace Kirki\Ecommerce\App\Models;

use Kirki\Ecommerce\Framework\Database\Query\Model;

class Refund extends Model
{
    protected $table = 'kirki_ecommerce_refunds';

    protected $fillable = [
        'order_id',
        'status',
        'amount',
        'reason',
        'refund_type',
        'refund_id',
        'created_by',
        'updated_by',
    ];

    protected $casts = [
        'amount' => 'integer',
    ];

    public function order()
    {
        return $this->belongs_to(Order::class, 'order_id');
    }
}
