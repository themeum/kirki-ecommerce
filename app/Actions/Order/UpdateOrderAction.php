<?php

namespace Kirki\Ecommerce\App\Actions\Order;

defined('ABSPATH') || exit;

use Kirki\Ecommerce\App\Actions\Cart\RecalculateCartAction;
use Kirki\Ecommerce\App\Concerns\PersistsOrderCoupons;
use Kirki\Ecommerce\App\Concerns\PersistsOrderTaxes;
use Kirki\Ecommerce\App\Models\Order;
use Kirki\Ecommerce\App\Services\CouponService;
use Kirki\Ecommerce\App\Services\InventoryService;
use Kirki\Ecommerce\App\Services\OrderCalculationContextBuilder;
use Kirki\Ecommerce\App\Services\OrderService;
use Kirki\Ecommerce\App\Services\ShippingService;
use Kirki\Ecommerce\App\DTO\Calculation\CalculationContextDTO;
use Kirki\Ecommerce\App\DTO\Calculation\CalculationItemDTO;
use Kirki\Ecommerce\App\DTO\Order\CreateOrderItemDTO;
use Kirki\Ecommerce\App\DTO\Order\UpdateOrderDTO;
use Kirki\Ecommerce\App\DTO\Order\UpdateOrderItemDTO;
use Kirki\Ecommerce\App\DTO\Order\UpdateOrderPayloadDTO;
use Kirki\Ecommerce\App\DTO\Calculation\CalculationResultDTO;
use Kirki\Ecommerce\App\Supports\Currency;
use Kirki\Ecommerce\App\Supports\Tax;
use Kirki\Ecommerce\App\Facades\Money;
use Kirki\Ecommerce\Framework\Exceptions\NotFoundException;
use Kirki\Ecommerce\Framework\Exceptions\ValidationException;
use Kirki\Ecommerce\Framework\Http\Response;
use Kirki\Ecommerce\Framework\Supports\Facades\DB;
use Kirki\Ecommerce\Framework\Sanitizer;
use Throwable;

use function Kirki\Ecommerce\App\base_currency;
use function Kirki\Ecommerce\Framework\throw_if;

/**
 * Edits an existing order: recalculates totals, syncs items and stock, coupons and taxes.
 *
 * @since 1.0.0
 */
class UpdateOrderAction
{
    use PersistsOrderCoupons;
    use PersistsOrderTaxes;

    /** @var RecalculateCartAction */
    protected $recalculate_cart_action;

    /** @var OrderCalculationContextBuilder */
    protected $context_builder;

    /** @var OrderService */
    protected $order_service;

    /** @var InventoryService */
    protected $inventory_service;

    /** @var ShippingService */
    protected $shipping_service;

    /** @var CouponService */
    protected $coupon_service;

    /** @var string */
    protected $base_currency_code;

    /**
     * Set up the action and capture the store's base currency code.
     *
     * @since 1.0.0
     *
     * @param RecalculateCartAction          $recalculate_cart_action Totals calculator.
     * @param OrderCalculationContextBuilder $context_builder         Builds the calculation input from the payload.
     * @param OrderService                   $order_service           Order persistence service.
     * @param InventoryService               $inventory_service       Stock checks and reservation.
     * @param ShippingService                $shippingService         Shipping method validation.
     * @param CouponService                  $coupon_service          Coupon service.
     */
    public function __construct(
        RecalculateCartAction $recalculate_cart_action,
        OrderCalculationContextBuilder $context_builder,
        OrderService $order_service,
        InventoryService $inventory_service,
        ShippingService $shippingService,
        CouponService $coupon_service
    ) {
        $this->recalculate_cart_action = $recalculate_cart_action;
        $this->context_builder = $context_builder;
        $this->order_service = $order_service;
        $this->inventory_service = $inventory_service;
        $this->shipping_service = $shippingService;
        $this->coupon_service = $coupon_service;
        $this->base_currency_code = base_currency()->code;
    }

