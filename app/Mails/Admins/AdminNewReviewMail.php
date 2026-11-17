<?php

namespace Kirki\Ecommerce\App\Mails\Admins;

defined('ABSPATH') || exit;

use Kirki\Ecommerce\App\Mails\Mailer;
use Kirki\Ecommerce\App\Models\Review;
use Kirki\Ecommerce\App\Resources\Review\ReviewResource;

/**
 * Email sent to the store admin when a new product review is submitted.
 *
 * @since 1.0.1
 */
class AdminNewReviewMail extends Mailer
{
    /** @var Review */
    protected $review;

    /**
     * Create the mail for the given review.
     *
     * @since 1.0.1
     *
     * @param Review $review The submitted review.
     */
    public function __construct(Review $review)
    {
        $this->review = $review;
    }

    /**
     * @inheritDoc
     *
     * @since 1.0.1
     */
    public function option_key()
    {
        return 'admin_emails.review_notifications.new_review';
    }

    /**
     * @inheritDoc
     *
     * @since 1.0.1
     */
    public function with()
    {
        $review = ReviewResource::make($this->review);

        return [
            'review' => $review,
            'product_title' => $this->review->product ? $this->review->product->title : '',
            'rating' => $this->review->rating,
            'author_name' => $this->review->author_name,
            'author_email' => $this->review->author_email,
            'title' => $this->review->title,
            'content' => $this->review->content,
        ];
    }
}
