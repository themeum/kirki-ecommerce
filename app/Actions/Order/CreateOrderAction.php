<?php

namespace Kirki\Ecommerce\App\Actions\Order;

use Kirki\Ecommerce\App\Actions\Customer\CreateCustomerAction;
use Kirki\Ecommerce\App\Concerns\PersistsOrderCoupons;
use Kirki\Ecommerce\App\Concerns\PersistsOrderTaxes;
use Kirki\Ecommerce\App\Constants\AddressPurpose;
use Kirki\Ecommerce\App\Constants\AddressType;
use Kirki\Ecommerce\App\DTO\Address\UpdateAddressDTO;
use Kirki\Ecommerce\App\Services\AddressService;
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
use Kirki\Ecommerce\Framework\Exceptions\NotFoundException;
use Kirki\Ecommerce\Framework\Exceptions\UniqueConstraintViolationException;
use Kirki\Ecommerce\Framework\Exceptions\ValidationException;
use Kirki\Ecommerce\Framework\Http\Response;
use Kirki\Ecommerce\Framework\Supports\Arr;
use Kirki\Ecommerce\App\Supports\Currency;
use Kirki\Ecommerce\App\Constants\Order\OrderActivityType;
use Kirki\Ecommerce\App\Facades\OrderActivity;
use Kirki\Ecommerce\App\Facades\Money;
use Kirki\Ecommerce\App\Payment\Facades\Payment;
use Kirki\Ecommerce\App\Constants\Order\FulfillmentStatus;
use Kirki\Ecommerce\App\Models\Address;
use Kirki\Ecommerce\App\Models\Order;
use Kirki\Ecommerce\Framework\Supports\Facades\DB;
use Throwable;

use function Kirki\Ecommerce\App\base_currency;
use function Kirki\Ecommerce\App\customer;
use function Kirki\Ecommerce\Framework\collection;
use function Kirki\Ecommerce\Framework\throw_if;
use function Kirki\Ecommerce\Framework\uuid;

/**
 * Places an order from a checkout or manual-order payload, reserving stock and persisting totals, coupons and taxes.
 *
 * @since 1.0.0
 */
class CreateOrderAction
{
    use PersistsOrderCoupons;
    use PersistsOrderTaxes;

    /** @var RecalculateCartAction */
    protected $recalculate_cart_action;

    /** @var VariantService */
    protected $variant_service;

    /** @var OrderService */
    protected $order_service;

    /** @var InventoryService */
    protected $inventory_service;

    /** @var ShippingService */
    protected $shipping_service;

    /** @var CouponService */
    protected $coupon_service;

    /** @var CustomerService */
    protected $customer_service;

    /** @var CreateCustomerAction */
    protected $create_customer_action;

    /** @var CartService */
    protected $cart_service;

    /** @var AddressService */
    protected $address_service;

    /** @var array<int, \Kirki\Ecommerce\App\Models\Variant> Variants loaded while building the calculation items, keyed by variant ID. */
    protected $variants_map = [];

    /** @var string */
    protected $base_currency_code;

    /**
     * Set up the action and capture the store's base currency code.
     *
     * @since 1.0.0
     *
     * @param RecalculateCartAction $recalculate_cart_action Totals calculator.
     * @param VariantService        $variant_service         Variant lookup service.
     * @param OrderService          $order_service           Order persistence service.
     * @param InventoryService      $inventory_service       Stock checks and reservation.
     * @param ShippingService       $shipping_service        Shipping method validation.
     * @param CouponService         $coupon_service          Coupon service.
     * @param CustomerService       $customer_service        Customer lookup service.
     * @param CreateCustomerAction  $create_customer_action  Provisions the checkout customer.
     * @param CartService           $cart_service            Cart lookup and clearing service.
     * @param AddressService        $address_service         Address persistence service.
     */
    public function __construct(
        RecalculateCartAction $recalculate_cart_action,
        VariantService $variant_service,
        OrderService $order_service,
        InventoryService $inventory_service,
        ShippingService $shipping_service,
        CouponService $coupon_service,
        CustomerService $customer_service,
        CreateCustomerAction $create_customer_action,
        CartService $cart_service,
        AddressService $address_service
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
        $this->address_service = $address_service;

        $this->base_currency_code = base_currency()->code;
    }

