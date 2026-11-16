<?php

namespace Kirki\Ecommerce\App\Models;

defined('ABSPATH') || exit;

use Kirki\Ecommerce\Framework\Database\Query\Model;

/**
 * Model for a product review and customer rating.
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
        'is_verified_purchase' => 'boolean',
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
    ];

    const STATUS_PENDING = 'pending';
    const STATUS_APPROVED = 'approved';
    const STATUS_REJECTED = 'rejected';

    /**
     * Define the product this review belongs to.
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
     * Check whether a user is eligible to write a review for a specific product.
     *
     * Rules:
     * 1. The user must be logged in.
     * 2. The user must have purchased this product.
     * 3. The order containing this product must be delivered.
     *
     * @since 1.0.1
     *
     * @param int         $product_id
     * @param int|null    $user_id
     * @param string|null $email
     * @return array{can_review: bool, reason: string, message: string, already_reviewed: bool}
     */
    public static function check_user_eligibility(int $product_id, ?int $user_id = null, ?string $email = null): array
    {
        if (empty($user_id) && empty($email)) {
            return [
                'can_review' => false,
                'reason' => 'not_logged_in',
                'message' => __('Please log in to submit a review.', 'kirki-ecommerce'),
                'already_reviewed' => false,
            ];
        }

        // Check if customer record exists for this user / email
        $customer_ids = [];
        try {
            $cust_q = Customer::query();
            if ($user_id && $email) {
                $cust_q->where('user_id', $user_id)->or_where('email', $email);
            } elseif ($user_id) {
                $cust_q->where('user_id', $user_id);
            } else {
                $cust_q->where('email', $email);
            }
            $customer_ids = $cust_q->pluck('id')->to_array();
        } catch (\Throwable $e) {
            $customer_ids = [];
        }

        // 1. Check if user has purchased this product in any order
        $has_purchased = OrderItem::where('product_id', $product_id)
            ->where_has('order', function ($q) use ($user_id, $email, $customer_ids) {
                $q->where(function ($inner) use ($user_id, $email, $customer_ids) {
                    $has_condition = false;
                    if ($user_id) {
                        $inner->where('created_by', $user_id);
                        $has_condition = true;
                    }
                    if (!empty($customer_ids)) {
                        if ($has_condition) {
                            $inner->or_where_in('customer_id', $customer_ids);
                        } else {
                            $inner->where_in('customer_id', $customer_ids);
                            $has_condition = true;
                        }
                    }
                    if ($email) {
                        if ($has_condition) {
                            $inner->or_where('customer_email', $email)
                                ->or_where('billing_email', $email)
                                ->or_where('shipping_email', $email);
                        } else {
                            $inner->where('customer_email', $email)
                                ->or_where('billing_email', $email)
                                ->or_where('shipping_email', $email);
                        }
                    }
                });
            })->exists();

        if (!$has_purchased) {
            return [
                'can_review' => false,
                'reason' => 'not_purchased',
                'message' => __('You can only review products that you have purchased.', 'kirki-ecommerce'),
                'already_reviewed' => false,
            ];
        }

        // 2. Check if any order containing this product has been delivered
        $is_delivered = OrderItem::where('product_id', $product_id)
            ->where_has('order', function ($q) use ($user_id, $email, $customer_ids) {
                $q->where(function ($inner) use ($user_id, $email, $customer_ids) {
                    $has_condition = false;
                    if ($user_id) {
                        $inner->where('created_by', $user_id);
                        $has_condition = true;
                    }
                    if (!empty($customer_ids)) {
                        if ($has_condition) {
                            $inner->or_where_in('customer_id', $customer_ids);
                        } else {
                            $inner->where_in('customer_id', $customer_ids);
                            $has_condition = true;
                        }
                    }
                    if ($email) {
                        if ($has_condition) {
                            $inner->or_where('customer_email', $email)
                                ->or_where('billing_email', $email)
                                ->or_where('shipping_email', $email);
                        } else {
                            $inner->where('customer_email', $email)
                                ->or_where('billing_email', $email)
                                ->or_where('shipping_email', $email);
                        }
                    }
                })->where(function ($sq) {
                    $sq->where('fulfillment_status', 'delivered')
                        ->or_where('order_status', 'completed')
                        ->or_where('order_status', 'delivered_unpaid')
                        ->or_where_not_null('delivered_at');
                });
            })->exists();

        if (!$is_delivered) {
            return [
                'can_review' => false,
                'reason' => 'not_delivered',
                'message' => __('Your order has not been delivered yet. You can submit a review once your product is delivered.', 'kirki-ecommerce'),
                'already_reviewed' => false,
            ];
        }

        // 3. Check if the user already submitted a review
        $already_reviewed = static::where('product_id', $product_id)
            ->where(function ($q) use ($user_id, $email) {
                if ($user_id) {
                    $q->where('user_id', $user_id);
                }
                if ($email) {
                    if ($user_id) {
                        $q->or_where('author_email', $email);
                    } else {
                        $q->where('author_email', $email);
                    }
                }
            })->exists();

        return [
            'can_review' => true,
            'reason' => 'eligible',
            'message' => __('You are eligible to review this product.', 'kirki-ecommerce'),
            'already_reviewed' => (bool) $already_reviewed,
        ];
    }
}
