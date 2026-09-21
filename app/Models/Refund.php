<?php

namespace Kirki\Ecommerce\App\Models;

use Kirki\Ecommerce\Framework\Database\Query\Model;

/**
 * Model for a refund issued against an order.
 *
 * @since 1.0.0
 */
class Refund extends Model
{
    /** @inheritDoc */
    protected $table = 'kirki_ecommerce_refunds';

    /** @inheritDoc */
    protected $fillable = [
        'order_id',
        'status',
        'invoiced_amount',
        'reason',
        'refund_type',
        'refund_id',
        'created_by',
        'updated_by',
    ];

    /** @inheritDoc */
    protected $casts = [
        'invoiced_amount' => 'integer',
    ];

    /**
     * Define the order this refund belongs to.
     *
     * @since 1.0.0
     *
     * @return \Kirki\Ecommerce\Framework\Database\Query\Relations\BelongsTo
     */
    public function order()
    {
        return $this->belongs_to(Order::class, 'order_id');
    }
}
