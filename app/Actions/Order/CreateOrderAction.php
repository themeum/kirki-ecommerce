<?php

namespace Kirki\Ecommerce\App\Actions\Order;

use Kirki\Ecommerce\App\Actions\Customer\CreateCustomerAction;
use Kirki\Ecommerce\App\Services\CartService;
use Kirki\Ecommerce\App\Services\CouponService;
use Kirki\Ecommerce\App\Services\CustomerService;
use Kirki\Ecommerce\App\Services\InventoryService;
use Kirki\Ecommerce\App\Services\OrderService;
use Kirki\Ecommerce\App\Services\ShippingService;
use Kirki\Ecommerce\App\Services\VariantService;
use Kirki\Ecommerce\App\Constants\Order\OrderStatus;
use Kirki\Ecommerce\App\Constants\Order\PaymentStatus;
use Kirki\Ecommerce\App\DTO\Address\CreateAddressDTO;
use Kirki\Ecommerce\App\DTO\Calculation\CalculationContextDTO;
use Kirki\Ecommerce\App\DTO\Calculation\CalculationItemDTO;
use Kirki\Ecommerce\App\DTO\Calculation\CalculationResultDTO;
use Kirki\Ecommerce\App\DTO\Cart\EmptyCartDTO;
use Kirki\Ecommerce\App\DTO\Customer\CreateCustomerDTO;
use Kirki\Ecommerce\App\DTO\Order\CreateOrderPayloadDTO;
use Kirki\Ecommerce\App\DTO\Order\CreateOrderDTO;
use Kirki\Ecommerce\App\DTO\Order\CreateOrderItemDTO;
use Kirki\Ecommerce\App\Actions\Cart\RecalculateCartAction;
use Kirki\Ecommerce\Framework\Exceptions\UniqueConstraintViolationException;
use Kirki\Ecommerce\Framework\Supports\Arr;
use Kirki\Ecommerce\App\Supports\Currency;
use Kirki\Ecommerce\App\Facades\Money;
use Kirki\Ecommerce\App\Payment\Facades\Payment;
use Exception;
use Kirki\Ecommerce\App\Constants\Order\FulfillmentStatus;
use Kirki\Ecommerce\Framework\Supports\Facades\DB;
use Throwable;

use function Kirki\Ecommerce\App\base_currency;
use function Kirki\Ecommerce\Framework\collection;
use function Kirki\Ecommerce\Framework\uuid;

class CreateOrderAction
{
    protected $recalculate_cart_action;
    protected $variant_service;
    protected $order_service;
    protected $inventory_service;
    protected $shipping_service;
    protected $coupon_service;
    protected $customer_service;
    protected $create_customer_action;
    protected $cart_service;
    protected $variants_map = [];
    protected $base_currency_code;

    public function __construct(
        RecalculateCartAction $recalculate_cart_action,
        VariantService $variant_service,
        OrderService $order_service,
        InventoryService $inventory_service,
        ShippingService $shipping_service,
        CouponService $coupon_service,
        CustomerService $customer_service,
        CreateCustomerAction $create_customer_action,
        CartService $cart_service
    ) {
        $this->recalculate_cart_action = $recalculate_cart_action;
        $this->variant_service = $variant_service;
        $this->order_service = $order_service;
        $this->inventory_service = $inventory_service;
        $this->shipping_service = $shipping_service;
        $this->coupon_service = $coupon_service;
        $this->customer_service = $customer_service;
        $this->create_customer_action = $create_customer_action;
        $this->cart_service = $cart_service;

        $this->base_currency_code = base_currency()->code;
    }

