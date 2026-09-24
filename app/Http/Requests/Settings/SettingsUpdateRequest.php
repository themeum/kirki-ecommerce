<?php

namespace Kirki\Ecommerce\App\Http\Requests\Settings;

use Kirki\Ecommerce\App\Constants\ConsentLocations;
use Kirki\Ecommerce\App\Constants\ConsentMethods;
use Kirki\Ecommerce\App\Constants\CurrencyFormat;
use Kirki\Ecommerce\App\Constants\CurrencyPosition;
use Kirki\Ecommerce\App\Constants\CurrencyUpdateFallback;
use Kirki\Ecommerce\App\Constants\DecimalSeparator;
use Kirki\Ecommerce\App\Constants\Email\AdminInventoryNotification;
use Kirki\Ecommerce\App\Constants\Email\AdminOrderNotification;
use Kirki\Ecommerce\App\Constants\Email\AdminUserNotification;
use Kirki\Ecommerce\App\Constants\Email\CustomerOrderNotification;
use Kirki\Ecommerce\App\Constants\Email\CustomerUserNotification;
use Kirki\Ecommerce\App\Constants\MailEncryption;
use Kirki\Ecommerce\App\Constants\Mailer;
use Kirki\Ecommerce\App\Constants\OptionKeys;
use Kirki\Ecommerce\App\Constants\PageKeys;
use Kirki\Ecommerce\App\Constants\SellingLocationType;
use Kirki\Ecommerce\App\Constants\ShippingMethodTypes;
use Kirki\Ecommerce\App\Constants\ThousandSeparator;
use Kirki\Ecommerce\App\Constants\UpdateFrequency;
use Kirki\Ecommerce\App\Facades\Money;
use Kirki\Ecommerce\Framework\Sanitizer;
use Kirki\Ecommerce\Framework\Http\Request;
use function Kirki\Ecommerce\Framework\deep_get;

/**
 * Validates and sanitizes a settings update for one settings group, selected by the `key` input.
 *
 * @since 1.0.0
 */
class SettingsUpdateRequest extends Request
{
    /**
     * Normalize the shipping and tax settings payload before validation.
     *
     * Shipping method and range amounts are converted to minor units. Non-EU tax regions with central tax enabled get their state list emptied.
     *
     * @since 1.0.0
     *
     * @return void
     */
    protected function prepare_for_validation()
    {
        $data = $this->input('data');

        switch ($this->get_string('key')) {
            case OptionKeys::SHIPPING_SETTINGS:
                if (!is_array($data) || !isset($data['shipping_zones']) || !is_array($data['shipping_zones'])) {
                    return;
                }

                foreach ($data['shipping_zones'] as $zone_index => $zone) {
                    if (!is_array($zone) || !isset($zone['shipping_methods']) || !is_array($zone['shipping_methods'])) {
                        continue;
                    }

                    foreach ($zone['shipping_methods'] as $method_index => $method) {
                        if (!is_array($method)) {
                            continue;
                        }

                        foreach (['base_amount', 'base_free_shipping_min_amount'] as $field) {
                            if (array_key_exists($field, $method) && !empty($method[$field])) {
                                $data['shipping_zones'][$zone_index]['shipping_methods'][$method_index][$field] = Money::to_minor($method[$field]);
                            }
                        }

                        if (isset($method['ranges']) && is_array($method['ranges'])) {
                            foreach ($method['ranges'] as $range_index => $range) {
                                if (is_array($range) && array_key_exists('base_amount', $range) && !empty($range['base_amount'])) {
                                    $data['shipping_zones'][$zone_index]['shipping_methods'][$method_index]['ranges'][$range_index]['base_amount'] = Money::to_minor($range['base_amount']);
                                }
                            }
                        }
                    }
                }
                break;
            case OptionKeys::TAX_SETTINGS:
                if (!is_array($data) || !isset($data['tax_regions']) || !is_array($data['tax_regions'])) {
                    return;
                }

                foreach ($data['tax_regions'] as $index => $region) {
                    if (!is_array($region) || ($region['code'] ?? null) === 'EU') {
                        continue;
                    }

                    if (Sanitizer::apply_rule($region['is_central_tax_enabled'] ?? false, Sanitizer::BOOL)) {
                        $data['tax_regions'][$index]['states'] = [];
                    }
                }
                break;
            default:
                return;
        }

        $this->merge(['data' => $data]);
    }

    /**
     * Build the validation rules for the settings group named by the `key` input.
     *
     * The `key` rule is always included; an unrecognised key adds no group rules.
     *
     * @since 1.0.0
     *
     * @return array<string, mixed>
     */
    public function rules()
    {
        $rules = [];
        $key = $this->get_string('key');

        switch ($key) {
            case OptionKeys::GENERAL_SETTINGS:
                $rules = $this->get_general_settings_rules();
                break;
            case OptionKeys::PRODUCT_SETTINGS:
                $rules = $this->get_product_settings_rules();
                break;
            case OptionKeys::SHIPPING_SETTINGS:
                $rules = $this->get_shipping_settings_rules();
                break;
            case OptionKeys::PAYMENT_SETTINGS:
                $rules = $this->get_payment_settings_rules();
                break;
            case OptionKeys::TAX_SETTINGS:
                $rules = $this->get_tax_settings_rules();
                break;
            case OptionKeys::CHECKOUT_SETTINGS:
                $rules = $this->get_checkout_settings_rules();
                break;
            case OptionKeys::CURRENCY_SETTINGS:
                $rules = $this->get_currency_settings_rules();
                break;
            case OptionKeys::EMAIL_SETTINGS:
                $rules = $this->get_email_settings_rules();
                break;
            case OptionKeys::ADVANCE_SETTINGS:
                $rules = $this->get_advance_settings_rules();
                break;
            case OptionKeys::LEGAL_SETTINGS:
                $rules = $this->get_legal_settings_rules();
                break;
            default:
                break;
        }

        return array_merge([
            'key' => 'required|string|in:' . implode(',', OptionKeys::get_constant_values()),
        ], $rules);
    }

