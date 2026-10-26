<?php

namespace Kirki\Ecommerce\App\Services;

defined('ABSPATH') || exit;

use Kirki\Ecommerce\App\Constants\Coupon\DiscountType;
use Kirki\Ecommerce\App\Constants\Order\OrderTaxDestination;
use Kirki\Ecommerce\App\Constants\Order\OrderTaxType;
use Kirki\Ecommerce\App\DTO\Calculation\CalculationContextDTO;
use Kirki\Ecommerce\App\DTO\Calculation\StoredOrderTermsDTO;
use Kirki\Ecommerce\App\DTO\Calculation\TaxRateDTO;
use Kirki\Ecommerce\App\Models\Order;
use Kirki\Ecommerce\App\Models\OrderCoupon;

/**
 * Reads the terms an order was placed with, which an edit of that order keeps.
 *
 * The tax rates, the shipping charge and the coupons stay as stored. They are
 * calculated again from the current settings only where the edit asks for a new
 * quote: a shipping charge when the shipping address (country or state) or the
 * shipping method changes, and the tax rates when the address that tax follows
 * changes.
 *
 * @since 1.0.0
 */
class StoredOrderTermsService
{
    /**
     * Build the stored terms for an edit of an order.
     *
     * @since 1.0.0
     *
     * @param Order                 $order   Order being edited, with its items and their taxes, shipping taxes and order coupons loaded.
     * @param CalculationContextDTO $context Context of the edit, with its items and addresses built.
     * @return StoredOrderTermsDTO
     */
    public function build(Order $order, CalculationContextDTO $context)
    {
        $stored = new StoredOrderTermsDTO();
        $stored->is_tax_inclusive = (bool) $order->is_tax_inclusive;
        $stored->tax_destination = $order->tax_destination;
        $stored->coupons = $this->get_kept_coupons($order, $context);

        $is_shipping_stored = !$this->is_shipping_quoted_again($order, $context);

        if ($is_shipping_stored) {
            $stored->shipping_subtotal = $this->get_shipping_subtotal($order);
        }

        if ($this->is_tax_address_changed($order, $context)) {
            return $stored;
        }

        $line_keys = $this->get_line_keys_by_order_item_id($context);

        $stored->item_tax_rates = $this->get_item_tax_rates($order, $line_keys);

        if ($is_shipping_stored) {
            $stored->shipping_tax_rates = $this->get_shipping_tax_rates($order, $line_keys);
            $stored->is_shipping_tax_split = $order->shipping_taxes->some(fn($order_tax) => !empty($order_tax->order_item_id));
        }

        return $stored;
    }

    /**
     * Get the coupons of the order that the edit keeps, which are the ones whose code the edit still sends.
     *
     * @since 1.0.0
     *
     * @param Order                 $order   Order being edited.
     * @param CalculationContextDTO $context Context of the edit.
     * @return array<string, OrderCoupon> Keyed by code.
     */
    protected function get_kept_coupons(Order $order, CalculationContextDTO $context)
    {
        $kept_coupons = [];

        foreach ($order->order_coupons as $order_coupon) {
            if (in_array($order_coupon->code, $context->coupon_codes, true)) {
                $kept_coupons[$order_coupon->code] = $order_coupon;
            }
        }

        return $kept_coupons;
    }

    /**
     * Check whether the edit needs a new shipping quote: the shipping address moved to another country or state, or another method was picked.
     *
     * @since 1.0.0
     *
     * @param Order                 $order   Order being edited.
     * @param CalculationContextDTO $context Context of the edit.
     * @return bool
     */
    protected function is_shipping_quoted_again(Order $order, CalculationContextDTO $context)
    {
        return $context->shipping_method_id !== $order->shipping_method
            || $this->has_region_changed($context->shipping_address, $order->shipping_country, $order->shipping_state);
    }

    /**
     * Check whether the address that tax follows moved to another country or state.
     *
     * The store address never moves with an edit.
     *
     * @since 1.0.0
     *
     * @param Order                 $order   Order being edited.
     * @param CalculationContextDTO $context Context of the edit.
     * @return bool
     */
    protected function is_tax_address_changed(Order $order, CalculationContextDTO $context)
    {
        switch ($order->tax_destination) {
            case OrderTaxDestination::STORE:
                return false;
            case OrderTaxDestination::BILLING:
                return $this->has_region_changed($context->billing_address, $order->billing_country, $order->billing_state);
            default:
                return $this->has_region_changed($context->shipping_address, $order->shipping_country, $order->shipping_state);
        }
    }

