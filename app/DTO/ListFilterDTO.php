<?php

namespace Kirki\Ecommerce\App\DTO;

use Kirki\Ecommerce\Framework\DTO;

class ListFilterDTO extends DTO
{
    /** @var string|null */
    public $search;

    /** @var int */
    public $page = 1;

    /** @var int */
    public $limit = 10;

    /** @var string */
    public $sort_by = 'id';

    /** @var string */
    public $sort_order = 'desc';

    /** @var string */
    public $from_date;

    /** @var string */
    public $to_date;
}
