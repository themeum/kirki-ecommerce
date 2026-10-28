<?php

namespace Kirki\Ecommerce\App\Actions\Order;

defined('ABSPATH') || exit;

use Kirki\Ecommerce\App\Actions\Cart\RecalculateCartAction;
use Kirki\Ecommerce\App\Concerns\PersistsOrderCoupons;
use Kirki\Ecommerce\App\Concerns\PersistsOrderTaxes;
use Kirki\Ecommerce\App\Concerns\PreparesOrderItems;
use Kirki\Ecommerce\App\Models\Order;
use Kirki\Ecommerce\App\Models\OrderItem;
use Kirki\Ecommerce\App\Services\CouponService;
use Kirki\Ecommerce\App\Services\InventoryService;
use Kirki\Ecommerce\App\Services\OrderCalculationContextService;
use Kirki\Ecommerce\App\Services\OrderService;
use Kirki\Ecommerce\App\Services\ShippingService;
use Kirki\Ecommerce\App\DTO\Calculation\CalculationContextDTO;
use Kirki\Ecommerce\App\DTO\Calculation\CalculationItemDTO;
use Kirki\Ecommerce\App\DTO\Order\CreateOrderItemDTO;
use Kirki\Ecommerce\App\DTO\Order\UpdateOrderDTO;
use Kirki\Ecommerce\App\DTO\Order\UpdateOrderItemDTO;
use Kirki\Ecommerce\App\DTO\Order\UpdateOrderPayloadDTO;
use Kirki\Ecommerce\App\DTO\Calculation\CalculationResultDTO;
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
 * An edit keeps what the customer was promised. Lines already on the order keep their
 * prices, stored coupons keep their terms, and the exchange rate, tax mode, shipping
 * charge and tax rates stay as stored. Only a new delivery address (or shipping method)
 * quotes shipping and tax again from the current settings.
 *
 * @since 1.0.0
 */
class UpdateOrderAction
{
    use PersistsOrderCoupons;
    use PersistsOrderTaxes;
    use PreparesOrderItems;

    /** Snapshot fields of an order item, written when the line is added and never rewritten by an edit. */
    const ITEM_SNAPSHOT_FIELDS = ['product_id', 'variant_id', 'product_name', 'variant_name', 'sku', 'barcode', 'product_image', 'is_physical_product', 'weight', 'weight_unit', 'product_data'];

    /** @var RecalculateCartAction */
    protected $recalculate_cart_action;

    /** @var OrderCalculationContextService */
    protected $context_service;

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
     * @param OrderCalculationContextService $context_service         Builds the calculation input from the payload.
     * @param OrderService                   $order_service           Order persistence service.
     * @param InventoryService               $inventory_service       Stock checks and reservation.
     * @param ShippingService                $shippingService         Shipping method validation.
     * @param CouponService                  $coupon_service          Coupon service.
     */
    public function __construct(
        RecalculateCartAction $recalculate_cart_action,
        OrderCalculationContextService $context_service,
        OrderService $order_service,
        InventoryService $inventory_service,
        ShippingService $shippingService,
        CouponService $coupon_service
    ) {
        $this->recalculate_cart_action = $recalculate_cart_action;
        $this->context_service = $context_service;
        $this->order_service = $order_service;
        $this->inventory_service = $inventory_service;
        $this->shipping_service = $shippingService;
        $this->coupon_service = $coupon_service;
        $this->base_currency_code = base_currency()->code;
    }

