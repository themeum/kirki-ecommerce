<?php

namespace Kirki\Ecommerce\Payments;

use Kirki\Ecommerce\App\Payment\Facades\Payment;
use Kirki\Ecommerce\Framework\Contracts\ShouldQueue;
use Kirki\Ecommerce\Framework\Queue\Concerns\Queueable;

defined('ABSPATH') || exit;

/**
 * Checks an unresolved SSLCommerz payment with a transaction query.
 */
class SslcommerzPaymentCheckJob implements ShouldQueue
{
    use Queueable;

    const QUEUE = 'sslcommerz-payment-checks';

    /** @var int */
    public $order_id;

    /** @var string */
    public $tran_id;

    /** @var int */
    public $check;

    /**
     * @param int    $order_id
     * @param string $tran_id
     * @param int    $check    The number of this check, from zero.
     */
    public function __construct(int $order_id, string $tran_id, int $check)
    {
        $this->order_id = $order_id;
        $this->tran_id = $tran_id;
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
            $provider->run_payment_check($this->order_id, $this->tran_id, $this->check);
        }
    }
}
