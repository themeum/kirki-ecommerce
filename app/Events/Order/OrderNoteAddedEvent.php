<?php

namespace Kirki\Ecommerce\App\Events\Order;

defined('ABSPATH') || exit;

use Kirki\Ecommerce\App\Models\Order;
use Kirki\Ecommerce\Framework\Concerns\Dispatchable;

/**
 * Event for a note an admin added to an order for its customer to read.
 *
 * Dispatched only for comments the admin chose to notify the customer about;
 * internal comments do not dispatch it.
 *
 * @since 1.0.0
 */
class OrderNoteAddedEvent
{
    use Dispatchable;

    /** @var Order */
    public $order;

    /** @var string */
    public $note;

    /**
     * Create the event for a customer-visible order note.
     *
     * @since 1.0.0
     *
     * @param Order  $order The order the note was added to.
     * @param string $note  The note's text.
     */
    public function __construct(Order $order, string $note)
    {
        $this->order = $order;
        $this->note = $note;
    }
}
