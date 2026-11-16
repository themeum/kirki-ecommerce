<?php

namespace Kirki\Ecommerce\App\Actions\Review;

defined('ABSPATH') || exit;

use Kirki\Ecommerce\App\Constants\Review\ReviewStatus;
use Kirki\Ecommerce\App\DTO\Review\CreateReviewDTO;
use Kirki\Ecommerce\App\Mails\Admins\AdminNewReviewMail;
use Kirki\Ecommerce\App\Models\Review;
use Kirki\Ecommerce\App\Services\EmailService;
use Kirki\Ecommerce\App\Services\ReviewService;
use Kirki\Ecommerce\Framework\Exceptions\ValidationException;
use Kirki\Ecommerce\Framework\Http\Response;
use Kirki\Ecommerce\Framework\Supports\Facades\DB;
use Throwable;

use function Kirki\Ecommerce\Framework\throw_if;
use function Kirki\Ecommerce\Framework\user;

/**
 * Creates a product review after verifying customer eligibility.
 *
 * @since 1.0.1
 */
class CreateReviewAction
{
    /** @var ReviewService */
    protected $review_service;

    /** @var EmailService */
    protected $email_service;

    /**
     * Create the action instance.
     *
     * @since 1.0.1
     *
     * @param ReviewService $review_service
     * @param EmailService  $email_service
     */
    public function __construct(ReviewService $review_service, EmailService $email_service)
    {
        $this->review_service = $review_service;
        $this->email_service = $email_service;
    }

    /**
     * Execute the review creation.
     *
     * @since 1.0.1
     *
     * @param CreateReviewDTO $payload
     * @return Review
     * @throws ValidationException When the user is not eligible to review.
     * @throws Throwable
     */
    public function execute(CreateReviewDTO $payload)
    {
        // Check eligibility: user must have a delivered purchase for this product
        $eligibility = $this->review_service->check_eligibility(
            $payload->product_id,
            $payload->user_id,
            $payload->author_email
        );

        if (!$eligibility['can_review']) {
            throw new ValidationException($eligibility['message'], Response::FORBIDDEN);
        }

        // If user already reviewed, update their existing review instead of creating duplicate
        if (!empty($eligibility['already_reviewed']) && !empty($eligibility['existing_review']['id'])) {
            $existing_id = (int) $eligibility['existing_review']['id'];
            $review = Review::find($existing_id);
            if ($review) {
                $review->update([
                    'rating' => $payload->rating,
                    'title' => $payload->title,
                    'content' => $payload->content,
                    'status' => ReviewStatus::PENDING,
                ]);
                return $this->review_service->find($existing_id);
            }
        }

        $is_admin = user()->is_admin();
        $payload->is_verified_purchase = true;
        $payload->status = $is_admin ? ReviewStatus::APPROVED : ReviewStatus::PENDING;

        DB::begin_transaction();

        try {
            $review = $this->review_service->create($payload);

            DB::commit();

            // Send notification to store admin
            try {
                $admin_email = get_option('admin_email');
                if (!empty($admin_email)) {
                    $subject = sprintf(
                        __('[%s] New Product Review Submitted: %s (%d Stars)', 'kirki-ecommerce'),
                        get_bloginfo('name'),
                        $review->product ? $review->product->title : '',
                        $review->rating
                    );
                    $admin_url = admin_url('admin.php?page=kirki-ecommerce#/reviews');
                    $body = sprintf(
                        __("A new product review has been submitted on %s:\n\nProduct: %s\nRating: %d/5 Stars\nAuthor: %s (%s)\nTitle: %s\n\nContent:\n%s\n\nModerate review in Kirki eCommerce admin:\n%s", 'kirki-ecommerce'),
                        get_bloginfo('name'),
                        $review->product ? $review->product->title : 'Product #' . $review->product_id,
                        $review->rating,
                        $review->author_name,
                        $review->author_email,
                        $review->title ?: __('(No title)', 'kirki-ecommerce'),
                        $review->content,
                        $admin_url
                    );
                    wp_mail($admin_email, $subject, $body);
                }
            } catch (\Throwable $e) {
                // Ignore mail sending failure
            }

            return $this->review_service->find($review->id);
        } catch (Throwable $e) {
            DB::roll_back();
            throw $e;
        }
    }
}
