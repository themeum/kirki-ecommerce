<?php

namespace Kirki\Ecommerce\App\Services;

defined('ABSPATH') || exit;

use Kirki\Ecommerce\App\Concerns\HasSortableColumns;
use Kirki\Ecommerce\App\Constants\Order\FulfillmentStatus;
use Kirki\Ecommerce\App\Constants\Order\OrderStatus;
use Kirki\Ecommerce\App\Constants\Pagination;
use Kirki\Ecommerce\App\Constants\Review\ReviewStatus;
use Kirki\Ecommerce\App\DTO\Review\CreateReviewDTO;
use Kirki\Ecommerce\App\DTO\Review\ReviewFilterDTO;
use Kirki\Ecommerce\App\DTO\Review\UpdateReviewDTO;
use Kirki\Ecommerce\App\Models\Customer;
use Kirki\Ecommerce\App\Models\Order;
use Kirki\Ecommerce\App\Models\OrderItem;
use Kirki\Ecommerce\App\Models\Review;
use Kirki\Ecommerce\App\Supports\ListPaginator;
use Kirki\Ecommerce\Framework\Database\Query\Paginator;
use Kirki\Ecommerce\Framework\Exceptions\NotFoundException;
use Kirki\Ecommerce\Framework\Http\Response;
use Kirki\Ecommerce\Framework\Supports\Facades\Date;

use function Kirki\Ecommerce\Framework\throw_if;

/**
 * Service for querying, moderating, and managing product reviews and ratings.
 *
 * @since 1.0.1
 */
class ReviewService
{
    use HasSortableColumns;

    /**
     * @inheritDoc
     *
     * @since 1.0.1
     */
    protected function sortable_columns()
    {
        return [
            'id' => 'id',
            'product_id' => 'product_id',
            'rating' => 'rating',
            'status' => 'status',
            'helpful_count' => 'helpful_count',
            'created_at' => 'created_at',
            'updated_at' => 'updated_at',
        ];
    }

    /**
     * Get a paginated list of reviews matching the filters.
     *
     * @since 1.0.1
     *
     * @param ReviewFilterDTO $filters
     * @return Paginator
     */
    public function paginated(ReviewFilterDTO $filters)
    {
        $query = Review::query()->with('product');

        if (!empty($filters->product_id)) {
            $query->where('product_id', (int) $filters->product_id);
        }

        if (!empty($filters->status) && $filters->status !== 'all') {
            $query->where('status', $filters->status);
        }

        if (!empty($filters->rating)) {
            $query->where('rating', (int) $filters->rating);
        }

        if (!empty($filters->search)) {
            $search = $filters->search;
            $query->where(function ($q) use ($search) {
                $q->where('author_name', 'like', "%{$search}%")
                    ->or_where('author_email', 'like', "%{$search}%")
                    ->or_where('title', 'like', "%{$search}%")
                    ->or_where('content', 'like', "%{$search}%");
            });
        }

        $query = $this->apply_sorting(
            $query,
            $filters->sort_by ?? 'created_at',
            $filters->sort_order ?? 'desc'
        );

        $page = $query->paginate($filters->limit ?? Pagination::LIMIT, $filters->page ?? 1);

        return ListPaginator::from($page, Review::query());
    }

    /**
     * Find a single review by ID.
     *
     * @since 1.0.1
     *
     * @param int $id
     * @return Review
     * @throws NotFoundException When the review does not exist.
     */
    public function find(int $id)
    {
        $review = Review::with('product')->find($id);

        throw_if(empty($review), __('Review not found.', 'kirki-ecommerce'), NotFoundException::class, Response::NOT_FOUND);

        return $review;
    }

    /**
     * Create a new review record.
     *
     * @since 1.0.1
     *
     * @param CreateReviewDTO $payload
     * @return Review
     */
    public function create(CreateReviewDTO $payload)
    {
        return Review::create([
            'product_id' => $payload->product_id,
            'user_id' => $payload->user_id,
            'author_name' => $payload->author_name,
            'author_email' => $payload->author_email,
            'rating' => $payload->rating,
            'title' => $payload->title,
            'content' => $payload->content,
            'status' => $payload->status ?? ReviewStatus::PENDING,
            'is_verified_purchase' => $payload->is_verified_purchase ? 1 : 0,
            'helpful_count' => 0,
        ]);
    }

