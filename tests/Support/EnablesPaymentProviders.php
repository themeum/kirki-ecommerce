<?php

namespace Kirki\Ecommerce\Tests\Support;

trait EnablesPaymentProviders
{
    /**
     * Enable an online payment provider through the same endpoint the admin uses.
     *
     * Checkout only accepts enabled providers, and PayPal is disabled until configured.
     *
     * @param string $id Online payment provider ID.
     * @return void
     * @since 1.0.0
     */
    protected function enable_payment_provider(string $id = 'paypal'): void
    {
        $this->assert_api_success($this->request('PATCH', 'online-payments/' . $id, ['is_enabled' => true]));
    }
}
