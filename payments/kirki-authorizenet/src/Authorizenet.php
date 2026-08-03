<?php

namespace Kirki\Ecommerce\Payments;

use Exception;
use Kirki\Ecommerce\App\Payment\PaymentGateway;

defined('ABSPATH') || exit;

class Authorizenet extends PaymentGateway
{
    public function __construct()
    {
        $this->id = 'authorizenet';
        $this->title = __('AuthorizeNet', 'kirki-ecommerce');
        $this->description = __('AuthorizeNet payment gateway', 'kirki-ecommerce');
        $this->icon = 'authorizenet';
        $this->settings_key = 'authorizenet';
        $this->is_manual = false;
        $this->has_fields = true;

        parent::__construct();

        $this->set_admin_fields([
            [
                'name' => 'login_id',
                'label' => __('Login ID', 'kirki-ecommerce'),
                'type' => 'text',
                'required' => true,
            ],
            [
                'name' => 'transaction_key',
                'label' => __('Transaction key', 'kirki-ecommerce'),
                'type' => 'text',
                'required' => true,
            ],
            [
                'name' => 'signature_key',
                'label' => __('Signature key', 'kirki-ecommerce'),
                'type' => 'text',
                'required' => true,
            ],
        ]);
    }

    /**
     * Pay for an order.
     *
     * @param Order $order
     * @return string
     * @throws Exception
     */
    public function pay(Order $order)
    {
        if (!$this->enabled()) {
            throw new Exception(__('AuthorizeNet is not enabled.', 'kirki-ecommerce'));
        }

        try {
        } catch (Exception $e) {
            throw new Exception(__('AuthorizeNet Payment Error: ' . $e->getMessage(), 'kirki-ecommerce'));
        }
    }
}
