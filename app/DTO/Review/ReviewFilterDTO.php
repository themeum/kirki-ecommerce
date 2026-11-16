<?php

namespace Kirki\Ecommerce\App\DTO\Review;

defined('ABSPATH') || exit;

use Kirki\Ecommerce\App\DTO\ListFilterDTO;

/**
 * Filters for listing reviews, extending list filters with product_id, status, and rating.
 *
 * @since 1.0.1
 */
class ReviewFilterDTO extends ListFilterDTO
{
    /** @var int|null */
    public $product_id;

    /** @var string|null */
    public $status;

    /** @var int|null */
    public $rating;
}