    /**
     * Update an order from the payload.
     *
     * Everything runs after the order is locked, in one transaction. Fails when the order
     * can no longer be edited, the currency is changed, the shipping method is invalid for
     * a new quote, a quantity rule is broken, or stock is short.
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

            $input = $dto->to_calculation_input();
            $context = $this->context_service->build($input, $order);

            $this->context_service->validate_edit($order, $input, $context);

            $calculated_result = $this->recalculate_cart_action->execute($context);
            $currency_code = $order->currency_code;
            $exchange_rate = (float) $order->exchange_rate;

            $order_items_by_line_key = $this->inventory_service->collect_stock_alerts(fn() => $this->sync_order_items($order, $calculated_result, $currency_code, $exchange_rate));

            $order_dto = $this->prepare_update_order_dto($order, $calculated_result, $dto, $context, $exchange_rate);
            $this->order_service->update_order($order_dto);

            $saved_order = $order->fresh();

            $this->sync_order_coupons($saved_order, $calculated_result, $order_items_by_line_key, $currency_code, $exchange_rate);
            $this->sync_order_taxes($saved_order, $calculated_result, $order_items_by_line_key, $currency_code, $exchange_rate);

            DB::commit();

            return $order->fresh('items', 'order_coupons.order_item_coupons');
        } catch (Throwable $e) {
            DB::rollback();
            throw $e;
        }
    }

    /**
     * Bring the order's items in line with the calculated items.
     *
     * A line already on the order is updated in place: its quantity and amounts change, and
     * its snapshot of the product stays. A new line gets a full snapshot of its variant as
     * it is now. A stored line that is no longer sent is removed. Stock moves only by the
     * quantity difference of a kept line, and a removed line gives its stock back unless
     * its variant was deleted. Fails when stock is short.
     *
     * @since 1.0.0
     *
     * @param Order                $order             Order with its items loaded.
     * @param CalculationResultDTO $calculated_result Calculated totals and items.
     * @param string               $currency_code     Order currency code.
     * @param float                $exchange_rate     Rate from the base currency to the order currency.
     * @return array<int|string, OrderItem> Saved items, keyed by the line key they were calculated under.
     * @throws ValidationException When stock is short for a new or increased item quantity.
     */
    protected function sync_order_items(Order $order, CalculationResultDTO $calculated_result, string $currency_code, float $exchange_rate)
    {
        $stored_items_by_id = [];

        foreach ($order->items as $stored_item) {
            $stored_items_by_id[$stored_item->id] = $stored_item;
        }

        $order_items_by_line_key = [];

        foreach ($calculated_result->items as $line_key => $calculated_item) {
            if ($calculated_item->order_item_id === null) {
                $order_items_by_line_key[$line_key] = $this->add_order_item($order, $calculated_item, $currency_code, $exchange_rate);
                continue;
            }

            $stored_item = $stored_items_by_id[$calculated_item->order_item_id];
            unset($stored_items_by_id[$calculated_item->order_item_id]);

            $this->update_order_item($order, $stored_item, $calculated_item, $currency_code, $exchange_rate);
            $order_items_by_line_key[$line_key] = $stored_item;
        }

        foreach ($stored_items_by_id as $removed_item) {
            if (!empty($removed_item->variant_id)) {
                $this->inventory_service->release_reserved_stock($removed_item->variant_id, $removed_item->quantity);
            }

            $this->order_service->delete_order_item($removed_item->id);
        }

        return $order_items_by_line_key;
    }

    /**
     * Add a line to the order and reserve its stock.
     *
     * @since 1.0.0
     *
     * @param Order              $order           Order the line is added to.
     * @param CalculationItemDTO $calculated_item Calculated item of the new line.
     * @param string             $currency_code   Order currency code.
     * @param float              $exchange_rate   Rate from the base currency to the order currency.
     * @return OrderItem The saved line.
     * @throws ValidationException When stock is short.
     */
    protected function add_order_item(Order $order, CalculationItemDTO $calculated_item, string $currency_code, float $exchange_rate)
    {
        /* translators: %s: variant ID */
        throw_if(!$this->inventory_service->has_stock($calculated_item->variant_id, $calculated_item->quantity), sprintf(__('Not enough stock for variant: %s', 'kirki-ecommerce'), $calculated_item->variant_id), ValidationException::class, Response::UNPROCESSABLE_ENTITY);

        $variant = $this->context_service->get_variants_map()[$calculated_item->variant_id];
        $item_dto = $this->fill_order_item_snapshot(new CreateOrderItemDTO(), $variant);
        $this->fill_order_item_amounts($item_dto, $order->id, $calculated_item, $currency_code, $exchange_rate);

        $order_item = $this->order_service->create_order_item($item_dto);
        $this->inventory_service->reserve_stock($calculated_item->variant_id, $calculated_item->quantity);

        return $order_item;
    }

    /**
     * Update a line already on the order and move its stock by the quantity difference.
     *
     * Only the quantity and the amounts are written. The context service has already refused
     * a quantity change on a line that is not reachable, so a stock move here always has a variant.
     *
     * @since 1.0.0
     *
     * @param Order              $order           Order the line is on.
     * @param OrderItem          $stored_item     Line as stored.
     * @param CalculationItemDTO $calculated_item Calculated item of the line.
     * @param string             $currency_code   Order currency code.
     * @param float              $exchange_rate   Rate from the base currency to the order currency.
     * @return void
     * @throws ValidationException When stock is short for an increased quantity.
     */
    protected function update_order_item(Order $order, OrderItem $stored_item, CalculationItemDTO $calculated_item, string $currency_code, float $exchange_rate)
    {
        $quantity_difference = $calculated_item->quantity - $stored_item->quantity;

        /* translators: %s: variant ID */
        throw_if($quantity_difference > 0 && !$this->inventory_service->has_stock($stored_item->variant_id, $quantity_difference), sprintf(__('Not enough stock for variant: %s', 'kirki-ecommerce'), $stored_item->variant_id), ValidationException::class, Response::UNPROCESSABLE_ENTITY);

        if ($quantity_difference > 0) {
            $this->inventory_service->reserve_stock($stored_item->variant_id, $quantity_difference);
        } elseif ($quantity_difference < 0) {
            $this->inventory_service->release_reserved_stock($stored_item->variant_id, abs($quantity_difference));
        }

        $item_dto = (new UpdateOrderItemDTO())->exclude(static::ITEM_SNAPSHOT_FIELDS);
        $this->fill_order_item_amounts($item_dto, $order->id, $calculated_item, $currency_code, $exchange_rate);
        $item_dto->id = $stored_item->id;

        $this->order_service->update_order_item($item_dto);
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

        $order_dto->is_tax_inclusive = $context->stored->is_tax_inclusive;
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
