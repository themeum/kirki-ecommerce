<?php

namespace Kirki\Ecommerce\App\Mcp\Resources;

defined('ABSPATH') || exit;

use Kirki\Ecommerce\Ahamed\FrameworkMcp\Request;
use Kirki\Ecommerce\Ahamed\FrameworkMcp\Response;
use Kirki\Ecommerce\App\Constants\OptionKeys;
use Kirki\Ecommerce\App\Services\CurrencyService;
use Kirki\Ecommerce\App\Supports\Facades\Settings;

/**
 * The store's name, contact data, address, base currency, time zone and number formats.
 *
 * @since 1.0.0
 */
class StoreProfileResource extends StoreResource
{
    /** @var string */
    protected $title = 'Store profile';

    /** @var string */
    protected $description = 'The store name, email, phone, address, tax ID, industry, selling countries, base currency, time zone, and the order and invoice number formats. Read it to use the correct store name, currency and dates in answers.';

    /** @var string */
    protected $uri = 'kecom://store/profile';

    /** @var string[] */
    protected $audience = ['assistant'];

    /** @var float */
    protected $priority = 1.0;

    /** @var CurrencyService */
    protected $currency_service;

    /**
     * Create the resource.
     *
     * @since 1.0.0
     *
     * @param CurrencyService $currency_service Currency service.
     */
    public function __construct(CurrencyService $currency_service)
    {
        $this->currency_service = $currency_service;
    }

    /**
     * Read the store profile.
     *
     * @since 1.0.0
     *
     * @param Request $request The read, which carries no arguments.
     *
     * @return Response
     */
    public function handle(Request $request)
    {
        $general = Settings::get(OptionKeys::GENERAL_SETTINGS);
        $address = (array) $general->get('store_address', []);
        $order_number = (array) $general->get('order_number', []);
        $invoice_number = (array) $general->get('invoice_number', []);
        $base_currency = $this->currency_service->get_base_currency();

        return Response::structured([
            'store_name' => $this->value_or_null($general->get('store_name')),
            'store_email' => $this->value_or_null($general->get('store_email')),
            'store_phone' => $this->value_or_null($general->get('store_phone')),
            'store_address' => [
                'address_line_1' => $this->value_or_null($address['address_line_1'] ?? null),
                'address_line_2' => $this->value_or_null($address['address_line_2'] ?? null),
                'city' => $this->value_or_null($address['city'] ?? null),
                'state' => $this->value_or_null($address['state'] ?? null),
                'postal_code' => $this->value_or_null($address['postal_code'] ?? null),
                'country' => $this->value_or_null($address['country'] ?? null),
            ],
            'store_tax_id' => $this->value_or_null($general->get('store_tax_id')),
            'industry' => $this->value_or_null($general->get('industry')),
            'selling_location_type' => $this->value_or_null($general->get('selling_location_type')),
            'selling_countries' => array_values((array) $general->get('selling_countries', [])),
            'base_currency' => $base_currency ? $base_currency->code : null,
            'time_zone' => wp_timezone_string(),
            'order_number' => [
                'prefix' => $this->value_or_null($order_number['prefix'] ?? null),
                'suffix' => $this->value_or_null($order_number['suffix'] ?? null),
            ],
            'invoice_number' => [
                'prefix' => $this->value_or_null($invoice_number['prefix'] ?? null),
                'suffix' => $this->value_or_null($invoice_number['suffix'] ?? null),
                'apply_year_prefix' => (bool) ($invoice_number['apply_year_prefix'] ?? false),
                'reset_sequence_every_year' => (bool) ($invoice_number['reset_sequence_every_year'] ?? false),
            ],
        ]);
    }
}
