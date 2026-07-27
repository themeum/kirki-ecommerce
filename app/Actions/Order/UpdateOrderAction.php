<?php

namespace Kirki\Ecommerce\App\Actions\Order;

use Kirki\Ecommerce\App\Actions\Cart\RecalculateCartAction;
use Kirki\Ecommerce\App\Models\Order;
use Kirki\Ecommerce\App\Models\OrderItem;
use Kirki\Ecommerce\App\Services\InventoryService;
use Kirki\Ecommerce\App\Services\OrderService;
use Kirki\Ecommerce\App\Services\ShippingService;
use Kirki\Ecommerce\App\Services\VariantService;
use Kirki\Ecommerce\App\Constants\Order\OrderStatus;
use Kirki\Ecommerce\App\DTO\Calculation\CalculationContextDTO;
use Kirki\Ecommerce\App\DTO\Calculation\CalculationItemDTO;
use Kirki\Ecommerce\App\DTO\Order\CreateOrderItemDTO;
use Kirki\Ecommerce\App\DTO\Order\UpdateOrderDTO;
use Kirki\Ecommerce\App\DTO\Order\UpdateOrderItemDTO;
use Kirki\Ecommerce\App\DTO\Order\UpdateOrderPayloadDTO;
use Kirki\Ecommerce\App\DTO\Calculation\CalculationResultDTO;
use Kirki\Ecommerce\Supports\Arr;
use Kirki\Ecommerce\Supports\Currency;
use Kirki\Ecommerce\App\Facades\Money;
use Kirki\Ecommerce\Supports\Facades\DB;
use Exception;
use Throwable;

use function Kirki\Ecommerce\base_currency;
use function Kirki\Ecommerce\collection;

class UpdateOrderAction
{
    protected $recalculate_cart_action;
    protected $variant_service;
    protected $order_service;
    protected $inventory_service;
    protected $shipping_service;
    protected $variants_map = [];
    protected $base_currency_code;

    public function __construct(
        RecalculateCartAction $recalculate_cart_action,
        VariantService $variant_service,
        OrderService $order_service,
        InventoryService $inventory_service,
        ShippingService $shippingService
    ) {
        $this->recalculate_cart_action = $recalculate_cart_action;
        $this->variant_service = $variant_service;
        $this->order_service = $order_service;
        $this->inventory_service = $inventory_service;
        $this->shipping_service = $shippingService;
        $this->base_currency_code = base_currency()->code;
    }

    public function execute(UpdateOrderPayloadDTO $dto)
    {
        // @todo Should we allow to edit the order if its status is cancelled or refunded?
        $order = $this->order_service->find_order_or_fail($dto->id);
        $context = $this->prepare_calculation_context_dto($dto);

        if (!$this->shipping_service->has_valid_shipping_method($context)) {
            throw new Exception(__('Invalid shipping method', 'kirki-ecommerce'));
        }

        $calculated_result = $this->recalculate_cart_action->execute($context);

        DB::begin_transaction();

        try {
            $exchange_rate = Currency::exchange_rate($dto->currency_code);
            $this->sync_order_items($order, $calculated_result, $dto->currency_code, $exchange_rate);

            $order_dto = $this->prepare_update_order_dto($order, $calculated_result, $dto, $context, $exchange_rate);
            $this->order_service->update_order($order_dto);
            $order->fresh('items');

            if (in_array($order_dto->order_status, [OrderStatus::CANCELLED, OrderStatus::REFUNDED], true)) {
                $order->coupon_usage->delete();
                $this->inventory_service->release_all_reserved_stock($order);
            }

            if ($order_dto->order_status === OrderStatus::COMPLETED) {
                $this->inventory_service->confirm_all_reserved_stock($order);
            }

            DB::commit();

            return $order->fresh('items');
        } catch (Throwable $e) {
            DB::rollback();
            throw $e;
        }
    }

