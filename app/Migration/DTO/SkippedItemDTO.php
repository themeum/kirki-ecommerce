<?php

namespace Kirki\Ecommerce\App\Migration\DTO;

defined('ABSPATH') || exit;

use Kirki\Ecommerce\Framework\DTO;

/**
 * Data object describing a source item that was skipped, with the reason.
 *
 * @since 1.0.0
 */
class SkippedItemDTO extends DTO
{
    /** @var string */
    public $group;

    /** @var int */
    public $source_id;

    /** @var string */
    public $reason;
}