    /**
     * Update an order from the payload.
     *
     * The edit syncs the whole order to the store's current state: every line takes its
     * variant's current price, coupons and shipping are checked again, and amounts are
     * converted at the current exchange rate. Lines whose variant was deleted are removed.
     * Everything runs after the order is locked, in one transaction. Fails when the order
     * can no longer be edited, the currency is changed, the shipping method is invalid,
     * a per-order limit is exceeded or stock is short.
     *
     * @since 1.0.0
     *
     * @param UpdateOrderPayloadDTO $dto Order ID with the new addresses, items, coupons and shipping method.
     * @return Order The updated order with its items and coupons loaded.
     * @throws NotFoundException When the order does not exist.
     * @throws ValidationException When the order cannot be edited or its currency would change.
     * @throws Throwable When persisting the update fails; the transaction is rolled back.
     */
    public function execute(UpdateOrderPayloadDTO $dto)
    {
        DB::begin_transaction();

        try {
            // Wait for any edit or cancel of this order already running, then read the order as it is now.
            $this->order_service->lock_order($dto->id);
            $order = $this->order_service->find_order($dto->id);

            throw_if(!$order, __('Order not found.', 'kirki-ecommerce'), NotFoundException::class, Response::NOT_FOUND);
            throw_if(!$order->is_editable(), __('This order can no longer be edited.', 'kirki-ecommerce'), ValidationException::class, Response::UNPROCESSABLE_ENTITY);
            throw_if(!empty($dto->currency_code) && $dto->currency_code !== $order->currency_code, __('The currency of an order cannot be changed.', 'kirki-ecommerce'), ValidationException::class, Response::UNPROCESSABLE_ENTITY);

            $context = $this->context_builder->build($dto->to_array(), $order, true);

            throw_if(!$this->shipping_service->has_valid_shipping_method($context), __('Invalid shipping method', 'kirki-ecommerce'));

            $calculated_result = $this->recalculate_cart_action->execute($context);
            $currency_code = $order->currency_code;
            $exchange_rate = $this->resolve_exchange_rate($order);

            $this->inventory_service->collect_stock_alerts(fn() => $this->sync_order_items($order, $calculated_result, $currency_code, $exchange_rate));

            $order_dto = $this->prepare_update_order_dto($order, $calculated_result, $dto, $context, $exchange_rate);
            $this->order_service->update_order($order_dto);

            $order_with_items = $order->fresh('items');

            $this->sync_order_coupons($order_with_items, $calculated_result, $currency_code, $exchange_rate);
            $this->sync_order_taxes($order_with_items, $calculated_result, $currency_code, $exchange_rate);

            DB::commit();

            return $order->fresh('items', 'order_coupons.order_item_coupons');
        } catch (Throwable $e) {
            DB::rollback();
            throw $e;
        }
    }

    /**
     * Bring the order's items in line with the recalculated items.
     *
     * Adds new lines, refreshes every kept line from its variant, and removes lines no
     * longer sent. Stock moves only by the quantity difference of a kept line. A line
     * whose variant was deleted is removed with no stock to give back. Fails when stock is short.
     *
     * @since 1.0.0
     *
     * @param Order                $order             Order with its items loaded.
     * @param CalculationResultDTO $calculated_result Recalculated totals and items.
     * @param string               $currency_code     Order currency code.
     * @param float                $exchange_rate     Rate from the base currency to the order currency.
     * @return void
     * @throws \Exception When stock is short for a new or increased item quantity.
     */
    protected function sync_order_items(Order $order, CalculationResultDTO $calculated_result, string $currency_code, float $exchange_rate)
    {
        $existing_items_map = [];

        foreach ($order->items as $item) {
            if (empty($item->variant_id)) {
                $this->order_service->delete_order_item($item->id);
                continue;
            }

            $existing_items_map[$item->variant_id] = $item;
        }

        foreach ($calculated_result->items as $variant_id => $calculated_item) {
            $existing_item = $existing_items_map[$variant_id] ?? null;

            if (!$existing_item) {
                /* translators: %s: variant ID */
                throw_if(!$this->inventory_service->has_stock($variant_id, $calculated_item->quantity), sprintf(__('Not enough stock for variant: %s', 'kirki-ecommerce'), $variant_id));

                $this->order_service->create_order_item($this->fill_order_item_dto(new CreateOrderItemDTO(), $order->id, $calculated_item, $currency_code, $exchange_rate));
                $this->inventory_service->reserve_stock($variant_id, $calculated_item->quantity);
                continue;
            }

            unset($existing_items_map[$variant_id]);

            $diff = $calculated_item->quantity - $existing_item->quantity;

            /* translators: %s: variant ID */
            throw_if($diff > 0 && !$this->inventory_service->has_stock($variant_id, $diff), sprintf(__('Not enough stock for variant: %s', 'kirki-ecommerce'), $variant_id));

            if ($diff > 0) {
                $this->inventory_service->reserve_stock($variant_id, $diff);
            } elseif ($diff < 0) {
                $this->inventory_service->release_reserved_stock($variant_id, abs($diff));
            }

            $item_dto = $this->fill_order_item_dto(new UpdateOrderItemDTO(), $order->id, $calculated_item, $currency_code, $exchange_rate);
            $item_dto->id = $existing_item->id;

            $this->order_service->update_order_item($item_dto);
        }

        foreach ($existing_items_map as $variant_id => $removed_item) {
            $this->inventory_service->release_reserved_stock($variant_id, $removed_item->quantity);
            $this->order_service->delete_order_item($removed_item->id);
        }
    }

