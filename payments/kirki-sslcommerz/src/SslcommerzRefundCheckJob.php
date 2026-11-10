<?php

namespace Kirki\Ecommerce\Payments;

use Kirki\Ecommerce\App\Payment\Facades\Payment;
use Kirki\Ecommerce\Framework\Contracts\ShouldQueue;
use Kirki\Ecommerce\Framework\Queue\Concerns\Queueable;

defined('ABSPATH') || exit;

/**
 * Checks an accepted SSLCommerz refund until it has a final state.
 */
class SslcommerzRefundCheckJob implements ShouldQueue
{
    use Queueable;

    const QUEUE = 'sslcommerz-refund-checks';

    /** @var int */
    public $order_id;

    /** @var int */
    public $refund_id;

    /** @var int */
    public $check;

    /**
     * @param int $order_id
     * @param int $refund_id The ID of the refund row.
     * @param int $check     The number of this check, from zero.
     */
    public function __construct(int $order_id, int $refund_id, int $check)
    {
        $this->order_id = $order_id;
        $this->refund_id = $refund_id;
        $this->check = $check;
        $this->on_queue(static::QUEUE);
    }

    /**
     * Run the check through the registered provider.
     *
     * @return void
     */
    public function handle()
    {
        $provider = Payment::get_provider('sslcommerz');

        if ($provider instanceof Sslcommerz) {
            $provider->run_refund_check($this->order_id, $this->refund_id, $this->check);
        }
    }
}