    /**
     * Build the sanitizers for the settings group named by the `key` input.
     *
     * Returns an empty array when the key is not a known settings group.
     *
     * @since 1.0.0
     *
     * @return array<string, string>
     */
    public function filters()
    {
        $key = $this->get_string('key');

        switch ($key) {
            case OptionKeys::GENERAL_SETTINGS:
                return $this->get_general_settings_filters();
            case OptionKeys::PRODUCT_SETTINGS:
                return $this->get_product_settings_filters();
            case OptionKeys::SHIPPING_SETTINGS:
                return $this->get_shipping_settings_filters();
            case OptionKeys::PAYMENT_SETTINGS:
                return $this->get_payment_settings_filters();
            case OptionKeys::TAX_SETTINGS:
                return $this->get_tax_settings_filters();
            case OptionKeys::CHECKOUT_SETTINGS:
                return $this->get_checkout_settings_filters();
            case OptionKeys::CURRENCY_SETTINGS:
                return $this->get_currency_settings_filters();
            case OptionKeys::EMAIL_SETTINGS:
                return $this->get_email_settings_filters();
            case OptionKeys::ADVANCE_SETTINGS:
                return $this->get_advance_settings_filters();
            case OptionKeys::LEGAL_SETTINGS:
                return $this->get_legal_settings_filters();
            default:
                return [];
        }
    }

    /**
     * @inheritDoc
     *
     * @since 1.0.0
     */
    protected function messages()
    {
        $no_slashes_message = __('Slashes and backslashes are not allowed.', 'kirki-ecommerce');

        return [
            'data.invoice_number.sequence.regex' =>  __('The sequence field must contain digits only.', 'kirki-ecommerce'),
            'data.order_number.prefix.regex' => $no_slashes_message,
            'data.order_number.suffix.regex' => $no_slashes_message,
            'data.invoice_number.prefix.regex' => $no_slashes_message,
            'data.invoice_number.suffix.regex' => $no_slashes_message,
        ];
    }

    /**
     * Return the validation rules for the general store settings.
     *
     * @since 1.0.0
     *
     * @return array<string, string>
     */
    protected function get_general_settings_rules()
    {
        return [
            'data.store_name' => 'required|string',
            'data.store_email' => 'required|email',
            'data.store_logo' => 'nullable|integer',
            'data.store_phone' => 'nullable|string',
            'data.store_address' => 'nullable|array',
            'data.store_address.address_line_1' => 'nullable|string',
            'data.store_address.address_line_2' => 'nullable|string',
            'data.store_address.city' => 'nullable|string',
            'data.store_address.state' => 'nullable|string',
            'data.store_address.postal_code' => 'nullable|string',
            'data.store_address.country' => 'nullable|string',
            'data.selling_location_type' => 'required|string|in:' . implode(',', SellingLocationType::get_constant_values()),
            'data.selling_countries' => 'nullable|array',
            'data.order_number' => 'nullable|array',
            'data.order_number.prefix' => 'string|regex:~^[^/\\\\]*$~',
            'data.order_number.suffix' => 'string|regex:~^[^/\\\\]*$~',
            'data.invoice_number' => 'nullable|array',
            'data.invoice_number.prefix' => 'string|regex:~^[^/\\\\]*$~',
            'data.invoice_number.suffix' => 'string|regex:~^[^/\\\\]*$~',
            'data.invoice_number.sequence' => 'required|string|regex:/^\d+$/',
            'data.invoice_number.apply_year_prefix' => 'boolean',
            'data.invoice_number.reset_sequence_every_year' => 'boolean',
            'data.is_tax_calculation_enabled' => 'nullable|boolean',
        ];
    }

    /**
     * Return the sanitizers for the general store settings.
     *
     * @since 1.0.0
     *
     * @return array<string, string>
     */
    protected function get_general_settings_filters()
    {
        return [
            'data.store_name' => Sanitizer::TEXT,
            'data.store_email' => Sanitizer::EMAIL,
            'data.store_logo' => Sanitizer::INT,
            'data.store_phone' => Sanitizer::TEXT,
            'data.store_address' => Sanitizer::ARRAY,
            'data.store_address.address_line_1' => Sanitizer::TEXT,
            'data.store_address.address_line_2' => Sanitizer::TEXT,
            'data.store_address.city' => Sanitizer::TEXT,
            'data.store_address.state' => Sanitizer::TEXT,
            'data.store_address.postal_code' => Sanitizer::TEXT,
            'data.store_address.country' => Sanitizer::TEXT,
            'data.selling_location_type' => Sanitizer::TEXT,
            'data.selling_countries' => Sanitizer::ARRAY,
            'data.order_number' => Sanitizer::ARRAY,
            'data.order_number.prefix' => Sanitizer::TEXT,
            'data.order_number.suffix' => Sanitizer::TEXT,
            'data.invoice_number' => Sanitizer::ARRAY,
            'data.invoice_number.prefix' => Sanitizer::TEXT,
            'data.invoice_number.suffix' => Sanitizer::TEXT,
            'data.invoice_number.sequence' => Sanitizer::TEXT,
            'data.invoice_number.apply_year_prefix' => Sanitizer::BOOL,
            'data.invoice_number.reset_sequence_every_year' => Sanitizer::BOOL,
            'data.is_tax_calculation_enabled' => Sanitizer::BOOL,
        ];
    }

    /**
     * Return the validation rules for the product settings.
     *
     * @since 1.0.0
     *
     * @return array<string, string>
     */
    protected function get_product_settings_rules()
    {
        return [
            'data.shop_page' => 'nullable|integer',
            'data.weight_unit' => 'required|string',
            'data.dimension_unit' => 'required|string',
            'data.display_layout' => 'nullable|string',
            'data.is_enabled_reviews' => 'boolean',
            'data.is_enabled_star_ratings' => 'boolean',
            'data.is_unit_price_visible' => 'boolean',
            'data.low_stock_threshold' => 'nullable|integer|min:0',
            'data.barcode_generation' => 'nullable|array',
            'data.barcode_generation.data_origin' => 'nullable|string',
            'data.barcode_generation.format' => 'nullable|string',
            'data.barcode_generation.width' => 'nullable|number',
            'data.barcode_generation.height' => 'nullable|number',
            'data.barcode_generation.country_of_origin' => 'nullable|string',
            'data.barcode_generation.is_human_readable_text_visible' => 'nullable|boolean',
            'data.barcode_generation.is_product_name_visible' => 'nullable|boolean',
            'data.barcode_generation.is_country_of_origin_visible' => 'nullable|boolean',
        ];
    }

