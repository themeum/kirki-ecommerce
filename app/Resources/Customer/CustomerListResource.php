<?php

namespace Kirki\Ecommerce\App\Resources\Customer;

use Kirki\Ecommerce\Framework\Resource;
use Kirki\Ecommerce\Framework\Supports\Facades\Date;
use Kirki\Ecommerce\App\Facades\Money;
use Kirki\Ecommerce\App\Services\CountryService;
use Kirki\Ecommerce\Framework\Supports\Arr;
use Kirki\Ecommerce\Framework\Supports\MediaAttachment;

use function Kirki\Ecommerce\Framework\app;
use function Kirki\Ecommerce\Framework\collection;

/**
 * API resource for a customer in list views, with spend and order statistics.
 *
 * @since 1.0.0
 */
class CustomerListResource extends Resource
{
    /**
     * Convert the customer resource to an array.
     *
     * @since 1.0.0
     *
     * @return array<string, mixed> The customer data, including total spent, order count and location.
     */
    public function to_array()
    {
        $display_currency = Money::resolve_display_currency();

        $country = !empty($this->billing_address) ? app(CountryService::class)->find_by_code($this->billing_address->country) : null;
        $state = collection($country['states'] ?? [])->find(fn($state) => (string) $state['id'] === (string) $this->billing_address->state)['name'] ?? null;
        $location = collection([$state, $country['name'] ?? null])->filter()->join(', ');

        return [
            'id' => $this->id,
            'user_id' => $this->user_id,
            'first_name' => $this->first_name,
            'last_name' => $this->last_name,
            'email' => $this->email,
            'phone' => $this->phone,
            'photo' => MediaAttachment::make($this->photo),
            'base_amount_spent' => Money::prepare_amount_from_minor($this->orders_sum_base_total ?? 0),
            'base_amount_spent_money_object' => Money::prepare_amount_object_from_minor($this->orders_sum_base_total ?? 0),
            'display_amount_spent' => Money::prepare_amount_from_minor($this->orders_sum_base_total ?? 0, null, $display_currency),
            'display_amount_spent_money_object' => Money::prepare_amount_object_from_minor($this->orders_sum_base_total ?? 0, null, $display_currency),
            'location' => $location,
            'orders_count' => $this->orders_count,
            'last_order_date' => $this->orders_max_created_at,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
