<?php

namespace Kirki\Ecommerce\App\Migration\DTO;

defined('ABSPATH') || exit;

use Kirki\Ecommerce\Framework\DTO;

/**
 * Data object holding the outcome of migrating one chunk of one group.
 *
 * @since 1.0.0
 */
class ChunkResultDTO extends DTO
{
    /** @var string */
    public $group;

    /** @var int */
    public $processed = 0;

    /** @var int */
    public $created = 0;

    /** @var int */
    public $reused = 0;

    /** @var int */
    public $skipped = 0;

    /** @var int The source id of the last item read; the next chunk starts after it. */
    public $cursor = 0;

    /** @var bool Whether no more items remain after this chunk. */
    public $finished = false;

    /** @var SkippedItemDTO[] */
    public $skipped_items = [];

    /** @var string[] Notes about values that were changed to fit, such as a suffixed SKU. */
    public $notes = [];
}