    /**
     * Create an order from the payload.
     *
     * For storefront checkouts the items and coupons come from the shopper's cart, which is
     * emptied after the order is placed. Totals are recalculated server-side, stock is
     * reserved per item, and everything is written in one transaction. Fails when the
     * shipping method is invalid, the cart is empty, or stock is short.
     *
     * @since 1.0.0
     *
     * @param CreateOrderPayloadDTO $dto Checkout or manual order data; addresses, customer and cart fields may be filled in.
     * @return Order The created order with its items and coupons loaded.
     * @throws Throwable When persisting the order fails; the transaction is rolled back.
     */
    public function execute(CreateOrderPayloadDTO $dto)
    {
        $this->resolve_billing_and_shipping_addresses($dto);

        if (!$dto->is_manual && (!empty($dto->cart_token) || !empty($dto->user_id))) {
            $this->resolve_checkout_cart($dto);
        }

        // Only resolve a customer when there is one to resolve: an explicitly
        // chosen customer, or a storefront checkout by a signed-in shopper.
        // The provisioning fallback builds the customer from the acting
        // WordPress user, so a manual order with no customer picked would
        // provision one for the admin, and a guest checkout has no user at all.
        if (!empty($dto->customer_id) || (!$dto->is_manual && !empty($dto->created_by))) {
            $dto->customer_id = $this->resolve_checkout_customer_id($dto);
        }

        $context = $this->prepare_calculation_context_dto($dto);

        throw_if(!$this->shipping_service->has_valid_shipping_method($context), __('Invalid shipping method', 'kirki-ecommerce'));

        $calculated_result = $this->recalculate_cart_action->execute($context);
        $create_order_dto = $this->prepare_create_order_dto($calculated_result, $dto, $context);

        DB::begin_transaction();

        try {
            $order = $this->order_service->create_order($create_order_dto);
            $this->sync_address($dto, $order);

            foreach ($dto->items as $item_data) {
                $order_item_dto = $this->prepare_order_item_dto($order->id, $calculated_result->items[$item_data['variant_id']], $dto->currency_code, $order->exchange_rate);

                /* translators: %s: variant ID */
                throw_if(!$this->inventory_service->has_stock($order_item_dto->variant_id, $order_item_dto->quantity), sprintf(__('Not enough stock for variant: %s', 'kirki-ecommerce'), $order_item_dto->variant_id));

                $this->order_service->create_order_item($order_item_dto);
                $this->inventory_service->reserve_stock($order_item_dto->variant_id, $order_item_dto->quantity);
            }

            $order_with_items = $order->fresh('items');

            $this->sync_order_coupons($order_with_items, $calculated_result, $dto->currency_code, $order->exchange_rate);
            $this->sync_order_taxes($order_with_items, $calculated_result, $dto->currency_code, $order->exchange_rate);

            if ((!empty($create_order_dto->customer_id) || !empty($dto->cart_token)) && !$dto->is_manual) {
                $empty_cart_dto = new EmptyCartDTO();
                $empty_cart_dto->token = $dto->cart_token;
                $empty_cart_dto->user_id = $dto->user_id;

                $this->cart_service->empty_cart($empty_cart_dto);
            }

            $order = $order->fresh('items', 'order_coupons.order_item_coupons');

            OrderActivity::log($order, OrderActivityType::ORDER_PLACED);

            DB::commit();

            return $order;
        } catch (Throwable $e) {
            DB::rollback();
            throw $e;
        }
    }

    /**
     * If the order is marked as "billing same as shipping", copy the
     * shipping address fields to the billing address fields.
     *
     * @since 1.0.0
     *
     * @param CreateOrderPayloadDTO $dto Order payload, modified in place.
     * @return void
     */
    protected function resolve_billing_and_shipping_addresses(CreateOrderPayloadDTO $dto)
    {
        if ($dto->is_billing_same_as_shipping) {
            $dto->billing_id = $dto->shipping_id;
            $dto->billing_first_name = $dto->shipping_first_name;
            $dto->billing_last_name = $dto->shipping_last_name;
            $dto->billing_address_line1 = $dto->shipping_address_line1;
            $dto->billing_address_line2 = $dto->shipping_address_line2;
            $dto->billing_city = $dto->shipping_city;
            $dto->billing_state = $dto->shipping_state;
            $dto->billing_postal_code = $dto->shipping_postal_code;
            $dto->billing_country = $dto->shipping_country;
            $dto->billing_phone = $dto->shipping_phone;
            $dto->billing_email = $dto->shipping_email;
        }
    }