    /**
     * Return the sanitizers for the product settings.
     *
     * @since 1.0.0
     *
     * @return array<string, string>
     */
    protected function get_product_settings_filters()
    {
        return [
            'data.shop_page' => Sanitizer::INT,
            'data.weight_unit' => Sanitizer::TEXT,
            'data.dimension_unit' => Sanitizer::TEXT,
            'data.display_layout' => Sanitizer::TEXT,
            'data.is_enabled_reviews' => Sanitizer::BOOL,
            'data.is_enabled_star_ratings' => Sanitizer::BOOL,
            'data.is_unit_price_visible' => Sanitizer::BOOL,
            'data.low_stock_threshold' => Sanitizer::INT,
            'data.barcode_generation' => Sanitizer::ARRAY,
            'data.barcode_generation.data_origin' => Sanitizer::TEXT,
            'data.barcode_generation.format' => Sanitizer::TEXT,
            'data.barcode_generation.width' => Sanitizer::FLOAT,
            'data.barcode_generation.height' => Sanitizer::FLOAT,
            'data.barcode_generation.country_of_origin' => Sanitizer::TEXT,
            'data.barcode_generation.is_human_readable_text_visible' => Sanitizer::BOOL,
            'data.barcode_generation.is_product_name_visible' => Sanitizer::BOOL,
            'data.barcode_generation.is_country_of_origin_visible' => Sanitizer::BOOL,
        ];
    }

    /**
     * Return the validation rules for the shipping zones and their shipping methods.
     *
     * Flat rate and weight based methods must also provide `is_taxable`.
     *
     * @since 1.0.0
     *
     * @return array<string, string|callable>
     */
    protected function get_shipping_settings_rules()
    {
        return [
            'data.shipping_zones' => 'nullable|array',
            'data.shipping_zones.*.is_enabled' => 'required|boolean',
            'data.shipping_zones.*.title' => 'required|string',
            'data.shipping_zones.*.regions' => 'required|array',
            'data.shipping_zones.*.regions.*.country' => 'required|string',
            'data.shipping_zones.*.regions.*.states' => 'nullable|array',
            'data.shipping_zones.*.shipping_methods' => 'nullable|array',
            'data.shipping_zones.*.shipping_methods.*.id' => 'required|string',
            'data.shipping_zones.*.shipping_methods.*.is_enabled' => 'required|boolean',
            'data.shipping_zones.*.shipping_methods.*.name' => 'required|string',
            'data.shipping_zones.*.shipping_methods.*.type' => 'required|string|in:' . implode(',', ShippingMethodTypes::get_constant_values()),
            // TODO: replace with a reusable required-if-sibling rule once it can safely mix
            // with type-check rules (e.g. string/array) without failing on null when not required.
            // Bound to the shipping method itself (not the is_taxable leaf) so the check still
            // runs even when the client omits is_taxable entirely - a wildcard rule keyed on a
            // leaf field is only evaluated when that key is present in the payload.
            'data.shipping_zones.*.shipping_methods.*' => function ($value, $key, $data) {
                if (!is_array($value) || !in_array($value['type'] ?? null, [ShippingMethodTypes::FLAT_RATE, ShippingMethodTypes::WEIGHT_BASED], true)) {
                    return true;
                }

                if (!array_key_exists('is_taxable', $value) || $value['is_taxable'] === null || $value['is_taxable'] === '') {
                    /* translators: %s: the field name */
                    return sprintf(__('The %s field is required.', 'kirki-ecommerce'), $key . '.is_taxable');
                }

                return true;
            },
            // Bound directly to the base_amount leaf (rather than the shipping method itself)
            // so a failure attaches to this field's own key and the frontend can surface it
            // inline instead of on the method object.
            'data.shipping_zones.*.shipping_methods.*.base_amount' => function ($value, $key, $data) {
                $method = deep_get($data, substr($key, 0, -\strlen('.base_amount')));
                $type = is_array($method) ? ($method['type'] ?? null) : null;
                $is_empty = $value === null || $value === '';

                if ($type === ShippingMethodTypes::FLAT_RATE && $is_empty) {
                    return __('This field is required.', 'kirki-ecommerce');
                }

                if ($type === ShippingMethodTypes::LOCAL_PICKUP && !empty($method['has_fee'])) {
                    if ($is_empty) {
                        return __('This field is required.', 'kirki-ecommerce');
                    }

                    if ($value <= 0) {
                        return __('This field must be greater than 0.', 'kirki-ecommerce');
                    }
                }

                return true;
            },
            'data.shipping_zones.*.shipping_methods.*.is_taxable' => 'nullable|boolean',
            'data.shipping_zones.*.shipping_methods.*.description' => 'nullable|string',

            // Local pickup specific fields
            'data.shipping_zones.*.shipping_methods.*.address' => 'nullable|string',
            'data.shipping_zones.*.shipping_methods.*.has_fee' => 'nullable|boolean',
            'data.shipping_zones.*.shipping_methods.*.has_pick_time' => 'nullable|boolean',
            'data.shipping_zones.*.shipping_methods.*.pickup_time_start' => 'nullable|string',
            'data.shipping_zones.*.shipping_methods.*.pickup_time_end' => 'nullable|string',

            // Weight-based shipping specific fields
            'data.shipping_zones.*.shipping_methods.*.ranges' => 'nullable|array',
            'data.shipping_zones.*.shipping_methods.*.ranges.*.from' => 'nullable|number',
            'data.shipping_zones.*.shipping_methods.*.ranges.*.to' => 'nullable|number',
            'data.shipping_zones.*.shipping_methods.*.ranges.*.base_amount' => 'nullable|number',
            'data.shipping_zones.*.shipping_methods.*.is_free_shipping_enabled' => 'nullable|boolean',
            'data.shipping_zones.*.shipping_methods.*.base_free_shipping_min_amount' => 'nullable|number',

            'data.shipping_zones.*.shipping_methods.*.shipping_rules' => 'nullable|array',
            'data.shipping_zones.*.shipping_methods.*.shipping_rules.*.relation' => 'required|string',
            'data.shipping_zones.*.shipping_methods.*.shipping_rules.*.conditions' => 'array',
            'data.shipping_zones.*.shipping_methods.*.shipping_rules.*.conditions.*.type' => 'required|string',
            'data.shipping_zones.*.shipping_methods.*.shipping_rules.*.conditions.*.operator' => 'required|string',
            'data.shipping_zones.*.shipping_methods.*.shipping_rules.*.conditions.*.value' => 'required',
            'data.shipping_zones.*.shipping_methods.*.shipping_rules.*.action' => 'array',
            'data.shipping_zones.*.shipping_methods.*.shipping_rules.*.action.type' => 'required|string',
            'data.shipping_zones.*.shipping_methods.*.shipping_rules.*.action.value' => 'nullable',
            // 'data.shipping_zones.*.shipping_carriers' => 'nullable|array',
            // 'data.shipping_zones.*.shipping_carriers.*.is_enabled' => 'required|boolean',
            // 'data.shipping_zones.*.shipping_carriers.*.name' => 'required|string',
            // 'data.shipping_zones.*.shipping_carriers.*.type' => 'required|string',
            // 'data.shipping_zones.*.shipping_carriers.*.rate' => 'required|number',
            // 'data.shipping_zones.*.shipping_carriers.*.is_taxable' => 'required|boolean',
            // 'data.shipping_zones.*.shipping_carriers.*.description' => 'nullable|string',
            // 'data.shipping_zones.*.shipping_carriers.*.shipping_rules' => 'nullable|array',
            // 'data.shipping_zones.*.shipping_carriers.*.shipping_rules.*.condition' => 'array',
            // 'data.shipping_zones.*.shipping_carriers.*.shipping_rules.*.condition.*.type' => 'required|string',
            // 'data.shipping_zones.*.shipping_carriers.*.shipping_rules.*.condition.*.operator' => 'required|string',
            // 'data.shipping_zones.*.shipping_carriers.*.shipping_rules.*.condition.*.value' => 'required|string',
            // 'data.shipping_zones.*.shipping_carriers.*.shipping_rules.*.action' => 'array',
            // 'data.shipping_zones.*.shipping_carriers.*.shipping_rules.*.action.*.type' => 'required|string',
            // 'data.shipping_zones.*.shipping_carriers.*.shipping_rules.*.action.*.value' => 'required|string',
        ];
    }

