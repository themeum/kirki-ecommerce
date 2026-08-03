<?php

namespace Kirki\Ecommerce\App\Resources\Customer;

use Kirki\Ecommerce\Framework\Resource;
use Kirki\Ecommerce\Framework\Supports\Facades\Date;
use Kirki\Ecommerce\App\Facades\Money;
use Kirki\Ecommerce\Framework\Supports\MediaAttachment;

class CustomerListResource extends Resource
{
    /**
     * Convert the customer resource to an array.
     *
     * @return array The customer data as an associative array.
     */
    public function to_array()
    {
        return [
            'id' => $this->id,
            'user_id' => $this->user_id,
            'first_name' => $this->first_name,
            'last_name' => $this->last_name,
            'email' => $this->email,
            'phone' => $this->phone,
            'photo' => MediaAttachment::make($this->photo),
            'amount_spent' => Money::from_minor($this->orders_sum_total ?? 0)->getAmount()->toFloat(),
            'location' => !empty($this->billing_address) ? $this->billing_address->state . ', ' . $this->billing_address->country : '',
            'orders_count' => $this->orders_count,
            'last_order_date' => $this->orders_max_created_at,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