    /**
     * Update an existing review.
     *
     * @since 1.0.1
     *
     * @param int             $id
     * @param UpdateReviewDTO $payload
     * @return Review
     */
    public function update(int $id, UpdateReviewDTO $payload)
    {
        $review = $this->find($id);

        $updates = [];

        if ($payload->rating !== null) {
            $updates['rating'] = (int) $payload->rating;
        }

        if ($payload->title !== null) {
            $updates['title'] = $payload->title;
        }

        if ($payload->content !== null) {
            $updates['content'] = $payload->content;
        }

        if ($payload->status !== null) {
            $updates['status'] = $payload->status;
        }

        if ($payload->admin_reply !== null) {
            $updates['admin_reply'] = $payload->admin_reply;
            $updates['admin_replied_at'] = Date::now('UTC')->to_date_time_string();
        }

        if (!empty($updates)) {
            $review->update($updates);
        }

        return $this->find($id);
    }

    /**
     * Update review status.
     *
     * @since 1.0.1
     *
     * @param int    $id
     * @param string $status
     * @return Review
     */
    public function update_status(int $id, string $status)
    {
        $review = $this->find($id);
        $review->update(['status' => $status]);

        return $this->find($id);
    }

    /**
     * Add or update an administrative reply to a review.
     *
     * @since 1.0.1
     *
     * @param int    $id
     * @param string $reply
     * @return Review
     */
    public function reply(int $id, string $reply)
    {
        $review = $this->find($id);
        $review->update([
            'admin_reply' => $reply,
            'admin_replied_at' => Date::now('UTC')->to_date_time_string(),
        ]);

        return $this->find($id);
    }

    /**
     * Increment the helpful counter for a review.
     *
     * @since 1.0.1
     *
     * @param int $id
     * @return Review
     */
    public function vote_helpful(int $id)
    {
        $review = $this->find($id);
        $current = (int) ($review->helpful_count ?? 0);
        $review->update(['helpful_count' => $current + 1]);

        return $this->find($id);
    }

    /**
     * Delete a single review by ID.
     *
     * @since 1.0.1
     *
     * @param int $id
     * @return bool
     */
    public function delete(int $id)
    {
        $review = $this->find($id);

        return (bool) $review->delete();
    }

    /**
     * Delete multiple reviews by ID.
     *
     * @since 1.0.1
     *
     * @param int[] $ids
     * @return int Number of deleted records.
     */
    public function bulk_delete(array $ids)
    {
        if (empty($ids)) {
            return 0;
        }

        return Review::where_in('id', array_map('intval', $ids))->delete();
    }

    /**
     * Delete all reviews matching the filters.
     *
     * @since 1.0.1
     *
     * @param ReviewFilterDTO $filters
     * @return int
     */
    public function delete_all(ReviewFilterDTO $filters)
    {
        $query = Review::query();

        if (!empty($filters->product_id)) {
            $query->where('product_id', (int) $filters->product_id);
        }

        if (!empty($filters->status) && $filters->status !== 'all') {
            $query->where('status', $filters->status);
        }

        return $query->delete();
    }

    /**
     * Check whether a user is eligible to write a review for a product.
     *
     * Verified buyers must have an order containing this product with
     * fulfillment status delivered or completed.
     *
     * @since 1.0.1
     *
     * @param int         $product_id
     * @param int|null    $user_id
     * @param string|null $email
     * @return array{can_review: bool, reason: string, message: string, already_reviewed: bool, existing_review: array|null}
     */
    public function check_eligibility(int $product_id, ?int $user_id = null, ?string $email = null)
    {
        if (empty($user_id) && empty($email)) {
            return [
                'can_review' => false,
                'reason' => 'not_logged_in',
                'message' => __('Please log in to submit a review.', 'kirki-ecommerce'),
                'already_reviewed' => false,
                'existing_review' => null,
            ];
        }

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
            $customers = $cust_q->get();
            if ($customers) {
                foreach ($customers as $c) {
                    $customer_ids[] = (int) $c->id;
                }
            }
        } catch (\Throwable $e) {
            // Customer lookup fallback
        }

        // Query orders placed by this customer or email
        $orders_query = Order::query();
        $orders_query->where(function ($q) use ($customer_ids, $email) {
            if (!empty($customer_ids)) {
                $q->where_in('customer_id', $customer_ids);
            }
            if (!empty($email)) {
                if (!empty($customer_ids)) {
                    $q->or_where('customer_email', $email);
                } else {
                    $q->where('customer_email', $email);
                }
            }
        });