    /**
     * Sync the order's shipping and billing addresses to the customer's
     * default shipping and billing addresses, creating them if they don't
     * exist yet.
     *
     * A guest order has no customer_id and therefore no address book to
     * sync into - the order's own shipping and billing column snapshots
     * already carry the data, so this is a no-op for guests.
     *
     * Runs inside CreateOrderAction::execute()'s own open transaction, so
     * every AddressService call here must be a without-transaction variant
     * - the framework's Connection has no transaction nesting support, and
     * a nested START TRANSACTION would implicitly commit the order insert
     * early.
     *
     * @since 1.0.0
     *
     * @param CreateOrderPayloadDTO $dto   Order payload; its shipping_id and billing_id are filled in.
     * @param Order                 $order Order that was just created.
     * @return void
     */
    protected function sync_address(CreateOrderPayloadDTO $dto, $order)
    {
        if (empty($order->customer_id)) {
            return;
        }

        if (empty($dto->shipping_id)) {
            $dto->shipping_id = $this->create_address($dto, $order->customer_id, AddressPurpose::SHIPPING)->id;
        }

        if (empty($dto->billing_id) && !$dto->is_billing_same_as_shipping) {
            $dto->billing_id = $this->create_address($dto, $order->customer_id, AddressPurpose::BILLING)->id;
        }

        if (empty($dto->billing_id) && $dto->is_billing_same_as_shipping) {
            $dto->billing_id = $dto->shipping_id;
        }
    }

    /**
     * Load the shopper's cart into the payload.
     *
     * Copies the cart's items, coupon codes, cart token and shipping method onto the payload.
     * Fails when the cart is missing or empty.
     *
     * @since 1.0.0
     *
     * @param CreateOrderPayloadDTO $dto Order payload, modified in place.
     * @return void
     * @throws \Exception When the cart is missing or empty.
     */
    protected function resolve_checkout_cart(CreateOrderPayloadDTO $dto): void
    {
        $cart = $this->cart_service->get_cart($dto->user_id, $dto->cart_token);

        throw_if(empty($cart) || empty($cart->items), __('Cart not found.', 'kirki-ecommerce'));

        $items = [];

        foreach ($cart->items as $item) {
            $items[] = [
                'variant_id' => $item->variant_id,
                'quantity' => $item->quantity,
            ];
        }

        throw_if(empty($items), __('Cart is empty.', 'kirki-ecommerce'));

        $dto->items = $items;
        $dto->cart_token = !empty($cart->cart_token) ? $cart->cart_token : $dto->cart_token;
        $dto->coupon_codes = $cart->coupons->pluck('code')->to_array();

        if (empty($dto->shipping_method) && !empty($cart->shipping_method)) {
            $dto->shipping_method = $cart->shipping_method;
        }
    }

    /**
     * Resolve the customer_id to link a checkout order to, provisioning a
     * Customer record (with addresses) for the authenticated user placing
     * the order if one doesn't already exist for their WordPress user_id.
     *
     * @since 1.0.0
     *
     * @param CreateOrderPayloadDTO $dto Order payload; its shipping_id and billing_id are filled in when a customer is created.
     * @return int Customer ID.
     * @throws UniqueConstraintViolationException When creating the customer fails on a unique constraint and no customer exists for the user.
     */
    protected function resolve_checkout_customer_id(CreateOrderPayloadDTO $dto)
    {
        $customer = $dto->customer_id ? $this->customer_service->find($dto->customer_id) : null;

        if (!empty($customer)) {
            return $customer->id;
        }

        try {
            $customer_payload = $this->prepare_checkout_customer_dto($dto);
            $customer_payload->addresses = $this->prepare_checkout_customer_addresses($dto);

            $customer = $this->create_customer_action->execute($customer_payload);

            $dto->shipping_id = $customer->shipping_address->id ?? null;
            $dto->billing_id = $customer->billing_address->id ?? null;

            return $customer->id;
        } catch (UniqueConstraintViolationException $e) {
            $customer = $this->customer_service->find_by_user_id($dto->created_by);

            if (empty($customer)) {
                throw $e;
            }

            return $customer->id;
        }
    }

