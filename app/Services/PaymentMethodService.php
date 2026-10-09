<?php

namespace Kirki\Ecommerce\App\Services;

defined('ABSPATH') || exit;

use Kirki\Ecommerce\App\Payment\Facades\Payment;
use Kirki\Ecommerce\Framework\Collections\Collection;

use function Kirki\Ecommerce\Framework\collection;

/**
 * Lists every registered payment method, offline and online.
 *
 * @since 1.0.0
 */
class PaymentMethodService
{
    /**
     * Get all registered payment providers.
     *
     * @since 1.0.0
     *
     * @return Collection Collection of PaymentProvider.
     */
    public function get()
    {
        return collection(Payment::get_all_providers());
    }
}