    /**
     * Build the order update DTO from the recalculated totals and payload.
     *
     * Stores every amount both in the base currency and converted to the order's currency.
     *
     * @since 1.0.0
     *
     * @param Order                 $order             Order being updated.
     * @param CalculationResultDTO  $calculated_result Recalculated totals.
     * @param UpdateOrderPayloadDTO $dto               Update payload.
     * @param CalculationContextDTO $context           Calculation context used for the totals.
     * @param float                 $exchange_rate     Rate from the base currency to the order currency.
     * @return UpdateOrderDTO Order data ready to persist.
     */
    protected function prepare_update_order_dto($order, CalculationResultDTO $calculated_result, UpdateOrderPayloadDTO $dto, CalculationContextDTO $context, float $exchange_rate)
    {
        $order_dto = new UpdateOrderDTO();
        $order_dto->id = $order->id;
        $order_dto->uuid = $order->uuid;
        $order_dto->order_number = $order->order_number;
        $order_dto->customer_id = $context->customer_id ?: null;
        $order_dto->is_manual = $dto->is_manual;

        $order_dto->currency_code = $order->currency_code;
        $order_dto->base_currency_code = $this->base_currency_code;
        $order_dto->exchange_rate = $exchange_rate;

        $order_dto->invoiced_subtotal = $this->convert_amount($calculated_result->base_subtotal, $order->currency_code, $order_dto->exchange_rate);
        $order_dto->base_subtotal = $calculated_result->base_subtotal;

        $order_dto->invoiced_shipping_total = $this->convert_amount($calculated_result->base_shipping_total, $order->currency_code, $order_dto->exchange_rate);
        $order_dto->base_shipping_total = $calculated_result->base_shipping_total;

        $order_dto->invoiced_discount_total = $this->convert_amount($calculated_result->base_discount_total, $order->currency_code, $order_dto->exchange_rate);
        $order_dto->base_discount_total = $calculated_result->base_discount_total;

        $order_dto->invoiced_tax_total = $this->convert_amount($calculated_result->base_tax_total, $order->currency_code, $order_dto->exchange_rate);
        $order_dto->base_tax_total = $calculated_result->base_tax_total;

        $order_dto->invoiced_shipping_tax_amount = $this->convert_amount($calculated_result->base_shipping_tax, $order->currency_code, $order_dto->exchange_rate);
        $order_dto->base_shipping_tax_amount = $calculated_result->base_shipping_tax;

        $order_dto->is_tax_inclusive = Tax::is_tax_inclusive();
        $order_dto->tax_destination = $calculated_result->tax_destination;

        $order_dto->invoiced_total = $this->convert_amount($calculated_result->base_total, $order->currency_code, $order_dto->exchange_rate);
        $order_dto->base_total = $calculated_result->base_total;

        $order_dto->items_count = $calculated_result->items_count;

        $order_dto->shipping_method = $dto->shipping_method;
        $order_dto->shipping_metadata = $this->shipping_service->get_selected_shipping_method_snapshot($context);

        $order_dto->shipping_first_name = $dto->shipping_first_name;
        $order_dto->shipping_last_name = $dto->shipping_last_name;
        $order_dto->shipping_address_line1 = $dto->shipping_address_line1;
        $order_dto->shipping_address_line2 = $dto->shipping_address_line2;
        $order_dto->shipping_city = $dto->shipping_city;
        $order_dto->shipping_state = $dto->shipping_state;
        $order_dto->shipping_country = $dto->shipping_country;
        $order_dto->shipping_postal_code = $dto->shipping_postal_code;
        $order_dto->shipping_phone = $dto->shipping_phone;
        $order_dto->shipping_email = $dto->shipping_email;
        $order_dto->shipping_company = $dto->shipping_company;

        $order_dto->billing_first_name = $dto->billing_first_name;
        $order_dto->billing_last_name = $dto->billing_last_name;
        $order_dto->billing_address_line1 = $dto->billing_address_line1;
        $order_dto->billing_address_line2 = $dto->billing_address_line2;
        $order_dto->billing_city = $dto->billing_city;
        $order_dto->billing_state = $dto->billing_state;
        $order_dto->billing_country = $dto->billing_country;
        $order_dto->billing_postal_code = $dto->billing_postal_code;
        $order_dto->billing_phone = $dto->billing_phone;
        $order_dto->billing_email = $dto->billing_email;
        $order_dto->billing_company = $dto->billing_company;

        $order_dto->customer_first_name = $dto->customer_first_name;
        $order_dto->customer_last_name = $dto->customer_last_name;
        $order_dto->customer_email = $dto->customer_email;
        $order_dto->customer_phone = $dto->customer_phone;
        $order_dto->order_notes = $dto->order_notes;
        $order_dto->flags = $dto->flags;

        return $order_dto;
    }

