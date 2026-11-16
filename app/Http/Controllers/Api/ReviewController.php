<?php

namespace Kirki\Ecommerce\App\Http\Controllers\Api;

defined('ABSPATH') || exit;

use Kirki\Ecommerce\App\Constants\Pagination;
use Kirki\Ecommerce\App\Models\Order;
use Kirki\Ecommerce\App\Models\OrderItem;
use Kirki\Ecommerce\App\Models\Product;
use Kirki\Ecommerce\App\Models\Review;
use Kirki\Ecommerce\Framework\Contracts\Request;
use Kirki\Ecommerce\Framework\Database\Query\Paginator;
use Kirki\Ecommerce\Framework\Exceptions\NotFoundException;
use Kirki\Ecommerce\Framework\Exceptions\UnauthorizedException;
use Kirki\Ecommerce\Framework\Exceptions\ValidationException;
use Kirki\Ecommerce\Framework\Http\Response;

use function Kirki\Ecommerce\Framework\response;
use function Kirki\Ecommerce\Framework\throw_if;
use function Kirki\Ecommerce\Framework\user;

/**
 * REST controller for product reviews and ratings.
 *
 * @since 1.0.1
 */
class ReviewController
{
    /**
     * List reviews, paginated.
     *
     * @since 1.0.1
     *
     * @param Request $request
     * @return \Kirki\Ecommerce\Framework\Http\JsonResponse
     */
    public function get(Request $request)
    {
        $query = Review::query()->with('product');

        $product_id = $request->int('product_id');
        if ($product_id) {
            $query->where('product_id', $product_id);
        }

        $status = $request->string('status');
        if (!empty($status) && $status !== 'all') {
            $query->where('status', $status);
        }

        $search = $request->string('search');
        if (!empty($search)) {
            $query->where(function ($q) use ($search) {
                $q->where('author_name', 'like', "%{$search}%")
                    ->or_where('author_email', 'like', "%{$search}%")
                    ->or_where('title', 'like', "%{$search}%")
                    ->or_where('content', 'like', "%{$search}%");
            });
        }

        $query->order_by_desc('created_at');

        $page = $request->int('page', 1);
        $limit = $request->int('limit', Pagination::LIMIT);

        $paginator = $query->paginate($limit, $page);

        return response()->json([
            'data' => $paginator->to_array(),
            'message' => __('Reviews retrieved successfully.', 'kirki-ecommerce'),
        ]);
    }

    /**
     * Return a single review by ID.
     *
     * @since 1.0.1
     *
     * @param Request $request
     * @return \Kirki\Ecommerce\Framework\Http\JsonResponse
     */
    public function show(Request $request)
    {
        $review = Review::with('product')->find($request->int('id'));

        throw_if(!$review, __('Review not found.', 'kirki-ecommerce'), NotFoundException::class, Response::NOT_FOUND);

        return response()->json([
            'data' => $review,
            'message' => __('Review retrieved successfully.', 'kirki-ecommerce'),
        ]);
    }

