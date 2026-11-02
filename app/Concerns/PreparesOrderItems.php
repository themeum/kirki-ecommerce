<?php

namespace Kirki\Ecommerce\App\Concerns;

defined('ABSPATH') || exit;

use Kirki\Ecommerce\App\DTO\Calculation\CalculationItemDTO;
use Kirki\Ecommerce\App\DTO\Order\CreateOrderItemDTO;
use Kirki\Ecommerce\App\DTO\Order\UpdateOrderItemDTO;
use Kirki\Ecommerce\App\Models\Variant;

/**
 * Fills an order item's data object, shared by order creation and order editing.
 *
 * An item's data has two parts. The snapshot part describes the product as it was
 * sold, and it is written once, when the line is added to the order. The amounts
 * part holds the quantity, prices, discounts and taxes, and it is written again
 * each time the order is calculated.
 *
 * Expects the using class to provide a `convert_amount($amount, $target_currency_code, $exchange_rate)` method.
 *
 * @since 1.0.0
 */
trait PreparesOrderItems
{
    /**
     * Fill the snapshot of the product and variant as they are now.
     *
     * @since 1.0.0
     *
     * @param CreateOrderItemDTO $item_dto DTO to fill.
     * @param Variant            $variant  Variant being sold, with its product.
     * @return CreateOrderItemDTO The filled DTO.
     */
    protected function fill_order_item_snapshot(CreateOrderItemDTO $item_dto, Variant $variant)
    {
        $product = $variant->product;
        $product->load_missing('media');

        $first_media = !empty($product->media) ? $product->media->first() : null;

        $item_dto->product_id = $product->id;
        $item_dto->variant_id = $variant->id;
        $item_dto->product_name = $product->title;
        $item_dto->variant_name = $variant->attribute_values ? $variant->attribute_values->pluck('value')->join(', ') : '';
        $item_dto->sku = $variant->sku;
        $item_dto->barcode = $variant->barcode;
        $item_dto->product_image = $variant->media ?? ($first_media ? $first_media->id : null);
        $item_dto->is_physical_product = $variant->is_physical_product ?? true;
        $item_dto->weight = $variant->weight;
        $item_dto->weight_unit = $variant->weight_unit;
        $item_dto->product_data = [
            'product' => $product->to_array(),
            'variant' => $variant->to_array(),
        ];

        return $item_dto;
    }

    /**
     * Fill the quantity, prices, discount and tax amounts of a calculated item.
     *
     * Every amount is stored in both the base currency and the order currency.
     *
     * @since 1.0.0
     *
     * @param CreateOrderItemDTO|UpdateOrderItemDTO $item_dto        DTO to fill.
     * @param int                                   $order_id        ID of the order the item belongs to.
     * @param CalculationItemDTO                    $calculated_item Calculated item.
     * @param string                                $currency_code   Order currency code.
     * @param float                                 $exchange_rate   Rate from the base currency to the order currency.
     * @return CreateOrderItemDTO|UpdateOrderItemDTO The filled DTO.
     */
    protected function fill_order_item_amounts($item_dto, int $order_id, CalculationItemDTO $calculated_item, string $currency_code, float $exchange_rate)
    {
        $item_dto->order_id = $order_id;

        $item_dto->invoiced_price = $this->convert_amount($calculated_item->base_unit_price, $currency_code, $exchange_rate);
        $item_dto->base_price = $calculated_item->base_unit_price;

        $item_dto->invoiced_regular_price = $this->convert_amount($calculated_item->base_regular_unit_price, $currency_code, $exchange_rate);
        $item_dto->base_regular_price = $calculated_item->base_regular_unit_price;

        $item_dto->invoiced_regular_tax_total = $this->convert_amount($calculated_item->base_regular_tax_amount, $currency_code, $exchange_rate);
        $item_dto->base_regular_tax_total = $calculated_item->base_regular_tax_amount;

        $item_dto->invoiced_catalog_regular_price = $this->convert_amount($calculated_item->base_catalog_regular_price, $currency_code, $exchange_rate);
        $item_dto->base_catalog_regular_price = $calculated_item->base_catalog_regular_price;

        $item_dto->invoiced_catalog_sale_price = $this->convert_amount($calculated_item->base_catalog_sale_price, $currency_code, $exchange_rate);
        $item_dto->base_catalog_sale_price = $calculated_item->base_catalog_sale_price;

        $item_dto->invoiced_catalog_product_coupon_discounted_subtotal = $this->convert_amount($calculated_item->base_catalog_product_coupon_discounted_subtotal, $currency_code, $exchange_rate);
        $item_dto->base_catalog_product_coupon_discounted_subtotal = $calculated_item->base_catalog_product_coupon_discounted_subtotal;

        $item_dto->invoiced_discount_tax_total = $this->convert_amount($calculated_item->base_discount_tax_amount, $currency_code, $exchange_rate);
        $item_dto->base_discount_tax_total = $calculated_item->base_discount_tax_amount;

        $item_dto->quantity = $calculated_item->quantity;

        $item_dto->invoiced_subtotal = $this->convert_amount($calculated_item->base_subtotal, $currency_code, $exchange_rate);
        $item_dto->base_subtotal = $calculated_item->base_subtotal;

        $item_dto->invoiced_discount_amount = $this->convert_amount($calculated_item->base_discount_amount, $currency_code, $exchange_rate);
        $item_dto->base_discount_amount = $calculated_item->base_discount_amount;

        $item_dto->invoiced_tax_total = $this->convert_amount($calculated_item->base_tax_amount, $currency_code, $exchange_rate);
        $item_dto->base_tax_total = $calculated_item->base_tax_amount;

        $item_dto->invoiced_total = $this->convert_amount($calculated_item->base_total, $currency_code, $exchange_rate);
        $item_dto->base_total = $calculated_item->base_total;

        return $item_dto;
    }
}