    protected function sync_order_items(Order $order, CalculationResultDTO $calculated_result, string $currency_code, float $exchange_rate)
    {
        $existing_items_map = [];
        $order->items->each(function ($item) use (&$existing_items_map) {
            $existing_items_map[$item->variant_id] = $item;
        });

        $processed_variant_ids = [];

        foreach ($calculated_result->items as $variant_id => $calculated_item) {
            $processed_variant_ids[] = $variant_id;

            if (isset($existing_items_map[$variant_id])) {
                $existing_item = $existing_items_map[$variant_id];
                $old_quantity = $existing_item->quantity;
                $new_quantity = $calculated_item->quantity;
                $diff = $new_quantity - $old_quantity;

                if ($new_quantity === 0) {
                    $this->order_service->delete_order_item($existing_item->id);
                    $this->inventory_service->release_reserved_stock($variant_id, $old_quantity);
                    continue;
                }

                if ($diff > 0 && !$this->inventory_service->has_stock($variant_id, $diff)) {
                    throw new Exception(sprintf(__('Not enough stock for variant: %s', 'kirki-ecommerce'), $variant_id));
                }

                if ($diff < 0) {
                    $this->inventory_service->release_reserved_stock($variant_id, abs($diff));
                } else {
                    $this->inventory_service->reserve_stock($variant_id, $diff);
                }

                $item_update_dto = $this->prepare_update_order_item_dto($existing_item, $calculated_item, $currency_code, $exchange_rate);

                $this->order_service->update_order_item($item_update_dto);
            } else {
                if (!$this->inventory_service->has_stock($variant_id, $calculated_item->quantity)) {
                    throw new Exception(sprintf(__('Not enough stock for variant: %s', 'kirki-ecommerce'), $variant_id));
                }

                $item_create_dto = $this->prepare_order_item_dto($order->id, $calculated_item, $currency_code, $exchange_rate);
                $this->order_service->create_order_item($item_create_dto);
                $this->inventory_service->reserve_stock($variant_id, $calculated_item->quantity);
            }
        }

        foreach ($order->items as $existing_item) {
            if (!in_array($existing_item->variant_id, $processed_variant_ids)) {
                $this->inventory_service->release_reserved_stock($existing_item->variant_id, $existing_item->quantity);
                $this->order_service->delete_order_item($existing_item->id);
            }
        }
    }

