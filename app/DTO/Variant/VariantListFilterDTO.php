<?php

namespace Kirki\Ecommerce\App\DTO\Variant;

use Kirki\Ecommerce\App\DTO\ListFilterDTO;

/**
 * Filters for listing product variants, adding catalog and inventory filters to the shared list filters.
 *
 * @since 1.0.0
 */
class VariantListFilterDTO extends ListFilterDTO
{
    /** @var string|null */
    public $status;

    /** @var int[]|null */
    public $category_ids;

    /** @var int|null */
    public $brand_id;

    /** @var string|null */
    public $collection_id;

    /** @var string|null */
    public $inventory_type = 'all';
}
