<?php

namespace Kirki\Ecommerce\App\Models;

use Kirki\Ecommerce\Framework\Database\Query\Model;

class OrderTax extends Model
{
    protected $table = 'kirki_ecommerce_order_taxes';

    protected $fillable = [
        'order_id',
        'order_item_id',
        'type',
        'name',
        'rate',
        'invoiced_amount',
        'base_amount',
    ];

    protected $casts = [
        'order_id' => 'integer',
        'order_item_id' => 'integer',
        'rate' => 'float',
        'invoiced_amount' => 'integer',
        'base_amount' => 'integer',
    ];

    public function order()
    {
        return $this->belongs_to(Order::class, 'order_id');
    }

    public function order_item()
    {
        return $this->belongs_to(OrderItem::class, 'order_item_id');
    }
}
