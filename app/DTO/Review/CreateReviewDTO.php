<?php

namespace Kirki\Ecommerce\App\DTO\Review;

defined('ABSPATH') || exit;

use Kirki\Ecommerce\App\Constants\Review\ReviewStatus;
use Kirki\Ecommerce\Framework\DTO;

/**
 * Data transfer object for creating a product review.
 *
 * @since 1.0.1
 */
class CreateReviewDTO extends DTO
{
    /** @var int */
    public $product_id;

    /** @var int|null */
    public $user_id;

    /** @var string */
    public $author_name;

    /** @var string */
    public $author_email;

    /** @var int */
    public $rating;

    /** @var string|null */
    public $title;

    /** @var string */
    public $content;

    /** @var string */
    public $status = ReviewStatus::PENDING;

    /** @var bool */
    public $is_verified_purchase = false;
}
