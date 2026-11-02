<?php

namespace Kirki\Ecommerce\Tests\Support\Racing;

use Kirki\Ecommerce\App\Services\OrderService;

/**
 * Order service that runs a competing action once, at the first order read or lock request.
 *
 * Fired by a read, the competitor lands after the caller read the order, so the
 * caller keeps a stale order. Fired by a lock request, it lands before the caller
 * holds the lock, which is the latest moment a competing request can commit.
 *
 * @since 1.0.0
 */
class RacingOrderService extends OrderService
{
    /** @var callable|null */
    public $after_read;

    /**
     * Read the order, then let the competitor run once.
     *
     * @since 1.0.0
     *
     * @param int $id Order ID.
     * @return \Kirki\Ecommerce\App\Models\Order
     */
    public function find_order_or_fail($id)
    {
        $order = parent::find_order_or_fail($id);

        $this->compete();

        return $order;
    }

    /**
     * Let the competitor run once, then lock the order.
     *
     * @since 1.0.0
     *
     * @param int $id Order ID.
     * @return void
     */
    public function lock_order(int $id)
    {
        $this->compete();

        parent::lock_order($id);
    }

    /**
     * Run the competitor callback once.
     *
     * @since 1.0.0
     *
     * @return void
     */
    protected function compete()
    {
        if ($this->after_read) {
            $callback = $this->after_read;
            $this->after_read = null;
            $callback();
        }
    }
}