    /**
     * Return the sanitizers for the shipping zones and their shipping methods.
     *
     * @since 1.0.0
     *
     * @return array<string, string>
     */
    protected function get_shipping_settings_filters()
    {
        return [
            'data.shipping_zones' => Sanitizer::ARRAY,
            'data.shipping_zones.*.is_enabled' => Sanitizer::BOOL,
            'data.shipping_zones.*.title' => Sanitizer::TEXT,
            'data.shipping_zones.*.regions' => Sanitizer::ARRAY,
            'data.shipping_zones.*.regions.*.country' => Sanitizer::TEXT,
            'data.shipping_zones.*.regions.*.states' => Sanitizer::ARRAY,
            'data.shipping_zones.*.shipping_methods' => Sanitizer::ARRAY,
            'data.shipping_zones.*.shipping_methods.*.id' => Sanitizer::TEXT,
            'data.shipping_zones.*.shipping_methods.*.is_enabled' => Sanitizer::BOOL,
            'data.shipping_zones.*.shipping_methods.*.name' => Sanitizer::TEXT,
            'data.shipping_zones.*.shipping_methods.*.type' => Sanitizer::TEXT,
            'data.shipping_zones.*.shipping_methods.*.base_amount' => Sanitizer::INT,
            'data.shipping_zones.*.shipping_methods.*.is_taxable' => Sanitizer::BOOL,
            'data.shipping_zones.*.shipping_methods.*.description' => Sanitizer::TEXT,

            // Local pickup specific fields  
            'data.shipping_zones.*.shipping_methods.*.address' => Sanitizer::TEXT,
            'data.shipping_zones.*.shipping_methods.*.has_fee' => Sanitizer::BOOL,
            'data.shipping_zones.*.shipping_methods.*.has_pick_time' => Sanitizer::BOOL,
            'data.shipping_zones.*.shipping_methods.*.pickup_time_start' => Sanitizer::TEXT,
            'data.shipping_zones.*.shipping_methods.*.pickup_time_end' => Sanitizer::TEXT,

            // Weight-based shipping specific fields
            'data.shipping_zones.*.shipping_methods.*.ranges' => Sanitizer::ARRAY,
            'data.shipping_zones.*.shipping_methods.*.ranges.*.from' => Sanitizer::FLOAT,
            'data.shipping_zones.*.shipping_methods.*.ranges.*.to' => Sanitizer::FLOAT,
            'data.shipping_zones.*.shipping_methods.*.ranges.*.base_amount' => Sanitizer::INT,
            'data.shipping_zones.*.shipping_methods.*.is_free_shipping_enabled' => Sanitizer::BOOL,
            'data.shipping_zones.*.shipping_methods.*.base_free_shipping_min_amount' => Sanitizer::INT,

            'data.shipping_zones.*.shipping_methods.*.shipping_rules' => Sanitizer::ARRAY,
            'data.shipping_zones.*.shipping_methods.*.shipping_rules.*.relation' => Sanitizer::TEXT,
            'data.shipping_zones.*.shipping_methods.*.shipping_rules.*.conditions' => Sanitizer::ARRAY,
            'data.shipping_zones.*.shipping_methods.*.shipping_rules.*.conditions.*.type' => Sanitizer::TEXT,
            'data.shipping_zones.*.shipping_methods.*.shipping_rules.*.conditions.*.operator' => Sanitizer::TEXT,
            'data.shipping_zones.*.shipping_methods.*.shipping_rules.*.conditions.*.value' => Sanitizer::ANY,
            'data.shipping_zones.*.shipping_methods.*.shipping_rules.*.action' => Sanitizer::ARRAY,
            'data.shipping_zones.*.shipping_methods.*.shipping_rules.*.action.type' => Sanitizer::TEXT,
            'data.shipping_zones.*.shipping_methods.*.shipping_rules.*.action.value' => Sanitizer::TEXT,

            //@todo: implement later
            // 'data.shipping_zones.*.shipping_carriers' => Sanitizer::ARRAY ,
            // 'data.shipping_zones.*.shipping_carriers.*.is_enabled' => Sanitizer::BOOL,
            // 'data.shipping_zones.*.shipping_carriers.*.name' => Sanitizer::TEXT,
            // 'data.shipping_zones.*.shipping_carriers.*.type' => Sanitizer::TEXT,
            // 'data.shipping_zones.*.shipping_carriers.*.rate' => Sanitizer::FLOAT,
            // 'data.shipping_zones.*.shipping_carriers.*.is_taxable' => Sanitizer::BOOL,
            // 'data.shipping_zones.*.shipping_carriers.*.description' => Sanitizer::TEXT,
            // 'data.shipping_zones.*.shipping_carriers.*.shipping_rules' => Sanitizer::ARRAY ,
            // 'data.shipping_zones.*.shipping_carriers.*.shipping_rules.*.condition' => Sanitizer::ARRAY ,
            // 'data.shipping_zones.*.shipping_carriers.*.shipping_rules.*.condition.*.type' => Sanitizer::TEXT,
            // 'data.shipping_zones.*.shipping_carriers.*.shipping_rules.*.condition.*.operator' => Sanitizer::TEXT,
            // 'data.shipping_zones.*.shipping_carriers.*.shipping_rules.*.condition.*.value' => Sanitizer::TEXT,
            // 'data.shipping_zones.*.shipping_carriers.*.shipping_rules.*.action' => Sanitizer::ARRAY ,
            // 'data.shipping_zones.*.shipping_carriers.*.shipping_rules.*.action.*.type' => Sanitizer::TEXT,
            // 'data.shipping_zones.*.shipping_carriers.*.shipping_rules.*.action.*.value' => Sanitizer::TEXT,
        ];
    }

