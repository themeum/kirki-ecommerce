<?php

namespace Kirki\Ecommerce\App\Currency\DTO;

use Kirki\Ecommerce\Framework\DTO;

/**
 * Data object for a currency provider's API quota usage.
 *
 * @since 1.0.0
 */
class APIUsageDTO extends DTO
{
    /**
     * @var int|null
     */
    public $total;

    /**
     * @var int|null
     */
    public $used;

    /**
     * @var int|null
     */
    public $remaining;

    /**
     * @var string|null
     */
    public $reset_at;
}
