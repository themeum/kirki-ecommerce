<?php

namespace Kirki\Ecommerce\App\DTO\Variant;

use Kirki\Ecommerce\App\DTO\ListFilterDTO;

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