    /**
     * Return the validation rules for the offline payment settings.
     *
     * @since 1.0.0
     *
     * @return array<string, string>
     */
    protected function get_payment_settings_rules()
    {
        return [
            'data.offline_payments' => 'nullable|array',
            'data.offline_payments.*.is_enabled' => 'boolean',
            'data.offline_payments.*.is_offline' => 'boolean',
            'data.offline_payments.*.name' => 'string',
            'data.offline_payments.*.icon' => 'string',
            'data.offline_payments.*.instructions' => 'nullable|string',
            'data.offline_payments.*.config' => 'nullable|array',
        ];
    }

    /**
     * Return the sanitizers for the offline payment settings.
     *
     * @since 1.0.0
     *
     * @return array<string, string>
     */
    protected function get_payment_settings_filters()
    {
        return [
            'data.offline_payments' => Sanitizer::ARRAY,
            'data.offline_payments.*.is_enabled' => Sanitizer::BOOL,
            'data.offline_payments.*.is_offline' => Sanitizer::BOOL,
            'data.offline_payments.*.name' => Sanitizer::TEXT,
            'data.offline_payments.*.icon' => Sanitizer::TEXT,
            'data.offline_payments.*.instructions' => Sanitizer::TEXT,
            'data.offline_payments.*.config' => Sanitizer::ARRAY,
        ];
    }

    /**
     * Return the validation rules for one tax rule list.
     *
     * Applied to both a region's country-wide rules and a state's per-state rules.
     *
     * @since 1.0.0
     *
     * @param string $prefix Fully qualified path of the rules array.
     * @return array<string, string>
     */
    protected function get_tax_rules_rules($prefix)
    {
        return [
            $prefix => 'nullable|array',
            $prefix . '.*.relation' => 'required|string',
            $prefix . '.*.conditions' => 'required|array',
            $prefix . '.*.conditions.*.type' => 'required|string',
            $prefix . '.*.conditions.*.operator' => 'required|string',
            $prefix . '.*.conditions.*.value' => 'required',
            $prefix . '.*.action' => 'required|array',
            $prefix . '.*.action.type' => 'required|string',
            $prefix . '.*.action.value' => 'nullable',
        ];
    }

    /**
     * Return the validation rules for the tax settings, including each region's and state's tax rules.
     *
     * @since 1.0.0
     *
     * @return array<string, string>
     */
    protected function get_tax_settings_rules()
    {
        return array_merge(
            [
                'data.is_tax_inclusive_price' => 'required|boolean',
                'data.is_shipping_tax_enabled' => 'required|boolean',
                // TODO: is_enabled_display_inclusive_taxed_price is persisted but has no backend consumer yet
                // (no read in the tax strategies or calculation); wire it or drop it.
                'data.is_enabled_display_inclusive_taxed_price' => 'required|boolean',
                'data.tax_regions' => 'nullable|array',
                'data.tax_regions.*.code' => 'required|string',
                'data.tax_regions.*.name' => 'nullable|string',
                'data.tax_regions.*.flag' => 'nullable|string',
                'data.tax_regions.*.is_enabled' => 'required|boolean',
                'data.tax_regions.*.type' => 'nullable|string',
                'data.tax_regions.*.is_central_tax_enabled' => 'nullable|boolean',
                'data.tax_regions.*.central_product_tax' => 'nullable|number',
                'data.tax_regions.*.central_shipping_tax' => 'nullable|number',
                'data.tax_regions.*.states' => 'nullable|array',
                'data.tax_regions.*.states.*.id' => 'required|string',
                'data.tax_regions.*.states.*.name' => 'nullable|string',
                'data.tax_regions.*.states.*.product_tax_rate' => 'nullable|number',
                'data.tax_regions.*.states.*.shipping_tax_rate' => 'nullable|number',
                'data.tax_regions.*.countries' => 'nullable|array',
                'data.tax_regions.*.countries.*.code' => 'required|string',
                'data.tax_regions.*.countries.*.name' => 'nullable|string',
                'data.tax_regions.*.countries.*.flag' => 'nullable|string',
                'data.tax_regions.*.countries.*.rate' => 'required|number',
                'data.tax_services' => 'nullable|array',
                'data.tax_ids' => 'nullable|array',
            ],
            $this->get_tax_rules_rules('data.tax_regions.*.rules'),
            $this->get_tax_rules_rules('data.tax_regions.*.states.*.rules')
        );
    }

