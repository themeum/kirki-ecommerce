<?php

namespace Kirki\Ecommerce\App\Mails;

defined('ABSPATH') || exit;

use Kirki\Ecommerce\App\Models\Customer;
use Kirki\Ecommerce\App\Supports\Url;

use function Kirki\Ecommerce\Framework\collection;

class ResetPasswordNotificationMail extends Mailer
{
    /** @var Customer */
    protected $customer;

    /** @var string */
    protected $key;

    public function __construct(Customer $customer, string $option_key)
    {
        $this->customer = $customer;
        $this->key = $option_key;
    }

    public function option_key()
    {
        return $this->key;
    }

    public function with()
    {
        return [
            'customer_name' => collection([$this->customer->first_name, $this->customer->last_name])->filter(fn($name) => !empty($name))->join(' '),
            'customer_email' => $this->customer->email,
            'reset_url' => Url::add_query_params(Url::get_login_url(), [
                'action' => 'reset_password',
                'key' => 'sample-reset-token',
                'login' => $this->customer->email,
            ]),
        ];
    }
}
