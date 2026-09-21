<?php

namespace Kirki\Ecommerce\App\Models;

use Kirki\Ecommerce\Framework\Database\Query\Model;

/**
 * Model for an entry in an order's activity log.
 *
 * @since 1.0.0
 */
class OrderActivity extends Model
{
    /** @inheritDoc */
    protected $table = 'kirki_ecommerce_order_activities';

    /** @inheritDoc */
    protected $fillable = [
        'order_id',
        'activity_type',
        'description',
        'metadata',
        'created_by',
    ];

    /** @inheritDoc */
    protected $casts = [
        'id' => 'integer',
        'order_id' => 'integer',
        'created_by' => 'integer',
        'metadata' => 'json',
    ];

    /**
     * Define the order this activity belongs to.
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