    /**
     * Return the sanitizers for one tax rule list, mirroring {@see static::get_tax_rules_rules()}.
     *
     * @since 1.0.0
     *
     * @param string $prefix Fully qualified path of the rules array.
     * @return array<string, string>
     */
    protected function get_tax_rules_filters($prefix)
    {
        return [
            $prefix => Sanitizer::ARRAY,
            $prefix . '.*.relation' => Sanitizer::TEXT,
            $prefix . '.*.conditions' => Sanitizer::ARRAY,
            $prefix . '.*.conditions.*.type' => Sanitizer::TEXT,
            $prefix . '.*.conditions.*.operator' => Sanitizer::TEXT,
            $prefix . '.*.conditions.*.value' => Sanitizer::ANY,
            $prefix . '.*.action' => Sanitizer::ARRAY,
            $prefix . '.*.action.type' => Sanitizer::TEXT,
            $prefix . '.*.action.value' => Sanitizer::ANY,
        ];
    }

    /**
     * Return the sanitizers for the tax settings, including each region's and state's tax rules.
     *
     * @since 1.0.0
     *
     * @return array<string, string>
     */
    protected function get_tax_settings_filters()
    {
        return array_merge(
            [
                'data.is_tax_inclusive_price' => Sanitizer::BOOL,
                'data.is_shipping_tax_enabled' => Sanitizer::BOOL,
                'data.is_enabled_display_inclusive_taxed_price' => Sanitizer::BOOL,
                'data.tax_regions' => Sanitizer::ARRAY,
                'data.tax_regions.*.code' => Sanitizer::TEXT,
                'data.tax_regions.*.name' => Sanitizer::TEXT,
                'data.tax_regions.*.flag' => Sanitizer::TEXT,
                'data.tax_regions.*.is_enabled' => Sanitizer::BOOL,
                'data.tax_regions.*.type' => Sanitizer::TEXT,
                'data.tax_regions.*.is_central_tax_enabled' => Sanitizer::BOOL,
                'data.tax_regions.*.central_product_tax' => Sanitizer::FLOAT,
                'data.tax_regions.*.central_shipping_tax' => Sanitizer::FLOAT,
                'data.tax_regions.*.states' => Sanitizer::ARRAY,
                'data.tax_regions.*.states.*.id' => Sanitizer::TEXT,
                'data.tax_regions.*.states.*.name' => Sanitizer::TEXT,
                'data.tax_regions.*.states.*.product_tax_rate' => Sanitizer::FLOAT,
                'data.tax_regions.*.states.*.shipping_tax_rate' => Sanitizer::FLOAT,
                'data.tax_regions.*.countries' => Sanitizer::ARRAY,
                'data.tax_regions.*.countries.*.code' => Sanitizer::TEXT,
                'data.tax_regions.*.countries.*.name' => Sanitizer::TEXT,
                'data.tax_regions.*.countries.*.flag' => Sanitizer::TEXT,
                'data.tax_regions.*.countries.*.rate' => Sanitizer::FLOAT,
                'data.tax_services' => Sanitizer::ARRAY,
                'data.tax_ids' => Sanitizer::ARRAY,
            ],
            $this->get_tax_rules_filters('data.tax_regions.*.rules'),
            $this->get_tax_rules_filters('data.tax_regions.*.states.*.rules')
        );
    }

    /**
     * Return the validation rules for the checkout settings.
     *
     * @since 1.0.0
     *
     * @return array<string, string>
     */
    protected function get_checkout_settings_rules()
    {
        return [
            'data.is_allowed_guest_checkout' => 'required|boolean',
            'data.checkout_configuration' => 'nullable|array',
            'data.checkout_configuration.address_line_validation' => 'required|string|in:required,optional',
            'data.checkout_configuration.phone_number_validation' => 'required|string|in:required,optional',
            'data.checkout_configuration.company_name_validation' => 'required|string|in:required,optional',
            'data.checkout_configuration.company_id_validation' => 'required|string|in:required,optional',
            'data.checkout_configuration.vat_identification_number_validation' => 'required|string|in:required,optional',
            'data.checkout_configuration.has_apply_coupon_code' => 'required|boolean',
        ];
    }

    /**
     * Return the sanitizers for the checkout settings.
     *
     * @since 1.0.0
     *
     * @return array<string, string>
     */
    protected function get_checkout_settings_filters()
    {
        return [
            'data.is_allowed_guest_checkout' => Sanitizer::BOOL,
            'data.checkout_configuration' => Sanitizer::ARRAY,
            'data.checkout_configuration.address_line_validation' => Sanitizer::TEXT,
            'data.checkout_configuration.phone_number_validation' => Sanitizer::TEXT,
            'data.checkout_configuration.company_name_validation' => Sanitizer::TEXT,
            'data.checkout_configuration.company_id_validation' => Sanitizer::TEXT,
            'data.checkout_configuration.vat_identification_number_validation' => Sanitizer::TEXT,
            'data.checkout_configuration.has_apply_coupon_code' => Sanitizer::BOOL,
        ];
    }

    /**
     * Return the validation rules for the currency settings.
     *
     * The API provider and API config are required only when automatic updates are enabled.
     *
     * @since 1.0.0
     *
     * @return array<string, string|array|callable>
     */
    protected function get_currency_settings_rules()
    {
        return [
            'data.currency_format' => 'required|string|in:' . implode(',', CurrencyFormat::get_constant_values()),
            'data.currency_position' => 'required|string|in:' . implode(',', CurrencyPosition::get_constant_values()),
            'data.thousand_separator' => [
                'required',
                'string',
                function ($value, $key, $data) {
                    if (!in_array($value, ThousandSeparator::get_constant_values())) {
                        /* translators: %1$s: field name, %2$s: comma-separated list of allowed values */
                        return sprintf(__('The value of %1$s must be one of the following: %2$s.', 'kirki-ecommerce'), $key, implode(',', ThousandSeparator::get_constant_values()));
                    }

                    return true;
                }
            ],
            'data.decimal_separator' => [
                'required',
                'string',
                function ($value, $key, $data) {
                    if (!in_array($value, DecimalSeparator::get_constant_values())) {
                        /* translators: %1$s: field name, %2$s: comma-separated list of allowed values */
                        return sprintf(__('The value of %1$s must be one of the following: %2$s.', 'kirki-ecommerce'), $key, implode(',', DecimalSeparator::get_constant_values()));
                    }

                    return true;
                }
            ],
            'data.is_automatic_update_enabled' => 'required|boolean',
            // TODO: replace with a reusable required-if-sibling rule once it can safely mix
            // with type-check rules (e.g. string/array) without failing on null when not required.
            'data.api_provider' => function ($value, $key, $data) {
                if (($data['data']['is_automatic_update_enabled'] ?? null) !== true) {
                    return true;
                }

                if ($value === null || $value === '') {
                    /* translators: %s: field name */
                    return sprintf(__('The %s field is required.', 'kirki-ecommerce'), $key);
                }

                if (!is_string($value)) {
                    /* translators: %s: field name */
                    return sprintf(__('The %s field must be a string.', 'kirki-ecommerce'), $key);
                }

                return true;
            },
            // TODO: replace with a reusable required-if-sibling rule once it can safely mix
            // with type-check rules (e.g. string/array) without failing on null when not required.
            'data.api_config' => function ($value, $key, $data) {
                if (($data['data']['is_automatic_update_enabled'] ?? null) !== true) {
                    return true;
                }

                if ($value === null || (is_array($value) && empty($value))) {
                    /* translators: %s: field name */
                    return sprintf(__('The %s field is required.', 'kirki-ecommerce'), $key);
                }

                if (!is_array($value)) {
                    /* translators: %s: field name */
                    return sprintf(__('The %s field must be an array.', 'kirki-ecommerce'), $key);
                }

                return true;
            },
            'data.api_config.api_key' => 'nullable|string',
            'data.api_config.update_frequency' => 'nullable|string|in:' . implode(',', UpdateFrequency::get_constant_values()),
            'data.api_config.fallback_behaviour' => 'nullable|string|in:' . implode(',', CurrencyUpdateFallback::get_constant_values()),
            'data.api_config.is_cache_enabled' => 'nullable|boolean',
        ];
    }