    /**
     * Compare an address with a stored country and state.
     *
     * @since 1.0.0
     *
     * @param array<string, mixed> $address        New address.
     * @param string|null          $stored_country Country stored on the order.
     * @param string|null          $stored_state   State stored on the order.
     * @return bool True when the country or the state differs.
     */
    protected function has_region_changed(array $address, $stored_country, $stored_state)
    {
        return (string) ($address['country'] ?? '') !== (string) $stored_country
            || (string) ($address['state'] ?? '') !== (string) $stored_state;
    }

    /**
     * Get the shipping charge as it was before the shipping discount and the shipping tax.
     *
     * The order stores the charge after both, so the free shipping discount is added back
     * and the shipping tax is taken off.
     *
     * @since 1.0.0
     *
     * @param Order $order Order being edited.
     * @return int Charge in base currency minor units.
     */
    protected function get_shipping_subtotal(Order $order)
    {
        $shipping_discount = 0;

        foreach ($order->order_coupons as $order_coupon) {
            if ($order_coupon->discount_type === DiscountType::FREE_SHIPPING) {
                $shipping_discount += $order_coupon->base_discount_amount;
            }
        }

        return max(0, $order->base_shipping_total - $order->base_shipping_tax_amount + $shipping_discount);
    }

    /**
     * Map each stored line to the line key it has in this edit.
     *
     * @since 1.0.0
     *
     * @param CalculationContextDTO $context Context of the edit.
     * @return array<int, int|string> Line key per order item ID, for the lines that are on the order.
     */
    protected function get_line_keys_by_order_item_id(CalculationContextDTO $context)
    {
        $line_keys = [];

        foreach ($context->items as $item) {
            if ($item->order_item_id !== null) {
                $line_keys[$item->order_item_id] = $item->line_key;
            }
        }

        return $line_keys;
    }

    /**
     * Get the product tax rates stored for each line that is in the edit.
     *
     * @since 1.0.0
     *
     * @param Order                  $order     Order being edited.
     * @param array<int, int|string> $line_keys Line key per order item ID.
     * @return array<int|string, TaxRateDTO[]> Rates per line key; empty for a line that was not taxed.
     */
    protected function get_item_tax_rates(Order $order, array $line_keys)
    {
        $item_tax_rates = [];

        foreach ($order->items as $order_item) {
            if (!isset($line_keys[$order_item->id])) {
                continue;
            }

            $item_tax_rates[$line_keys[$order_item->id]] = [];

            foreach ($order_item->taxes as $order_tax) {
                if ($order_tax->type === OrderTaxType::PRODUCT) {
                    $item_tax_rates[$line_keys[$order_item->id]][] = $this->make_tax_rate($order_tax->name, $order_tax->rate);
                }
            }
        }

        return $item_tax_rates;
    }

    /**
     * Get the shipping tax rates stored on the order.
     *
     * @since 1.0.0
     *
     * @param Order                  $order     Order being edited.
     * @param array<int, int|string> $line_keys Line key per order item ID.
     * @return TaxRateDTO[] The line key is set when the rate was split to a line that is in the edit.
     */
    protected function get_shipping_tax_rates(Order $order, array $line_keys)
    {
        $shipping_tax_rates = [];

        foreach ($order->shipping_taxes as $order_tax) {
            $shipping_tax_rates[] = $this->make_tax_rate($order_tax->name, $order_tax->rate, $line_keys[$order_tax->order_item_id] ?? null);
        }

        return $shipping_tax_rates;
    }

    /**
     * Make a stored tax rate.
     *
     * @since 1.0.0
     *
     * @param string|null     $name     Name of the tax.
     * @param float|string    $rate     Rate in percent.
     * @param int|string|null $line_key Line the rate was split to; null when it was not split.
     * @return TaxRateDTO
     */
    protected function make_tax_rate($name, $rate, $line_key = null)
    {
        $tax_rate = new TaxRateDTO();
        $tax_rate->name = $name;
        $tax_rate->rate = (float) $rate;
        $tax_rate->line_key = $line_key;

        return $tax_rate;
    }
}
