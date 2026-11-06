<?php

namespace Kirki\Ecommerce\App\Resources\PaymentMethod;

defined('ABSPATH') || exit;

use Kirki\Ecommerce\Framework\Resource;

/**
 * API resource for a payment method, offline or online, in list views.
 *
 * @since 1.0.0
 */
class PaymentMethodListResource extends Resource
{
    /** @var string[] */
    protected $active_currency_codes;

    /**
     * Create the resource.
     *
     * @since 1.0.0
     *
     * @param \Kirki\Ecommerce\App\Payment\PaymentProvider $resource
     * @param string[]                                      $active_currency_codes Active store currency codes.
     */
    public function __construct($resource, array $active_currency_codes = [])
    {
        parent::__construct($resource);

        $this->active_currency_codes = $active_currency_codes;
    }

    /**
     * Convert the payment method to an array.
     *
     * @since 1.0.0
     *
     * @return array<string, mixed> The method ID, name, icon, icon media, enabled state, offline flag, description and currency support.
     */
    public function to_array()
    {
        return [
            'id' => $this->id(),
            'name' => $this->title(),
            'icon' => $this->icon(),
            'icon_media' => $this->icon_media(),
            'is_enabled' => $this->enabled(),
            'is_offline' => $this->is_offline(),
            'description' => $this->description(),
            'currency_support' => $this->currency_support($this->active_currency_codes),
        ];
    }
}
