<?php

namespace Kirki\Ecommerce\Payments;

use Kirki\Ecommerce\App\Payment\Facades\Payment;
use Kirki\Ecommerce\Framework\Contracts\ShouldQueue;
use Kirki\Ecommerce\Framework\Queue\Concerns\Queueable;

defined('ABSPATH') || exit;

/**
 * Checks an unresolved bKash payment with Query Payment. It never calls Execute.
 */
class BkashPaymentCheckJob implements ShouldQueue
{
    use Queueable;

    const QUEUE = 'bkash-payment-checks';

    /** @var int */
    public $order_id;

    /** @var string */
    public $payment_id;

    /** @var int */
    public $check;

    /**
     * @param int    $order_id
     * @param string $payment_id
     * @param int    $check      The number of this check, from zero.
     */
    public function __construct(int $order_id, string $payment_id, int $check)
    {
        $this->order_id = $order_id;
        $this->payment_id = $payment_id;
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
        $provider = Payment::get_provider('bkash');

        if ($provider instanceof Bkash) {
            $provider->run_payment_check($this->order_id, $this->payment_id, $this->check);
        }
    }
}
