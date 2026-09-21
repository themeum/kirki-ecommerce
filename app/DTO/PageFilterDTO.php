<?php

namespace Kirki\Ecommerce\App\DTO;

use Kirki\Ecommerce\Framework\DTO;

/**
 * Filters for listing pages by status.
 *
 * @since 1.0.0
 */
class PageFilterDTO extends DTO
{
    /** @var string|null */
    public $status;
}
