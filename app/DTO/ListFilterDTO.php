<?php

namespace Kirki\Ecommerce\App\DTO;

use Kirki\Ecommerce\DTO;

class ListFilterDTO extends DTO
{
    /** @var string|null */
    public $search;

    /** @var string */
    public $status = 'all';

    /** @var string */
    public $method = 'all';

    /** @var string */
    public $discount_type = 'all';

    /** @var int */
    public $page = 1;

    /** @var int */
    public $limit = 10;

    /** @var string */
    public $sort_by = 'id';

    /** @var string */
    public $sort_order = 'desc';
}
