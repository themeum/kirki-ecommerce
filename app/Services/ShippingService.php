<?php

namespace Kirki\Ecommerce\App\Services;

use Kirki\Ecommerce\App\Decisions\Contexts\DecisionContext;
use Kirki\Ecommerce\App\Constants\ShippingMethodTypes;
use Kirki\Ecommerce\App\DTO\Calculation\CalculationContextDTO;
use Kirki\Ecommerce\App\Models\ShippingProfile;

use function Kirki\Ecommerce\App\decision_engine;

class ShippingService
{
    protected $shipping_settings;

    public function __construct(array $shipping_settings)
    {
        $this->shipping_settings = $shipping_settings;
    }

    /**
     * Calculate shipping cost for a cart context
     *
     * @param CalculationContextDTO $context
     * @return int Shipping cost in base currency (minor units)
     */
    public function calculate(CalculationContextDTO $context)
    {
        return $this->get_selected_shipping_method($context)['base_cost'] ?? 0;
    }

    /**
     * Get calculated decision context for a cart/order
     *
     * @param CalculationContextDTO $context
     * @param array|null $method
     * @return DecisionContext
     */
    public function get_calculated_decision_context(CalculationContextDTO $context, $method = null)
    {
        $method = $method ?? $this->get_selected_shipping_method($context);
        $type = $method['type'] ?? ShippingMethodTypes::FLAT_RATE;
        $cost = null;

        switch ($type) {
            case ShippingMethodTypes::FLAT_RATE:
            case ShippingMethodTypes::LOCAL_PICKUP:
                $cost = ((int) $method['base_amount'] ?? null);
                break;
            case ShippingMethodTypes::WEIGHT_BASED:
                $cost = $this->calculate_weight_based_cost($context, $method);
                break;
            default:
                $cost = ((int) $method['base_amount'] ?? null);
                break;
        }

        return $this->apply_shipping_rules($context, $method, $cost);
    }

    /**
     * Get available shipping options for a cart/order
     *
     * @param CalculationContextDTO $context
     * @return array
     */
    public function get_final_available_shipping_options(CalculationContextDTO $context)
    {
        $available_methods = $this->get_available_shipping_methods($context->shipping_address);

        if (empty($available_methods)) {
            return [];
        }

        $available_options = [];

        foreach ($available_methods as $method) {
            $decision_context = $this->get_calculated_decision_context($context, $method);

            if ($decision_context->is_disabled()) {
                continue;
            }

            $available_options[] = [
                'id' => $method['id'],
                'name' => $method['name'],
                'description' => $method['description'],
                'is_taxable' => $method['is_taxable'] ?? false,
                'type' => $method['type'],
                'base_cost' => $decision_context->get_shipping_cost(),
            ];
        }

        return $available_options;
    }

    /**
     * Get available shipping methods for a shipping address
     *
     * @param array $shipping_address
     * @return array
     */
    public function get_available_shipping_methods(array $shipping_address)
    {
        if (empty($shipping_address)) {
            return [];
        }

        $zone = $this->find_shipping_zone($shipping_address);

        if (empty($zone)) {
            return [];
        }

        $all_methods = $zone['shipping_methods'] ?? [];

        if (empty($all_methods)) {
            return [];
        }

        $available_methods = [];

        foreach ($all_methods as $method) {
            if ($method['is_enabled'] === true) {
                $available_methods[] = $method;
            }
        }

        return $available_methods;
    }

    /**
     * Get every enabled shipping method defined across the enabled zones.
     *
     * Zones scope a method to a region, so the same method can be defined in
     * more than one zone. Orders store only the method id, so the list is
     * deduplicated by id and carries just what a filter control needs.
     *
     * @return array<int, array{id: string, name: string, type: string}>
     */
    public function get_all_shipping_methods()
    {
        $zones = $this->shipping_settings['shipping_zones'] ?? [];
        $methods = [];

        foreach ($zones as $zone) {
            if (!($zone['is_enabled'] ?? false)) {
                continue;
            }

            foreach ($zone['shipping_methods'] ?? [] as $method) {
                if (($method['is_enabled'] ?? false) !== true) {
                    continue;
                }

                $id = $method['id'] ?? null;

                if (empty($id) || isset($methods[$id])) {
                    continue;
                }

                $methods[$id] = [
                    'id' => (string) $id,
                    'name' => $method['name'] ?? '',
                    'type' => $method['type'] ?? '',
                ];
            }
        }

        return array_values($methods);
    }

    /**
     * Get selected shipping method for a shipping address
     *
     * @param CalculationContextDTO $context
     * @return array|null
     */
    public function get_selected_shipping_method(CalculationContextDTO $context)
    {
        $methods = $this->get_final_available_shipping_options($context);

        if (empty($methods)) {
            return null;
        }

        foreach ($methods as $method) {
            if ($method['id'] === $context->shipping_method_id) {
                return $method;
            }
        }

        return null;
    }