    /**
     * Submit a new review for a product.
     *
     * @since 1.0.1
     *
     * @param Request $request
     * @return \Kirki\Ecommerce\Framework\Http\JsonResponse
     */
    public function store(Request $request)
    {
        $product_id = $request->int('product_id') ?: $request->int('id');

        $request->validate([
            'rating' => 'required|integer|min:1|max:5',
            'content' => 'required|string|max:5000',
            'author_name' => 'required|string|max:255',
            'author_email' => 'required|email|max:255',
            'title' => 'nullable|string|max:255',
        ]);

        $product = Product::find($product_id);

        throw_if(!$product, __('Product not found.', 'kirki-ecommerce'), NotFoundException::class, Response::NOT_FOUND);

        $current_user_id = user()->get_id() ?: (function_exists('is_user_logged_in') && is_user_logged_in() ? get_current_user_id() : null);
        $current_wp_user = function_exists('wp_get_current_user') ? wp_get_current_user() : null;
        $author_email = ($current_wp_user && !empty($current_wp_user->user_email))
            ? $current_wp_user->user_email
            : $request->string('author_email');
        $author_name = ($current_wp_user && (!empty($current_wp_user->display_name) || !empty($current_wp_user->user_nicename)))
            ? ($current_wp_user->display_name ?: $current_wp_user->user_nicename)
            : $request->string('author_name');

        // Check user eligibility: user must have bought the product and the order must be delivered
        $eligibility = Review::check_user_eligibility($product_id, $current_user_id, $author_email);

        if (!$eligibility['can_review']) {
            $status_code = $eligibility['reason'] === 'not_logged_in' ? Response::UNAUTHORIZED : Response::FORBIDDEN;
            return response()->json([
                'message' => $eligibility['message'],
                'code' => $eligibility['reason'],
            ], $status_code);
        }

        if ($eligibility['already_reviewed']) {
            if (!empty($eligibility['existing_review']['id'])) {
                $existing = Review::find($eligibility['existing_review']['id']);
                if ($existing) {
                    $existing->update([
                        'rating' => $request->int('rating'),
                        'title' => $request->string('title') ?: null,
                        'content' => $request->string('content'),
                        'status' => Review::STATUS_PENDING,
                    ]);

                    return response()->json([
                        'data' => $existing,
                        'message' => __('Your review has been updated and submitted for approval.', 'kirki-ecommerce'),
                    ]);
                }
            }

            return response()->json([
                'message' => __('You have already submitted a review for this product.', 'kirki-ecommerce'),
                'code' => 'already_reviewed',
            ], Response::BAD_REQUEST);
        }

        $is_admin = function_exists('current_user_can') && current_user_can('manage_options');
        $status = $is_admin ? Review::STATUS_APPROVED : Review::STATUS_PENDING;

        $review = Review::create([
            'product_id' => $product_id,
            'user_id' => $current_user_id,
            'author_name' => $author_name,
            'author_email' => $author_email,
            'rating' => $request->int('rating'),
            'title' => $request->string('title') ?: null,
            'content' => $request->string('content'),
            'status' => $status,
            'is_verified_purchase' => true,
        ]);

        // Send notification email to admin
        try {
            $admin_email = get_option('admin_email');
            if (!empty($admin_email)) {
                $rating_stars = str_repeat('★', (int) $request->int('rating'));
                $subject = sprintf(__('[Kirki eCommerce] New Review: %s (%s)', 'kirki-ecommerce'), $product->title, $rating_stars);
                $body = sprintf(
                    __("A new review was submitted for \"%s\".\n\nAuthor: %s (%s)\nRating: %d/5 Stars\nTitle: %s\nReview:\n%s\n\nStatus: %s\n\nReview link in admin: %s", 'kirki-ecommerce'),
                    $product->title,
                    $author_name,
                    $author_email,
                    $request->int('rating'),
                    $request->string('title') ?: '(No title)',
                    $request->string('content'),
                    $status,
                    admin_url('admin.php?page=kirki-ecommerce#/reviews')
                );
                wp_mail($admin_email, $subject, $body);
            }
        } catch (\Throwable $e) {
            // Silently ignore mail errors
        }

        $message = $status === Review::STATUS_APPROVED
            ? __('Review submitted and published successfully.', 'kirki-ecommerce')
            : __('Review submitted successfully. It will be visible after approval.', 'kirki-ecommerce');

        return response()->json([
            'data' => $review,
            'message' => $message,
        ], Response::CREATED);
    }

