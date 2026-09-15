<?php

namespace Kirki\Ecommerce\App\DTO\Tax;

use Kirki\Ecommerce\Framework\DTO;

class TaxLineDTO extends DTO
{
    /**
     * @var string
     */
    public $name;

    /**
     * @var float
     */
    public $rate;

    /**
     * @var int
     */
    public $base_amount;

    /**
     * The item this tax line belongs to. Always set on an item's own tax
     * line. On a shipping tax line, set only when the shipping tax was
     * split proportionally across items (e.g. EU shipping tax following the
     * goods' VAT rates) - the item that portion was allocated to; null when
     * the line applies to the order's shipping as a whole rather than being
     * split per item.
     *
     * @var int|string|null
     */
    public $item_id;
}
