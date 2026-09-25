<?php

namespace Kirki\Ecommerce\App\Constants\Product;

use Kirki\Ecommerce\Framework\Concerns\HasConstants;

/**
 * Publication statuses of a product.
 *
 * @since 1.0.0
 */
class ProductStatus
{
    use HasConstants;

    const DRAFT = 'draft';
    const PUBLISHED = 'published';
    const SCHEDULED = 'scheduled';
    const TRASHED = 'trashed';
}