    /**
     * Get approved reviews and rating stats for a specific product.
     *
     * @since 1.0.1
     *
     * @param Request $request
     * @return \Kirki\Ecommerce\Framework\Http\JsonResponse
     */
    public function product_reviews(Request $request)
    {
        $product_id = $request->int('id') ?: $request->int('product_id');
        $product = Product::find($product_id);

        throw_if(!$product, __('Product not found.', 'kirki-ecommerce'), NotFoundException::class, Response::NOT_FOUND);

        $reviews = Review::where('product_id', $product_id)
            ->where('status', Review::STATUS_APPROVED)
            ->order_by_desc('created_at')
            ->get();

        $count = $reviews->count();
        $total_rating = 0;
        foreach ($reviews as $rev) {
            $total_rating += (int) $rev->rating;
        }
        $average = $count > 0 ? round($total_rating / $count, 1) : 0;

        $current_user_id = user()->get_id() ?: (function_exists('is_user_logged_in') && is_user_logged_in() ? get_current_user_id() : null);
        $current_wp_user = function_exists('wp_get_current_user') ? wp_get_current_user() : null;
        $current_email = $current_wp_user ? $current_wp_user->user_email : null;
        $eligibility = Review::check_user_eligibility($product_id, $current_user_id, $current_email);

        return response()->json([
            'data' => [
                'reviews' => $reviews->map(function ($r) {
                    return [
                        'id' => (int) $r->id,
                        'author_name' => $r->author_name,
                        'rating' => (int) $r->rating,
                        'title' => $r->title,
                        'content' => $r->content,
                        'is_verified_purchase' => (bool) $r->is_verified_purchase,
                        'created_at' => $r->created_at ? (is_string($r->created_at) ? date('M d, Y', strtotime($r->created_at)) : $r->created_at->format('M d, Y')) : '',
                    ];
                })->all(),
                'total' => $count,
                'average_rating' => $average,
                'user_eligibility' => $eligibility,
            ],
            'message' => __('Product reviews retrieved successfully.', 'kirki-ecommerce'),
        ]);
    }

    /**
     * Update review status (approve, reject, pending).
     *
     * @since 1.0.1
     *
     * @param Request $request
     * @return \Kirki\Ecommerce\Framework\Http\JsonResponse
     */
    public function update_status(Request $request)
    {
        $request->validate([
            'status' => 'required|string|in:' . implode(',', [Review::STATUS_PENDING, Review::STATUS_APPROVED, Review::STATUS_REJECTED]),
        ]);

        $review = Review::find($request->int('id'));

        throw_if(!$review, __('Review not found.', 'kirki-ecommerce'), NotFoundException::class, Response::NOT_FOUND);

        $review->update([
            'status' => $request->string('status'),
        ]);

        return response()->json([
            'data' => $review,
            'message' => __('Review status updated.', 'kirki-ecommerce'),
        ]);
    }

    /**
     * Delete a review.
     *
     * @since 1.0.1
     *
     * @param Request $request
     * @return \Kirki\Ecommerce\Framework\Http\JsonResponse
     */
    public function delete(Request $request)
    {
        $review = Review::find($request->int('id'));

        throw_if(!$review, __('Review not found.', 'kirki-ecommerce'), NotFoundException::class, Response::NOT_FOUND);

        $review->delete();

        return response()->json([
            'message' => __('Review deleted successfully.', 'kirki-ecommerce'),
        ]);
    }

    /**
     * Perform bulk actions on reviews.
     *
     * @since 1.0.1
     *
     * @param Request $request
     * @return \Kirki\Ecommerce\Framework\Http\JsonResponse
     */
    public function bulk_actions(Request $request)
    {
        $request->validate([
            'action' => 'required|string|in:approve,reject,delete',
            'ids' => 'required|array',
            'ids.*' => 'integer',
        ]);

        $action = $request->string('action');
        $ids = $request->get('ids', []);

        if (empty($ids)) {
            return response()->json([
                'message' => __('No reviews selected.', 'kirki-ecommerce'),
            ], Response::BAD_REQUEST);
        }

        if ($action === 'approve') {
            Review::where_in('id', $ids)->update(['status' => Review::STATUS_APPROVED]);
            $message = __('Selected reviews approved.', 'kirki-ecommerce');
        } elseif ($action === 'reject') {
            Review::where_in('id', $ids)->update(['status' => Review::STATUS_REJECTED]);
            $message = __('Selected reviews rejected.', 'kirki-ecommerce');
        } elseif ($action === 'delete') {
            Review::where_in('id', $ids)->delete();
            $message = __('Selected reviews deleted.', 'kirki-ecommerce');
        }

        return response()->json([
            'message' => $message ?? __('Bulk action completed.', 'kirki-ecommerce'),
        ]);
    }