    /**
     * Fill an order item DTO from its variant's current data and the recalculated item.
     *
     * New and kept lines are filled alike, so a kept line takes a fresh snapshot of its
     * product and variant along with its current prices. Amounts are stored in both the
     * base and the order currency.
     *
     * @since 1.0.0
     *
     * @param CreateOrderItemDTO|UpdateOrderItemDTO $item_dto        DTO to fill.
     * @param int                                   $order_id        ID of the order the item belongs to.
     * @param CalculationItemDTO                    $calculated_item Recalculated item.
     * @param string                                $currency_code   Order currency code.
     * @param float                                 $exchange_rate   Rate from the base currency to the order currency.
     * @return CreateOrderItemDTO|UpdateOrderItemDTO The filled DTO.
     */
    protected function fill_order_item_dto($item_dto, int $order_id, CalculationItemDTO $calculated_item, $currency_code, $exchange_rate)
    {
        $variant = $this->context_builder->get_variants_map()[$calculated_item->variant_id];
        $product = $variant->product;
        $product->load_missing('media');

        $first_media = !empty($product->media) ? $product->media->first() : null;

        $item_dto->order_id = $order_id;
        $item_dto->product_id = $product->id;
        $item_dto->variant_id = $variant->id;
        $item_dto->product_name = $product->title;
        $item_dto->variant_name = $variant->attribute_values ? $variant->attribute_values->pluck('value')->join(', ') : '';
        $item_dto->sku = $variant->sku;
        $item_dto->barcode = $variant->barcode;
        $item_dto->product_image = $variant->media ?? ($first_media ? $first_media->id : null);

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
     * Get the exchange rate an edit converts the order's amounts with.
     *
     * An edit uses the current rate. Return `$order->exchange_rate` here to keep the rate the order was placed at.
     *
     * @since 1.0.0
     *
     * @param Order $order Order being edited.
     * @return float Rate from the base currency to the order currency.
     */
    protected function resolve_exchange_rate(Order $order)
    {
        return Currency::exchange_rate($order->currency_code);
    }

    /**
     * Convert a base currency minor amount into the target currency.
     *
     * @since 1.0.0
     *
     * @param int    $amount               Amount in base currency minor units.
     * @param string $target_currency_code Currency to convert to.
     * @param float  $exchange_rate        Rate from the base currency to the target currency.
     * @return int Amount in the target currency's minor units; unchanged when the target is the base currency.
     */
    protected function convert_amount($amount, $target_currency_code, $exchange_rate)
    {
        if ($target_currency_code === $this->base_currency_code) {
            return $amount;
        }

        return Money::convert_to_currency(Money::from_minor($amount, $this->base_currency_code), $target_currency_code, $exchange_rate)->getMinorAmount()->toInt();
    }
}
