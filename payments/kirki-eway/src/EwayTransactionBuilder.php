<?php

namespace Kirki\Ecommerce\Payments;

use Kirki\Ecommerce\App\Models\Order;
use Kirki\Ecommerce\App\Supports\Url;

defined('ABSPATH') || exit;

/**
 * Builds QuickPay request payloads and interprets transaction status.
 *
 */
class EwayTransactionBuilder
{
    protected Order $order;

    /**
     * @param Order $order The order to build QuickPay payloads for.
     */
    public function __construct(Order $order)
    {
        $this->order = $order;
    }

    /**
     * Build a QuickPay address array for the order's billing or shipping address.
     *
     * @param string $type Either 'billing' or 'shipping'.
     * @return array An empty array if the order has no address of that type.
     */
    protected function format_address(string $type)
    {
        if (empty($this->order->{$type . '_address_line1'})) {
            return [];
        }

        $name = $this->order->{$type . '_first_name'} . ' ' . $this->order->{$type . '_last_name'};

        return [
            'name' => $name,
            'street'  => $this->order->{$type . '_address_line1'},
            'house_number' => $this->order->{$type . '_address_line2'},
            'city' => $this->order->{$type . '_city'},
            'zip_code' => (string) $this->order->{$type . '_postal_code'},
            'region' => $this->order->{$type . '_state'},
            'phone_number' => $this->order->{$type . '_phone'},
            'email' => $this->order->{$type . '_email'},
        ];
    }
}
