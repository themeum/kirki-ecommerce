<?php

namespace Kirki\Ecommerce\App\Constants\Product;

use Kirki\Ecommerce\Concerns\HasConstants;

class ProductStatus
{
    use HasConstants;

    const DRAFT = 'draft';
    const PUBLISHED = 'published';
    const UNPUBLISHED = 'unpublished';
    const ARCHIVED = 'archived';
}