        $eligible_orders = $orders_query->get();
        $delivered_order_ids = [];

        if ($eligible_orders) {
            foreach ($eligible_orders as $ord) {
                $is_delivered = false;
                if (!empty($ord->fulfillment_status) && $ord->fulfillment_status === FulfillmentStatus::DELIVERED) {
                    $is_delivered = true;
                } elseif (!empty($ord->status) && in_array($ord->status, [OrderStatus::COMPLETED, OrderStatus::DELIVERED_UNPAID], true)) {
                    $is_delivered = true;
                }
                if ($is_delivered) {
                    $delivered_order_ids[] = (int) $ord->id;
                }
            }
        }

        if (empty($delivered_order_ids)) {
            return [
                'can_review' => false,
                'reason' => 'not_delivered',
                'message' => __('Only verified buyers who have received this product can write a review.', 'kirki-ecommerce'),
                'already_reviewed' => false,
                'existing_review' => null,
            ];
        }

        // Check if any delivered order contains the target product
        $purchased = OrderItem::where_in('order_id', $delivered_order_ids)
            ->where('product_id', $product_id)
            ->first();

        if (!$purchased) {
            return [
                'can_review' => false,
                'reason' => 'not_purchased',
                'message' => __('You have not purchased this product yet.', 'kirki-ecommerce'),
                'already_reviewed' => false,
                'existing_review' => null,
            ];
        }

        // Check if the user has already submitted a review
        $rev_q = Review::where('product_id', $product_id);
        if ($user_id && $email) {
            $rev_q->where(function ($q) use ($user_id, $email) {
                $q->where('user_id', $user_id)->or_where('author_email', $email);
            });
        } elseif ($user_id) {
            $rev_q->where('user_id', $user_id);
        } else {
            $rev_q->where('author_email', $email);
        }

        $existing = $rev_q->first();
        if ($existing) {
            return [
                'can_review' => true,
                'reason' => 'already_reviewed',
                'message' => __('You have already submitted a review for this product.', 'kirki-ecommerce'),
                'already_reviewed' => true,
                'existing_review' => [
                    'id' => (int) $existing->id,
                    'rating' => (int) $existing->rating,
                    'title' => $existing->title,
                    'content' => $existing->content,
                    'status' => $existing->status,
                ],
            ];
        }

        return [
            'can_review' => true,
            'reason' => 'eligible',
            'message' => __('You are verified to leave a review.', 'kirki-ecommerce'),
            'already_reviewed' => false,
            'existing_review' => null,
        ];
    }

    /**
     * Get aggregate rating and review breakdown for a product.
     *
     * @since 1.0.1
     *
     * @param int $product_id
     * @return array{average_rating: float, reviews_count: int, rating_breakdown: array<int, int>}
     */
    public function get_product_rating_summary(int $product_id)
    {
        $reviews = Review::where('product_id', $product_id)
            ->where('status', ReviewStatus::APPROVED)
            ->get();

        $count = $reviews ? $reviews->count() : 0;
        $breakdown = [5 => 0, 4 => 0, 3 => 0, 2 => 0, 1 => 0];

        if ($count === 0) {
            return [
                'average_rating' => 0.0,
                'reviews_count' => 0,
                'rating_breakdown' => $breakdown,
            ];
        }

        $sum = 0;
        foreach ($reviews as $rev) {
            $r = (int) $rev->rating;
            $sum += $r;
            if (isset($breakdown[$r])) {
                $breakdown[$r]++;
            }
        }

        $average = round($sum / $count, 1);

        return [
            'average_rating' => $average,
            'reviews_count' => $count,
            'rating_breakdown' => $breakdown,
        ];
    }

    /**
     * Get customer reviews for account portal.
     *
     * @since 1.0.1
     *
     * @param int|null $user_id
     * @param string   $email
     * @param int      $page
     * @param int      $limit
     * @return Paginator
     */
    public function get_customer_reviews(?int $user_id, string $email, int $page = 1, int $limit = 10)
    {
        $query = Review::query()->with('product');

        if ($user_id && !empty($email)) {
            $query->where(function ($q) use ($user_id, $email) {
                $q->where('user_id', $user_id)->or_where('author_email', $email);
            });
        } elseif ($user_id) {
            $query->where('user_id', $user_id);
        } else {
            $query->where('author_email', $email);
        }

        $query->order_by_desc('created_at');

        $results = $query->paginate($limit, $page);

        return ListPaginator::from($results, Review::query());
    }
}
