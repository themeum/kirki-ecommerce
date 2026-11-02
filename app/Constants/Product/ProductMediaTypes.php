<?php

namespace Kirki\Ecommerce\App\Constants\Product;

defined('ABSPATH') || exit;

/**
 * Attachment types a product's media fields accept.
 *
 * A type without a subtype, such as `image`, matches every subtype of it. A full
 * MIME type, such as `application/pdf`, matches exactly.
 *
 * @since 1.0.0
 */
class ProductMediaTypes
{
    const ALLOWED = ['image'];
}