    /**
     * Build the address(es) to provision the checkout customer with: a
     * single address covering both defaults when billing is the same as
     * shipping, otherwise a separate address for each.
     *
     * @since 1.0.0
     *
     * @param CreateOrderPayloadDTO $dto Order payload.
     * @return CreateAddressDTO[] One or two default addresses.
     */
    protected function prepare_checkout_customer_addresses(CreateOrderPayloadDTO $dto)
    {
        $shipping_address = $this->prepare_checkout_address_dto($dto, AddressPurpose::SHIPPING);

        if ($dto->is_billing_same_as_shipping) {
            $shipping_address->is_default_billing = true;

            return [$shipping_address];
        }

        return [$shipping_address, $this->prepare_checkout_address_dto($dto, AddressPurpose::BILLING)];
    }

    /**
     * Create a new default shipping/billing address for the customer from
     * the checkout request's shipping/billing fields.
     *
     * The purpose only selects the field prefix and default flag; it is unrelated
     * to the address's own type (home/office/others), which defaults to home here.
     *
     * @since 1.0.0
     *
     * @param CreateOrderPayloadDTO $dto         Order payload.
     * @param int                   $customer_id Customer to attach the address to.
     * @param string                $purpose     AddressPurpose::SHIPPING or AddressPurpose::BILLING, which selects the request field prefix and the default flag to set.
     * @return Address The created address.
     */
    protected function create_address(CreateOrderPayloadDTO $dto, $customer_id, $purpose)
    {
        $address_dto = $this->prepare_checkout_address_dto($dto, $purpose);
        $address_dto->customer_id = $customer_id;

        return $this->address_service->create_without_transaction($address_dto);
    }

    /**
     * Build the customer payload for the user placing the order.
     *
     * Uses the WordPress user's profile, falling back to the billing details.
     *
     * @since 1.0.0
     *
     * @param CreateOrderPayloadDTO $dto Order payload.
     * @return CreateCustomerDTO Customer data without addresses.
     */
    protected function prepare_checkout_customer_dto(CreateOrderPayloadDTO $dto)
    {
        $wp_user = get_userdata($dto->created_by) ?: null;

        $customer_payload = new CreateCustomerDTO();
        $customer_payload->user_id = $dto->created_by;
        $customer_payload->first_name = !empty($wp_user->first_name) ? $wp_user->first_name : $dto->billing_first_name;
        $customer_payload->last_name = !empty($wp_user->last_name) ? $wp_user->last_name : $dto->billing_last_name;
        $customer_payload->email = !empty($wp_user->user_email) ? $wp_user->user_email : $dto->billing_email;
        $customer_payload->phone = !empty($wp_user->phone) ? $wp_user->phone : $dto->billing_phone;

        return $customer_payload;
    }

    /**
     * Resolve the order's customer contact snapshot from the placing
     * WordPress user's profile when they have an account, else billing.
     *
     * @since 1.0.0
     *
     * @param CreateOrderPayloadDTO $dto Order payload.
     * @return array{first_name: ?string, last_name: ?string, email: ?string, phone: ?string}
     */
    protected function resolve_customer_contact_details(CreateOrderPayloadDTO $dto)
    {
        $wp_user = !empty($dto->created_by) ? (get_userdata($dto->created_by) ?: null) : null;

        return [
            'first_name' => !empty($wp_user->first_name) ? $wp_user->first_name : $dto->billing_first_name,
            'last_name' => !empty($wp_user->last_name) ? $wp_user->last_name : $dto->billing_last_name,
            'email' => !empty($wp_user->user_email) ? $wp_user->user_email : $dto->customer_email ?? $dto->billing_email,
            'phone' => !empty($wp_user->phone) ? $wp_user->phone : $dto->billing_phone,
        ];
    }

