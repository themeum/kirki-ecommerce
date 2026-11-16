<?php

namespace Kirki\Ecommerce\App\Models;

defined('ABSPATH') || exit;

use Kirki\Ecommerce\App\Constants\Review\ReviewStatus;
use Kirki\Ecommerce\Framework\Database\Query\Model;

/**
 * Model representing a product review and rating.
 *
 * @since 1.0.1
 */
class Review extends Model
{
    /** @inheritDoc */
    protected $table = 'kirki_ecommerce_reviews';

    /** @inheritDoc */
    protected $primary_key = 'id';

    /** @inheritDoc */
    protected $casts = [
        'id' => 'integer',
        'product_id' => 'integer',
        'user_id' => 'integer',
        'rating' => 'integer',
        'helpful_count' => 'integer',
        'is_verified_purchase' => 'boolean',
        'admin_replied_at' => 'datetime',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /** @inheritDoc */
    protected $fillable = [
        'product_id',
        'user_id',
        'author_name',
        'author_email',
        'rating',
        'title',
        'content',
        'status',
        'is_verified_purchase',
        'admin_reply',
        'admin_replied_at',
        'helpful_count',
    ];

    /**
     * Get the product this review belongs to.
     *
     * @since 1.0.1
     *
     * @return \Kirki\Ecommerce\Framework\Database\Query\Relations\BelongsTo
     */
    public function product()
    {
        return $this->belongs_to(Product::class, 'product_id', 'id');
    }

    /**
     * Scope a query to only include approved reviews.
     *
     * @since 1.0.1
     *
     * @param \Kirki\Ecommerce\Framework\Database\Query\QueryBuilder $query
     * @return \Kirki\Ecommerce\Framework\Database\Query\QueryBuilder
     */
    public function scope_approved($query)
    {
        return $query->where('status', ReviewStatus::APPROVED);
    }

    /**
     * Scope a query to only include pending reviews.
     *
     * @since 1.0.1
     *
     * @param \Kirki\Ecommerce\Framework\Database\Query\QueryBuilder $query
     * @return \Kirki\Ecommerce\Framework\Database\Query\QueryBuilder
     */
    public function scope_pending($query)
    {
        return $query->where('status', ReviewStatus::PENDING);
    }
}
