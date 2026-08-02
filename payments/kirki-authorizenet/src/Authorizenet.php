<?php

namespace Kirki\Ecommerce\Payments;

use Kirki\Ecommerce\App\Payment\PaymentGateway;

defined('ABSPATH') || exit;

class Authorizenet extends PaymentGateway
{
    public function __construct()
    {
        $this->id = 'authorizenet';
        $this->title = __('Stripe', 'kirki-ecommerce');
        $this->description = __('Stripe payment gateway', 'kirki-ecommerce');
        $this->icon = 'stripe';
        $this->settings_key = 'stripe';
        $this->is_manual = false;
        $this->has_fields = false;

        parent::__construct();

        $this->set_admin_fields([
            [
                'name' => 'secret_key',
                'label' => __('Secret Key', 'kirki-ecommerce'),
                'type' => 'text',
                'required' => true,
            ],
            [
                'name' => 'webhook_secret',
                'label' => __('Webhook Secret', 'kirki-ecommerce'),
                'type' => 'text',
                'required' => true,
            ],
        ]);
    }
}