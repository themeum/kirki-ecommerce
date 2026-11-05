<?php

namespace Kirki\Ecommerce\App\Mcp\Resources;

defined('ABSPATH') || exit;

use Kirki\Ecommerce\Ahamed\FrameworkMcp\Request;
use Kirki\Ecommerce\Ahamed\FrameworkMcp\Response;
use Kirki\Ecommerce\App\Constants\OptionKeys;
use Kirki\Ecommerce\App\Payment\Facades\Payment;
use Kirki\Ecommerce\App\Supports\Facades\Settings;

/**
 * The checkout rules, the payment methods and the legal consents, with no credentials.
 *
 * @since 1.0.0
 */
class CheckoutAndPaymentsResource extends StoreResource
{
    const CHECKOUT_FIELDS = [
        'address_line_validation',
        'phone_number_validation',
        'company_name_validation',
        'company_id_validation',
        'vat_identification_number_validation',
    ];

    /** @var string */
    protected $title = 'Checkout and payments';

    /** @var string */
    protected $description = 'Guest checkout, the checkout field rules, the coupon field and the customer note, the payment methods with their enabled state, and the legal consents. No credentials.';

    /** @var string */
    protected $uri = 'kecom://store/checkout-and-payments';

    /**
     * Read the checkout and payment settings.
     *
     * @since 1.0.0
     *
     * @param Request $request The read, which carries no arguments.
     *
     * @return Response
     */
    public function handle(Request $request)
    {
        $checkout = Settings::get(OptionKeys::CHECKOUT_SETTINGS);
        $configuration = (array) $checkout->get('checkout_configuration', []);
        $fields = [];

        foreach (static::CHECKOUT_FIELDS as $field) {
            $fields[$field] = $configuration[$field] ?? null;
        }

        return Response::structured([
            'is_guest_checkout_allowed' => (bool) $checkout->get('is_allowed_guest_checkout', false),
            'checkout_fields' => $fields,
            'has_coupon_field' => (bool) ($configuration['has_apply_coupon_code'] ?? false),
            'shows_customer_note' => (bool) ($configuration['show_customer_note'] ?? false),
            'payment_methods' => $this->payment_methods(),
            'legal_consents' => $this->legal_consents(),
        ]);
    }

    /**
     * Get the payment methods in the merchant's order, with no settings or credentials.
     *
     * @since 1.0.0
     *
     * @return array<int, array<string, mixed>>
     */
    protected function payment_methods()
    {
        return array_map(function ($provider) {
            return [
                'id' => $provider->id(),
                'name' => $provider->title(),
                'is_enabled' => (bool) $provider->enabled(),
                'is_offline' => (bool) $provider->is_offline(),
            ];
        }, array_values(Payment::get_all_providers()));
    }

    /**
     * Get the legal consents with their text, method, locations and enabled state.
     *
     * @since 1.0.0
     *
     * @return array<int, array<string, mixed>>
     */
    protected function legal_consents()
    {
        $consents = Settings::get(OptionKeys::LEGAL_SETTINGS . '.consents', []);

        if (!is_array($consents)) {
            return [];
        }

        $rows = [];

        foreach ($consents as $consent) {
            if (!is_array($consent)) {
                continue;
            }

            $rows[] = [
                'id' => (string) ($consent['id'] ?? ''),
                'text' => trim(wp_strip_all_tags((string) ($consent['message'] ?? ''))),
                'method' => $consent['method'] ?? null,
                'locations' => array_values(isset($consent['locations']) && is_array($consent['locations']) ? $consent['locations'] : []),
                'is_enabled' => !empty($consent['is_enabled']),
            ];
        }

        return $rows;
    }
}