    public function execute(CreateOrderPayloadDTO $dto)
    {
        if (empty($dto->customer_id) && !$dto->is_manual && !empty($dto->created_by)) {
            $dto->customer_id = $this->resolve_checkout_customer_id($dto);
        }

        $context = $this->prepare_calculation_context_dto($dto);

        if (!$this->shipping_service->has_valid_shipping_method($context)) {
            throw new Exception(__('Invalid shipping method', 'kirki-ecommerce'));
        }

        $calculated_result = $this->recalculate_cart_action->execute($context);
        $create_order_dto = $this->prepare_create_order_dto($calculated_result, $dto, $context);

        DB::begin_transaction();

        try {
            $order = $this->order_service->create_order($create_order_dto);
            $coupon = !empty($order->discount_details) ? $this->coupon_service->find($order->discount_details['id']) : null;

            if ($coupon) {
                $coupon->usage()->create([
                    'order_id' => $order->id,
                    'customer_id' => $create_order_dto->customer_id,
                ]);
            }

            foreach ($dto->items as $item_data) {
                $order_item_dto = $this->prepare_order_item_dto($order->id, $calculated_result->items[$item_data['variant_id']], $dto->currency_code, $order->exchange_rate);

                if (!$this->inventory_service->has_stock($order_item_dto->variant_id, $order_item_dto->quantity)) {
                    throw new Exception(sprintf(__('Not enough stock for variant: %s', 'kirki-ecommerce'), $order_item_dto->variant_id));
                }

                $this->order_service->create_order_item($order_item_dto);
                $this->inventory_service->reserve_stock($order_item_dto->variant_id, $order_item_dto->quantity);
            }

            if (!empty($create_order_dto->customer_id) || !empty($dto->cart_token)) {
                $empty_cart_dto = new EmptyCartDTO();
                $empty_cart_dto->customer_id = $create_order_dto->customer_id;
                $empty_cart_dto->token = $dto->cart_token;

                $this->cart_service->empty_cart($empty_cart_dto);
            }

            DB::commit();

            return $order->fresh('items');
        } catch (Throwable $e) {
            DB::rollback();
            throw $e;
        }
    }

    /**
     * Resolve the customer_id to link a checkout order to, provisioning a
     * Customer record (with addresses) for the authenticated user placing
     * the order if one doesn't already exist for their WordPress user_id.
     *
     * @param CreateOrderPayloadDTO $dto
     * @return int
     */
    protected function resolve_checkout_customer_id(CreateOrderPayloadDTO $dto)
    {
        try {
            $customer = $this->create_customer_action->execute(
                $this->prepare_checkout_customer_dto($dto),
                $this->prepare_checkout_address_dto($dto, 'shipping'),
                $this->prepare_checkout_address_dto($dto, 'billing')
            );

            return $customer->id;
        } catch (UniqueConstraintViolationException $e) {
            $customer = $this->customer_service->find_by_user_id($dto->created_by);

            if (empty($customer)) {
                throw $e;
            }

            return $customer->id;
        }
    }

    protected function prepare_checkout_customer_dto(CreateOrderPayloadDTO $dto)
    {
        $wp_user = get_userdata($dto->created_by) ?: null;

        $customer_payload = new CreateCustomerDTO();
        $customer_payload->user_id = $dto->created_by;
        $customer_payload->first_name = !empty($wp_user->first_name) ? $wp_user->first_name : $dto->billing_first_name;
        $customer_payload->last_name = !empty($wp_user->last_name) ? $wp_user->last_name : $dto->billing_last_name;
        $customer_payload->email = !empty($wp_user->user_email) ? $wp_user->user_email : $dto->billing_email;
        $customer_payload->phone = !empty($wp_user->phone) ? $wp_user->phone : $dto->billing_phone;
        $customer_payload->is_billing_same_as_shipping = (bool) $dto->is_billing_same_as_shipping;

        return $customer_payload;
    }

    /**
     * Resolve the order's customer contact snapshot from the placing
     * WordPress user's profile when they have an account, else billing.
     *
     * @param CreateOrderPayloadDTO $dto
     * @return array{first_name: ?string, last_name: ?string, email: ?string, phone: ?string}
     */
    protected function resolve_customer_contact_details(CreateOrderPayloadDTO $dto)
    {
        $wp_user = !empty($dto->created_by) ? (get_userdata($dto->created_by) ?: null) : null;

        return [
            'first_name' => !empty($wp_user->first_name) ? $wp_user->first_name : $dto->billing_first_name,
            'last_name' => !empty($wp_user->last_name) ? $wp_user->last_name : $dto->billing_last_name,
            'email' => !empty($wp_user->user_email) ? $wp_user->user_email : $dto->billing_email,
            'phone' => !empty($wp_user->phone) ? $wp_user->phone : $dto->billing_phone,
        ];
    }

    protected function prepare_checkout_address_dto(CreateOrderPayloadDTO $dto, string $prefix)
    {
        $address_payload = new CreateAddressDTO();
        $address_payload->first_name = $dto->{"{$prefix}_first_name"};
        $address_payload->last_name = $dto->{"{$prefix}_last_name"};
        $address_payload->address_line1 = $dto->{"{$prefix}_address_line1"};
        $address_payload->address_line2 = $dto->{"{$prefix}_address_line2"};
        $address_payload->city = $dto->{"{$prefix}_city"};
        $address_payload->state = $dto->{"{$prefix}_state"};
        $address_payload->country = $dto->{"{$prefix}_country"};
        $address_payload->postal_code = $dto->{"{$prefix}_postcode"};
        $address_payload->email = $dto->{"{$prefix}_email"};
        $address_payload->phone = $dto->{"{$prefix}_phone"};

        return $address_payload;
    }