    /**
     * Return the sanitizers for the currency settings.
     *
     * @since 1.0.0
     *
     * @return array<string, string>
     */
    protected function get_currency_settings_filters()
    {
        return [
            'data.currency_format' => Sanitizer::TEXT,
            'data.currency_position' => Sanitizer::TEXT,
            'data.thousand_separator' => Sanitizer::TEXT,
            'data.decimal_separator' => Sanitizer::TEXT,
            'data.is_automatic_update_enabled' => Sanitizer::BOOL,
            'data.api_provider' => Sanitizer::TEXT,
            'data.api_config' => Sanitizer::ARRAY,
            'data.api_config.api_key' => Sanitizer::TEXT,
            'data.api_config.update_frequency' => Sanitizer::TEXT,
            'data.api_config.fallback_behaviour' => Sanitizer::TEXT,
            'data.api_config.is_cache_enabled' => Sanitizer::BOOL,
        ];
    }

    /**
     * Make email template rules
     * 
     * @since 1.0.0
     * 
     * @return array
     */
    protected function make_email_template_rules()
    {
        $notification_classes = [
            AdminOrderNotification::class,
            AdminInventoryNotification::class,
            AdminUserNotification::class,
            CustomerOrderNotification::class,
            CustomerUserNotification::class,
        ];

        $email_template_rules = [];

        foreach ($notification_classes as $notification_class) {
            $type_key = 'data.' . $notification_class::get_type();

            if (!isset($email_template_rules[$type_key])) {
                $email_template_rules[$type_key] = 'nullable|array';
            }

            $group_key = $type_key . '.' . $notification_class::get_group();

            if (!isset($email_template_rules[$group_key])) {
                $email_template_rules[$group_key] = 'nullable|array';
            }


            $options = $notification_class::get_constant_values();

            foreach ($options as $option) {
                $option_key = $group_key . '.' . $option;

                if (!isset($email_template_rules[$option_key])) {
                    $email_template_rules[$option_key] = 'nullable|array';
                    $email_template_rules = array_merge($email_template_rules, [
                        $option_key . '.is_enabled' => 'nullable|boolean',
                        $option_key . '.subject' => 'nullable|string',
                        $option_key . '.heading' => 'nullable|string',
                        $option_key . '.message' => 'nullable|string',
                    ]);
                }
            }
        }

        return $email_template_rules;
    }

    /**
     * Return the validation rules for the email settings: default template, mail server and notification emails.
     *
     * @since 1.0.0
     *
     * @return array<string, string>
     */
    protected function get_email_settings_rules()
    {
        return array_merge([
            // Default template settings
            'data.default_template' => 'nullable|array',
            'data.default_template.logo' => 'nullable|integer',
            'data.default_template.height' => 'nullable|integer',
            'data.default_template.position' => 'nullable|string',
            'data.default_template.colors' => 'array',
            'data.default_template.colors.background' => 'array',
            'data.default_template.colors.background.email_body' => 'string',
            'data.default_template.colors.background.outer_area' => 'string',
            'data.default_template.colors.background.info_cads' => 'string',
            'data.default_template.colors.background.divider' => 'string',
            'data.default_template.colors.typography' => 'array',
            'data.default_template.colors.typography.headings' => 'string',
            'data.default_template.colors.typography.body' => 'string',
            'data.default_template.colors.typography.muted' => 'string',
            'data.default_template.colors.typography.link' => 'string',
            'data.default_template.colors.typography.exceptions' => 'string',
            'data.default_template.colors.button' => 'array',
            'data.default_template.colors.button.background' => 'string',
            'data.default_template.colors.button.text' => 'string',
            'data.default_template.additional_description' => 'nullable|string',
            'data.default_template.footer' => 'nullable|string',

            // Mail server configuration
            'data.mail_configuration' => 'nullable|array',
            'data.mail_configuration.from_email' => 'nullable|email',
            'data.mail_configuration.from_name' => 'nullable|string',
            'data.mail_configuration.mailer' => 'nullable|string|in:' . Mailer::join(),
            'data.mail_configuration.host' => 'nullable|string',
            'data.mail_configuration.port' => 'nullable|integer',
            'data.mail_configuration.encryption' => 'nullable|string|in:' . MailEncryption::join(),
            'data.mail_configuration.is_authentication_enabled' => 'nullable|boolean',
            'data.mail_configuration.username' => 'nullable|string',
            'data.mail_configuration.password' => 'nullable|string',
        ], $this->make_email_template_rules());
    }