    /**
     * Build an address DTO from the payload's shipping or billing fields.
     *
     * New addresses are typed as home and flagged as the default for the given prefix.
     *
     * @since 1.0.0
     *
     * @param CreateOrderPayloadDTO $dto       Order payload.
     * @param string                $prefix    Field prefix to read, shipping or billing.
     * @param bool                  $is_update Whether to build an update DTO instead of a create DTO.
     * @return CreateAddressDTO|UpdateAddressDTO Address data.
     */
    protected function prepare_checkout_address_dto(CreateOrderPayloadDTO $dto, string $prefix, bool $is_update = false)
    {
        $address_payload = $is_update ? new UpdateAddressDTO() : new CreateAddressDTO();
        $address_payload->first_name = $dto->{"{$prefix}_first_name"};
        $address_payload->last_name = $dto->{"{$prefix}_last_name"};
        $address_payload->address_line1 = $dto->{"{$prefix}_address_line1"};
        $address_payload->address_line2 = $dto->{"{$prefix}_address_line2"};
        $address_payload->city = $dto->{"{$prefix}_city"};
        $address_payload->state = $dto->{"{$prefix}_state"};
        $address_payload->country = $dto->{"{$prefix}_country"};
        $address_payload->postal_code = $dto->{"{$prefix}_postal_code"};
        $address_payload->email = $dto->{"{$prefix}_email"};
        $address_payload->phone = $dto->{"{$prefix}_phone"};

        if (!$is_update) {
            $address_payload->type = AddressType::HOME;
            $address_payload->{"is_default_{$prefix}"} = true;
        }

        return $address_payload;
    }