    /**
     * Admin updates review fields (rating, title, content, status).
     *
     * @since 1.0.1
     *
     * @param Request $request
     * @return \Kirki\Ecommerce\Framework\Http\JsonResponse
     */
    public function update(Request $request)
    {
        $review = Review::find($request->int('id'));
        throw_if(!$review, __('Review not found.', 'kirki-ecommerce'), NotFoundException::class, Response::NOT_FOUND);

        $request->validate([
            'rating' => 'sometimes|integer|min:1|max:5',
            'title' => 'nullable|string|max:255',
            'content' => 'sometimes|string|max:5000',
            'status' => 'sometimes|string',
        ]);

        $data = [];
        if ($request->has('rating')) {
            $data['rating'] = $request->int('rating');
        }
        if ($request->has('title')) {
            $data['title'] = $request->string('title') ?: null;
        }
        if ($request->has('content')) {
            $data['content'] = $request->string('content');
        }
        if ($request->has('status')) {
            $data['status'] = $request->string('status');
        }

        $review->update($data);

        return response()->json([
            'data' => $review,
            'message' => __('Review updated successfully.', 'kirki-ecommerce'),
        ]);
    }

    /**
     * Admin adds or updates a store owner reply to a review.
     *
     * @since 1.0.1
     *
     * @param Request $request
     * @return \Kirki\Ecommerce\Framework\Http\JsonResponse
     */
    public function reply(Request $request)
    {
        $review = Review::find($request->int('id'));
        throw_if(!$review, __('Review not found.', 'kirki-ecommerce'), NotFoundException::class, Response::NOT_FOUND);

        $request->validate([
            'admin_reply' => 'required|string|max:5000',
        ]);

        $review->update([
            'admin_reply' => $request->string('admin_reply'),
            'admin_replied_at' => current_time('mysql'),
        ]);

        return response()->json([
            'data' => $review,
            'message' => __('Reply saved successfully.', 'kirki-ecommerce'),
        ]);
    }

    /**
     * Upvote a review as helpful.
     *
     * @since 1.0.1
     *
     * @param Request $request
     * @return \Kirki\Ecommerce\Framework\Http\JsonResponse
     */
    public function vote_helpful(Request $request)
    {
        $review_id = $request->int('id');
        $review = Review::find($review_id);
        throw_if(!$review, __('Review not found.', 'kirki-ecommerce'), NotFoundException::class, Response::NOT_FOUND);

        $cookie_name = 'kecom_voted_review_' . $review_id;
        if (!empty($_COOKIE[$cookie_name])) {
            return response()->json([
                'message' => __('You have already voted this review as helpful.', 'kirki-ecommerce'),
                'helpful_count' => (int) $review->helpful_count,
            ], Response::BAD_REQUEST);
        }

        $new_count = ((int) $review->helpful_count) + 1;
        $review->update(['helpful_count' => $new_count]);

        if (!headers_sent()) {
            setcookie($cookie_name, '1', time() + (30 * DAY_IN_SECONDS), COOKIEPATH ?: '/', COOKIE_DOMAIN ?: '', is_ssl(), true);
        }

        return response()->json([
            'message' => __('Thank you for your feedback.', 'kirki-ecommerce'),
            'helpful_count' => $new_count,
        ]);
    }

    /**
     * Get reviews submitted by the currently logged-in customer.
     *
     * @since 1.0.1
     *
     * @param Request $request
     * @return \Kirki\Ecommerce\Framework\Http\JsonResponse
     */
    public function customer_reviews(Request $request)
    {
        $user_id = function_exists('is_user_logged_in') && is_user_logged_in() ? get_current_user_id() : null;
        throw_if(!$user_id, __('Please log in.', 'kirki-ecommerce'), UnauthorizedException::class, Response::UNAUTHORIZED);

        $reviews = Review::with('product')
            ->where('user_id', $user_id)
            ->order_by_desc('created_at')
            ->get();

        return response()->json([
            'data' => $reviews,
            'message' => __('Your reviews retrieved successfully.', 'kirki-ecommerce'),
        ]);
    }
}