    /**
     * Check if the selected shipping method is valid for the context
     *
     * @param CalculationContextDTO $context
     * @return bool
     */
    public function has_valid_shipping_method(CalculationContextDTO $context)
    {
        $selected_method = $this->get_selected_shipping_method($context);

        if (empty($selected_method)) {
            return false;
        }

        return true;
    }

    /**
     * Find applicable shipping zone based on shipping address
     *
     * @param array $shipping_address
     * @param array $zones
     * @return array|null
     */
    protected function find_shipping_zone(array $shipping_address)
    {
        $zones = $this->shipping_settings['shipping_zones'] ?? [];

        if (empty($zones) || empty($shipping_address) || !is_array($shipping_address)) {
            return null;
        }

        $country = $shipping_address['country'] ?? null;
        $state = $shipping_address['state'] ?? null;

        foreach ($zones as $zone) {
            if (!($zone['is_enabled'] ?? false)) {
                continue;
            }

            if ($this->matches_zone($country, $state, $zone['regions'] ?? [])) {
                return $zone;
            }
        }

        return null;
    }

    /**
     * Check if destination matches zone regions
     *
     * @param string|null $country
     * @param string|null $state
     * @param array $regions
     * @return bool
     */
    protected function matches_zone($country, $state, array $regions)
    {
        if (empty($regions)) {
            return true;
        }

        foreach ($regions as $region) {
            $region_country = $region['country'] ?? null;
            $region_states = $region['states'] ?? [];

            if ($region_country !== $country) {
                continue;
            }

            if (empty($region_states)) {
                return true;
            }

            if (in_array($state, $region_states)) {
                return true;
            }
        }

        return false;
    }

    /**
     * Calculate weight-based shipping cost
     *
     * @param CalculationContextDTO $context
     * @param array $method
     * @return int|null
     */
    protected function calculate_weight_based_cost(CalculationContextDTO $context, array $method)
    {
        if ($method['is_free_shipping_enabled'] === true && $context->get_subtotal() >= $method['base_free_shipping_min_amount']) {
            return 0;
        }

        $total_weight = $context->items->map(function ($item) {
            return $item->weight * $item->quantity;
        })->sum();

        $ranges = $method['ranges'] ?? [];

        foreach ($ranges as $range) {
            $from = floatval($range['from'] ?? 0);
            $to = floatval($range['to'] ?? PHP_FLOAT_MAX);

            if ($total_weight >= $from && $total_weight < $to) {
                return (int) ($range['base_amount'] ?? 0);
            }
        }

        if (!empty($ranges)) {
            return null;
        }

        return null;
    }

    /**
     * Apply shipping rules using Decision Engine
     *
     * @param CalculationContextDTO $context
     * @param array|null $method
     * @param int|null $base_cost
     * @return DecisionContext
     */
    protected function apply_shipping_rules(CalculationContextDTO $context, $method, $base_cost)
    {
        $rules = $method['shipping_rules'] ?? [];

        $decision_context = $this->prepare_decision_context($context, $base_cost);

        $engine = decision_engine();
        $engine->apply_rules($decision_context, $rules);

        return $decision_context;
    }

    /**
     * Prepare decision context data from calculation context
     *
     * @param CalculationContextDTO $context
     * @param int|null $base_cost
     * @return DecisionContext
     */
    protected function prepare_decision_context(CalculationContextDTO $context, $base_cost = null)
    {
        $cart_weight = 0;
        $shipping_profiles = [];
        $product_categories = [];

        $default_profile = ShippingProfile::where('is_default', true)->first();
        $default_profile_id = $default_profile ? $default_profile->id : null;

        $context->items->each(function ($item) use (&$cart_weight, &$shipping_profiles, &$product_categories, $default_profile_id) {
            if ($item->weight) {
                $cart_weight += $item->weight * $item->quantity;
            }

            $profile_id = $item->shipping_profile_id ? $item->shipping_profile_id : $default_profile_id;

            if ($profile_id) {
                $shipping_profiles[] = $profile_id;
            }

            if ($item->product_categories) {
                $product_categories = array_merge($product_categories, $item->product_categories);
            }
        });

        return DecisionContext::from([
            'base_shipping_cost' => $base_cost ?? 0,
            'cart_weight' => $cart_weight,
            'base_cart_subtotal' => $context->get_subtotal() ?? 0,
            'shipping_address' => $context->shipping_address ?? null,
            'shipping_profiles' => array_unique($shipping_profiles),
            'product_categories' => $product_categories,
            'is_disabled' => is_null($base_cost),
        ]);
    }
}