    /**
     * Build the price calculation context from the payload.
     *
     * Includes the customer's active order count, addresses, coupon codes,
     * shipping method and the priced item list.
     *
     * @since 1.0.0
     *
     * @param CreateOrderPayloadDTO $dto Order payload.
     * @return CalculationContextDTO Context ready for RecalculateCartAction.
     */
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
            'postal_code' => $dto->shipping_postal_code,
            'country' => $dto->shipping_country,
        ];
        $context->billing_address = [
            'first_name' => $dto->billing_first_name,
            'last_name' => $dto->billing_last_name,
            'address_line1' => $dto->billing_address_line1,
            'address_line2' => $dto->billing_address_line2,
            'city' => $dto->billing_city,
            'state' => $dto->billing_state,
            'postal_code' => $dto->billing_postal_code,
            'country' => $dto->billing_country,
        ];
        $context->coupon_codes = $dto->coupon_codes;
        $context->shipping_method_id = $dto->shipping_method ?? null;

        $context->items = $this->prepare_context_items($dto);

        return $context;
    }

    /**
     * Build the calculation items for the payload's line items.
     *
     * Records each variant in the variants map. Fails when a variant or its
     * product is missing, the per-order limit is exceeded, or the item is
     * no longer available for purchase.
     *
     * @since 1.0.0
     *
     * @param CreateOrderPayloadDTO $dto Order payload.
     * @return \Kirki\Ecommerce\Framework\Collections\Collection Collection of CalculationItemDTO.
     * @throws \Exception When a variant or its product is missing, or the per-order limit is exceeded.
     * @throws ValidationException When an item is no longer available for purchase.
     */
    protected function prepare_context_items(CreateOrderPayloadDTO $dto)
    {
        $items = collection();

        foreach ($dto->items as $item_data) {
            $variant = $this->variant_service->find($item_data['variant_id']);

            /* translators: %s: JSON-encoded item data */
            throw_if(!$variant, sprintf(__('Variant not found for item: %s', 'kirki-ecommerce'), Arr::json_encode($item_data)), NotFoundException::class, Response::NOT_FOUND);

            /* translators: %s: variant ID */
            throw_if($variant->has_limit_per_order && $variant->max_per_order < $item_data['quantity'], sprintf(__('Max per order limit exceeded for variant: %s', 'kirki-ecommerce'), $variant->id), ValidationException::class, Response::UNPROCESSABLE_ENTITY);

            $product = $variant->product;

            /* translators: %s: variant ID */
            throw_if(empty($product), sprintf(__('Product not found for variant: %s', 'kirki-ecommerce'), $variant->id), NotFoundException::class, Response::NOT_FOUND);

            /* translators: %s: variant ID */
            throw_if(!$variant->is_available(), sprintf(__('This item is no longer available: %s', 'kirki-ecommerce'), $variant->id), ValidationException::class, Response::UNPROCESSABLE_ENTITY);

            $product->load('categories');

            $this->variants_map[$variant->id] = $variant;

            $item_dto = new CalculationItemDTO();
            $item_dto->variant_id = $variant->id;
            $item_dto->product_id = $product->id;
            $item_dto->quantity = $item_data['quantity'];
            $item_dto->base_unit_price = $variant->base_sale_price ?: $variant->base_price;
            $item_dto->base_product_total = $variant->base_price;
            $item_dto->weight = $variant->weight;
            $item_dto->shipping_profile_id = $variant->shipping_profile_id;
            $item_dto->product_categories = $product->categories->pluck('id')->all();

            $items->push($item_dto);
        }

        return $items;
    }

    /**
     * Build the order DTO from the calculated totals and payload.
     *
     * Stores every amount both in the base currency and converted to the order's currency.
     *
     * @since 1.0.0
     *
     * @param CalculationResultDTO  $calculated_result Recalculated totals.
     * @param CreateOrderPayloadDTO $dto               Order payload.
     * @param CalculationContextDTO $context           Calculation context used for the totals.
     * @return CreateOrderDTO Order data ready to persist.
     */
    protected function prepare_create_order_dto(CalculationResultDTO $calculated_result, CreateOrderPayloadDTO $dto, CalculationContextDTO $context)
    {
        $target_currency_code = $dto->currency_code;
        $order_dto = new CreateOrderDTO();
        $order_dto->uuid = uuid();
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

        $order_dto->invoiced_tax_total = $this->convert_amount($calculated_result->base_tax_total, $target_currency_code, $order_dto->exchange_rate);
        $order_dto->base_tax_total = $calculated_result->base_tax_total;

        $order_dto->invoiced_shipping_tax_amount = $this->convert_amount($calculated_result->base_shipping_tax, $target_currency_code, $order_dto->exchange_rate);
        $order_dto->base_shipping_tax_amount = $calculated_result->base_shipping_tax;

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

    /**
     * Build an order item DTO from a calculated item and its variant.
     *
     * Snapshots the product and variant data, and stores amounts in both the base and order currency.
     * Fails when the variant's product is missing.
     *
     * @since 1.0.0
     *
     * @param int                $order_id        ID of the order the item belongs to.
     * @param CalculationItemDTO $calculated_item Recalculated item.
     * @param string             $currency_code   Order currency code.
     * @param float              $exchange_rate   Rate from the base currency to the order currency.
     * @return CreateOrderItemDTO Order item data ready to persist.
     * @throws \Exception When the variant's product is missing.
     */
    protected function prepare_order_item_dto(int $order_id, CalculationItemDTO $calculated_item, $currency_code, $exchange_rate)
    {
        $variant = $this->variants_map[$calculated_item->variant_id];
        $product = $variant->product;

        /* translators: %s: variant ID */
        throw_if(empty($product), sprintf(__('Product not found for variant: %s', 'kirki-ecommerce'), $variant->id));

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

        $item_dto->invoiced_price = $this->convert_amount($calculated_item->base_unit_price, $currency_code, $exchange_rate);
        $item_dto->base_price = $calculated_item->base_unit_price;

        $item_dto->invoiced_regular_price = $this->convert_amount($calculated_item->base_regular_unit_price, $currency_code, $exchange_rate);
        $item_dto->base_regular_price = $calculated_item->base_regular_unit_price;

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
            'variant' => $variant->to_array()
        ];

        return $item_dto;
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

    /**
     * Build the payment provider snapshot stored on the order.
     *
     * @since 1.0.0
     *
     * @param string|null $payment_provider_id Payment provider ID.
     * @return array<string, mixed>|null Provider id, name, icon and offline flag; null when the provider is unknown.
     */
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

    /**
     * Build the shipping method snapshot stored on the order.
     *
     * @since 1.0.0
     *
     * @param CalculationContextDTO $context Calculation context with the selected shipping method.
     * @return array<string, mixed>|null Shipping method id, name and type; null when no method is selected.
     */
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