    protected function prepare_calculation_context_dto(CreateOrderPayloadDTO $dto)
    {
        $context = new CalculationContextDTO();
        $context->customer_id = $dto->customer_id ?? 0;

        if ($context->customer_id) {
            $context->customer_order_count = $this->customer_service->find($context->customer_id)->orders()
                ->where_not_in('fulfillment_status', [FulfillmentStatus::CANCELLED, FulfillmentStatus::RETURNED])
                ->count();
        }

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

    protected function prepare_context_items(CreateOrderPayloadDTO $dto)
    {
        $items = collection();

        foreach ($dto->items as $item_data) {
            $variant = $this->variant_service->find($item_data['variant_id']);

            if (!$variant) {
                throw new Exception("Variant not found for item: " . Arr::json_encode($item_data));
            }

            if ($variant->has_limit_per_order && $variant->max_per_order < $item_data['quantity']) {
                throw new Exception(sprintf(__('Max per order limit exceeded for variant: %s', 'kirki-ecommerce'), $variant->id));
            }

            $product = $variant->product;

            if (empty($product)) {
                throw new Exception(sprintf(__('Product not found for variant: %s', 'kirki-ecommerce'), $variant->id));
            }

            $product->load('categories');

            $this->variants_map[$variant->id] = $variant;

            $item_dto = new CalculationItemDTO();
            $item_dto->variant_id = $variant->id;
            $item_dto->product_id = $product->id;
            $item_dto->quantity = $item_data['quantity'];
            $item_dto->base_unit_price = $variant->base_sale_price ?: $variant->base_price;
            $item_dto->weight = $variant->weight;
            $item_dto->shipping_profile_id = $variant->shipping_profile_id;
            $item_dto->product_categories = $product->categories->pluck('id')->all();

            $items->push($item_dto);
        }

        return $items;
    }

    protected function prepare_create_order_dto(CalculationResultDTO $calculated_result, CreateOrderPayloadDTO $dto, CalculationContextDTO $context)
    {
        $target_currency_code = $dto->currency_code;
        $order_dto = new CreateOrderDTO();
        $order_dto->uuid = uuid();
        $order_dto->order_number = 'ORD-' . strtoupper(uniqid()); // TODO: get from settings
        $order_dto->customer_id = $context->customer_id ?: null;
        $order_dto->fulfillment_status = FulfillmentStatus::UNFULFILLED;
        $order_dto->order_status = OrderStatus::PENDING;
        $order_dto->is_manual = $dto->is_manual;

        $order_dto->currency_code = $target_currency_code;
        $order_dto->base_currency_code = $this->base_currency_code;
        $order_dto->exchange_rate = Currency::exchange_rate($target_currency_code);

        $order_dto->invoiced_subtotal = $this->convert_amount($calculated_result->base_subtotal, $target_currency_code, $order_dto->exchange_rate);
        $order_dto->base_subtotal = $calculated_result->base_subtotal;

        $order_dto->invoiced_shipping_total = $this->convert_amount($calculated_result->base_shipping_total, $target_currency_code, $order_dto->exchange_rate);
        $order_dto->base_shipping_total = $calculated_result->base_shipping_total;

        $order_dto->invoiced_discount_total = $this->convert_amount($calculated_result->base_discount_total, $target_currency_code, $order_dto->exchange_rate);
        $order_dto->base_discount_total = $calculated_result->base_discount_total;
        $order_dto->discount_details = $calculated_result->discount_details;

        $order_dto->invoiced_tax_total = $this->convert_amount($calculated_result->base_tax_total, $target_currency_code, $order_dto->exchange_rate);
        $order_dto->base_tax_total = $calculated_result->base_tax_total;

        $order_dto->invoiced_total = $this->convert_amount($calculated_result->base_total, $target_currency_code, $order_dto->exchange_rate);
        $order_dto->base_total = $calculated_result->base_total;

        $order_dto->items_count = $calculated_result->items_count;

        $order_dto->payment_status = PaymentStatus::UNPAID;
        $order_dto->payment_provider = $dto->payment_provider;
        $order_dto->payment_metadata = $this->build_payment_provider_snapshot($dto->payment_provider);
        $order_dto->shipping_method = $dto->shipping_method;
        $order_dto->shipping_metadata = $this->build_shipping_method_snapshot($context);

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

        $customer_contact = $this->resolve_customer_contact_details($dto);
        $order_dto->customer_first_name = $customer_contact['first_name'];
        $order_dto->customer_last_name = $customer_contact['last_name'];
        $order_dto->customer_email = $customer_contact['email'];
        $order_dto->customer_phone = $customer_contact['phone'];
        $order_dto->customer_notes = $dto->customer_notes;
        $order_dto->admin_notes = $dto->admin_notes;
        $order_dto->ip_address = $dto->ip_address;
        $order_dto->user_agent = $dto->user_agent;
        $order_dto->created_by = $dto->created_by;

        return $order_dto;
    }

    protected function prepare_order_item_dto(int $order_id, CalculationItemDTO $calculated_item, $currency_code, $exchange_rate)
    {
        $variant = $this->variants_map[$calculated_item->variant_id];
        $product = $variant->product;

        if (empty($product)) {
            throw new Exception(sprintf(__('Product not found for variant: %s', 'kirki-ecommerce'), $variant->id));
        }

        $product->load('media');

        $first_media = !empty($product->media) ? $product->media->first() : null;

        $item_dto = new CreateOrderItemDTO();
        $item_dto->order_id = $order_id;
        $item_dto->product_id = $product->id;
        $item_dto->variant_id = $variant->id;
        $item_dto->product_name = $product->title;
        $item_dto->variant_name = $variant->attribute_values
            ? $variant->attribute_values->pluck('value')->join(', ')
            : '';
        $item_dto->sku = $variant->sku;
        $item_dto->barcode = $variant->barcode;
        $item_dto->product_image = $variant->media ?? ($first_media ? $first_media->id : null);

        $item_dto->invoiced_price = $this->convert_amount($variant->base_sale_price ?: $variant->base_price, $currency_code, $exchange_rate);
        $item_dto->base_price = $variant->base_sale_price ?: $variant->base_price;

        $item_dto->quantity = $calculated_item->quantity;

        $item_dto->invoiced_subtotal = $this->convert_amount($calculated_item->base_subtotal, $currency_code, $exchange_rate);
        $item_dto->base_subtotal = $calculated_item->base_subtotal;

        $item_dto->invoiced_discount_amount = $this->convert_amount($calculated_item->base_discount_amount, $currency_code, $exchange_rate);
        $item_dto->base_discount_amount = $calculated_item->base_discount_amount;

        $item_dto->invoiced_tax_total = $this->convert_amount($calculated_item->base_tax_amount, $currency_code, $exchange_rate);
        $item_dto->base_tax_total = $calculated_item->base_tax_amount;
        $item_dto->tax_rate = $calculated_item->tax_rate;
        $item_dto->tax_breakdown = $calculated_item->tax_breakdown;

        $item_dto->invoiced_total = $this->convert_amount($calculated_item->base_total, $currency_code, $exchange_rate);
        $item_dto->base_total = $calculated_item->base_total;

        $item_dto->is_physical_product = $variant->is_physical_product ?? true;
        $item_dto->weight = $variant->weight;
        $item_dto->weight_unit = $variant->weight_unit;

        $item_dto->product_data = [
            'product' => $product->to_array(),
            'variant' => $variant->to_array()
        ];

        return $item_dto;
    }

    protected function convert_amount($amount, $target_currency_code, $exchange_rate)
    {
        if ($target_currency_code === $this->base_currency_code) {
            return $amount;
        }

        return Money::convert_to_currency(Money::from_minor($amount, $this->base_currency_code), $target_currency_code, $exchange_rate)->getMinorAmount()->toInt();
    }

    protected function build_payment_provider_snapshot($payment_provider_id)
    {
        $provider = Payment::get_provider($payment_provider_id);

        if (!$provider) {
            return null;
        }

        return [
            'payment_provider' => [
                'id' => $provider->id(),
                'name' => $provider->title(),
                'icon' => $provider->icon(),
                'is_offline' => $provider->is_offline(),
            ],
        ];
    }

    protected function build_shipping_method_snapshot(CalculationContextDTO $context)
    {
        $method = $this->shipping_service->get_selected_shipping_method($context);

        if (!$method) {
            return null;
        }

        return [
            'shipping_method' => [
                'id' => $method['id'],
                'name' => $method['name'],
                'type' => $method['type'],
            ],
        ];
    }
}
