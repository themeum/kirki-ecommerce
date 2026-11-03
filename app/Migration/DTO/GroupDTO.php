<?php

namespace Kirki\Ecommerce\App\Migration\DTO;

defined('ABSPATH') || exit;

use Kirki\Ecommerce\Framework\DTO;

/**
 * Data object describing one migratable data group in a scan result.
 *
 * @since 1.0.0
 */
class GroupDTO extends DTO
{
    /** @var string */
    public $id;

    /** @var string */
    public $label;

    /** @var string */
    public $description = '';

    /** @var int */
    public $count = 0;
}
