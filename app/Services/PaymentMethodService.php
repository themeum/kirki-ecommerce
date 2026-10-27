<?php

namespace Kirki\Ecommerce\App\Services;

defined('ABSPATH') || exit;

use Kirki\Ecommerce\App\Constants\OptionKeys;
use Kirki\Ecommerce\App\Payment\Facades\Payment;
use Kirki\Ecommerce\Framework\Collections\Collection;

use function Kirki\Ecommerce\App\settings;
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

    /**
     * Save the merchant-defined order of the payment providers.
     *
     * @since 1.0.0
     *
     * @param string[] $ids Provider IDs in the new order.
     * @return Collection Collection of PaymentProvider in the new order.
     */
    public function reorder(array $ids)
    {
        settings(OptionKeys::PAYMENT_SETTINGS)->set([
            'methods_order' => array_values($ids),
        ]);

        return $this->get();
    }
}
