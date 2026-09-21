<?php

namespace Kirki\Ecommerce\App\DTO\Product;

use Kirki\Ecommerce\App\DTO\ListFilterDTO;

/**
 * Filters for listing products, adding catalog, price and availability filters to the shared list filters.
 *
 * @since 1.0.0
 */
class ProductListFilterDTO extends ListFilterDTO
{
    /** @var string|null */
    public $status;

    /** @var int[]|null */
    public $category_ids;

    /** @var int|null */
    public $brand_id;

    /** @var int[]|null */
    public $brand_ids;

    /** @var string|null */
    public $collection_id;

    /** @var int|null */
    public $min_price;

    /** @var int|null */
    public $max_price;

    /** @var int[]|null */
    public $attribute_value_ids;

    /** @var string|null */
    public $availability_status = 'all';
}
