<?php

namespace Kirki\Ecommerce\App\Constants\Review;

defined('ABSPATH') || exit;

use Kirki\Ecommerce\Framework\Concerns\HasConstants;

/**
 * Lifecycle and moderation statuses of a product review.
 *
 * @since 1.0.1
 */
class ReviewStatus
{
    use HasConstants;

    const APPROVED = 'approved';
    const PENDING = 'pending';
    const SPAM = 'spam';
    const TRASH = 'trash';
}
