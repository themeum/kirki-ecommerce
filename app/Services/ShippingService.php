<?php

namespace Kirki\Ecommerce\App\Services;

use Kirki\Ecommerce\App\Decisions\Contexts\DecisionContext;
use Kirki\Ecommerce\App\Constants\ShippingMethodTypes;
use Kirki\Ecommerce\App\DTO\Calculation\CalculationContextDTO;
use Kirki\Ecommerce\App\Models\ShippingProfile;

use function Kirki\Ecommerce\App\decision_engine;

/**
 * Works out which shipping methods apply to a cart and what they cost.
 *
 * Reads zones and methods from the shipping settings and applies shipping
 * rules through the decision engine.
 *
 * @since 1.0.0
 */
class ShippingService
{
    /** @var array<string, mixed> */
    protected $shipping_settings;

    /**
     * Create the service.
     *
     * @since 1.0.0
     *
     * @param array<string, mixed> $shipping_settings Shipping settings, including the `shipping_zones` list.
     */
    public function __construct(array $shipping_settings)
    {
        $this->shipping_settings = $shipping_settings;
    }

    /**
     * Calculate the shipping cost for a cart context.
     *
     * @since 1.0.0
     *
     * @param CalculationContextDTO $context Cart or order calculation context.
     * @return int Shipping cost in base currency (minor units); 0 when no method is selected.
     */
    public function calculate(CalculationContextDTO $context)
    {
        return $this->get_selected_shipping_method($context)['base_cost'] ?? 0;
    }

    /**
     * Get the decision context for a shipping method after its cost and rules are applied.
     *
     * Uses the context's selected method when none is given.
     *
     * @since 1.0.0
     *
     * @param CalculationContextDTO     $context Cart or order calculation context.
     * @param array<string, mixed>|null $method  Shipping method definition.
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
     * Get the shipping options a cart or order can choose from.
     *
     * Methods whose rules disable them are left out.
     *
     * @since 1.0.0
     *
     * @param CalculationContextDTO $context Cart or order calculation context.
     * @return array<int, array{id: string, name: string, description: string, is_taxable: bool, type: string, base_cost: int}> Options with their cost in base currency (minor units).
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
     * Get the enabled shipping methods of the zone matching a shipping address.
     *
     * @since 1.0.0
     *
     * @param array<string, mixed> $shipping_address Shipping address with `country` and `state` entries.
     * @return array<int, array<string, mixed>> Shipping method definitions; empty when no zone matches.
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
     * @since 1.0.0
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
     * Get the shipping option chosen in the context, if it is still available.
     *
     * @since 1.0.0
     *
     * @param CalculationContextDTO $context Cart or order calculation context.
     * @return array<string, mixed>|null Null when no option matches the context's shipping method ID.
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
     * Check whether the context's selected shipping method is currently available.
     *
     * @since 1.0.0
     *
     * @param CalculationContextDTO $context Cart or order calculation context.
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
     * Find the first enabled shipping zone whose regions match a shipping address.
     *
     * @since 1.0.0
     *
     * @param array<string, mixed> $shipping_address Shipping address with `country` and `state` entries.
     * @return array<string, mixed>|null Null when no zone matches.
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
     * Check whether a destination falls inside a zone's regions.
     *
     * A zone without regions matches everywhere, and a region without states
     * matches its whole country.
     *
     * @since 1.0.0
     *
     * @param string|null                      $country Destination country code.
     * @param string|null                      $state   Destination state code.
     * @param array<int, array<string, mixed>> $regions Zone regions, each with a `country` and optional `states`.
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
     * Calculate the cost of a weight-based shipping method.
     *
     * Returns 0 when free shipping applies, or the cost of the range the cart's
     * total weight falls into.
     *
     * @since 1.0.0
     *
     * @param CalculationContextDTO $context Cart or order calculation context.
     * @param array<string, mixed>  $method  Weight-based shipping method definition.
     * @return int|null Cost in base currency (minor units); null when no range matches.
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
     * Run a shipping method's rules through the decision engine.
     *
     * @since 1.0.0
     *
     * @param CalculationContextDTO     $context   Cart or order calculation context.
     * @param array<string, mixed>|null $method    Shipping method definition holding the `shipping_rules`.
     * @param int|null                  $base_cost Cost before rules; null marks the method as disabled.
     * @return DecisionContext The context after the rules ran.
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
     * Build the decision context for shipping rules from a calculation context.
     *
     * Collects the cart weight, shipping profiles and product categories of the items.
     *
     * @since 1.0.0
     *
     * @param CalculationContextDTO $context   Cart or order calculation context.
     * @param int|null              $base_cost Cost before rules; null marks the context as disabled.
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
