<?php

namespace Kirki\Ecommerce\App\Constants\Product;

use Kirki\Ecommerce\Framework\Concerns\HasConstants;

class ProductStatus
{
    use HasConstants;

    const DRAFT = 'draft';
    const PUBLISHED = 'published';
    const TRASHED = 'trashed';
}
