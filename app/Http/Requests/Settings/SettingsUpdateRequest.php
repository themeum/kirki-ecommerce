<?php

namespace Kirki\Ecommerce\App\Http\Requests\Settings;

use Kirki\Ecommerce\App\Constants\CurrencyFormat;
use Kirki\Ecommerce\App\Constants\CurrencyPosition;
use Kirki\Ecommerce\App\Constants\CurrencyUpdateFallback;
use Kirki\Ecommerce\App\Constants\DecimalSeparator;
use Kirki\Ecommerce\App\Constants\OptionKeys;
use Kirki\Ecommerce\App\Constants\SellingLocationType;
use Kirki\Ecommerce\App\Constants\ShippingMethodTypes;
use Kirki\Ecommerce\App\Constants\ThousandSeparator;
use Kirki\Ecommerce\App\Constants\UpdateFrequency;
use Kirki\Ecommerce\App\Facades\Money;
use Kirki\Ecommerce\Framework\Sanitizer;
use Kirki\Ecommerce\Framework\Http\Request;
use Kirki\Ecommerce\Framework\Validation\Rule;

class SettingsUpdateRequest extends Request
{
    protected function prepare_for_validation()
    {
        if ($this->get_string('key') !== OptionKeys::SHIPPING_SETTINGS) {
            return;
        }

        $data = $this->input('data');

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

        $this->merge(['data' => $data]);
    }

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
                $rules = []; // @todo: implement later
                break;
            default:
                break;
        }

        return array_merge([
            'key' => 'required|string|in:' . implode(',', OptionKeys::get_constant_values()),
        ], $rules);
    }

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
                return []; //@todo: implement later
            default:
                return [];
        }
    }

    protected function get_general_settings_rules()
    {
        return [
            'data.store_name' => 'required|string',
            'data.store_email' => 'required|email',
            'data.store_logo' => 'nullable|integer',
            'data.store_phone' => 'nullable|string',
            'data.store_address' => 'nullable|array',
            'data.store_address.address_line_1' => 'required|string',
            'data.store_address.address_line_2' => 'nullable|string',
            'data.store_address.city' => 'required|string',
            'data.store_address.state' => 'required|string',
            'data.store_address.postal_code' => 'required|string',
            'data.store_address.country' => 'required|string',
            'data.selling_location_type' => 'required|string|in:' . implode(',', SellingLocationType::get_constant_values()),
            'data.selling_countries' => 'nullable|array',
            'data.order_id_prefix' => 'nullable|string',
            'data.order_id_suffix' => 'nullable|string',
            'data.invoice_id_prefix' => 'nullable|string',
            'data.invoice_id_sequence' => 'nullable|string',
            'data.invoice_id_suffix' => 'nullable|string',
            'data.invoice_counter_reset_schedule' => 'nullable|string',
        ];
    }

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
            'data.order_id_prefix' => Sanitizer::TEXT,
            'data.order_id_suffix' => Sanitizer::TEXT,
            'data.invoice_id_prefix' => Sanitizer::TEXT,
            'data.invoice_id_sequence' => Sanitizer::TEXT,
            'data.invoice_id_suffix' => Sanitizer::TEXT,
            'data.invoice_counter_reset_schedule' => Sanitizer::TEXT,
        ];
    }

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
            'data.shipping_zones.*.shipping_methods.*.base_amount' => 'required|number',
            // TODO: replace with a reusable required-if-sibling rule once it can safely mix
            // with type-check rules (e.g. string/array) without failing on null when not required.
            // Bound to the shipping method itself (not the is_taxable leaf) so the check
            // still runs even when the client omits is_taxable entirely - a wildcard rule
            // keyed on a leaf field is only evaluated when that key is present in the payload.
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

    protected function get_tax_settings_rules()
    {
        return [
            'data.is_tax_inclusive_price' => 'required|boolean',
            'data.is_shipping_tax_enabled' => 'required|boolean',
            'data.is_enabled_taxed_price' => 'required|boolean',
            'data.tax_regions' => 'nullable|array',
            'data.tax_regions.*.code' => 'required|string',
            'data.tax_regions.*.name' => 'required|string',
            'data.tax_regions.*.is_enabled' => 'required|boolean',
            'data.tax_regions.*.type' => 'required_if:code,EU|string',
            'data.tax_regions.*.is_central_tax_enabled' => 'nullable|boolean',
            'data.tax_regions.*.central_product_tax' => 'required_if:is_central_tax_enabled,true|number',
            'data.tax_regions.*.central_shipping_tax' => 'nullable|number',
            'data.tax_regions.*.product_tax' => 'required_if:code,EU|array',
            'data.tax_regions.*.product_tax.*.country' => 'required_if:code,EU|string',
            'data.tax_regions.*.product_tax.*.state' => 'nullable|string',
            'data.tax_regions.*.product_tax.*.rate' => 'required|number',
            'data.tax_regions.*.shipping_tax' => 'nullable|array',
            'data.tax_regions.*.shipping_tax.*.country' => 'required_if:code,EU|string',
            'data.tax_regions.*.shipping_tax.*.state' => 'nullable|string',
            'data.tax_regions.*.shipping_tax.*.rate' => 'required|number',
            'data.tax_regions.*.rules' => 'nullable|array',
            'data.tax_regions.*.rules.*.relation' => 'required|string',
            'data.tax_regions.*.rules.*.conditions' => 'required|array',
            'data.tax_regions.*.rules.*.conditions.*.type' => 'required|string',
            'data.tax_regions.*.rules.*.conditions.*.operator' => 'required|string',
            'data.tax_regions.*.rules.*.conditions.*.value' => 'required',
            'data.tax_regions.*.rules.*.action' => 'required|array',
            'data.tax_regions.*.rules.*.action.type' => 'required|string',
            'data.tax_regions.*.rules.*.action.value' => 'nullable',
            'data.tax_services' => 'nullable|array',
            'data.tax_ids' => 'nullable|array',
        ];
    }

    protected function get_tax_settings_filters()
    {
        return [
            'data.is_tax_inclusive_price' => Sanitizer::BOOL,
            'data.is_shipping_tax_enabled' => Sanitizer::BOOL,
            'data.is_enabled_taxed_price' => Sanitizer::BOOL,
            'data.tax_regions' => Sanitizer::ARRAY,
            'data.tax_regions.*.code' => Sanitizer::TEXT,
            'data.tax_regions.*.name' => Sanitizer::TEXT,
            'data.tax_regions.*.is_enabled' => Sanitizer::BOOL,
            'data.tax_regions.*.type' => Sanitizer::TEXT,
            'data.tax_regions.*.is_central_tax_enabled' => Sanitizer::BOOL,
            'data.tax_regions.*.central_product_tax' => Sanitizer::FLOAT,
            'data.tax_regions.*.central_shipping_tax' => Sanitizer::FLOAT,
            'data.tax_regions.*.product_tax' => Sanitizer::ARRAY,
            'data.tax_regions.*.product_tax.*.country' => Sanitizer::TEXT,
            'data.tax_regions.*.product_tax.*.state' => Sanitizer::TEXT,
            'data.tax_regions.*.product_tax.*.rate' => Sanitizer::FLOAT,
            'data.tax_regions.*.shipping_tax' => Sanitizer::ARRAY,
            'data.tax_regions.*.shipping_tax.*.country' => Sanitizer::TEXT,
            'data.tax_regions.*.shipping_tax.*.state' => Sanitizer::TEXT,
            'data.tax_regions.*.shipping_tax.*.rate' => Sanitizer::FLOAT,
            'data.tax_regions.*.rules' => Sanitizer::ARRAY,
            'data.tax_regions.*.rules.*.relation' => Sanitizer::TEXT,
            'data.tax_regions.*.rules.*.conditions' => Sanitizer::ARRAY,
            'data.tax_regions.*.rules.*.conditions.*.type' => Sanitizer::TEXT,
            'data.tax_regions.*.rules.*.conditions.*.operator' => Sanitizer::TEXT,
            'data.tax_regions.*.rules.*.conditions.*.value' => Sanitizer::ANY,
            'data.tax_regions.*.rules.*.action' => Sanitizer::ARRAY,
            'data.tax_regions.*.rules.*.action.type' => Sanitizer::TEXT,
            'data.tax_regions.*.rules.*.action.value' => Sanitizer::ANY,
            'data.tax_services' => Sanitizer::ARRAY,
            'data.tax_ids' => Sanitizer::ARRAY,
        ];
    }

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
            'data.is_terms_and_conditions_visible' => 'required|boolean',
            'data.terms_and_conditions_content' => 'nullable|string',
            'data.is_privacy_policy_visible' => 'required|boolean',
            'data.privacy_policy_content' => 'nullable|string',
        ];
    }

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
            'data.is_terms_and_conditions_visible' => Sanitizer::BOOL,
            'data.terms_and_conditions_content' => Sanitizer::TEXTAREA,
            'data.is_privacy_policy_visible' => Sanitizer::BOOL,
            'data.privacy_policy_content' => Sanitizer::TEXTAREA,
        ];
    }

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
                        /* translators: %s: possible values */
                        return sprintf(__('The value of %s must be one of the following: %s.', 'growfund'), $key, implode(',', ThousandSeparator::get_constant_values()));
                    }

                    return true;
                }
            ],
            'data.decimal_separator' => [
                'required',
                'string',
                function ($value, $key, $data) {
                    if (!in_array($value, DecimalSeparator::get_constant_values())) {
                        /* translators: %s: possible values */
                        return sprintf(__('The value of %s must be one of the following: %s.', 'growfund'), $key, implode(',', DecimalSeparator::get_constant_values()));
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
                    return sprintf(__('The %s field is required.', 'growfund'), $key);
                }

                if (!is_string($value)) {
                    return sprintf(__('The %s field must be a string.', 'growfund'), $key);
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
                    return sprintf(__('The %s field is required.', 'growfund'), $key);
                }

                if (!is_array($value)) {
                    return sprintf(__('The %s field must be an array.', 'growfund'), $key);
                }

                return true;
            },
            'data.api_config.api_key' => 'nullable|string',
            'data.api_config.update_frequency' => 'nullable|string|in:' . implode(',', UpdateFrequency::get_constant_values()),
            'data.api_config.fallback_behaviour' => 'nullable|string|in:' . implode(',', CurrencyUpdateFallback::get_constant_values()),
            'data.api_config.is_cache_enabled' => 'nullable|boolean',
        ];
    }

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

    protected function get_email_settings_rules()
    {
        return [
            // Default template settings
            'data.default_template' => 'nullable|array',
            'data.default_template.logo' => 'nullable|string',
            'data.default_template.height' => 'nullable|string',
            'data.default_template.position' => 'nullable|string',
            'data.default_template.colors' => 'nullable|array',
            'data.default_template.colors.background' => 'nullable|string',
            'data.default_template.colors.text' => 'nullable|string',
            'data.default_template.colors.link' => 'nullable|string',
            'data.default_template.colors.label' => 'nullable|string',
            'data.default_template.colors.button' => 'nullable|string',
            'data.default_template.colors.button_bg' => 'nullable|string',

            // Customer emails
            'data.customer_emails' => 'nullable|array',
            'data.customer_emails.order_notifications' => 'nullable|array',

            // Customer order notifications
            'data.customer_emails.order_notifications.new_order_email' => 'nullable|array',
            'data.customer_emails.order_notifications.new_order_email.is_enabled' => 'nullable|boolean',
            'data.customer_emails.order_notifications.new_order_email.name' => 'nullable|string',
            'data.customer_emails.order_notifications.new_order_email.subject' => 'nullable|string',
            'data.customer_emails.order_notifications.new_order_email.heading' => 'nullable|string',
            'data.customer_emails.order_notifications.new_order_email.message' => 'nullable|string',
            'data.customer_emails.order_notifications.new_order_email.shortcodes' => 'nullable|array',

            'data.customer_emails.order_notifications.cancelled_order_email' => 'nullable|array',
            'data.customer_emails.order_notifications.cancelled_order_email.is_enabled' => 'nullable|boolean',
            'data.customer_emails.order_notifications.cancelled_order_email.name' => 'nullable|string',
            'data.customer_emails.order_notifications.cancelled_order_email.subject' => 'nullable|string',
            'data.customer_emails.order_notifications.cancelled_order_email.heading' => 'nullable|string',
            'data.customer_emails.order_notifications.cancelled_order_email.message' => 'nullable|string',
            'data.customer_emails.order_notifications.cancelled_order_email.shortcodes' => 'nullable|array',

            'data.customer_emails.order_notifications.failed_order_email' => 'nullable|array',
            'data.customer_emails.order_notifications.failed_order_email.is_enabled' => 'nullable|boolean',
            'data.customer_emails.order_notifications.failed_order_email.name' => 'nullable|string',
            'data.customer_emails.order_notifications.failed_order_email.subject' => 'nullable|string',
            'data.customer_emails.order_notifications.failed_order_email.heading' => 'nullable|string',
            'data.customer_emails.order_notifications.failed_order_email.message' => 'nullable|string',
            'data.customer_emails.order_notifications.failed_order_email.shortcodes' => 'nullable|array',

            'data.customer_emails.order_notifications.order_on_hold_email' => 'nullable|array',
            'data.customer_emails.order_notifications.order_on_hold_email.is_enabled' => 'nullable|boolean',
            'data.customer_emails.order_notifications.order_on_hold_email.name' => 'nullable|string',
            'data.customer_emails.order_notifications.order_on_hold_email.subject' => 'nullable|string',
            'data.customer_emails.order_notifications.order_on_hold_email.heading' => 'nullable|string',
            'data.customer_emails.order_notifications.order_on_hold_email.message' => 'nullable|string',
            'data.customer_emails.order_notifications.order_on_hold_email.shortcodes' => 'nullable|array',

            'data.customer_emails.order_notifications.processing_order_email' => 'nullable|array',
            'data.customer_emails.order_notifications.processing_order_email.is_enabled' => 'nullable|boolean',
            'data.customer_emails.order_notifications.processing_order_email.name' => 'nullable|string',
            'data.customer_emails.order_notifications.processing_order_email.subject' => 'nullable|string',
            'data.customer_emails.order_notifications.processing_order_email.heading' => 'nullable|string',
            'data.customer_emails.order_notifications.processing_order_email.message' => 'nullable|string',
            'data.customer_emails.order_notifications.processing_order_email.shortcodes' => 'nullable|array',

            'data.customer_emails.order_notifications.completed_order_email' => 'nullable|array',
            'data.customer_emails.order_notifications.completed_order_email.is_enabled' => 'nullable|boolean',
            'data.customer_emails.order_notifications.completed_order_email.name' => 'nullable|string',
            'data.customer_emails.order_notifications.completed_order_email.subject' => 'nullable|string',
            'data.customer_emails.order_notifications.completed_order_email.heading' => 'nullable|string',
            'data.customer_emails.order_notifications.completed_order_email.message' => 'nullable|string',
            'data.customer_emails.order_notifications.completed_order_email.shortcodes' => 'nullable|array',

            'data.customer_emails.order_notifications.order_note_email' => 'nullable|array',
            'data.customer_emails.order_notifications.order_note_email.is_enabled' => 'nullable|boolean',
            'data.customer_emails.order_notifications.order_note_email.name' => 'nullable|string',
            'data.customer_emails.order_notifications.order_note_email.subject' => 'nullable|string',
            'data.customer_emails.order_notifications.order_note_email.heading' => 'nullable|string',
            'data.customer_emails.order_notifications.order_note_email.message' => 'nullable|string',
            'data.customer_emails.order_notifications.order_note_email.shortcodes' => 'nullable|array',

            // Customer user notifications
            'data.customer_emails.user_notifications' => 'nullable|array',

            'data.customer_emails.user_notifications.new_customer_registered_email' => 'nullable|array',
            'data.customer_emails.user_notifications.new_customer_registered_email.is_enabled' => 'nullable|boolean',
            'data.customer_emails.user_notifications.new_customer_registered_email.name' => 'nullable|string',
            'data.customer_emails.user_notifications.new_customer_registered_email.subject' => 'nullable|string',
            'data.customer_emails.user_notifications.new_customer_registered_email.heading' => 'nullable|string',
            'data.customer_emails.user_notifications.new_customer_registered_email.message' => 'nullable|string',
            'data.customer_emails.user_notifications.new_customer_registered_email.shortcodes' => 'nullable|array',

            'data.customer_emails.user_notifications.reset_password_email' => 'nullable|array',
            'data.customer_emails.user_notifications.reset_password_email.is_enabled' => 'nullable|boolean',
            'data.customer_emails.user_notifications.reset_password_email.name' => 'nullable|string',
            'data.customer_emails.user_notifications.reset_password_email.subject' => 'nullable|string',
            'data.customer_emails.user_notifications.reset_password_email.heading' => 'nullable|string',
            'data.customer_emails.user_notifications.reset_password_email.message' => 'nullable|string',
            'data.customer_emails.user_notifications.reset_password_email.shortcodes' => 'nullable|array',

            // Admin emails
            'data.admin_emails' => 'nullable|array',
            'data.admin_emails.order_notifications' => 'nullable|array',

            // Admin order notifications
            'data.admin_emails.order_notifications.new_order_email' => 'nullable|array',
            'data.admin_emails.order_notifications.new_order_email.is_enabled' => 'nullable|boolean',
            'data.admin_emails.order_notifications.new_order_email.name' => 'nullable|string',
            'data.admin_emails.order_notifications.new_order_email.subject' => 'nullable|string',
            'data.admin_emails.order_notifications.new_order_email.heading' => 'nullable|string',
            'data.admin_emails.order_notifications.new_order_email.message' => 'nullable|string',
            'data.admin_emails.order_notifications.new_order_email.shortcodes' => 'nullable|array',

            'data.admin_emails.order_notifications.cancelled_order_email' => 'nullable|array',
            'data.admin_emails.order_notifications.cancelled_order_email.is_enabled' => 'nullable|boolean',
            'data.admin_emails.order_notifications.cancelled_order_email.name' => 'nullable|string',
            'data.admin_emails.order_notifications.cancelled_order_email.subject' => 'nullable|string',
            'data.admin_emails.order_notifications.cancelled_order_email.heading' => 'nullable|string',
            'data.admin_emails.order_notifications.cancelled_order_email.message' => 'nullable|string',
            'data.admin_emails.order_notifications.cancelled_order_email.shortcodes' => 'nullable|array',

            'data.admin_emails.order_notifications.failed_order_email' => 'nullable|array',
            'data.admin_emails.order_notifications.failed_order_email.is_enabled' => 'nullable|boolean',
            'data.admin_emails.order_notifications.failed_order_email.name' => 'nullable|string',
            'data.admin_emails.order_notifications.failed_order_email.subject' => 'nullable|string',
            'data.admin_emails.order_notifications.failed_order_email.heading' => 'nullable|string',
            'data.admin_emails.order_notifications.failed_order_email.message' => 'nullable|string',
            'data.admin_emails.order_notifications.failed_order_email.shortcodes' => 'nullable|array',

            'data.admin_emails.order_notifications.customer_requested_refund_email' => 'nullable|array',
            'data.admin_emails.order_notifications.customer_requested_refund_email.is_enabled' => 'nullable|boolean',
            'data.admin_emails.order_notifications.customer_requested_refund_email.name' => 'nullable|string',
            'data.admin_emails.order_notifications.customer_requested_refund_email.subject' => 'nullable|string',
            'data.admin_emails.order_notifications.customer_requested_refund_email.heading' => 'nullable|string',
            'data.admin_emails.order_notifications.customer_requested_refund_email.message' => 'nullable|string',
            'data.admin_emails.order_notifications.customer_requested_refund_email.shortcodes' => 'nullable|array',

            // Admin inventory notifications
            'data.admin_emails.inventory_notifications' => 'nullable|array',

            'data.admin_emails.inventory_notifications.low_stock_email' => 'nullable|array',
            'data.admin_emails.inventory_notifications.low_stock_email.is_enabled' => 'nullable|boolean',
            'data.admin_emails.inventory_notifications.low_stock_email.name' => 'nullable|string',
            'data.admin_emails.inventory_notifications.low_stock_email.subject' => 'nullable|string',
            'data.admin_emails.inventory_notifications.low_stock_email.heading' => 'nullable|string',
            'data.admin_emails.inventory_notifications.low_stock_email.message' => 'nullable|string',
            'data.admin_emails.inventory_notifications.low_stock_email.shortcodes' => 'nullable|array',

            'data.admin_emails.inventory_notifications.out_of_stock_email' => 'nullable|array',
            'data.admin_emails.inventory_notifications.out_of_stock_email.is_enabled' => 'nullable|boolean',
            'data.admin_emails.inventory_notifications.out_of_stock_email.name' => 'nullable|string',
            'data.admin_emails.inventory_notifications.out_of_stock_email.subject' => 'nullable|string',
            'data.admin_emails.inventory_notifications.out_of_stock_email.heading' => 'nullable|string',
            'data.admin_emails.inventory_notifications.out_of_stock_email.message' => 'nullable|string',
            'data.admin_emails.inventory_notifications.out_of_stock_email.shortcodes' => 'nullable|array',

            // Admin user notifications
            'data.admin_emails.user_notifications' => 'nullable|array',

            'data.admin_emails.user_notifications.new_customer_registered_email' => 'nullable|array',
            'data.admin_emails.user_notifications.new_customer_registered_email.is_enabled' => 'nullable|boolean',
            'data.admin_emails.user_notifications.new_customer_registered_email.name' => 'nullable|string',
            'data.admin_emails.user_notifications.new_customer_registered_email.subject' => 'nullable|string',
            'data.admin_emails.user_notifications.new_customer_registered_email.heading' => 'nullable|string',
            'data.admin_emails.user_notifications.new_customer_registered_email.message' => 'nullable|string',
            'data.admin_emails.user_notifications.new_customer_registered_email.shortcodes' => 'nullable|array',
        ];
    }

    protected function get_email_settings_filters()
    {
        return [
            // Default template settings
            'data.default_template' => Sanitizer::ARRAY,
            'data.default_template.logo' => Sanitizer::TEXT,
            'data.default_template.height' => Sanitizer::TEXT,
            'data.default_template.position' => Sanitizer::TEXT,
            'data.default_template.colors' => Sanitizer::ARRAY,
            'data.default_template.colors.background' => Sanitizer::TEXT,
            'data.default_template.colors.text' => Sanitizer::TEXT,
            'data.default_template.colors.link' => Sanitizer::TEXT,
            'data.default_template.colors.label' => Sanitizer::TEXT,
            'data.default_template.colors.button' => Sanitizer::TEXT,
            'data.default_template.colors.button_bg' => Sanitizer::TEXT,

            // Customer emails
            'data.customer_emails' => Sanitizer::ARRAY,
            'data.customer_emails.order_notifications' => Sanitizer::ARRAY,

            // Customer order notifications
            'data.customer_emails.order_notifications.new_order_email' => Sanitizer::ARRAY,
            'data.customer_emails.order_notifications.new_order_email.is_enabled' => Sanitizer::BOOL,
            'data.customer_emails.order_notifications.new_order_email.name' => Sanitizer::TEXT,
            'data.customer_emails.order_notifications.new_order_email.subject' => Sanitizer::TEXT,
            'data.customer_emails.order_notifications.new_order_email.heading' => Sanitizer::TEXT,
            'data.customer_emails.order_notifications.new_order_email.message' => Sanitizer::TEXTAREA,
            'data.customer_emails.order_notifications.new_order_email.shortcodes' => Sanitizer::ARRAY,

            'data.customer_emails.order_notifications.cancelled_order_email' => Sanitizer::ARRAY,
            'data.customer_emails.order_notifications.cancelled_order_email.is_enabled' => Sanitizer::BOOL,
            'data.customer_emails.order_notifications.cancelled_order_email.name' => Sanitizer::TEXT,
            'data.customer_emails.order_notifications.cancelled_order_email.subject' => Sanitizer::TEXT,
            'data.customer_emails.order_notifications.cancelled_order_email.heading' => Sanitizer::TEXT,
            'data.customer_emails.order_notifications.cancelled_order_email.message' => Sanitizer::TEXTAREA,
            'data.customer_emails.order_notifications.cancelled_order_email.shortcodes' => Sanitizer::ARRAY,

            'data.customer_emails.order_notifications.failed_order_email' => Sanitizer::ARRAY,
            'data.customer_emails.order_notifications.failed_order_email.is_enabled' => Sanitizer::BOOL,
            'data.customer_emails.order_notifications.failed_order_email.name' => Sanitizer::TEXT,
            'data.customer_emails.order_notifications.failed_order_email.subject' => Sanitizer::TEXT,
            'data.customer_emails.order_notifications.failed_order_email.heading' => Sanitizer::TEXT,
            'data.customer_emails.order_notifications.failed_order_email.message' => Sanitizer::TEXTAREA,
            'data.customer_emails.order_notifications.failed_order_email.shortcodes' => Sanitizer::ARRAY,

            'data.customer_emails.order_notifications.order_on_hold_email' => Sanitizer::ARRAY,
            'data.customer_emails.order_notifications.order_on_hold_email.is_enabled' => Sanitizer::BOOL,
            'data.customer_emails.order_notifications.order_on_hold_email.name' => Sanitizer::TEXT,
            'data.customer_emails.order_notifications.order_on_hold_email.subject' => Sanitizer::TEXT,
            'data.customer_emails.order_notifications.order_on_hold_email.heading' => Sanitizer::TEXT,
            'data.customer_emails.order_notifications.order_on_hold_email.message' => Sanitizer::TEXTAREA,
            'data.customer_emails.order_notifications.order_on_hold_email.shortcodes' => Sanitizer::ARRAY,

            'data.customer_emails.order_notifications.processing_order_email' => Sanitizer::ARRAY,
            'data.customer_emails.order_notifications.processing_order_email.is_enabled' => Sanitizer::BOOL,
            'data.customer_emails.order_notifications.processing_order_email.name' => Sanitizer::TEXT,
            'data.customer_emails.order_notifications.processing_order_email.subject' => Sanitizer::TEXT,
            'data.customer_emails.order_notifications.processing_order_email.heading' => Sanitizer::TEXT,
            'data.customer_emails.order_notifications.processing_order_email.message' => Sanitizer::TEXTAREA,
            'data.customer_emails.order_notifications.processing_order_email.shortcodes' => Sanitizer::ARRAY,

            'data.customer_emails.order_notifications.completed_order_email' => Sanitizer::ARRAY,
            'data.customer_emails.order_notifications.completed_order_email.is_enabled' => Sanitizer::BOOL,
            'data.customer_emails.order_notifications.completed_order_email.name' => Sanitizer::TEXT,
            'data.customer_emails.order_notifications.completed_order_email.subject' => Sanitizer::TEXT,
            'data.customer_emails.order_notifications.completed_order_email.heading' => Sanitizer::TEXT,
            'data.customer_emails.order_notifications.completed_order_email.message' => Sanitizer::TEXTAREA,
            'data.customer_emails.order_notifications.completed_order_email.shortcodes' => Sanitizer::ARRAY,

            'data.customer_emails.order_notifications.order_note_email' => Sanitizer::ARRAY,
            'data.customer_emails.order_notifications.order_note_email.is_enabled' => Sanitizer::BOOL,
            'data.customer_emails.order_notifications.order_note_email.name' => Sanitizer::TEXT,
            'data.customer_emails.order_notifications.order_note_email.subject' => Sanitizer::TEXT,
            'data.customer_emails.order_notifications.order_note_email.heading' => Sanitizer::TEXT,
            'data.customer_emails.order_notifications.order_note_email.message' => Sanitizer::TEXTAREA,
            'data.customer_emails.order_notifications.order_note_email.shortcodes' => Sanitizer::ARRAY,

            // Customer user notifications
            'data.customer_emails.user_notifications' => Sanitizer::ARRAY,

            'data.customer_emails.user_notifications.new_customer_registered_email' => Sanitizer::ARRAY,
            'data.customer_emails.user_notifications.new_customer_registered_email.is_enabled' => Sanitizer::BOOL,
            'data.customer_emails.user_notifications.new_customer_registered_email.name' => Sanitizer::TEXT,
            'data.customer_emails.user_notifications.new_customer_registered_email.subject' => Sanitizer::TEXT,
            'data.customer_emails.user_notifications.new_customer_registered_email.heading' => Sanitizer::TEXT,
            'data.customer_emails.user_notifications.new_customer_registered_email.message' => Sanitizer::TEXTAREA,
            'data.customer_emails.user_notifications.new_customer_registered_email.shortcodes' => Sanitizer::ARRAY,

            'data.customer_emails.user_notifications.reset_password_email' => Sanitizer::ARRAY,
            'data.customer_emails.user_notifications.reset_password_email.is_enabled' => Sanitizer::BOOL,
            'data.customer_emails.user_notifications.reset_password_email.name' => Sanitizer::TEXT,
            'data.customer_emails.user_notifications.reset_password_email.subject' => Sanitizer::TEXT,
            'data.customer_emails.user_notifications.reset_password_email.heading' => Sanitizer::TEXT,
            'data.customer_emails.user_notifications.reset_password_email.message' => Sanitizer::TEXTAREA,
            'data.customer_emails.user_notifications.reset_password_email.shortcodes' => Sanitizer::ARRAY,

            // Admin emails
            'data.admin_emails' => Sanitizer::ARRAY,
            'data.admin_emails.order_notifications' => Sanitizer::ARRAY,

            // Admin order notifications
            'data.admin_emails.order_notifications.new_order_email' => Sanitizer::ARRAY,
            'data.admin_emails.order_notifications.new_order_email.is_enabled' => Sanitizer::BOOL,
            'data.admin_emails.order_notifications.new_order_email.name' => Sanitizer::TEXT,
            'data.admin_emails.order_notifications.new_order_email.subject' => Sanitizer::TEXT,
            'data.admin_emails.order_notifications.new_order_email.heading' => Sanitizer::TEXT,
            'data.admin_emails.order_notifications.new_order_email.message' => Sanitizer::TEXTAREA,
            'data.admin_emails.order_notifications.new_order_email.shortcodes' => Sanitizer::ARRAY,

            'data.admin_emails.order_notifications.cancelled_order_email' => Sanitizer::ARRAY,
            'data.admin_emails.order_notifications.cancelled_order_email.is_enabled' => Sanitizer::BOOL,
            'data.admin_emails.order_notifications.cancelled_order_email.name' => Sanitizer::TEXT,
            'data.admin_emails.order_notifications.cancelled_order_email.subject' => Sanitizer::TEXT,
            'data.admin_emails.order_notifications.cancelled_order_email.heading' => Sanitizer::TEXT,
            'data.admin_emails.order_notifications.cancelled_order_email.message' => Sanitizer::TEXTAREA,
            'data.admin_emails.order_notifications.cancelled_order_email.shortcodes' => Sanitizer::ARRAY,

            'data.admin_emails.order_notifications.failed_order_email' => Sanitizer::ARRAY,
            'data.admin_emails.order_notifications.failed_order_email.is_enabled' => Sanitizer::BOOL,
            'data.admin_emails.order_notifications.failed_order_email.name' => Sanitizer::TEXT,
            'data.admin_emails.order_notifications.failed_order_email.subject' => Sanitizer::TEXT,
            'data.admin_emails.order_notifications.failed_order_email.heading' => Sanitizer::TEXT,
            'data.admin_emails.order_notifications.failed_order_email.message' => Sanitizer::TEXTAREA,
            'data.admin_emails.order_notifications.failed_order_email.shortcodes' => Sanitizer::ARRAY,

            'data.admin_emails.order_notifications.customer_requested_refund_email' => Sanitizer::ARRAY,
            'data.admin_emails.order_notifications.customer_requested_refund_email.is_enabled' => Sanitizer::BOOL,
            'data.admin_emails.order_notifications.customer_requested_refund_email.name' => Sanitizer::TEXT,
            'data.admin_emails.order_notifications.customer_requested_refund_email.subject' => Sanitizer::TEXT,
            'data.admin_emails.order_notifications.customer_requested_refund_email.heading' => Sanitizer::TEXT,
            'data.admin_emails.order_notifications.customer_requested_refund_email.message' => Sanitizer::TEXTAREA,
            'data.admin_emails.order_notifications.customer_requested_refund_email.shortcodes' => Sanitizer::ARRAY,

            // Admin inventory notifications
            'data.admin_emails.inventory_notifications' => Sanitizer::ARRAY,

            'data.admin_emails.inventory_notifications.low_stock_email' => Sanitizer::ARRAY,
            'data.admin_emails.inventory_notifications.low_stock_email.is_enabled' => Sanitizer::BOOL,
            'data.admin_emails.inventory_notifications.low_stock_email.name' => Sanitizer::TEXT,
            'data.admin_emails.inventory_notifications.low_stock_email.subject' => Sanitizer::TEXT,
            'data.admin_emails.inventory_notifications.low_stock_email.heading' => Sanitizer::TEXT,
            'data.admin_emails.inventory_notifications.low_stock_email.message' => Sanitizer::TEXTAREA,
            'data.admin_emails.inventory_notifications.low_stock_email.shortcodes' => Sanitizer::ARRAY,

            'data.admin_emails.inventory_notifications.out_of_stock_email' => Sanitizer::ARRAY,
            'data.admin_emails.inventory_notifications.out_of_stock_email.is_enabled' => Sanitizer::BOOL,
            'data.admin_emails.inventory_notifications.out_of_stock_email.name' => Sanitizer::TEXT,
            'data.admin_emails.inventory_notifications.out_of_stock_email.subject' => Sanitizer::TEXT,
            'data.admin_emails.inventory_notifications.out_of_stock_email.heading' => Sanitizer::TEXT,
            'data.admin_emails.inventory_notifications.out_of_stock_email.message' => Sanitizer::TEXTAREA,
            'data.admin_emails.inventory_notifications.out_of_stock_email.shortcodes' => Sanitizer::ARRAY,

            // Admin user notifications
            'data.admin_emails.user_notifications' => Sanitizer::ARRAY,

            'data.admin_emails.user_notifications.new_customer_registered_email' => Sanitizer::ARRAY,
            'data.admin_emails.user_notifications.new_customer_registered_email.is_enabled' => Sanitizer::BOOL,
            'data.admin_emails.user_notifications.new_customer_registered_email.name' => Sanitizer::TEXT,
            'data.admin_emails.user_notifications.new_customer_registered_email.subject' => Sanitizer::TEXT,
            'data.admin_emails.user_notifications.new_customer_registered_email.heading' => Sanitizer::TEXT,
            'data.admin_emails.user_notifications.new_customer_registered_email.message' => Sanitizer::TEXTAREA,
            'data.admin_emails.user_notifications.new_customer_registered_email.shortcodes' => Sanitizer::ARRAY,
        ];
    }
}
