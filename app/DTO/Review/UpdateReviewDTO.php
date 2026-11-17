<?php

namespace Kirki\Ecommerce\App\DTO\Review;

defined('ABSPATH') || exit;

use Kirki\Ecommerce\Framework\DTO;

/**
 * Data transfer object for updating a product review.
 *
 * @since 1.0.1
 */
class UpdateReviewDTO extends DTO
{
    /** @var int|null */
    public $rating;

    /** @var string|null */
    public $title;

    /** @var string|null */
    public $content;

    /** @var string|null */
    public $status;

    /** @var string|null */
    public $admin_reply;
}