    /**
     * Make email template filters
     * 
     * @since 1.0.0
     * 
     * @return array
     */
    protected function make_email_template_filters()
    {
        $notification_classes = [
            AdminOrderNotification::class,
            AdminInventoryNotification::class,
            AdminUserNotification::class,
            CustomerOrderNotification::class,
            CustomerUserNotification::class,
        ];

        $email_template_rules = [];

        foreach ($notification_classes as $notification_class) {
            $type_key = 'data.' . $notification_class::get_type();

            if (!isset($email_template_rules[$type_key])) {
                $email_template_rules[$type_key] = Sanitizer::ARRAY;
            }

            $group_key = $type_key . '.' . $notification_class::get_group();

            if (!isset($email_template_rules[$group_key])) {
                $email_template_rules[$group_key] = Sanitizer::ARRAY;
            }


            $options = $notification_class::get_constant_values();

            foreach ($options as $option) {
                $option_key = $group_key . '.' . $option;

                if (!isset($email_template_rules[$option_key])) {
                    $email_template_rules[$option_key] = Sanitizer::ARRAY;
                    $email_template_rules = array_merge($email_template_rules, [
                        $option_key . '.is_enabled' => Sanitizer::BOOL,
                        $option_key . '.subject' => Sanitizer::TEXT,
                        $option_key . '.heading' => Sanitizer::TEXT,
                        $option_key . '.message' => Sanitizer::RICH_TEXT,
                    ]);
                }
            }
        }

        return $email_template_rules;
    }

    /**
     * Return the sanitizers for the email settings: default template, mail server and notification emails.
     *
     * @since 1.0.0
     *
     * @return array<string, string>
     */
    protected function get_email_settings_filters()
    {
        return array_merge([
            // Default template settings
            'data.default_template' => Sanitizer::ARRAY,
            'data.default_template.logo' => Sanitizer::INT,
            'data.default_template.height' => Sanitizer::INT,
            'data.default_template.position' => Sanitizer::TEXT,
            'data.default_template.colors' => Sanitizer::ARRAY,
            'data.default_template.colors.background' => Sanitizer::ARRAY,
            'data.default_template.colors.background.email_body' => Sanitizer::TEXT,
            'data.default_template.colors.background.outer_area' => Sanitizer::TEXT,
            'data.default_template.colors.background.info_cads' => Sanitizer::TEXT,
            'data.default_template.colors.background.divider' => Sanitizer::TEXT,
            'data.default_template.colors.typography' => Sanitizer::ARRAY,
            'data.default_template.colors.typography.headings' => Sanitizer::TEXT,
            'data.default_template.colors.typography.body' => Sanitizer::TEXT,
            'data.default_template.colors.typography.muted' => Sanitizer::TEXT,
            'data.default_template.colors.typography.link' => Sanitizer::TEXT,
            'data.default_template.colors.typography.exceptions' => Sanitizer::TEXT,
            'data.default_template.colors.button' => Sanitizer::ARRAY,
            'data.default_template.colors.button.background' => Sanitizer::TEXT,
            'data.default_template.colors.button.text' => Sanitizer::TEXT,
            'data.default_template.additional_description' => Sanitizer::RICH_TEXT,
            'data.default_template.footer' => Sanitizer::RICH_TEXT,

            // Mail server configuration
            'data.mail_configuration' => Sanitizer::ARRAY,
            'data.mail_configuration.from_email' => Sanitizer::EMAIL,
            'data.mail_configuration.from_name' => Sanitizer::TEXT,
            'data.mail_configuration.mailer' => Sanitizer::TEXT,
            'data.mail_configuration.host' => Sanitizer::TEXT,
            'data.mail_configuration.port' => Sanitizer::INT,
            'data.mail_configuration.encryption' => Sanitizer::TEXT,
            'data.mail_configuration.is_authentication_enabled' => Sanitizer::BOOL,
            'data.mail_configuration.username' => Sanitizer::TEXT,
            'data.mail_configuration.password' => Sanitizer::TEXT,
        ], $this->make_email_template_filters());
    }

    /**
     * Return the validation rules for the advanced settings page assignments.
     *
     * @since 1.0.0
     *
     * @return array<string, string>
     */
    protected function get_advance_settings_rules()
    {
        $rules = [
            'data.pages' => 'nullable|array',
        ];

        foreach (PageKeys::get_constant_values() as $page_key) {
            $rules['data.pages.' . $page_key] = 'nullable|integer';
        }

        return $rules;
    }

    /**
     * Return the sanitizers for the advanced settings page assignments.
     *
     * @since 1.0.0
     *
     * @return array<string, string>
     */
    protected function get_advance_settings_filters()
    {
        $filters = [
            'data.pages' => Sanitizer::ARRAY,
        ];

        foreach (PageKeys::get_constant_values() as $page_key) {
            $filters['data.pages.' . $page_key] = Sanitizer::INT;
        }

        return $filters;
    }

    /**
     * Return the validation rules for the legal consents.
     *
     * @since 1.0.0
     *
     * @return array<string, string>
     */
    protected function get_legal_settings_rules()
    {
        return [
            'data.consents' => 'nullable|array',
            'data.consents.*.id' => 'required|string',
            'data.consents.*.title' => 'required|string',
            'data.consents.*.locations' => 'required|array|min:1',
            'data.consents.*.locations.*' => 'required|string|in:' . implode(',', ConsentLocations::get_constant_values()),
            'data.consents.*.message' => 'required|string',
            'data.consents.*.method' => 'required|string|in:' . implode(',', ConsentMethods::get_constant_values()),
            'data.consents.*.is_enabled' => 'required|boolean',
        ];
    }

    /**
     * Return the sanitizers for the legal consents.
     *
     * The `data.consents` array rule must stay first: sanitization only keeps
     * the paths listed here, and the array rule seeds the whole subtree that
     * the leaf rules below then overwrite key by key.
     *
     * @since 1.0.0
     *
     * @return array<string, string>
     */
    protected function get_legal_settings_filters()
    {
        return [
            'data.consents' => Sanitizer::ARRAY,
            'data.consents.*.id' => Sanitizer::TEXT,
            'data.consents.*.title' => Sanitizer::TEXT,
            'data.consents.*.locations' => Sanitizer::ARRAY,
            'data.consents.*.locations.*' => Sanitizer::KEY,
            'data.consents.*.message' => Sanitizer::TEXTAREA,
            'data.consents.*.method' => Sanitizer::KEY,
            'data.consents.*.is_enabled' => Sanitizer::BOOL,
        ];
    }
}
