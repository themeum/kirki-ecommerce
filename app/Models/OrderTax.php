<?php

namespace Kirki\Ecommerce\App\Models;

use Kirki\Ecommerce\Framework\Database\Query\Model;

/**
 * Model for one tax line charged on an order, either on a product item or on shipping.
 *
 * @since 1.0.0
 */
class OrderTax extends Model
{
    /** @inheritDoc */
    protected $table = 'kirki_ecommerce_order_taxes';

    /** @inheritDoc */
    protected $fillable = [
        'order_id',
        'order_item_id',
        'type',
        'name',
        'rate',
        'invoiced_amount',
        'base_amount',
    ];

    /** @inheritDoc */
    protected $casts = [
        'order_id' => 'integer',
        'order_item_id' => 'integer',
        'rate' => 'float',
        'invoiced_amount' => 'integer',
        'base_amount' => 'integer',
    ];

    /**
     * Define the order this tax line belongs to.
     *
     * @since 1.0.0
     *
     * @return \Kirki\Ecommerce\Framework\Database\Query\Relations\BelongsTo
     */
    public function order()
    {
        return $this->belongs_to(Order::class, 'order_id');
    }

    /**
     * Define the order item this tax line applies to, when it is item-specific.
     *
     * @since 1.0.0
     *
     * @return \Kirki\Ecommerce\Framework\Database\Query\Relations\BelongsTo
     */
    public function order_item()
    {
        return $this->belongs_to(OrderItem::class, 'order_item_id');
    }
}
