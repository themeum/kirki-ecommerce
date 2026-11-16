<?php

namespace Kirki\Ecommerce\App\Policies;

defined('ABSPATH') || exit;

use Kirki\Ecommerce\App\Models\Product;
use Kirki\Ecommerce\App\Models\Review;
use Kirki\Ecommerce\App\Services\ReviewService;
use Kirki\Ecommerce\Framework\Wordpress\User;

use function Kirki\Ecommerce\Framework\app;

/**
 * Authorization rules for product reviews.
 *
 * @since 1.0.1
 */
class ReviewPolicy
{
    /**
     * Determine whether the user can create a review for the product.
     *
     * @since 1.0.1
     *
     * @param User         $user    The acting user.
     * @param Product|null $product The product being reviewed.
     * @return bool
     */
    public function create(User $user, ?Product $product = null): bool
    {
        if ($user->is_admin()) {
            return true;
        }

        if (!$user->is_logged_in() || !$product) {
            return false;
        }

        $email = $user->user ? $user->user->user_email : null;
        $eligibility = app(ReviewService::class)->check_eligibility(
            $product->id,
            $user->get_id(),
            $email
        );

        return (bool) ($eligibility['can_review'] && empty($eligibility['already_reviewed']));
    }

    /**
     * Determine whether the user can reply to a review.
     *
     * @since 1.0.1
     *
     * @param User   $user   The acting user.
     * @param Review $review The review record.
     * @return bool
     */
    public function reply(User $user, Review $review): bool
    {
        return $user->is_admin();
    }

    /**
     * Determine whether the user can update a review.
     *
     * @since 1.0.1
     *
     * @param User   $user   The acting user.
     * @param Review $review The review record.
     * @return bool
     */
    public function update(User $user, Review $review): bool
    {
        return $user->is_admin();
    }

    /**
     * Determine whether the user can delete a review.
     *
     * @since 1.0.1
     *
     * @param User   $user   The acting user.
     * @param Review $review The review record.
     * @return bool
     */
    public function delete(User $user, Review $review): bool
    {
        return $user->is_admin();
    }

    /**
     * Determine whether the user can vote helpful on a review.
     *
     * @since 1.0.1
     *
     * @param User   $user   The acting user.
     * @param Review $review The review record.
     * @return bool
     */
    public function vote_helpful(User $user, Review $review): bool
    {
        if ($user->is_logged_in() && $review->user_id && (int) $review->user_id === (int) $user->get_id()) {
            return false;
        }

        return true;
    }
}