    protected function prepare_update_order_dto($order, CalculationResultDTO $calculated_result, UpdateOrderPayloadDTO $dto, CalculationContextDTO $context, float $exchange_rate)
    {
        $order_dto = new UpdateOrderDTO();
        $order_dto->id = $order->id;
        $order_dto->uuid = $order->uuid;
        $order_dto->order_number = $order->order_number;
        $order_dto->customer_id = $context->customer_id;
        $order_dto->order_status = $dto->order_status;
        $order_dto->is_manual = $dto->is_manual;

        $order_dto->currency_code = $dto->currency_code;
        $order_dto->base_currency_code = $this->base_currency_code;
        $order_dto->exchange_rate = $exchange_rate;

        $order_dto->subtotal = $this->convert_amount($calculated_result->subtotal, $dto->currency_code, $order_dto->exchange_rate);
        $order_dto->subtotal_base = $calculated_result->subtotal;

        $order_dto->shipping_total = $this->convert_amount($calculated_result->shipping_total, $dto->currency_code, $order_dto->exchange_rate);
        $order_dto->shipping_total_base = $calculated_result->shipping_total;

        $order_dto->discount_total = $this->convert_amount($calculated_result->discount_total, $dto->currency_code, $order_dto->exchange_rate);
        $order_dto->discount_total_base = $calculated_result->discount_total;
        $order_dto->discount_details = $calculated_result->discount_details;

        $order_dto->tax_total = $this->convert_amount($calculated_result->tax_total, $dto->currency_code, $order_dto->exchange_rate);
        $order_dto->tax_total_base = $calculated_result->tax_total;

        $order_dto->total = $this->convert_amount($calculated_result->total, $dto->currency_code, $order_dto->exchange_rate);
        $order_dto->total_base = $calculated_result->total;

        $order_dto->items_count = $calculated_result->items_count;

        $order_dto->payment_status = $dto->payment_status;
        $order_dto->payment_method = $dto->payment_method;
        $order_dto->shipping_method = $dto->shipping_method;

        $order_dto->shipping_first_name = $dto->shipping_first_name;
        $order_dto->shipping_last_name = $dto->shipping_last_name;
        $order_dto->shipping_address_line1 = $dto->shipping_address_line1;
        $order_dto->shipping_address_line2 = $dto->shipping_address_line2;
        $order_dto->shipping_city = $dto->shipping_city;
        $order_dto->shipping_state = $dto->shipping_state;
        $order_dto->shipping_country = $dto->shipping_country;
        $order_dto->shipping_postal_code = $dto->shipping_postcode;
        $order_dto->shipping_phone = $dto->shipping_phone;
        $order_dto->shipping_email = $dto->shipping_email;

        $order_dto->billing_first_name = $dto->billing_first_name;
        $order_dto->billing_last_name = $dto->billing_last_name;
        $order_dto->billing_address_line1 = $dto->billing_address_line1;
        $order_dto->billing_address_line2 = $dto->billing_address_line2;
        $order_dto->billing_city = $dto->billing_city;
        $order_dto->billing_state = $dto->billing_state;
        $order_dto->billing_country = $dto->billing_country;
        $order_dto->billing_postal_code = $dto->billing_postcode;
        $order_dto->billing_phone = $dto->billing_phone;
        $order_dto->billing_email = $dto->billing_email;
        $order_dto->billing_company = $dto->billing_company;

        $order_dto->customer_email = $dto->customer_email;
        $order_dto->customer_phone = $dto->customer_phone;
        $order_dto->customer_notes = $dto->customer_notes;

        return $order_dto;
    }

    protected function prepare_calculation_context_dto(UpdateOrderPayloadDTO $dto)
    {
        $context = new CalculationContextDTO();
        $context->customer_id = $dto->customer_id;
        $context->shipping_address = [
            'first_name' => $dto->shipping_first_name,
            'last_name' => $dto->shipping_last_name,
            'address_line1' => $dto->shipping_address_line1,
            'address_line2' => $dto->shipping_address_line2,
            'city' => $dto->shipping_city,
            'state' => $dto->shipping_state,
            'postcode' => $dto->shipping_postcode,
            'country' => $dto->shipping_country,
        ];
        $context->coupon = $dto->coupon_code ?? null;
        $context->shipping_method_id = $dto->shipping_method ?? null;

        $context->items = $this->prepare_context_items($dto);

        return $context;
    }

    protected function prepare_context_items(UpdateOrderPayloadDTO $dto)
    {
        $items = collection();

        foreach ($dto->items as $item_data) {
            $variant = $this->variant_service->find($item_data['variant_id']);

            if (!$variant) {
                throw new Exception("Variant not found for item: " . Arr::json_encode($item_data));
            }

            $product = $variant->product->load('categories');

            $this->variants_map[$variant->id] = $variant;

            $item_dto = new CalculationItemDTO();
            $item_dto->variant_id = $variant->id;
            $item_dto->product_id = $product->id;
            $item_dto->quantity = $item_data['quantity'];
            $item_dto->unit_price = $variant->sale_price ?: $variant->price;
            $item_dto->weight = $variant->weight;
            $item_dto->shipping_profile_id = $variant->shipping_profile_id;
            $item_dto->product_categories = $product->categories->pluck('id')->to_array();

            $items->push($item_dto);
        }

        return $items;
    }

