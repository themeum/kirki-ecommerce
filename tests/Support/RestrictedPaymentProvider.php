<?php

namespace Kirki\Ecommerce\Tests\Support;

use Kirki\Ecommerce\App\Constants\Payment\PaymentActionType;
use Kirki\Ecommerce\App\DTO\Payment\PaymentActionDTO;
use Kirki\Ecommerce\App\Models\Order;
use Kirki\Ecommerce\App\Payment\PaymentProvider;

/**
 * An enabled online provider with a chosen currency list. It counts its pay() calls.
 */
class RestrictedPaymentProvider extends PaymentProvider
{
    /** @var int */
    public static $pay_calls = 0;

    /** @var string[] */
    protected $currencies;

    /**
     * @param string   $id
     * @param string[] $currencies
     * @param bool     $enabled
     */
    public function __construct(string $id = 'restricted', array $currencies = ['BDT'], bool $enabled = true)
    {
        $this->id = $id;
        $this->title = 'Restricted';
        $this->settings_key = $id;
        $this->is_offline = false;
        $this->currencies = $currencies;

        parent::__construct();

        $this->is_enabled = $enabled;
    }

    /** @inheritDoc */
    public function supported_currencies()
    {
        return $this->currencies;
    }

    /** @inheritDoc */
    public function pay(Order $order)
    {
        static::$pay_calls++;

        return PaymentActionDTO::from_array([
            'type' => PaymentActionType::REDIRECT,
            'value' => 'https://gateway.test/pay',
        ]);
    }
}