    protected function prepare_order_item_dto(int $order_id, CalculationItemDTO $calculated_item, $currency_code, $exchange_rate)
    {
        $variant = $this->variants_map[$calculated_item->variant_id];
        $product = $variant->product;

        $item_dto = new CreateOrderItemDTO();
        $item_dto->order_id = $order_id;
        $item_dto->product_id = $product->id;
        $item_dto->variant_id = $variant->id;
        $item_dto->product_name = $product->title;
        $item_dto->variant_name = $variant->attribute_values->pluck('value')->join(', ');
        $item_dto->sku = $variant->sku;
        $item_dto->barcode = $variant->barcode;
        $item_dto->product_image = $variant->media ?? $product->media->first()->id;

        $item_dto->price = $this->convert_amount($variant->sale_price ?: $variant->price, $currency_code, $exchange_rate);
        $item_dto->price_base = $variant->sale_price ?: $variant->price;

        $item_dto->quantity = $calculated_item->quantity;

        $item_dto->subtotal = $this->convert_amount($calculated_item->subtotal, $currency_code, $exchange_rate);
        $item_dto->subtotal_base = $calculated_item->subtotal;

        $item_dto->discount_amount = $this->convert_amount($calculated_item->discount_amount, $currency_code, $exchange_rate);
        $item_dto->discount_amount_base = $calculated_item->discount_amount;

        $item_dto->tax_total = $this->convert_amount($calculated_item->tax_amount, $currency_code, $exchange_rate);
        $item_dto->tax_total_base = $calculated_item->tax_amount;
        $item_dto->tax_rate = $calculated_item->tax_rate;

        $item_dto->total = $this->convert_amount($calculated_item->total, $currency_code, $exchange_rate);
        $item_dto->total_base = $calculated_item->total;

        $item_dto->is_physical_product = $variant->is_physical_product ?? true;
        $item_dto->weight = $variant->weight;
        $item_dto->weight_unit = $variant->weight_unit;

        $item_dto->product_data = [
            'product' => $product->to_array(),
            'variant' => $variant->to_array()
        ];

        return $item_dto;
    }

    protected function prepare_update_order_item_dto(OrderItem $existing_item, CalculationItemDTO $calculated_item, $currency_code, $exchange_rate)
    {
        $item_dto = new UpdateOrderItemDTO();
        $item_dto->id = $existing_item->id;
        $item_dto->order_id = $existing_item->order_id;
        $item_dto->product_id = $existing_item->product_id;
        $item_dto->variant_id = $existing_item->variant_id;
        $item_dto->product_name = $existing_item->product_name;
        $item_dto->variant_name = $existing_item->variant_name;
        $item_dto->sku = $existing_item->sku;
        $item_dto->barcode = $existing_item->barcode;
        $item_dto->product_image = $existing_item->product_image;

        $item_dto->price = $existing_item->price;
        $item_dto->price_base = $existing_item->price_base;

        $item_dto->quantity = $calculated_item->quantity;

        $item_dto->subtotal = $this->convert_amount($calculated_item->subtotal, $currency_code, $exchange_rate);
        $item_dto->subtotal_base = $calculated_item->subtotal;

        $item_dto->discount_amount = $this->convert_amount($calculated_item->discount_amount, $currency_code, $exchange_rate);
        $item_dto->discount_amount_base = $calculated_item->discount_amount;

        $item_dto->tax_total = $this->convert_amount($calculated_item->tax_amount, $currency_code, $exchange_rate);
        $item_dto->tax_total_base = $calculated_item->tax_amount;
        $item_dto->tax_rate = $calculated_item->tax_rate;

        $item_dto->total = $this->convert_amount($calculated_item->total, $currency_code, $exchange_rate);
        $item_dto->total_base = $calculated_item->total;

        $item_dto->is_physical_product = $existing_item->is_physical_product;
        $item_dto->weight = $existing_item->weight;
        $item_dto->weight_unit = $existing_item->weight_unit;

        $item_dto->product_data = $existing_item->product_data;

        return $item_dto;
    }

    protected function convert_amount($amount, $target_currency_code, $exchange_rate)
    {
        if ($target_currency_code === $this->base_currency_code) {
            return $amount;
        }

        return Money::convert_to_currency(Money::from_minor($amount, $this->base_currency_code), $target_currency_code, $exchange_rate)->getMinorAmount()->toInt();
    }
}
